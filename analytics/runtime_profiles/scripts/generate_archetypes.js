// =====================================
// IMPORTS
// =====================================

const fs = require('fs');

const path = require('path');

const {
  loadSnapshots
} = require('../../helpers/loadSnapshots');

const {
  loadJson
} = require('../../helpers/loadJson');

const {
  saveOutput
} = require('../../helpers/saveOutput');

const {
  buildUserMetrics
} = require('./helpers/buildUserMetrics');

const {
  evaluateFrontRunner
} = require('./helpers/evaluateFrontRunner');


const {
  evaluateSharpshooter
} = require('./helpers/evaluateSharpshooter');

const {
  evaluateClutchHunter
} = require('./helpers/evaluateClutchHunter');

const {
  evaluateConsistencyMachine
} = require('./helpers/evaluateConsistencyMachine');

const {
  resolveArchetypePrecedence
} = require('./helpers/resolveArchetypePrecedence');


// =====================================
// LOAD SNAPSHOTS
// =====================================

const snapshots =
  loadSnapshots();


// =====================================
// LOAD PREVIOUS OUTPUT
// =====================================

const previousOutputPath = path.join(

  __dirname,

  '..',

  'outputs',

  'archetypes.json'

);

let previousArchetypesMap = {};

if (fs.existsSync(previousOutputPath)) {

  const previousOutput =
    loadJson(previousOutputPath);

  previousOutput.users.forEach(user => {

    previousArchetypesMap[user.user_id] = {

      active_archetype:
        user.active_archetype

    };

  });

}


// =====================================
// BUILD USER METRICS
// =====================================

const userMetrics =
  buildUserMetrics();


// =====================================
// BUILD USERS
// =====================================

const users = [];

Object.values(userMetrics)
  .forEach(user => {

    // =====================
    // USER INFO
    // =====================

    const userId =
      user.user_id;

    const displayName =
      user.display_name;



    // =====================
    // EVALUATIONS
    // =====================

    const frontRunner =
      evaluateFrontRunner({

        userId,
        snapshots,
        metrics: user

      });

    const sharpshooter =
      evaluateSharpshooter({

        userId,
        snapshots,
        metrics: user

      });

    const clutchHunter =
      evaluateClutchHunter({

        userId,
        snapshots,
        metrics: user

      });

    const consistencyMachine =
      evaluateConsistencyMachine({

        userId,
        snapshots,
        metrics: user

      });


    // =====================
    // BUILD ELIGIBILITY
    // =====================

    const evaluations = [

      frontRunner,
      sharpshooter,
      clutchHunter,
      consistencyMachine

    ];

    const eligibleArchetypes =
      evaluations

        .filter(
          evaluation =>
            evaluation.eligible
        )

        .map(
          evaluation =>
            evaluation.archetype_id
        );


    // =====================
    // RESOLVE PRECEDENCE
    // =====================
    
    const precedenceResolution =
      resolveArchetypePrecedence(
        eligibleArchetypes
      );

    const activeArchetype =
      precedenceResolution
        .active_archetype;

    const rejectedByPrecedence =
      precedenceResolution
        .rejected_by_precedence;


    // =====================
    // WINNING EVALUATION
    // =====================

    const winningEvaluation =
      evaluations.find(
        evaluation =>
          evaluation.archetype_id ===
          activeArchetype
      );


    // =====================
    // ACTIVATION REASONS
    // =====================

    const activationReasons =
      winningEvaluation
        ? winningEvaluation.activation_reasons
        : [];


    // =====================
    // PREVIOUS ARCHETYPE
    // =====================

    const previousArchetype =
      previousArchetypesMap[userId]
        ?.active_archetype
        || null;


    // =====================
    // CHANGE DETECTION
    // =====================

    const archetypeChanged =
      previousArchetype !==
      activeArchetype;

    let changeType = null;

    if (archetypeChanged) {

      // =====================
      // PROMOTED
      // =====================

      if (
        previousArchetype === null
        &&
        activeArchetype !== null
      ) {

        changeType =
          'promoted';

      }

      // =====================
      // DEMOTED
      // =====================

      else if (
        previousArchetype !== null
        &&
        activeArchetype === null
      ) {

        changeType =
          'demoted';

      }

      // =====================
      // REPLACED
      // =====================

      else if (
        previousArchetype !== null
        &&
        activeArchetype !== null
      ) {

        changeType =
          'replaced';

      }

    }


    // =====================
    // PUSH USER
    // =====================

    users.push({

      user_id:
        userId,

      display_name:
        displayName,

      active_archetype:
        activeArchetype,

      eligible_archetypes:
        eligibleArchetypes,

      rejected_by_precedence:
        rejectedByPrecedence,

      activation_reasons:
        activationReasons,

      previous_archetype:
        previousArchetype,

      archetype_changed:
        archetypeChanged,

      change_type:
        changeType

    });

  });


// =====================================
// OUTPUT
// =====================================

const output = {

  generated_at:
    new Date().toISOString(),

  system:
    'runtime_archetypes',

  version:
    'v1',

  users

};


// =====================================
// SAVE
// =====================================

const outputPath = path.join(

  __dirname,

  '..',

  'outputs',

  'archetypes.json'

);

saveOutput(
  outputPath,
  output
);


// =====================================
// DONE
// =====================================

console.log(
  '✅ archetypes.json generado'
);