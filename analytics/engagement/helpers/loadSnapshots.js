const fs = require('fs');
const path = require('path');

function loadJSON(filePath) {

  return JSON.parse(
    fs.readFileSync(filePath, 'utf-8')
  );

}


function loadSnapshots() {

  const snapshotsPath = path.join(

    __dirname,

    '..',
    '..',

    'output',
    'scores',
    'snapshots'

  );

  const files = fs.readdirSync(snapshotsPath)
    .filter(file => file.endsWith('.json'));

  const snapshots = files.map(file => {

    const fullPath = path.join(
      snapshotsPath,
      file
    );

    return loadJSON(fullPath);

  });

  snapshots.sort(

    (a, b) =>

      a.snapshot_match_id -
      b.snapshot_match_id

  );

  return snapshots;

}

module.exports = {
  loadSnapshots
};