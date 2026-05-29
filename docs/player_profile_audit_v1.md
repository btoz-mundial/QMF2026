# Auditoría Conceptual — Player Profile Dashboard
**QMF 2026 · Runtime Competitive Profiles**
_Generado: 2026-05-20 · Revisado: 2026-05-20 (v1.1 — 4 correcciones aplicadas)_

---

## 0. Metodología

Este documento analiza el prototipo visual del Player Profile contra los outputs y contratos **reales** del sistema. Cada componente del prototipo fue clasificado según su derivabilidad actual. No se asume nada que no esté verificado en los JSONs.

### Correcciones aplicadas en v1.1

| # | Corrección |
|---|---|
| 1 | `campeon_vivo.json` → concepto evolucionado a bracket survival tracking (`surviving_predictions.json`) |
| 2 | Fortalezas/Debilidades → usar `best_category`/`worst_category` de `precision_general.extra` (ya existe, determinístico, sin threshold) |
| 3 | Zona de Premio → definida en `payout/payout_structure.json` → `paid_positions: 2` (Top 2) |
| 4 | Campo narrativo del archetype → es `identity_formula` (añadido a `archetype_registry_v1.json`). El Hero usa `display_name` + `short_description` + `identity_formula`. No se introduce `quote`. |

Archivos inspeccionados:
- `output/scores/leaderboard.json`
- `output/scores/score_details.json`
- `output/scores/snapshots/` (88 snapshots)
- `analytics/outputs/user_metrics.json`
- `analytics/timeline/outputs/timeline_race.json`
- `analytics/core/outputs/precision_avance.json`
- `analytics/intelligence/outputs/campeon_vivo.json`
- `analytics/engagement/outputs/consenso_partidos.json`
- `analytics/runtime_profiles/outputs/archetypes.json`
- `analytics/runtime_profiles/outputs/traits.json`
- `contracts/analytics/runtime_profiles/archetype_registry_v1.json`
- `contracts/analytics/runtime_profiles/momentum_states.md`

---

## 1. Inventario de Outputs Reales

### 1.1 Lo que existe y funciona

| Output | Contenido clave disponible |
|---|---|
| `leaderboard.json` | rank, total_points, breakdown {group, standings, knockout} |
| `score_details.json` | Por partido: prediction, result, points, breakdown por campo |
| `snapshots/` (88) | rank por usuario por snapshot |
| `timeline_race.json` | rank, rank_delta, movement (up/down/same), total_points por snapshot |
| `user_metrics.json` | 5 métricas: precision_general, precision_marcadores_exactos, precision_tabla, eficiencia_de_puntos, consistencia_ranking (con value, ranking, percentile, extra) |
| `precision_avance.json` | group_qualifiers_accuracy + knockout_advancement_accuracy + rank — pero **no está en user_metrics** |
| `archetypes.json` | active_archetype, eligible_archetypes, activation_reasons, archetype_changed |
| `traits.json` | traits con id, label, description, confidence, metrics (advance_accuracy, volatility, momentum.trend, phase_strength) |
| `archetype_registry_v1.json` | display_name, short_description, short_metric, rarity_tier (4 archetypes: front_runner, consistency_machine, clutch_hunter, sharpshooter) |

### 1.2 Lo que está roto o vacío

| Output | Estado | Impacto en prototipo |
|---|---|---|
| `campeon_vivo.json` | `users: []` — vacío. Además el concepto es semánticamente insuficiente: el objetivo real es bracket survival tracking completo (campeón, finalistas, semifinalistas, etc.), no solo el campeón. Necesita evolucionar a `surviving_predictions.json`. | Sección "Tus Apuestas Clave (Vivas)" no puede funcionar hasta que se refactorice y repare |
| `consenso_partidos.json` | `matches: []` — vacío | Cualquier trait derivado de consenso es inoperable |
| `momentum_state_rules.json` | Archivo vacío | Momentum states sin implementación |

### 1.3 Lo que no existe en ningún output

