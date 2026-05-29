# Dependency Rules — v2

## Allowed Dependency Flow

fixture_master.xlsx
↓
results/*.json
users/*.json
↓
scoring/*
↓
leaderboard.json
score_details.json
snapshots/*
↓
analytics/generated/*
↓
frontend rendering

Dependencies MUST flow downward only.

## Forbidden Dependencies

Analytics MUST NOT:
- import scoring logic
- redefine correctness
- recalculate points

Frontend MUST NOT:
- calculate rankings
- infer standings
- mutate outputs

Scoring MUST NOT:
- depend on analytics
- depend on frontend state
