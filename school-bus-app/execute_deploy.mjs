import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function deploy() {
  try {
    console.log('🔗 Connecting to 103.118.158.92...');
    await ssh.connect({
      host: '103.118.158.92',
      username: 'ubuntu',
      password: '190125@Amgi'
    });
    console.log('✅ Connected!');

    console.log('📤 Uploading missing files natively...');
    await ssh.execCommand('mkdir -p /home/ubuntu/school-bus-app/prisma');
    await ssh.putFile('./deploy.sh', '/home/ubuntu/school-bus-app/deploy.sh');
    await ssh.putFile('./Dockerfile', '/home/ubuntu/school-bus-app/Dockerfile');
    await ssh.putFile('./prisma/schema.prisma', '/home/ubuntu/school-bus-app/prisma/schema.prisma');
    await ssh.putFile('./docker-compose.yml', '/home/ubuntu/school-bus-app/docker-compose.yml');

    console.log('🚀 Running deploy.sh using sudo...');
    const result = await ssh.execCommand('echo 190125@Amgi | sudo -S bash deploy.sh', { 
        cwd: '/home/ubuntu/school-bus-app',
        onStdout(chunk) { process.stdout.write(chunk.toString('utf8')); },
        onStderr(chunk) { process.stderr.write(chunk.toString('utf8')); }
    });

    console.log('\n--- Deployment Finished ---');
    ssh.dispose();
  } catch (err) {
    console.error('Deployment Failed:', err);
    process.exit(1);
  }
}

deploy();
