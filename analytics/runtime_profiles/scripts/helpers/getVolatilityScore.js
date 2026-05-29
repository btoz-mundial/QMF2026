// ======================================
// GET VOLATILITY SCORE
// ======================================

function getVolatilityScore({

  userId,
  snapshots,
  totalUsers

}) {

  // ======================================
  // USER RANKS
  // ======================================

  const userRanks = [];

  // ======================================
  // COLLECT RANKS
  // ======================================

  snapshots.forEach(snapshot => {

    const leaderboard =
      snapshot?.leaderboard || [];

    const userEntry =
      leaderboard.find(entry =>

        entry.user_id === userId

      );

    if (userEntry) {

      userRanks.push(
        userEntry.rank
      );

    }

  });

  // ======================================
  // NO DATA
  // ======================================

  if (userRanks.length === 0) {

    return {

      best_rank: null,
      worst_rank: null,
      rank_swing: 0,
      volatility_score: 0

    };

  }

  // ======================================
  // BEST / WORST
  // ======================================

  const bestRank =
    Math.min(...userRanks);

  const worstRank =
    Math.max(...userRanks);

  // ======================================
  // RANK SWING
  // ======================================

  const rankSwing =
    worstRank - bestRank;

  // ======================================
  // NORMALIZED SCORE
  // ======================================

  const volatilityScore =
    Number(
      (
        rankSwing / totalUsers
      ).toFixed(2)
    );

  // ======================================
  // RETURN
  // ======================================

  return {

    best_rank:
      bestRank,

    worst_rank:
      worstRank,

    rank_swing:
      rankSwing,

    volatility_score:
      volatilityScore

  };

}


// ======================================
// EXPORT
// ======================================

module.exports = {

  getVolatilityScore

};