const fs = require('fs');
const path = require('path');
const readline = require('readline');

const userId = process.argv[2];

if (!userId) {
  console.log('Uso: node remove_user.js <USER_ID>');
  process.exit(1);
}

const USERS_DIR = path.join(__dirname, '..', 'output', 'users');
const INDEX_PATH = path.join(USERS_DIR, 'index.json');

const index = JSON.parse(
  fs.readFileSync(INDEX_PATH, 'utf8')
);

const matches = index.filter(
  u => u.user_id.startsWith(userId.toUpperCase())
);

if (matches.length === 0) {
  console.log(`❌ Usuario no encontrado: ${userId}`);
  process.exit(1);
}

if (matches.length > 1) {
  console.log(`❌ Más de un usuario coincide con "${userId}"\n`);

  matches.forEach(u => {
    console.log(
      `${u.user_id} - ${u.display_name}`
    );
  });

  process.exit(1);
}

const user = matches[0];


console.log('\n⚠️ Usuario encontrado\n');
console.log(`Nombre: ${user.display_name}`);
console.log(`ID: ${user.user_id}`);
console.log(`Profile: ${user.profile_file}`);
console.log(`Source: ${user.source_file}`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n¿Eliminar participante? (y/n): ', answer => {

  if (answer.toLowerCase() !== 'y') {
    console.log('Operación cancelada.');
    rl.close();
    return;
  }

  const profilePath = path.join(
    USERS_DIR,
    user.profile_file
  );

  if (fs.existsSync(profilePath)) {
    fs.unlinkSync(profilePath);
    console.log('✓ Profile eliminado');
  }

  const updatedIndex = index.filter(
    u => u.user_id !== user.user_id
  );

  fs.writeFileSync(
    INDEX_PATH,
    JSON.stringify(updatedIndex, null, 2)
  );

  console.log('✓ Usuario eliminado de index.json');

  rl.close();
});