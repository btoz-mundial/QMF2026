const fs = require('fs');
const path = require('path');

function loadLeaderboard() {

  const leaderboardPath = path.join(
    __dirname,
    '..',
    '..',
    'output',
    'scores',
    'leaderboard.json'
  );

  return JSON.parse(
    fs.readFileSync(leaderboardPath, 'utf-8')
  );

}

module.exports = {
  loadLeaderboard
};