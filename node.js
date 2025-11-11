const { Client } = require('ssh2');
const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Log de roteadores com falhas
const failedRouters = [];

// Lê IPs de arquivo externo
const routerIPs = require('./ips.json');

// Interface para entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Pergunta login e senha
rl.question('👤 Usuário: ', (username) => {
  rl.question('🔒 Senha: ', (password) => {
    rl.close();
    const mikrotiks = routerIPs.map(ip => ({
      host: ip,
      username,
      password
    }));
    startBackup(mikrotiks);
  });
});

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');

  return `${day}-${month}-${year}_${hour}-${minute}-${second}`;
}

async function processRouter(router) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let routerName = 'mikrotik';
    const ip = router.host;

    console.log(`\n▶ Conectando ao MikroTik ${ip}...`);

    conn.on('ready', () => {
      console.log(`✔ Conectado a ${ip}, obtendo nome...`);

      conn.exec('/system identity print without-paging', (err, stream) => {
        if (err) return reject(err);

        let output = '';
        stream.on('data', (data) => output += data.toString());
        stream.on('close', () => {
          const match = output.match(/name: (.+)/);
          if (match) {
            routerName = match[1].trim().replace(/[^a-zA-Z0-9_-]/g, '_');
            console.log(`🧾 Nome do roteador (${ip}): ${routerName}`);
          } else {
            console.warn(`⚠️ Não foi possível obter nome do roteador (${ip}).`);
          }

          const backupFile = `backup_${routerName}_${getTimestamp()}`;
          console.log(`📦 Gerando backup em ${ip}...`);
          conn.exec(`export file=${backupFile}`, (err) => {
            if (err) return reject(err);
            conn.end();

            setTimeout(() => {
              downloadBackup(router, backupFile)
                .then(() => resolve())
                .catch(reject);
            }, 10000);
          });
        });
      });
    }).on('error', (err) => {
      console.error(`❌ Falha na conexão com ${ip}:`, err.message);
      failedRouters.push(ip);  // Registra ip e a falha
      // conn.end();  teste
      resolve(); // ignora erro e continua
    }).connect({
      host: router.host,
      port: 22,
      username: router.username,
      password: router.password
    });
  });
}

async function downloadBackup(router, backupFile) {
  const ip = router.host;
  const client = new ftp.Client();
  const folder = path.join(__dirname, 'backups', ip);
  const localPath = path.join(folder, backupFile + '.rsc');

  fs.mkdirSync(folder, { recursive: true });

  console.log(`⬇️ Baixando backup de ${ip} para ${localPath}...`);
  try {
    await client.access({
      host: router.host,
      user: router.username,
      password: router.password,
      secure: false
    });

    await client.downloadTo(localPath, '/' + backupFile + '.rsc');
    console.log(`✅ Backup salvo com sucesso: ${localPath}`);
  } catch (e) {
    console.error(`❌ Erro ao baixar backup de ${ip}:`, e.message);
    failedRouters.push(ip);  // Registra ip e a falha
  } finally {
    client.close();
  }
}

async function startBackup(mikrotiks) {
  for (const router of mikrotiks) {
    await processRouter(router);
  }
  console.log('\n🚀 Todos os backups foram processados.');
  // Exibe os roteadores que falharam
  if (failedRouters.length > 0) {
    console.log('\n⚠️ Os seguintes roteadores falharam no backup:');
    failedRouters.forEach(ip => console.log(` - ${ip}`));
  } else {
    console.log('\n✅ Sem falhas!');
  }
}