const bcrypt = require('bcrypt');

// --- Ganti password yang Anda inginkan di sini ---
const password = 'superpassword';
// ------------------------------------------------

const saltRounds = 12; // Pastikan ini sama dengan BCRYPT_SALT_ROUNDS di docker-compose.yml

console.log(`Mencari hash untuk password: "${password}"`);

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error creating hash:', err);
    return;
  }
  console.log('\n==============================================================');
  console.log('Hash baru Anda adalah:');
  console.log(hash);
  console.log('==============================================================');
  console.log('\nSalin hash di atas dan gunakan di file mongodb/auth/init-users.js');
});
