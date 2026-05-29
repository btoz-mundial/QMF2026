# Runtime Archetypes

Runtime Archetypes represent rare competitive identities detected dynamically during tournament progression.

They are not cosmetic labels, achievements, or static profile badges.

An archetype is assigned only when sustained competitive behavior matches a specific runtime identity model defined by the analytics system.

Archetypes exist to identify meaningful tournament narratives emerging organically from performance patterns across snapshots, rankings, precision metrics, and phase behavior.

The system intentionally prefers under-assignment over inflation.

Most participants are expected to have no active archetype during most tournament states.



# Core Philosophy

Archetypes are:

- runtime-derived
- performance-based
- deterministic
- auditable
- non-manual
- competitively meaningful

They are not assigned through:
- popularity
- subjective interpretation
- manual moderation
- isolated performances
- single-match spikes

All archetypes require:
- tournament maturity
- minimum sample size
- sustained competitive behavior
- runtime stability validation



# Archetype Exclusivity

A participant may qualify simultaneously for multiple archetypes internally.

However:
- only one active archetype may exist at runtime
- precedence resolution determines the final identity exposed publicly

This preserves:
- narrative clarity
- rarity
- competitive prestige
- frontend readability



# Runtime Behavior

Archetypes are dynamic runtime states.

They may:
- appear
- disappear
- evolve
- be replaced by higher-precedence identities

The system intentionally allows runtime movement when competitive behavior changes meaningfully over time.

However:
- isolated volatility should not immediately create or destroy archetypes
- stability windows exist to reduce noise and false-positive activation



# Archetype Visibility

Archetypes are intended to be visible at tournament level, not exclusively inside individual player profiles.

Frontend implementations may expose:
- archetype presence
- archetype rarity
- competitive emergence
- runtime identity transitions
- archetype census distributions

Possible frontend representations include:
- leaderboard markers
- runtime feeds
- archetype census summaries
- hover reveals
- tournament-level competitive signals

Presentation should preserve:
- competitive seriousness
- rarity perception
- prestige
- readability

Archetypes should never resemble:
- advertisements
- excessive gamification
- achievement spam
- social media-style engagement systems



# Archetype Definitions



## Front Runner

Represents sustained tournament control.

This archetype identifies participants capable of maintaining elite ranking position stability across large portions of the tournament lifecycle.

Front Runner is intended to be the rarest and most prestigious runtime archetype in the system.

Core signals include:
- sustained elite average rank
- prolonged top-tier leaderboard presence
- low ranking volatility
- stable competitive dominance



## Sharpshooter

Represents elite predictive precision.

This archetype identifies participants with unusually high accuracy in score prediction performance, especially across exact score and goal prediction metrics.

Sharpshooter prioritizes precision consistency over isolated prediction spikes.

Core signals include:
- home goal prediction accuracy
- away goal prediction accuracy
- combined prediction precision
- exact score prediction precision
- sustained predictive consistency



## Consistency Machine

Represents stable competitive performance throughout the tournament.

This archetype identifies participants capable of maintaining controlled volatility, balanced phase performance, and stable ranking behavior over time.

Consistency Machine values reliability over explosive peaks.

Core signals include:
- low runtime volatility
- stable ranking behavior
- controlled phase delta
- sustained competitive floor
- cross-phase consistency



## Elimination Specialist

Represents elite performance during knockout stages.

This archetype identifies participants whose predictive performance strengthens meaningfully during elimination rounds.

The identity is intended to reward participants capable of performing under higher competitive pressure environments.

Core signals include:
- knockout-stage efficiency
- elimination-round precision
- positive knockout phase delta
- sustained late-stage performance



# Runtime Transitions

The system tracks archetype transitions between executions.

Supported transition states include:

- promoted
- demoted
- replaced
- unchanged

Transitions are determined automatically by comparing current runtime identity against the previously generated archetype output.

No manual intervention exists inside the archetype lifecycle system.



# System Design Constraints

The runtime archetype system is intentionally designed without:
- databases
- backend services
- hidden persistence layers
- manual overrides
- opaque scoring systems

All archetype generation must remain:
- reproducible
- deterministic
- transparent
- recalculable from source outputs



# Source of Truth

Archetypes are derived from analytics outputs generated across the tournament runtime ecosystem.

Examples include:
- leaderboard snapshots
- ranking consistency metrics
- prediction precision metrics
- phase efficiency metrics
- runtime volatility metrics

Archetypes themselves are not primary truth objects.

They are interpretative runtime identities derived from deterministic tournament analytics.