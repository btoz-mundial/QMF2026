// ======================================
// GET RANKING MOMENTUM
// ======================================

function getRankingMomentum({

  userId,
  snapshots

}) {

  // ======================================
  // USER RANKS
  // ======================================

  const userRanks = [];

  snapshots.forEach(snapshot => {

    const leaderboard =
      snapshot?.leaderboard || [];

    const userEntry =
      leaderboard.find(entry =>

        entry.user_id === userId

      );

    if (userEntry) {

      userRanks.push({

        snapshot_match_id:
          snapshot.snapshot_match_id,

        rank:
          userEntry.rank

      });

    }

  });

  // ======================================
  // NEED MINIMUM SNAPSHOTS
  // ======================================

  if (userRanks.length < 3) {

    return {

      trend: 'stable',

      recent_delta: 0,

      momentum_strength: 0,

      recent_ranks:
        userRanks.map(r => r.rank)

    };

  }

  // ======================================
  // LAST 3 SNAPSHOTS
  // ======================================

  const recent =
    userRanks.slice(-3);

  const ranks =
    recent.map(r => r.rank);

  // ======================================
  // DELTA
  // ======================================

  const recentDelta =
    ranks[0] - ranks[2];

  // ======================================
  // MOMENTUM STRENGTH
  // ======================================

  const momentumStrength =
    Math.abs(recentDelta);

  // ======================================
  // TREND
  // ======================================

  let trend = 'stable';

  // ======================================
  // UP
  // ======================================

  if (

    ranks[2] < ranks[1] &&
    ranks[1] < ranks[0]

  ) {

    trend = 'up';

  }

  // ======================================
  // DOWN
  // ======================================

  if (

    ranks[2] > ranks[1] &&
    ranks[1] > ranks[0]

  ) {

    trend = 'down';

  }

  // ======================================
  // RETURN
  // ======================================

  return {

    trend,

    recent_delta:
      recentDelta,

    momentum_strength:
      momentumStrength,

    recent_ranks:
      ranks

  };

}


// ======================================
// EXPORT
// ======================================

module.exports = {

  getRankingMomentum

};