// Lokal kompyuterda Telegram ichida sinash uchun bitta buyruq:  npm run tunnel
//   1. Mini App build qilinmagan bo'lsa — build qiladi (yoki --build bilan har doim)
//   2. cloudflared orqali vaqtinchalik HTTPS manzil ochadi
//   3. Serverni shu manzil bilan ishga tushiradi (Menu tugmasi avtomatik yangilanadi)
// To'xtatish: Ctrl+C

import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const root = path.resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT) || 3000;
const forceBuild = process.argv.includes('--build');

function findCloudflared() {
  const candidates = [
    'cloudflared',
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
    'C:\\Program Files\\cloudflared\\cloudflared.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'cloudflared.exe'),
  ];

  for (const candidate of candidates) {
    try {
      execSync(`"${candidate}" --version`, { stdio: 'ignore' });
      return candidate;
    } catch {
      // keyingisini sinaymiz
    }
  }
  return null;
}

const cloudflared = findCloudflared();
if (!cloudflared) {
  console.error('\n❌ cloudflared topilmadi. O‘rnatish:  winget install --id Cloudflare.cloudflared\n');
  process.exit(1);
}

if (forceBuild || !fs.existsSync(path.join(root, 'web', 'out', 'index.html'))) {
  console.log('\n📦 Mini App build qilinmoqda (1–2 daqiqa)...\n');
  execSync('npm --prefix web run build', { cwd: root, stdio: 'inherit' });
}

console.log('\n🌐 HTTPS tunnel ochilmoqda...');
const tunnel = spawn(cloudflared, ['tunnel', '--no-autoupdate', '--url', `http://localhost:${port}`], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

let server = null;

const url = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('60 soniyada manzil olinmadi')), 60_000);
  const onData = (chunk) => {
    const match = String(chunk).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      clearTimeout(timer);
      resolve(match[0]);
    }
  };
  tunnel.stdout.on('data', onData);
  tunnel.stderr.on('data', onData);
  tunnel.on('exit', (code) => reject(new Error(`cloudflared to‘xtadi (kod ${code})`)));
}).catch((error) => {
  console.error(`\n❌ Tunnel ochilmadi: ${error.message}\n`);
  tunnel.kill();
  process.exit(1);
});

console.log(`✅ Manzil: ${url}\n`);

server = spawn(process.execPath, ['src/index.js'], {
  cwd: root,
  stdio: 'inherit',
  // Tunnel — ochiq internet, shuning uchun imzosiz kirish albatta o'chiriladi
  env: { ...process.env, WEBAPP_URL: url, ALLOW_DEV_AUTH: 'false' },
});

console.log('📱 Telegram\'da botni oching: /start bosing yoki pastdagi "🍽 Menyu" tugmasini bosing.');
console.log('⏳ Menu tugmasi ~20 soniyada yangilanadi. To‘xtatish: Ctrl+C\n');

const stopAll = () => {
  server?.kill();
  tunnel.kill();
  process.exit(0);
};

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
server.on('exit', () => {
  tunnel.kill();
  process.exit(0);
});
tunnel.on('exit', () => {
  console.error('\n⚠️  Tunnel uzildi — qaytadan:  npm run tunnel\n');
  server?.kill();
  process.exit(1);
});
