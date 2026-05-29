const fs = require('fs');
const path = require('path');

function loadJSON(filePath) {

  return JSON.parse(
    fs.readFileSync(filePath, 'utf-8')
  );

}


function loadUsers() {

  const usersPath = path.join(

    __dirname,

    '..',
    '..',

    'output',
    'users'

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