// ======================================
// GET ADVANCE ACCURACY
// ======================================

function getAdvanceAccuracy(userDetails = {}) {

  // ======================================
  // KNOCKOUT MATCHES
  // ======================================

  const knockout =
    userDetails?.knockout || [];

  // ======================================
  // VALID MATCHES
  // ======================================

  const validMatches =
    knockout.filter(match => {

      return (
        match?.breakdown &&
        typeof match.breakdown.advance === 'boolean'
      );

    });

  // ======================================
  // TOTAL MATCHES
  // ======================================

  const totalMatches =
    validMatches.length;

  // ======================================
  // NO DATA
  // ======================================

  if (totalMatches === 0) {

    return {

      accuracy: 0,
      correct: 0,
      total_matches: 0

    };

  }

  // ======================================
  // CORRECT ADVANCEMENTS
  // ======================================

  const correct =
    validMatches.filter(match =>

      match.breakdown.advance === true

    ).length;

  // ======================================
  // ACCURACY
  // ======================================

  const accuracy =
    correct / totalMatches;

  // ======================================
  // RETURN
  // ======================================

  return {

    accuracy:
      Number(
        accuracy.toFixed(2)
      ),

    correct,

    total_matches:
      totalMatches

  };

}


// ======================================
// EXPORT
// ======================================

module.exports = {

  getAdvanceAccuracy

};