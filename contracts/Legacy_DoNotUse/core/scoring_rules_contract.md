# SCORING RULES CONTRACT

## Purpose

Defines deterministic tournament scoring rules.

Scoring must always be reproducible from JSON data only.

---

# GROUP STAGE

Prediction type:
- L = local win
- E = draw
- V = away win

Scoring:
- correct result → +1 point

---

# GROUP STANDINGS

Per group position:

- 1st place → +4
- 2nd place → +3
- 3rd place → +2
- 4th place → +1

Rules:
- points awarded independently per position
- partial scoring allowed

---

# KNOCKOUT STAGE

Per match:

- correct home_team → +1
- correct away_team → +1
- correct home_goals → +1
- correct away_goals → +1
- exact score → +1
- correct advance_team → +1
- winner_type
- home_penalties
- away_penalties

Maximum:
- 6 points per match

---

# IMPORTANT KNOCKOUT RULES

Goal scoring does NOT depend on matching teams.

Exact score:
- requires both scores correct

Advance:
- evaluated independently

Partial scoring:
- always allowed

---

# BONUS RULES

Third place match:
- correct advance → +5

Final:
- correct champion → +15

---

# SNAPSHOT RULES

Leaderboard updates after every completed match.

A snapshot must be generated after every completed match.

---

# STANDINGS ACTIVATION RULE

Standings scoring activates only after match 72 is completed.

Before match 72:
- standings score = 0

---

# VALIDATION RULES

Invalid values:
- negative goals
- invalid prediction types
- duplicated match_id
- duplicated group positions

---

# SOURCE OF TRUTH RULE

Only these files may affect scoring:

- group_results.json
- knockout_results.json
- standings_results.json

Predictions become immutable after freeze.
# SCORING RULES CONTRACT

## Purpose

Defines deterministic tournament scoring rules.

Scoring must always be reproducible from JSON data only.

---

# GROUP STAGE

Prediction type:
- L = local win
- E = draw
- V = away win

Scoring:
- correct result → +1 point

---

# GROUP STANDINGS

Per group position:

- 1st place → +4
- 2nd place → +3
- 3rd place → +2
- 4th place → +1

Rules:
- points awarded independently per position
- partial scoring allowed

---

# KNOCKOUT STAGE

Per match:

- correct home_team → +1
- correct away_team → +1
- correct home_goals → +1
- correct away_goals → +1
- exact score → +1
- correct advance_team → +1

Maximum:
- 6 points per match

---

# IMPORTANT KNOCKOUT RULES

Goal scoring does NOT depend on matching teams.

Exact score:
- requires both scores correct

Advance:
- evaluated independently

Partial scoring:
- always allowed

---

# BONUS RULES

Third place match:
- correct advance → +5

Final:
- correct champion → +15

---

# SNAPSHOT RULES

Leaderboard updates after every completed match.

A snapshot must be generated after every completed match.

---

# STANDINGS ACTIVATION RULE

Standings scoring activates only after match 72 is completed.

Before match 72:
- standings score = 0

---

# VALIDATION RULES

Invalid values:
- negative goals
- invalid prediction types
- duplicated match_id
- duplicated group positions

---

# SOURCE OF TRUTH RULE

Only these files may affect scoring:

- group_results.json
- knockout_results.json
- standings_results.json

Predictions become immutable after freeze