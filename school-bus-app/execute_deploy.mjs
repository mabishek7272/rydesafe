import { NodeSSH } from 'node-ssh';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ssh = new NodeSSH();

// ── Connection Profiles ──────────────────────────────────────────────────────
// The script tries each profile in order until one succeeds.
const CONNECTION_PROFILES = [
  {
    label: 'Primary (cPanel SSH)',
    host: '103.118.158.161',
    port: 22,
    username: 'saischoo',       // cPanel username — update if different
    privateKeyPath: path.resolve(process.env.HOME || 'C:/Users/acer', '4Core Privatekey.pem'),
  },
  {
    label: 'Tailscale Tunnel',
    host: '100.109.137.8',
    port: 2222,
    username: 'sai',
    password: 'amgi@2025',
  },
  {
    label: 'Direct SSH (port 22)',
    host: '103.118.158.161',
    port: 22,
    username: 'sai',
    password: 'amgi@2025',
  },
];

// ── Deploy Config ────────────────────────────────────────────────────────────
const REMOTE_APP_DIR = '/home/saischoo/public_html/rydesafe';   // cPanel public_html
const LOCAL_ARCHIVE  = path.resolve(__dirname, '..', 'rydesafe.tar.gz');
const HANDSHAKE_TIMEOUT_MS = 15000;

async function tryConnect(profile) {
  const connectOpts = {
    host: profile.host,
    port: profile.port,
    username: profile.username,
    readyTimeout: HANDSHAKE_TIMEOUT_MS,
  };

  if (profile.password) {
    connectOpts.password = profile.password;
  } else if (profile.privateKeyPath && existsSync(profile.privateKeyPath)) {
    connectOpts.privateKey = readFileSync(profile.privateKeyPath);
  }

  await ssh.connect(connectOpts);
}

async function deploy() {
  // ── 1. Connect ─────────────────────────────────────────────────────────────
  let connected = false;
  for (const profile of CONNECTION_PROFILES) {
    try {
      console.log(`\n🔌 Trying ${profile.label} (${profile.host}:${profile.port})...`);
      await tryConnect(profile);
      console.log(`✅ Connected via ${profile.label}!`);
      connected = true;
      break;
    } catch (err) {
      console.log(`   ⚠️  Failed: ${err.message}`);
    }
  }

  if (!connected) {
    console.error('\n❌ All connection profiles failed.');
    console.error('   Verify one of the following:');
    console.error('   1. Tailscale VPN is connected');
    console.error('   2. cPanel SSH is enabled at Hosting → SSH Access');
    console.error('   3. The SSH private key path is correct');
    console.error('\n📋 Manual deployment steps:');
    console.error('   1. Upload rydesafe.tar.gz via cPanel File Manager');
    console.error(`   2. Extract to ${REMOTE_APP_DIR}`);
    console.error('   3. Run: npm install && npx prisma migrate deploy && npm run build');
    console.error('   4. Set up PM2 or Node.js app in cPanel');
    process.exit(1);
  }

  try {
    // ── 2. Prepare remote directory ─────────────────────────────────────────
    console.log('\n📁 Preparing remote directory...');
    await ssh.execCommand(`mkdir -p ${REMOTE_APP_DIR}`);

    // ── 3. Upload archive ────────────────────────────────────────────────────
    console.log('⬆️  Uploading rydesafe.tar.gz...');
    await ssh.putFile(LOCAL_ARCHIVE, `${REMOTE_APP_DIR}/rydesafe.tar.gz`);
    console.log('   Upload complete.');

    // ── 4. Extract ───────────────────────────────────────────────────────────
    console.log('📦 Extracting files...');
    const extractRes = await ssh.execCommand(
      `tar -xzf rydesafe.tar.gz --strip-components=1`,
      { cwd: REMOTE_APP_DIR }
    );
    if (extractRes.stderr && !extractRes.stderr.includes('Removing leading')) {
      console.log('   Extract info:', extractRes.stderr);
    }

    // ── 5. Upload production .env ─────────────────────────────────────────
    const prodEnvPath = path.resolve(__dirname, '.env.production');
    if (existsSync(prodEnvPath)) {
      console.log('🔑 Uploading production .env...');
      await ssh.putFile(prodEnvPath, `${REMOTE_APP_DIR}/.env`);
    } else {
      console.log('⚠️  No .env.production found — using existing remote .env');
    }

    // ── 6. Install dependencies ──────────────────────────────────────────────
    console.log('📥 Installing production dependencies...');
    const npmRes = await ssh.execCommand(
      `npm install --production --legacy-peer-deps`,
      { cwd: REMOTE_APP_DIR }
    );
    if (npmRes.code !== 0) {
      throw new Error(`npm install failed:\n${npmRes.stderr}`);
    }

    // ── 7. Prisma ────────────────────────────────────────────────────────────
    console.log('🔧 Generating Prisma Client...');
    await ssh.execCommand(`npx prisma generate`, { cwd: REMOTE_APP_DIR });

    console.log('📊 Running database migrations...');
    const migrateRes = await ssh.execCommand(
      `npx prisma migrate deploy || npx prisma db push`,
      { cwd: REMOTE_APP_DIR }
    );
    console.log('   Migration output:', migrateRes.stdout.slice(0, 200));

    // ── 8. Build ─────────────────────────────────────────────────────────────
    console.log('🏗️  Building Next.js for production...');
    const buildRes = await ssh.execCommand(`npm run build`, { cwd: REMOTE_APP_DIR });
    if (buildRes.code !== 0) {
      throw new Error(`Build failed:\n${buildRes.stderr?.slice(0, 500)}`);
    }
    console.log('   Build complete ✅');

    // ── 9. Restart with PM2 ──────────────────────────────────────────────────
    console.log('🌐 Restarting application with PM2...');
    const pm2Res = await ssh.execCommand(
      [
        `npx pm2 describe rydesafe > /dev/null 2>&1`,
        `&& npx pm2 restart rydesafe`,
        `|| npx pm2 start npm --name "rydesafe" -- start`
      ].join(' '),
      { cwd: REMOTE_APP_DIR }
    );
    console.log('   PM2:', pm2Res.stdout || pm2Res.stderr || 'Started.');

    // ── 10. Save PM2 list for auto-start on reboot ─────────────────────────
    await ssh.execCommand(`npx pm2 save`);

    console.log('\n🎉 ===== DEPLOYMENT COMPLETE =====');
    console.log(`   App running at: https://${CONNECTION_PROFILES[0].host}`);
    console.log('   Monitor with:   npx pm2 logs rydesafe');

  } catch (err) {
    console.error('\n❌ Deployment failed during execution:', err.message);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

deploy();
