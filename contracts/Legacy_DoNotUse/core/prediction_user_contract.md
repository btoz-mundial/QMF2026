# PREDICTION USER CONTRACT

## Purpose

Canonical user prediction structure.

Generated from Excel ingestion pipeline.

Consumed by:
- scoring engine
- analytics
- payouts
- snapshots

---

## Path

output/users/*.json

---

## Root Schema

```json
{
  "user_id": "string",

  "display_name": "string",

  "source_file": "string",

  "processed_at": "ISO_DATE",

  "group_stage": [],

  "knockout": [],

  "standings": []
}
```

---

# GROUP STAGE PREDICTION

```json
{
  "match_id": 1,

  "prediction": "L | E | V"
}
```

---

# KNOCKOUT PREDICTION

```json
{
  "match_id": 73,

  "home_team": "string",

  "away_team": "string",

  "home_goals": 0,

  "away_goals": 0,

  "advance_team": "string"
}
```

---

# STANDINGS PREDICTION

```json
{
  "group": "A",

  "positions": [
    "Team A",
    "Team B",
    "Team C",
    "Team D"
  ]
}
```

---

# Validation Rules

## group_stage

- prediction must be:
  - L
  - E
  - V

---

## knockout

- scores cannot be negative
- advance is mandatory
- match_id must exist

---

## standings

- positions length must equal 4
- no duplicated teams inside same group
- group must exist

---

## Global Rules

- user_id must be unique
- all users must contain complete predictions
- predictions become immutable after freeze