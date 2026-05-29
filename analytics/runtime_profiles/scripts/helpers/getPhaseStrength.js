// ======================================
// GET PHASE STRENGTH
// ======================================

function getPhaseStrength(userDetails = {}) {

  // ======================================
  // GROUP
  // ======================================

  const group =
    userDetails?.group || [];

  const groupMatches =
    group.length;

  const correctGroup =
    group.filter(match =>

      match?.breakdown?.correct === true

    ).length;

  const groupAccuracy =
    groupMatches > 0
      ? correctGroup / groupMatches
      : 0;

// ======================================
// KNOCKOUT
// ======================================

const knockout =
  userDetails?.knockout || [];

const knockoutMatches =
  knockout.length;

// ======================================
// EARNED POINTS
// ======================================

const earnedKnockoutPoints =
  knockout.reduce(

    (sum, match) =>

      sum + (match.points || 0),

    0

  );

// ======================================
// AVAILABLE POINTS
// ======================================

const availableKnockoutPoints =
  knockout.reduce(

    (sum, match) => {

      const breakdown =
        match?.breakdown || {};

      return (
        sum +
        Object.keys(breakdown).length
      );

    },

    0

  );

// ======================================
// ACCURACY
// ======================================

const knockoutAccuracy =
  availableKnockoutPoints > 0

    ? earnedKnockoutPoints /
      availableKnockoutPoints

    : 0;

  // ======================================
  // STRENGTH DELTA
  // ======================================

    const strengthDelta =
     Math.abs(
     groupAccuracy -
     knockoutAccuracy
    );
  // ======================================
  // STRENGTH
  // ======================================

  let strongestPhase =
    'balanced';

  // ======================================
  // GROUP SPECIALIST
  // ======================================

  if (

    groupAccuracy >=
    knockoutAccuracy + 0.25

  ) {

    strongestPhase =
      'group';

  }

  // ======================================
  // KNOCKOUT SPECIALIST
  // ======================================

  if (

    knockoutAccuracy >=
    groupAccuracy + 0.25

  ) {

    strongestPhase =
      'knockout';

  }


  // ======================================
  // RETURN
  // ======================================

  return {

  strongest_phase:
    strongestPhase,

  confidence:

    strengthDelta >= 0.25
      ? 'high'
      : strengthDelta >= 0.15
        ? 'medium'
        : 'low',

  strength_delta:
    Number(
      strengthDelta.toFixed(2)
    ),

  group_accuracy:
    Number(
      groupAccuracy.toFixed(2)
    ),

  knockout_accuracy:
    Number(
      knockoutAccuracy.toFixed(2)
    ),

  group_matches:
    groupMatches,

  knockout_matches:
    knockoutMatches

};

}


// ======================================
// EXPORT
// ======================================

module.exports = {

  getPhaseStrength

};