- Racha de posiciones reciente (últimos N snapshots) → campo calculable pero no derivado aún
- Consecutive snapshots en zona de premio → no existe, zona de premio tampoco está definida en contrato
- Deltas de ranking por fase (R16→QF, etc.) → no existe como output
- Score ganado por jornada/match → no existe (solo por snapshot)
- Quote/tagline narrativo del archetype → **no existe en archetype_registry_v1.json**
- Percentil global de puntos totales → distinto a los percentiles de métricas individuales en user_metrics

---

## 2. Auditoría Componente por Componente

### 2.1 Hero / Header

**Prototipo muestra:**
- Nombre, avatar, rango actual (#7 de 12), puntos totales (199)
- Tags: "Desde el día 1", "Predicciones Bloqueadas"
- Barras de progreso por fase: Grupos / Tabla / Knockout
- Percentil general "Top 58%"

**Estado:**

| Elemento | Derivable | Fuente | Nota |
|---|---|---|---|
| Nombre, rank, pts | ✅ | leaderboard.json | Directo |
| Breakdown pts (3 barras) | ✅ | leaderboard.breakdown | Directo |
| "Predicciones Bloqueadas" | ✅ | user profile metadata | Ya existe el concepto |
| "Desde el día 1" | ⚠️ | Requiere definición explícita | ¿Qué significa? ¿Que el usuario tiene predicciones del snapshot inicial? Necesita contrato |
| Top 58% percentil general | ⚠️ | Calculable desde leaderboard | No es el mismo percentile que en user_metrics (que es por métrica). Necesita derivación: rank/total_users |

**Riesgo:** "Top 58%" es fácil de calcular (1 - rank/N), pero no está en ningún output. Si se calcula en frontend, viola la regla de no-logic en frontend. Debe ser campo en leaderboard o derivado en pipeline.

---

### 2.2 Identidad Competitiva (Panel derecho del hero)

**Prototipo muestra:**
- Nombre del archetype: "Depredador del Knockout"
- Quote: _"Mientras el torneo se volvía más difícil... se hacía más fuerte."_
- Estado actual: "En Ascenso" (con badge verde)
- Racha actual: "+4 posiciones últimos 3 snapshots"
- Traits: Bajo consenso, Alta volatilidad, Precisión en avances

**Estado:**

| Elemento | Derivable | Fuente | Nota |
|---|---|---|---|
| Nombre archetype (display_name) | ✅ | archetypes.json → archetype_registry | Existe. Pero "Depredador del Knockout" no existe en registry actual (hay: Front Runner, Consistency Machine, Clutch Hunter, Sharpshooter). Es nombre ficticio del prototipo. |
| Texto narrativo del archetype (`identity_formula`) | ✅ | `archetype_registry_v1.json → identity_formula` | Campo añadido al registry. Ejemplos: "Se mantiene arriba cuando el torneo aprieta." (Front Runner), "Crece cuando llegan los partidos decisivos." (Clutch Hunter). El Hero usa `display_name` + `short_description` + `identity_formula`. Gobernado manualmente, estable durante el torneo, tono broadcast/esports. No es flavor text ni RPG. |
| "En Ascenso" (momentum state) | ❌ | **Momentum states explícitamente diferidos** | momentum_state_rules.json está vacío. No implementar. |
| Racha "+4 últimos 3 snapshots" | ⚠️ | timeline_race.json | Calculable desde últimas 3 entradas del usuario, pero no existe como output derivado. Necesita campo en pipeline o en traits.json (que ya tiene momentum.recent_delta pero sin formato de "racha") |
| Trait "Bajo consenso" | ❌ | No existe en traits.json | traits.json actual para DisasterPicks: precise_advancements, high_volatility, knockout_specialist. "Bajo consenso" no está implementado. Además consenso_partidos.json está vacío. |
| Trait "Alta volatilidad" | ✅ | traits.json | Existe como high_volatility |
| Trait "Precisión en avances" | ✅ | traits.json | Existe como precise_advancements |

**Riesgos críticos:**
1. **Momentum state no debe aparecer.** El prototipo lo muestra como feature activo, pero el scope lo tiene diferido explícitamente. Incluirlo ahora crea deuda técnica y viola la jerarquía de implementación.
2. **`identity_formula` del archetype** — campo ya añadido al registry con tono broadcast/esports. Determinístico, gobernado manualmente. El Hero usa `display_name` + `short_description` + `identity_formula`.
3. **"Bajo consenso" no existe.** Depende de consenso_partidos.json que está roto. No se puede mostrar este trait todavía.

---

### 2.3 Estado del Torneo

**Prototipo muestra:**
- Top Actual #7, Mejor Posición #4 (Match 72), Peor Posición #12 (Match 48)
- En Zona de Premio: Sí
- "+32 Puntos en Knockout (mejor fase)"
- "Top 3 en precisión de avances (62.5%)"
- "12 snapshots consecutivos en zona de premio"
- "Recuperó 4 posiciones desde Octavos"

**Estado:**

| Elemento | Derivable | Fuente | Nota |
|---|---|---|---|
| Top Actual | ✅ | leaderboard.json | Directo |
| Mejor/Peor posición + snapshot | ✅ | consistencia_ranking.extra (best_rank, worst_rank) | Existe. Match ID no está en extra, solo el rank. Habría que correlacionar con timeline_race para obtener el snapshot_match_id. |
| En Zona de Premio | ✅ | `payout/payout_structure.json → paid_positions` | Definición oficial: `paid_positions: 2` → zona de premio = Top 2. Determinístico. |
| +32 pts en Knockout | ✅ | leaderboard.breakdown.knockout | Directo. |
| Top 3 en precisión de avances | ✅ | precision_avance.json → rank | precision_avance.rank existe. Pero precision_avance NO está en user_metrics aún — es output separado no integrado al pipeline de user_metrics. |
| 12 snapshots consecutivos en zona de premio | ⚠️ | `timeline_race.json` + `payout_structure.json` | Zona de premio ya definida (Top 2). Falta derivar: iterar timeline_race por usuario contando snapshots consecutivos donde rank ≤ paid_positions. No está en ningún output aún. |
| Recuperó 4 posiciones desde Octavos | ⚠️ | timeline_race.json | Calculable: rank en snapshot de inicio de R16 vs rank actual. Pero requiere saber el snapshot_match_id de frontera de fase. No está como output derivado. |

**Riesgos:**
- "12 snapshots consecutivos" ahora tiene la zona definida (Top 2 desde payout_structure). Solo falta derivar el contador desde timeline_race. No debe hacerse en frontend.
- "Recuperó 4 posiciones desde Octavos" puede crear narrativa falsa: si el usuario bajó mucho durante Octavos y luego subió 4 desde el piso, el framing es engañoso. Necesita contexto narrativo cuidadoso.
- Separación importante: Archetypes usan percentil competitivo (no payout zone). Payout zone es un concepto económico/competitivo separado de la identidad narrativa. No mezclar en la identity layer.

---

### 2.4 Evolución de Ranking (Chart)

**Prototipo muestra:**
- Línea temporal desde Grupos → R16 → QF → SF → Final
- Un punto por snapshot oficial

**Estado:**

| Elemento | Derivable | Fuente | Nota |
|---|---|---|---|
| Datos de ranking por snapshot | ✅ | timeline_race.json | 88 snapshots con rank por usuario. Listo para graficar. |
| Labels de fase (Grupos, R16, QF, SF, Final) | ✅ | timeline_race.snapshot.stage | El campo stage existe en cada snapshot |
| Eje Y invertido (rank 1 arriba) | Puramente visual | — | Decisión de render, no lógica |

**Este es el componente más limpio del prototipo.** Derivación directa, sin ambigüedad, completamente auditable.

---

### 2.5 Fortalezas y Debilidades

**Prototipo muestra:**
- Fortalezas: Knockout Accuracy 62.5%, Precisión en Avances 61.9%, Momentum en KO +32 pts
- Debilidades: Grupos Accuracy 33.3%, Consenso Promedio 38.2%, Marcador Exacto 21.6%

**Estado:**

| Elemento | Derivable | Fuente | Nota |
|---|---|---|---|
| Knockout Accuracy % | ✅ | user_metrics → precision_general.extra.category_breakdown.knockout | Existe como 40.0% (valor real) |
| Precisión en Avances % | ⚠️ | precision_avance.json | Existe pero no integrado en user_metrics |
| Momentum en KO +32 pts | ✅ | leaderboard.breakdown.knockout | Valor absoluto, no momentum |
| Grupos Accuracy % | ✅ | user_metrics → precision_general.extra.category_breakdown.group | Existe |
| Consenso Promedio % | ❌ | consenso_partidos.json vacío | No operable |
| Marcador Exacto % | ✅ | user_metrics → precision_marcadores_exactos | Existe |

**Corrección v1.1 — Fortaleza/Debilidad ya tiene solución determinística:**

`precision_general.extra` ya incluye `best_category` y `worst_category` por usuario. Son campos determinísticos, relativos al propio usuario, sin threshold arbitrario. La UI debe usarlos directamente:
- Fortaleza = `best_category` (con su accuracy % del `category_breakdown`)
- Debilidad = `worst_category` (ídem)

Esto evita thresholds editoriales y mantiene la narrativa relativa al torneo individual del usuario. No se necesita cross-user comparison para este bloque. Verificado en datos reales: DisasterPicks → `best_category: standings` (85.42%), `worst_category: group` (4.23%).

Nota pendiente: mostrar "Momentum en KO +32 pts" como fortaleza en la misma lista que porcentajes mezcla unidades (pts vs %). Visualmente confuso. Ese valor pertenece al bloque de estado/breakdown, no a Fortalezas.

---

### 2.6 Predicciones vs Resultados (3 donuts)

**Prototipo muestra:**
- Fase de Grupos: 45.8% acierto, 22 aciertos / 14 parciales / 12 fallos
- Fase Eliminatoria: 47.6%, con breakdown (Equipos, Goles Local, Goles Visita, Marcador Exacto, Avances)
- Posiciones por Grupo: 75% acierto, 1°/2°/3°/4° lugar counts

**Estado:**

| Sección | Derivable | Fuente | Nota |
|---|---|---|---|
| Grupos: aciertos/parciales/fallos | ✅ | score_details.group | Cada match tiene points + breakdown.correct. Acierto=1pt, parcial=no aplica en grupos (solo correcto/incorrecto). Revisar qué significa "parcial" aquí. |
| Eliminatoria: breakdown por campo | ✅ | score_details.knockout.breakdown | Campos: home_team, away_team, home_goals, away_goals, exact_goals, advance. Todos presentes. |
| Posiciones por Grupo | ✅ | score_details.standings | standings tiene estructura similar |
| Porcentajes derivados | ✅ | Calculable desde score_details | Deben calcularse en pipeline, no en frontend |

**Riesgo UX — "Parciales" en grupos:** En la fase de grupos el scoring es binario (correcto o no), no hay parciales reales como en knockout. Si el prototipo muestra "14 parciales" en grupos, o la definición es distinta a lo esperado (ej. parcial = equivocó el equipo ganador pero acertó el empate) o es un error de diseño del prototipo.

**Riesgo UX — Tres donuts simultáneos:** Alta densidad visual. Compiten entre sí. Considera mostrar uno destacado y el resto como collapse/secondary.

---

### 2.7 Tus Apuestas Clave (Vivas)

**Prototipo muestra:**
- Campeón, Finalistas, Semifinalistas, Cuartos, Octavos con estado Vivo/Eliminado
- "2 de tus 2 finalistas siguen vivos"

**Estado:**

| Elemento | Derivable | Fuente | Nota |
|---|---|---|---|
| Predicciones de avance por fase | ✅ | user profiles (knockout array) | Las predicciones existen en profiles |
| Estado actual del equipo (vivo/eliminado) | ⚠️ | results/data | Requiere cruzar advance_team de predicción contra resultados reales |
| campeon_vivo.json | ❌ | **Vacío — users: []** | El output que debería tener esto está roto |

**Este bloque completo está bloqueado por campeon_vivo.json vacío.** La lógica de "¿sigue vivo tu equipo?" existe conceptualmente (cruzar predicción vs avances reales) pero el output está roto. Antes de diseñar el frontend de este bloque, hay que reparar campeon_vivo.

---

### 2.8 Momentos del Torneo

**Prototipo muestra:**
- Mejor Jornada: Match 89, +5 posiciones, Ganaste 18 pts
- Peor Caída: Match 48, -4 posiciones, Perdiste 9 pts
- Mayor Ascenso: R16→QF, +4 posiciones, En 1 snapshot
- Momento Clave: SF, Entraste a Top 10

**Estado:**

| Elemento | Derivable | Fuente | Nota |
|---|---|---|---|
| Mejor/Peor snapshot por rank_delta | ✅ | timeline_race.rank_delta | Calculable: max rank_delta positivo/negativo por usuario |
| Puntos ganados en un snapshot | ⚠️ | timeline_race.total_points | Delta entre snapshots consecutivos. Calculable pero no en output. |
| Mayor Ascenso por fase | ⚠️ | timeline_race + stage boundaries | Calculable pero requiere identificar boundaries de fase |
| "Momento Clave: SF, Entraste a Top 10" | ❌ | **Definición ambigua** | ¿Qué es un "momento clave"? ¿Cualquier entrada a Top 10? ¿El más significativo? Sin definición en contrato, esto es narrativa opaca. Riesgo serio. |

**"Momento Clave" es el componente de mayor riesgo narrativo del prototipo.** Es un label editorial sin criterio técnico definido. Si no puede trazarse a una regla explícita en un contrato, no debe implementarse.

Los otros tres momentos (mejor jornada, peor caída, mayor ascenso) son derivables de forma determinística desde timeline_race. Son seguros.

---

### 2.9 Transparencia & Auditabilidad

**Prototipo muestra:**
- Predicciones bloqueadas antes del torneo
- Fuente de resultados: data/results/*.json
- Cálculo de puntos: score.js (determinístico) v1.4.2
- Última actualización: timestamp
- Snapshot Actual: Match 101 Final
- Links: "Ver Auditoría Completa" y "Ver score_details.json"

**Estado:** ✅ **Este bloque es completamente implementable.** Todos los metadatos existen en los JSON actuales (generated_at en snapshots, version info en contratos, timestamps en outputs). Es además el bloque más alineado con la filosofía del proyecto.

**Recomendación:** Este bloque debe ser prominente, no enterrado al final. Es parte de la identidad del sistema.

---

## 3. Overlaps y Redundancias

| Par redundante | Problema |
|---|---|
| "+32 pts en Knockout" (Estado del Torneo) + "Momentum en KO +32 pts" (Fortalezas) | El mismo número aparece dos veces con labels diferentes. Confunde más de lo que informa. |
| "Knockout Accuracy 62.5%" (Fortalezas) + "Avances 61.9%" (Fase Eliminatoria donut) | Valores distintos pero concepto solapado (ambos hablan de precisión en eliminatoria). Sin contexto claro de por qué difieren. |
| "Racha actual: +4 posiciones" (Hero) + "Mayor Ascenso: R16→QF +4 posiciones" (Momentos) | Podrían ser el mismo +4 o distintos. Sin claridad, el usuario va a asumir que es lo mismo, creando confusión o falsa sensación de redundancia. |
| Chart de ranking (Evolución) + Mejor Posición #4 / Peor Posición #12 (Estado del Torneo) | El chart ya cuenta esa historia visualmente. Los números son refuerzo, no redundancia. Este overlap es aceptable. |

---

## 4. Riesgos Narrativos

| Riesgo | Severidad | Descripción |
|---|---|---|
| Momentum State sin implementación | 🔴 Alta | "En Ascenso" aparece en el hero pero el sistema no lo tiene implementado. Si se muestra hardcoded o derivado ad-hoc, viola auditabilidad. |
| "Momento Clave" sin definición | 🔴 Alta | Narrativa editorial sin regla técnica. Imposible auditar. |
| ~~Quote del archetype sin campo en registry~~ | ✅ Resuelto | `identity_formula` añadido al registry. Determinístico, gobernado manualmente, tono broadcast/esports. |
| Fortalezas/Debilidades sin umbral de contrato | 🟠 Media | La clasificación es narrativamente fuerte pero técnicamente arbitraria sin un criterio explícito. |
| "Bajo consenso" trait sin datos operables | 🟠 Media | Se muestra en el prototipo pero consenso_partidos.json está vacío. |
| "Recuperó 4 posiciones desde Octavos" | 🟡 Baja-Media | El framing puede ser engañoso dependiendo del contexto temporal. Necesita nota de fase de referencia. |
| "12 snapshots consecutivos en zona de premio" sin "zona" definida | 🟡 Baja-Media | Poderoso narrativamente pero requiere threshold en contrato antes de implementar. |
| campeon_vivo.json vacío | 🔴 Alta | Bloquea toda la sección "Apuestas Clave Vivas". |

---

## 5. Riesgos UX

| Riesgo | Descripción |
|---|---|
| **Saturación de información** | El prototipo tiene ~25 números distintos en la vista Resumen. Viola el principio de narrative clarity. Un usuario en una sesión larga no puede procesar todo esto sin esfuerzo. |
| **Tres donuts simultáneos** | Grupos, Eliminatoria, Posiciones — tres visualizaciones del mismo tipo compiten por atención. Considera uno principal + details on demand. |
| **4 tarjetas "Momentos del Torneo"** | Requieren contexto mental previo para interpretarse. Sin jerarquía clara entre ellos. |
| **Mezcla de unidades en Fortalezas** | Porcentajes + puntos absolutos en la misma lista dificultan la comparación. |
| **Prioridad visual poco clara entre Archetype y Stats** | El hero divide atención entre identidad (archetype) y datos (rank/puntos). Si el objetivo es que el archetype domine, los números no deben competir visualmente. |

---

## 6. Jerarquía de Información Propuesta

Basada en lo que existe, lo que es auditable, y los principios del sistema:

```
CAPA 1 — IDENTIDAD (dominante)
  ├── Archetype: display_name + short_description + quote (si se añade al registry)
  ├── Traits: máximo 3, visualmente subordinados
  └── [Momentum state: DIFERIDO — reservar espacio pero no implementar]

CAPA 2 — ESTADO ACTUAL
  ├── Rank + Points (absolutos)
  ├── Score breakdown: Grupos / Tabla / Knockout (barras)
  └── Trend reciente: últimos 3 snapshots (derivar desde timeline_race)

CAPA 3 — EVOLUCIÓN
  ├── Chart de ranking (timeline_race) — protagonista visual
  └── 2–3 momentos clave derivados determinísticamente:
       ├── Mejor snapshot (max rank_delta positivo)
       ├── Peor snapshot (max rank_delta negativo)
       └── Mayor ascenso por fase (calculable)
       [Momento Clave editorial: NO implementar sin contrato]

CAPA 4 — RENDIMIENTO
  ├── Precisión por fase: Grupos / Eliminatoria / Standings (una vista unificada)
  ├── 2 fortalezas + 1 debilidad (no 3+3 simultáneos)
  └── Apuestas vivas (BLOQUEADO por campeon_vivo.json)

CAPA 5 — AUDITORÍA (siempre visible, no colapsada)
  └── Fuentes, versión, timestamp, link a score_details
```

---

## 7. Derivation Map — Qué Necesita Qué

```
COMPONENTE                    → FUENTE                        → ESTADO
──────────────────────────────────────────────────────────────────────
Rank, Points, Breakdown       → leaderboard.json              → ✅ Listo
Score chart (ranking)         → timeline_race.json            → ✅ Listo
Archetype + Traits            → archetypes.json + traits.json → ✅ Listo
Phase accuracy (raw %)        → score_details.json            → ✅ Listo (calcular en pipeline)
Best/Worst rank               → consistencia_ranking.extra    → ✅ Listo
Mejor/Peor snapshot           → timeline_race.rank_delta      → ⚠️ Calculable, falta output
Mayor ascenso por fase        → timeline_race + stage         → ⚠️ Calculable, falta output
Top N% percentil total        → leaderboard (rank/N)          → ⚠️ Calculable, falta campo
Racha reciente (N snapshots)  → timeline_race (últimas N)     → ⚠️ Calculable, falta campo
identity_formula del archetype → archetype_registry_v1.json   → ✅ Campo añadido, 4 archetypes completos
Fortaleza/Debilidad label     → user_metrics + threshold      → ❌ Umbral no definido en contrato
En zona de premio             → leaderboard + threshold       → ❌ Zona no definida en contrato
Snapshots consecutivos zona   → timeline_race + zona          → ❌ Depende de zona (no definida)
Apuestas vivas por fase       → campeon_vivo.json             → ❌ Output vacío
Trait "Bajo consenso"         → consenso_partidos.json        → ❌ Output vacío
Momentum State ("En Ascenso") → (diferido)                   → 🚫 No implementar
"Momento Clave" editorial     → (sin contrato)               → 🚫 No implementar
```

---

## 8. Qué No Debe Implementarse Todavía

1. **Momentum States** — diferidos por decisión de scope. No añadir aunque el prototipo los muestre.
2. **"Momento Clave" editorial** — sin definición técnica determinística, es narrativa opaca.
3. **Sección "Apuestas Clave Vivas"** — bloqueada por campeon_vivo.json vacío. Reparar primero el pipeline.
4. **Trait "Bajo consenso"** — bloqueado por consenso_partidos.json vacío.
5. **Fortalezas/Debilidades con clasificación automática** — sin threshold en contrato, no implementar el label. Los valores sí se pueden mostrar.

---

## 9. Qué Debe Hacerse Antes de Implementar React

En orden de prioridad:

### 9.1 Decisiones de contrato (tú decides, yo ejecuto)
1. **Definir "zona de premio"**: ¿Top N? Debe ser un campo en algún contrato.
2. **Definir umbral de Fortaleza/Debilidad**: ¿Absoluto (>50%)? ¿Relativo al usuario? ¿Relativo al grupo?
3. ~~**Añadir campo `quote` al archetype_registry**~~ — resuelto: `identity_formula` ya está en el registry con los 4 archetypes completos.

### 9.2 Pipeline fixes / derivaciones nuevas
4. **Reparar campeon_vivo.json**: Cruzar predicciones de advance_team con resultados reales.
5. **Derivar campo de racha reciente**: Calcular delta de rank en últimos N snapshots → añadir a traits.json o nuevo output.
6. **Derivar percentil global**: rank/total_users → añadir a leaderboard.json.
7. **Integrar precision_avance en user_metrics**: Actualmente es output separado, no integrado.
8. **Derivar momentos del torneo**: Mejor snapshot, peor snapshot, mayor ascenso por fase → nuevo output `output/scores/milestones.json` o similar.

### 9.3 Opcional / Nice-to-have
9. Consenso (consenso_partidos.json) — investigar bug antes de diseñar cualquier componente basado en ello.
10. "Desde el día 1" — definir qué significa en contrato.

---

## 10. Resumen Ejecutivo

El prototipo es conceptualmente sólido y narrativamente coherente con la filosofía del sistema. La jerarquía Archetype → Traits → Analytics está bien expresada. Sin embargo, tiene problemas técnicos reales que deben resolverse antes de escribir una línea de React:

**Lo que funciona hoy:** chart de ranking, archetype + traits base, breakdown de puntos por fase, precisión por categoría (raw values), auditoría.

**Lo que necesita trabajo de pipeline:** percentil global, racha reciente, momentos del torneo (mejor/peor/mayor ascenso), campeon_vivo.json, integración de precision_avance en user_metrics.

**Lo que necesita decisiones de contrato:** zona de premio, umbral fortaleza/debilidad, quote del archetype.

**Lo que no debe implementarse aún:** momentum states, "Momento Clave" editorial, cualquier cosa que dependa de consenso_partidos.json.

**El riesgo UX más serio no es técnico:** es la densidad de información. El prototipo muestra demasiado simultáneamente. La implementación final debería priorizar claridad narrativa sobre completitud del dashboard.
