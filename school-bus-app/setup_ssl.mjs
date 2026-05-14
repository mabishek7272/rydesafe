import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function setupSSL() {
  console.log('🚀 Connecting to sai for SSL setup...');
  try {
    await ssh.connect({
      host: '100.109.137.8',
      port: 2222,
      username: 'sai',
      password: 'amgi@2025',
    });
    console.log('✅ Connected!');

    const pass = 'amgi@2025';

    console.log('🛡️ Opening ports 80, 443, and 3000 in firewall...');
    await ssh.execCommand(`echo "${pass}" | sudo -S ufw allow 80/tcp`);
    await ssh.execCommand(`echo "${pass}" | sudo -S ufw allow 443/tcp`);
    await ssh.execCommand(`echo "${pass}" | sudo -S ufw allow 3000/tcp`);

    console.log('📦 Updating packages and installing certbot/nginx...');
    await ssh.execCommand(`echo "${pass}" | sudo -S apt update`);
    await ssh.execCommand(`echo "${pass}" | sudo -S apt install -y certbot nginx`);

    console.log('🛑 Stopping Nginx briefly for standalone certbot...');
    await ssh.execCommand(`echo "${pass}" | sudo -S systemctl stop nginx`);

    console.log('🔐 Obtaining SSL certificates...');
    const certRes = await ssh.execCommand(`echo "${pass}" | sudo -S certbot certonly --standalone -d rideshare.com.my -d www.rideshare.com.my --non-interactive --agree-tos -m admin@rideshare.com.my`);
    console.log(certRes.stdout);
    if (certRes.stderr) console.error(certRes.stderr);

    console.log('📝 Configuring Nginx reverse proxy...');
    const nginxConfig = `
server {
    listen 80;
    server_name rideshare.com.my www.rideshare.com.my;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name rideshare.com.my www.rideshare.com.my;

    ssl_certificate /etc/letsencrypt/live/rideshare.com.my/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rideshare.com.my/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # SSE Support
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}`;

    await ssh.execCommand(`echo "${pass}" | sudo -S bash -c "echo '${nginxConfig}' > /etc/nginx/sites-available/rydesafe"`);
    await ssh.execCommand(`echo "${pass}" | sudo -S ln -sf /etc/nginx/sites-available/rydesafe /etc/nginx/sites-enabled/`);
    await ssh.execCommand(`echo "${pass}" | sudo -S rm -f /etc/nginx/sites-enabled/default`);

    console.log('🚀 Starting Nginx...');
    await ssh.execCommand(`echo "${pass}" | sudo -S systemctl start nginx`);
    
    console.log('🎉 SSL and Reverse Proxy setup complete!');
  } catch (err) {
    console.error('❌ SSL Setup failed:', err);
  } finally {
    ssh.dispose();
  }
}

setupSSL();
