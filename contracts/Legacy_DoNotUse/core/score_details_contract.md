# SCORE DETAILS CONTRACT

## Path

output/scores/score_details.json

---

## Purpose

Transparent scoring audit layer.

Stores detailed scoring breakdown for every user.

Used for:
- frontend audit views
- match breakdowns
- analytics
- debugging
- transparency

---

## Root Schema

```json
[
  {
    "user_id": "string",
    "display_name": "string",

    "group": [],
    "knockout": [],
    "standings": []
  }
]
```

---

# GROUP DETAIL

```json
{
  "match_id": 1,

  "prediction": "L",

  "result": "L",

  "points": 1,

  "breakdown": {
    "correct": true
  }
}
```

---

# KNOCKOUT DETAIL

```json
{
  "match_id": 73,

  "prediction": {
    "home_team": "string",
    "away_team": "string",
    "home_goals": 0,
    "away_goals": 0,
    "advance_team": "string"
  },

  "result": {
    "home_team": "string",
    "away_team": "string",
    "home_goals": 0,
    "away_goals": 0,
    "advance_team": "string"
  },

  "points": 0,

  "breakdown": {
    "home_team": false,
    "away_team": false,
    "home_goals": false,
    "away_goals": false,
    "exact_score": false,
    "advance_team": false
  }
}
```

---

# STANDINGS DETAIL

```json
{
  "group": "A",

  "total_points": 0,

  "positions": [
    {
      "position": 1,
      "predicted_team": "string",
      "real_team": "string",
      "correct": false,
      "points": 0
    }
  ]
}
```