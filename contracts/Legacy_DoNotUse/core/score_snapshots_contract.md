# SCORE SNAPSHOTS CONTRACT

## Path

output/scores/snapshots/

---

## Purpose

Historical leaderboard state after every completed match.

Allows:
- leaderboard history
- ranking progression
- timeline analytics
- replayable tournament states

---

## Naming Convention

{match_id}_score.json

Examples:
- 001_score.json
- 072_score.json
- 104_score.json

---

## Rules

- Generated after every completed match
- Immutable once generated
- Sorted by total_points descending
- rank assigned after sorting
- Represents leaderboard state immediately after match completion

---

## Schema

```json
{
  "snapshot_match_id": 73,

  "stage": "group | knockout",

  "generated_at": "ISO_DATE",

  "leaderboard": [
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
}
```

---

## Snapshot Visibility Rules

Future matches must remain hidden.

Only completed matches may contribute to scoring.

---

## Standings Activation Rule

Standings scoring activates only after match 72 is completed.