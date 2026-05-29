# PIPELINE CONTRACT

## Purpose

Defines official execution order and data flow.

All systems must consume generated JSON artifacts.

No module may recalculate upstream logic.

---

# PIPELINE

## STEP 0 - RESULT INGEST

## STEP 1 — INGEST

Script:
scripts/parse_excel.js

Input:
input_open/*.xlsx

Output:
output/users/*.json

Purpose:
Convert Excel predictions into canonical JSON format.

---

## STEP 2 — SCORING

Script:
scripts/score.js

Inputs:
- output/users/*.json
- data/results/group_results.json
- data/results/knockout_results.json
- data/results/standings_results.json

Outputs:
- output/scores/leaderboard.json
- output/scores/score_details.json
- output/scores/snapshots/*.json

Purpose:
Generate deterministic scoring outputs.

---

## STEP 3 — ANALYTICS

Script:
analytics/build_metrics.js

Inputs:
- output/scores/*.json
- output/users/*.json

Outputs:
analytics/**/*.json

Purpose:
Generate derived tournament metrics.

---

## STEP 4 — PAYOUTS

Script:
payout/scripts/calculate_payouts.js

Inputs:
- output/scores/leaderboard.json
- payout/contracts/payout_structure.json

Outputs:
payout/outputs/*.json

Purpose:
Generate deterministic payout distributions.

---

# PIPELINE RULES

- Every step consumes outputs from previous step
- No step may infer missing data
- No frontend calculations allowed
- JSON artifacts are source of truth
- Outputs must be reproducible from zero

---

# FREEZE RULE

After tournament freeze:
- predictions cannot change
- only results files may updatelis