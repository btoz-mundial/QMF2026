# Scoring Invariants — v2

## Core Invariants

Scoring MUST be:

- deterministic
- reproducible
- stateless
- auditable

## Official Scoring Authority

Only scoring/* may:

- calculate points
- define correctness
- generate official score breakdowns

## score_details.json

score_details.json is:

- immutable
- downstream-safe
- audit-oriented

score_details.json is NOT:

- canonical tournament truth
- mutable runtime state

## Analytics Restrictions

Analytics MUST consume scoring outputs.

Analytics MUST NOT redefine scoring logic.
