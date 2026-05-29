# Runtime Profile Governance V1

---

# Purpose

Define governance rules for:

- Archetypes
- Momentum States
- Traits
- Runtime identity stability

This document exists to preserve:

- semantic consistency
- competitive clarity
- auditability
- narrative coherence

Runtime profiles are:

- deterministic
- derivable
- reproducible
- snapshot-driven

They are NOT:

- achievements
- gamification badges
- personality assumptions
- psychological profiling
- personality typing

---

# Runtime Identity Philosophy

Runtime identities exist to translate tournament behavior into recognizable competitive narratives derived exclusively from deterministic runtime data.

The system should feel like:

- sports coverage
- live tournament narrative
- tournament analysis
- competitive broadcast commentary

NOT like:

- SaaS dashboards
- productivity tools
- generic fantasy apps
- achievement systems

Runtime identities are intended to answer:

> “What kind of tournament is this player having?”

NOT:

> “How many points does this player have?”

---

# Core Principles

## 1. Deterministic

All runtime identities must derive exclusively from:

- score_details
- leaderboard
- snapshots
- official runtime metrics

Runtime identities must never depend on:

- manual interpretation
- hidden scoring
- subjective review
- frontend calculations
- AI inference
- narrative overrides

Every activation must be reproducible from JSON source artifacts.

---

## 2. Scarcity Over Coverage

Elite runtime identities are intentionally rare.

Not every player should receive an archetype.

Under-assignment is preferred over:

- weak assignments
- inflated identities
- ambiguous narratives
- low-prestige labels

A tournament where most users receive elite identities is considered a governance failure.

The system prioritizes:

- prestige
- recognizability
- narrative legitimacy

over:

- user coverage
- engagement optimization
- profile decoration

---

## 3. Narrative Stability

Runtime identities should emerge from sustained tournament behavior.

The system must avoid:

- constant reassignment
- narrative volatility
- identity drift
- reactive activations from short-term variance

Runtime identity systems should prioritize:

- continuity
- interpretability
- narrative coherence

over:

- excessive reactivity

---

## 4. Competitive Legitimacy

Runtime identities must feel valid within a sports competition context.

The system must never:

- glorify randomness
- reward irrational prediction behavior
- celebrate failure
- romanticize volatility without results
- create misleading prestige

Runtime identities should communicate:

- recognizable tournament behavior
- competitive interpretation
- performance identity
- tournament evolution

---

# Runtime Identity Layers

## 1. Archetypes

Highest-level competitive identity.

Archetypes represent:

- dominant tournament behavior
- elite performance patterns
- recognizable competitive styles

Official archetypes are defined in:

