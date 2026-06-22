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
        'Bola de Cristal',

      description:
        'Adivina quién avanza con precisión sospechosa.',

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
        'Montaña Rusa',

      description:
        'Sus posiciones suben y bajan sin avisar. Al menos el torneo es entretenido.',

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
        'No se baja de la zona alta. Candidato peligroso.',

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
        'Enrachado',

      description:
        'Escala posiciones y suma puntos fecha tras fecha. ¿Racha pasajera o nueva realidad?',

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
        'En Caída',

      description:
        'Viene cuesta abajo en las últimas fechas. ¿Momentáneo o preocupante?',

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
        'Amo de Grupos',

      description:
        'La fase de grupos es su territorio. Las eliminatorias dirán el resto.',

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
        'Bestia KO',

      description:
        'Crece en eliminatorias, cuando el torneo se pone serio.',

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
