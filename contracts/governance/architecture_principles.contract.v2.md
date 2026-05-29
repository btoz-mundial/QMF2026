# Architecture Principles — v2

## System Identity

The platform is a deterministic, JSON-only,
auditable World Cup prediction system.

The platform prioritizes:

1. Scoring accuracy
2. Data consistency
3. Auditability
4. Determinism
5. Maintainability
6. Performance
7. UX / Gamification

## Core Philosophy

The system MUST remain:

- deterministic
- reproducible
- transparent
- stateless during scoring
- audit-friendly
- contract-driven

## Forbidden Architecture

The system MUST NOT introduce:

- backend services
- databases
- hidden runtime state
- implicit scoring logic
- frontend business logic
- runtime mutation of predictions

## Canonical Rule

Canonical tournament truth originates from:

- fixture_master.xlsx
- results/*.json
- users/*.json

Everything else is downstream interpretation.
