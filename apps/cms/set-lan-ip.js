const os = require('os');
const fs = require('fs');
const path = require('path');

const ip = Object.values(os.networkInterfaces())
  .flat()
  .find((i) => i.family === 'IPv4' && !i.internal)?.address || 'localhost';

const envPath = path.join(__dirname, 'src/environments/environment.ts');
const content = fs.readFileSync(envPath, 'utf8');
const updated = content.replace(/http:\/\/[\w.]+:3000\/api/, `http://${ip}:3000/api`);

fs.writeFileSync(envPath, updated);
console.log(`apiUrl -> http://${ip}:3000/api`);
