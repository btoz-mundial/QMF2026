const fs = require('fs');
const path = require('path');

function loadScoreDetails() {

  const detailsPath = path.join(

    __dirname,

    '..',
    '..',

    'output',
    'scores',

    'score_details.json'

  );

  return JSON.parse(
    fs.readFileSync(detailsPath, 'utf-8')
  );

}

module.exports = {
  loadScoreDetails
};