const fs = require('fs');
const path = require('path');

function loadJSON(filePath) {

  return JSON.parse(
    fs.readFileSync(filePath, 'utf-8')
  );

}


function loadResults() {

  const resultsPath = path.join(

    __dirname,

    '..',
    '..',

    'data',
    'results'

  );

  return {

    group: loadJSON(
      path.join(
        resultsPath,
        'group_results.json'
      )
    ),

    knockout: loadJSON(
      path.join(
        resultsPath,
        'knockout_results.json'
      )
    ),

    standings: loadJSON(
      path.join(
        resultsPath,
        'standings_results.json'
      )
    )

  };

}

module.exports = {
  loadResults
};