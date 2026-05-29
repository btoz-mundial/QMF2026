# FRONTEND DATA CONTRACT

## Purpose

Defines all frontend-consumable JSON artifacts.

Frontend is render-only.

Frontend must never calculate tournament logic.

---

# FRONTEND RULES

Frontend must never:

- calculate scores
- calculate rankings
- calculate standings
- infer analytics
- infer payouts
- recalculate snapshots

Frontend only consumes generated JSON artifacts.

---

# OFFICIAL DATA SOURCES

## SCORES

output/scores/leaderboard.json

output/scores/score_details.json

output/scores/snapshots/*.json

---

## ANALYTICS

analytics/**/*.json

---

## PAYOUTS

payout/outputs/*.json

---

## USER PREDICTIONS

output/users/*.json

---

# RENDERING RULES

Frontend must:

- display data only
- preserve backend ordering
- preserve backend ranking
- preserve backend totals

---

# SOURCE OF TRUTH

Backend-generated JSON artifacts are authoritative.

Frontend state must never override generated outputs.

---

# SNAPSHOT RULES

Snapshots represent historical immutable states.

Frontend must not mutate snapshot data.

---

# ANALYTICS RULES

Analytics are precomputed.

Frontend must not derive metrics dynamically.

---

# COMPATIBILITY RULES

Frontend must consume canonical field names only.

Deprecated names are unsupported.