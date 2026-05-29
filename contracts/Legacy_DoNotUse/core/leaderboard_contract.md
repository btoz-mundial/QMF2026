# LEADERBOARD CONTRACT

## Path

output/scores/leaderboard.json

---

## Purpose

Current tournament ranking.

Generated from deterministic scoring engine.

Frontend consumes this file directly.

---

## Rules

- Sorted by total_points descending
- rank assigned after sorting
- Immutable scoring source
- Frontend must never recalculate totals

---

## Schema

```json
[
  {
    "user_id": "string",
    "display_name": "string",

    "total_points": 0,

    "breakdown": {
      "group": 0,
      "knockout": 0,
      "standings": 0
    },

    "rank": 1
  }
]