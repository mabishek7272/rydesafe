import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function getIP() {
  try {
    const token = 'eyJhIjoiYzlhODc4ZWY2ZjdlODAyNmY0ZTFmODk1OGQ5OTAxMzciLCJ0IjoiNDJlM2U3MGMtMGNlZi00ZGM4LTg2OTQtNjFiM2YwYzI4OTcwIiwicyI6Ik5UaGtaR1UzTVdVdE0yUmxOUzAwWVROaUxXRTBaV1V0WXpabU5USTNNakZqTmpJMCJ9';
    await ssh.connect({
      host: '100.109.137.8',
      port: 2222,
      username: 'sai',
      password: 'amgi@2025',
    });
    const stop = await ssh.execCommand('echo "amgi@2025" | sudo -S systemctl stop cloudflared');
    console.log('Stopped system tunnel:', stop.stderr || 'ok');
    const restart = await ssh.execCommand('npx pm2 restart rydesafe-tunnel');
    console.log('Restarted PM2 tunnel:', restart.stdout);
    const status = await ssh.execCommand('npx pm2 status');
    console.log('PM2 Status:\n', status.stdout);
  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}
getIP();
