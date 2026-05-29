# Entity Dictionary — v2

## Tournament Stages

Group:
- group

Knockout:
- R16
- OF
- QF
- SF
- 3P
- F

## Canonical Match Entities

- match_id
- stage
- group
- home_team
- away_team
- result
- home_goals
- away_goals
- advance_team

## Prediction Entities

Group stage:
- prediction

Standings:
- positions

## Score Entities

- total_points
- breakdown
- rank
- correct
- points

## Analytics Entities

- precision_general
- precision_avance
- precision_marcadores_exactos
- precision_tabla
- eficiencia_de_puntos
- consistencia_ranking
- timeline_race
- consenso_partidos
- campeon_vivo
- archetypes
- traits

## Important Invariant

match_id identifies bracket slot,
NOT universal matchup identity.
