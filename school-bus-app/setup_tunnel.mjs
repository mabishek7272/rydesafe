import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function setupTunnel() {
  console.log('🚀 Connecting to sai for Cloudflare Tunnel setup...');
  try {
    await ssh.connect({
      host: '100.109.137.8',
      port: 2222,
      username: 'sai',
      password: 'amgi@2025',
    });
    console.log('✅ Connected!');

    const pass = 'amgi@2025';
    const token = 'eyJhIjoiYzlhODc4ZWY2ZjdlODAyNmY0ZTFmODk1OGQ5OTAxMzciLCJ0IjoiNDJlM2U3MGMtMGNlZi00ZGM4LTg2OTQtNjFiM2YwYzI4OTcwIiwicyI6Ik5UaGtaR1UzTVdVdE0yUmxOUzAwWVROaUxXRTBaV1V0WXpabU5USTNNakZqTmpJMCJ9';

    console.log('📦 Downloading and installing cloudflared...');
    // Download for amd64 architecture
    await ssh.execCommand('wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb');
    await ssh.execCommand(`echo "${pass}" | sudo -S dpkg -i cloudflared-linux-amd64.deb`);

    console.log('🗑️ Cleaning up existing cloudflared service...');
    await ssh.execCommand(`echo "${pass}" | sudo -S cloudflared service uninstall`).catch(() => {});

    console.log('🛡️ Installing cloudflared service...');
    const installRes = await ssh.execCommand(`echo "${pass}" | sudo -S cloudflared service install ${token}`);
    console.log(installRes.stdout);
    if (installRes.stderr) console.error(installRes.stderr);

    console.log('🚀 Starting cloudflared service...');
    await ssh.execCommand(`echo "${pass}" | sudo -S systemctl start cloudflared`);
    
    console.log('🎉 Cloudflare Tunnel setup complete!');
  } catch (err) {
    console.error('❌ Tunnel Setup failed:', err);
  } finally {
    ssh.dispose();
  }
}

setupTunnel();
