# Analytics Boundaries — v2

Analytics is a derived interpretation layer.

Analytics MAY:

- aggregate
- enrich
- classify
- narrativize
- derive metrics

Analytics MUST NOT:

- recalculate official scores
- redefine correctness
- override rankings
- mutate canonical truth
- infer unresolved tournament state

## Analytics Inputs

Allowed:

- leaderboard.json
- score_details.json
- snapshots/*

Forbidden:

- frontend runtime state
- mutable client state
