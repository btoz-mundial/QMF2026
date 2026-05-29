# score_details.json Contract — v2

## Purpose

Immutable audit scoring artifact.

## Root Structure

[
  {
    "user_id": "49977F7EBF",
    "display_name": "BtoZ",
    "group": [],
    "knockout": [],
    "standings": []
  }
]

## Knockout Breakdown Structure

{
  "home_team": false,
  "away_team": false,
  "home_goals": true,
  "away_goals": true,
  "exact_goals": true,
  "advance": false
}

### Nota sobre `advance`

El campo `advance` aparece en el breakdown pero siempre otorga 0 puntos. Se evalúa y se registra para auditabilidad, pero no contribuye al score. No eliminar — es parte del contrato de auditoría.

## Rules

Consumers MAY:

- read
- aggregate
- enrich

Consumers MUST NOT:

- mutate
- redefine correctness
- infer canonical truth
