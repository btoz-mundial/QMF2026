const fs = require('fs');

function saveOutput(outputPath, data) {

  fs.writeFileSync(
    outputPath,
    JSON.stringify(data, null, 2)
  );

}

module.exports = {
  saveOutput
};