const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Your Apple credentials
const TEAM_ID = 'VKPMTL7RAU';
const KEY_ID = 'N3L9R5TZ57';
const CLIENT_ID = 'com.beautyhq.dev'; // Services ID

// Find the .p8 key file
const possiblePaths = [
  path.join(__dirname, '..', `AuthKey_${KEY_ID}.p8`),
  path.join(__dirname, '..', 'AuthKey.p8'),
  path.join(process.env.HOME, 'Downloads', `AuthKey_${KEY_ID}.p8`),
];

let privateKey = null;
let keyPath = null;

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    privateKey = fs.readFileSync(p, 'utf8');
    keyPath = p;
    break;
  }
}

if (!privateKey) {
  console.error('❌ Could not find Apple private key (.p8 file)');
  console.error('Please place your AuthKey_N3L9R5TZ57.p8 file in:');
  console.error('  - Project root: /Users/erolakarsu/projects/beauty-wellness-ai/');
  console.error('  - Or Downloads folder');
  process.exit(1);
}

console.log(`✅ Found key at: ${keyPath}`);

// Generate the client secret (valid for 6 months)
const now = Math.floor(Date.now() / 1000);
const expiry = now + (180 * 24 * 60 * 60); // 180 days

const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: now,
    exp: expiry,
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID,
  },
  privateKey,
  {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: KEY_ID,
    },
  }
);

console.log('\n✅ Apple Client Secret generated successfully!\n');
console.log('Add this to your .env file:\n');
console.log(`APPLE_CLIENT_SECRET="${token}"`);
console.log('\n⚠️  This secret expires in 180 days. Regenerate before:', new Date(expiry * 1000).toISOString());
