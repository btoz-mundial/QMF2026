const fs = require('fs');

function loadJson(filePath) {

  return JSON.parse(
    fs.readFileSync(filePath, 'utf8')
  );

}

module.exports = {
  loadJson
};