# NAMING CONVENTIONS CONTRACT

## Purpose

Defines canonical naming conventions across all JSON artifacts.

These names must remain stable.

---

# OFFICIAL FIELD NAMES

## User Identity

Use:
- user_id
- display_name

Deprecated:
- name

---

# Score Totals

Use:
- total_points

Deprecated:
- total

---

# Score Categories

Use:
- group
- knockout
- standings
- bonus

Deprecated:
- group_stage (except prediction input files)

---

# Prediction Collections

Canonical prediction structure:

```json
{
  "group_stage": [],
  "knockout": [],
  "standings": []
}
```

Reason:
group_stage represents prediction input layer.

---

# Leaderboard Collections

Canonical scoring structure:

```json
{
  "breakdown": {
    "group": 0,
    "knockout": 0,
    "standings": 0,
    "bonus": 0
  }
}
```

Reason:
group represents scoring category layer.

---

# Timestamp Naming

Use:
- generated_at
- processed_at

Format:
ISO 8601 UTC

---

# Snapshot Naming

Use:
{match_id}_score.json

Examples:
- 001_score.json
- 072_score.json
- 104_score.json

---

Honestamente:
NO crearía otro archivo.

Ya tienes una separación MUY buena.

Lo correcto es:
1. naming_conventions_contract.md

#Canonical stage taxonomy
group
R32
OF
QF
SF
3P
Final

#Match status taxonomy
scheduled
live
final
postponed
cancelled

#Winner type taxonomy
REGULAR_TIME
EXTRA_TIME
PENALTIES

# Rules

- Naming must remain stable
- Frontend must not infer aliases
- Analytics must consume canonical names only
- Deprecated names must not appear in new outputs