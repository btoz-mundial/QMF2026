// =====================================
// IMPORTS
// =====================================

const path = require('path');

const {
  loadJson
} = require('../../../helpers/loadJson');


// =====================================
// LOAD RULES
// =====================================

const activationRulesPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'contracts',
  'analytics',
  'runtime_profiles',
  'archetype_activation_rules_v1.json'
);

const activationRules =
  loadJson(activationRulesPath);


// =====================================
// RESOLVE PRECEDENCE
// =====================================

function resolveArchetypePrecedence(
  eligibleArchetypes = []
) {

  // =====================
  // LOAD PRECEDENCE ORDER
  // =====================

  const precedenceOrder =
    activationRules
      .global_rules
      .precedence_order;


// =====================
// FILTER VALID IDS
// =====================

const validEligibleArchetypes =
  eligibleArchetypes.filter(
    archetypeId =>
      precedenceOrder.includes(archetypeId)
  );

  // =====================
  // EMPTY ELIGIBILITY
  // =====================

  if (validEligibleArchetypes.length === 0) {

    return {
      active_archetype: null,
      rejected_by_precedence: []
    };

  }


  // =====================
  // FIND WINNER
  // =====================

  let activeArchetype = null;

  for (const archetypeId of precedenceOrder) {

    if (
      validEligibleArchetypes.includes(archetypeId)
    ) {

      activeArchetype =
        archetypeId;

      break;

    }

  }


  // =====================
  // BUILD REJECTED LIST
  // =====================

  const rejectedByPrecedence =
    validEligibleArchetypes.filter(
      archetypeId =>
        archetypeId !== activeArchetype
    );


  // =====================
  // RETURN
  // =====================

  return {

    active_archetype:
      activeArchetype,

    rejected_by_precedence:
      rejectedByPrecedence

  };

}


// =====================================
// EXPORTS
// =====================================

module.exports = {
  resolveArchetypePrecedence
};