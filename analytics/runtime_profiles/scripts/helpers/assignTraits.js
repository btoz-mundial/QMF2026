// ======================================
// ASSIGN TRAITS
// ======================================

function assignTraits({

  advanceMetrics,
  volatilityMetrics,
  momentumMetrics,
  phaseStrength,
  totalUsers

}) {

  const traits = [];

  // ======================================
  // PRECISE ADVANCEMENTS
  // ======================================

  const advanceAccuracy =
    advanceMetrics?.accuracy || 0;

  const knockoutMatches =
    advanceMetrics?.total_matches || 0;

  if (

    knockoutMatches >= 8 &&
    advanceAccuracy >= 0.70

  ) {

    traits.push({

      id:
        'precise_advancements',

      label:
        'Preciso en avances',

      description:
        'Alta precisión prediciendo equipos clasificados.',

      confidence:
        advanceAccuracy >= 0.85
          ? 'high'
          : 'medium',

      metrics: {

        advance_accuracy:
          Number(
            advanceAccuracy.toFixed(2)
          ),

        knockout_matches:
          knockoutMatches

      }

    });

  }

  // ======================================
  // HIGH VOLATILITY
  // ======================================

  const rankSwing =
    volatilityMetrics?.rank_swing || 0;

  const volatilityThreshold =
    Math.max(
     5,
     Math.round(totalUsers * 0.20)
    );

  if (

    rankSwing >= volatilityThreshold

  ) {

    traits.push({

      id:
        'high_volatility',

      label:
        'Alta volatilidad',

      description:
        'Usuario con cambios fuertes de posición durante el torneo.',

      confidence:
        rankSwing >= volatilityThreshold * 1.5
          ? 'high'
          : 'medium',

      metrics: {

        rank_swing:
          rankSwing,

        volatility_threshold:
          volatilityThreshold

      }

    });

  }

  // ======================================
  // CONTENDER
  // ======================================

  const worstRankPercentile =
    volatilityMetrics?.worst_rank_percentile || 1;

  if (

    worstRankPercentile <= 0.40

  ) {

    traits.push({

      id:
        'contender',

      label:
        'Contendiente',

      description:
        'Se mantiene constantemente en zona competitiva.',

      confidence:
        worstRankPercentile <= 0.25
          ? 'high'
          : 'medium',

      metrics: {

        worst_rank_percentile:
          Number(
            worstRankPercentile.toFixed(2)
          )

      }

    });

  }

  // ======================================
  // RISING
  // ======================================

  const momentumTrend =
    momentumMetrics?.trend || 'stable';

  const momentumStrength =
    momentumMetrics?.momentum_strength || 0;

  if (

    momentumTrend === 'up'

  ) {

    traits.push({

      id:
        'rising',

      label:
        'En ascenso',

      description:
        'Ha mejorado consistentemente en los últimos partidos.',

      confidence:
        momentumStrength >= 10
          ? 'high'
          : 'medium',

      metrics: {

        recent_ranks:
          momentumMetrics?.recent_ranks || [],

        momentum_strength:
          momentumStrength

      }

    });

  }

  // ======================================
  // FALLING
  // ======================================

  if (

    momentumTrend === 'down'

  ) {

    traits.push({

      id:
        'falling',

      label:
        'Se desinfló',

      description:
        'Ha perdido posiciones recientemente.',

      confidence:
        momentumStrength >= 10
          ? 'high'
          : 'medium',

      metrics: {

        recent_ranks:
          momentumMetrics?.recent_ranks || [],

        momentum_strength:
          momentumStrength

      }

    });

  }

  // ======================================
  // GROUP SPECIALIST
  // ======================================

  const strongestPhase =
    phaseStrength?.strongest_phase || 'balanced';

  const strengthConfidence =
    phaseStrength?.confidence || 'low';

  if (

    strongestPhase === 'group'

  ) {

    traits.push({

      id:
        'group_specialist',

      label:
        'Especialista de grupos',

      description:
        'Destaca especialmente en la fase de grupos.',

      confidence:
        strengthConfidence,

      metrics: {

        group_accuracy:
          phaseStrength?.group_accuracy || 0,

        knockout_accuracy:
          phaseStrength?.knockout_accuracy || 0,

        strength_delta:
          phaseStrength?.strength_delta || 0

      }

    });

  }

  // ======================================
  // KNOCKOUT SPECIALIST
  // ======================================

  if (

    strongestPhase === 'knockout'

  ) {

    traits.push({

      id:
        'knockout_specialist',

      label:
        'Especialista knockout',

      description:
        'Se fortalece conforme avanza el torneo.',

      confidence:
        strengthConfidence,

      metrics: {

        group_accuracy:
          phaseStrength?.group_accuracy || 0,

        knockout_accuracy:
          phaseStrength?.knockout_accuracy || 0,

        strength_delta:
          phaseStrength?.strength_delta || 0

      }

    });

  }

  // ======================================
  // RETURN
  // ======================================

  return traits;

}


// ======================================
// EXPORT
// ======================================

module.exports = {

  assignTraits

};