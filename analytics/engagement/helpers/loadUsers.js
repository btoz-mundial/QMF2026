const fs = require('fs');
const path = require('path');

function loadJSON(filePath) {

  return JSON.parse(
    fs.readFileSync(filePath, 'utf-8')
  );

}


function loadUsers() {

  // Profiles viven en subfolder profiles/ — coherente con el contrato
  // declarado en index.json (profile_file: "profiles/...json")
  const usersPath = path.join(

    __dirname,

    '..',
    '..',
    '..',
    'output',
    'users',
    'profiles'

  );

  const files = fs.readdirSync(usersPath)
    .filter(file => file.endsWith('.json'));

  return files.map(file => {

    const fullPath = path.join(
      usersPath,
      file
    );

    return loadJSON(fullPath);

  });

}

module.exports = {
  loadUsers
};
