# PAYOUT CONTRACT

## Purpose

Defines deterministic tournament payout structure.

Payouts must be reproducible from leaderboard outputs only.

---

# INPUTS

## Leaderboard

output/scores/leaderboard.json

---

## Payout Structure

payout/contracts/payout_structure.json

---

# OUTPUTS

payout/outputs/payouts.json

---

# PAYOUT STRUCTURE SCHEMA

```json
{
  "entry_fee": 0,

  "players": 0,

  "total_pool": 0,

  "distribution": [
    {
      "rank": 1,
      "percentage": 50
    }
  ]
}
```

---

# PAYOUT OUTPUT SCHEMA

```json
{
  "generated_at": "ISO_DATE",

  "total_pool": 0,

  "positions": [
    {
      "rank": 1,

      "user_id": "string",

      "display_name": "string",

      "total_points": 0,

      "percentage": 50,

      "prize": 0
    }
  ]
}
```

---

# RULES

- payouts derive only from leaderboard
- frontend must never calculate payouts
- payout calculations must be deterministic
- ranking ties follow leaderboard ordering
- payouts are immutable once generated

---

# SOURCE OF TRUTH

Leaderboard ranking is authoritative.

Payout system must never recalculate scores.

---

# VALIDATION RULES

- total distribution must equal 100
- percentages cannot be negative
- payout positions must be unique