```text
contracts/analytics/runtime_profiles/archetype_registry_v1.json
Archetype Rules
Maximum: 1 active archetype
Archetypes should feel prestigious
Archetypes should activate rarely
Archetypes should emerge from sustained behavior
Archetypes should NOT fluctuate frequently
Archetypes SHOULD:
feel memorable
feel earned
reinforce competitive storytelling
represent sustained tournament identity
Archetypes SHOULD NOT:
feel random
activate too early
overlap excessively
behave like generic achievements
2. Momentum States

Temporary competitive state derived from recent tournament evolution.

Momentum represents:

recent ranking behavior
recent tournament trajectory
current competitive direction

Examples:

En Ascenso
Imparable
Se Desinfló
Congelado
Sigo Vivo
Momentum Rules
Maximum: 1 active momentum state
Momentum may change frequently
Momentum is timeline-dependent
Momentum is snapshot-sensitive

Momentum exists to answer:

“What is happening to this player RIGHT NOW?”

3. Traits

Secondary descriptive attributes.

Traits complement:

archetypes
momentum
competitive interpretation

Examples:

Bajo consenso
Alta volatilidad
Conservador
Preciso en avances
Trait Rules
0–3 active traits
Traits are NOT elite identities
Traits may coexist
Traits are descriptive only

Traits exist to add:

nuance
tournament flavor
behavioral context
Single Identity Principle

A user may only hold:

maximum 1 archetype
maximum 1 momentum_state
0–3 traits

Archetypes represent the dominant competitive identity.

Momentum states represent current competitive condition.

Traits provide behavioral nuance.

These layers must remain conceptually separated.

Priority System

Runtime rendering priority:

Archetype
Momentum State
Traits
Fallback Identity
Fallback Identity

Some users may NOT qualify for an archetype.

This is intentional.

Archetypes should remain:

scarce
meaningful
prestigious

When no archetype exists:

Render fallback UI identity:

Participante Oficial

This is:

a UI fallback
NOT a runtime archetype
NOT a competitive identity

The fallback exists to:

preserve prestige hierarchy
avoid forced archetypes
maintain visual consistency
Runtime Stability Rules
Archetypes

Archetypes should remain relatively stable.

Archetypes should:

activate carefully
avoid frequent switching
represent sustained tournament identity

Archetypes SHOULD NOT:

change every snapshot
fluctuate rapidly
react to small ranking swings
Momentum States

Momentum can change frequently.

Momentum should:

react to recent performance
reflect tournament trajectory
feel alive and current

Momentum may:

shift rapidly
respond to streaks
react to ranking swings
Traits

Traits are semi-stable.

Traits may:

fluctuate moderately
evolve during tournament progression

Traits SHOULD NOT:

oscillate every snapshot
contradict archetype identity
Activation Philosophy

Runtime identities should emerge from:

repeated patterns
meaningful tournament behavior
measurable trends
sustained performance

NOT from:

isolated events
single lucky matches
tiny statistical differences

Certain runtime identities may require:

minimum snapshots
minimum sample sizes
stage-specific validation
sustained runtime stability
Archetype Scarcity

Archetypes are intentionally rare.

Most tournament participants are expected to have no active archetype.

Scarcity is considered necessary to preserve:

prestige
readability
narrative legitimacy
competitive differentiation

The system prioritizes:

identity quality

over:

archetype coverage
Mutual Exclusion Philosophy

Some runtime identities may conflict semantically.

Mutual exclusions exist to preserve:

narrative clarity
believable tournament storytelling
competitive coherence

The system should prefer:

no assignment

over:

contradictory identity assignment

Traits are generally allowed to coexist unless they become:

semantically contradictory
analytically incompatible
Frontend Governance

Frontend MUST:

consume generated runtime outputs
render existing identities
avoid runtime inference
avoid hidden calculations

Frontend MUST NOT:

derive archetypes
derive momentum
generate narrative logic
invent tournament interpretation

All runtime interpretation must originate from deterministic outputs.

Archetype Visibility

Archetypes are intended to be visible at tournament level,
not exclusively inside individual player profiles.

Frontend implementations may expose:

archetype presence
archetype rarity
tournament-level runtime narrative

provided presentation preserves:

competitive seriousness
narrative prestige
visual restraint
sports-oriented tone

Frontend implementations may optionally include:

archetype census systems
discrete leaderboard indicators
hover-based archetype reveals
tournament runtime signals
competitive narrative feeds

Examples may include:

active archetype counts
runtime archetype emergence
archetype scarcity visibility
tournament-wide competitive signals

Frontend presentation must avoid:

achievement-style framing
excessive visual celebration
arcade-style progression systems
aggressive notifications
intrusive banners
gamified unlock presentation

Archetype visibility should feel:

editorial
competitive
observational
tournament-oriented

NOT:

collectible
reward-driven
progression-based
advertisement-like
Runtime Governance

Runtime identities are:

recalculable
replaceable
tournament-specific
state-dependent

They are NOT:

permanent user classifications
historical lifetime labels
profile ranks
account-level identities

A player's runtime identity may change across tournaments.

Transparency Requirement

Every runtime identity should be explainable.

The system should always be able to answer:

“Why does this player have this runtime identity?”

Runtime profiles must remain:

auditable
understandable
derivable from tournament data

No hidden logic.

No opaque scoring.

No narrative-only identities.

Governance Priority Order

When conflicts appear, the runtime profile system prioritizes:

Competitive legitimacy
Deterministic reproducibility
Narrative coherence
Stability
Scarcity
Readability
Coverage

Coverage is intentionally low priority.

Non-Goals

The runtime profile system is NOT intended to:

maximize engagement
assign everyone an identity
reward participation
create collectible labels
simulate RPG systems
replace scoring systems
replace traits
replace momentum states

Its purpose is to create coherent competitive identity from deterministic tournament behavior.

Future Expansion Policy

New runtime identities should be added rarely.

An identity should only be introduced if it:

has a unique competitive identity
does not overlap existing identities
derives from stable runtime signals
remains narratively recognizable
survives deterministic governance review

Runtime identity quantity must remain intentionally constrained.

Narrative inflation is considered a system risk.

V1 Scope

This governance is intentionally lightweight.

Goals:

semantic consistency
runtime stability
frontend alignment
narrative coherence

This document does NOT finalize:

thresholds
exact derivation formulas
analytics contracts
runtime implementation details

Those will evolve separately as runtime derivation matures.