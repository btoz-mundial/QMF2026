# CONTEXT — Quiniela Mundial FIFA 2026

> **Léeme antes de hacer cualquier cambio.** Este documento es el estado canónico del sistema. No es un resumen de conversaciones — es documentación arquitectónica y filosófica viva. Actualizar cuando cambie la arquitectura, las decisiones visuales, o el estado real del sistema.

---

## 1. Naturaleza del proyecto

Quiniela personal para el Mundial FIFA 2026. 100% archivos JSON versionados, determinísticos y auditables. Sin backend, sin base de datos, sin auth. El frontend es React (Vite) y consume JSON estático generado por un pipeline Node.

**Lo que este proyecto es hoy:**
Este sistema evolucionó de ser una quiniela con analytics hacia una **plataforma de identidad competitiva runtime**. La identidad de cada participante emerge completamente desde scoring determinístico, snapshots históricos, y métricas auditables. No hay narrativa artificial — toda identidad es derivada, no declarada.

**Rol del usuario:** arquitecto y product owner. Define visión, valida decisiones, detecta drift. Conocimiento técnico limitado (~10%) pero criterio de producto sólido.
**Rol del AI:** ejecutor técnico y validador honesto. Cuando el usuario se equivoca técnicamente, decirlo con respeto y argumentos.

**Idioma:** español siempre. El usuario también domina inglés pero prefiere español para este proyecto.

---

## 2. Prioridades del proyecto (en orden estricto)

1. **Exactitud del scoring**
2. **Consistencia de datos**
3. **Auditabilidad**
4. **Determinismo**
5. Mantenibilidad
6. Performance pragmática
7. UX / presentación

Cualquier cambio que comprometa 1–4 debe rechazarse aunque mejore 5–7.

---

## 3. Source of Truth hierarchy

```
Tier 1 — Canonical Truth
  - data/fixture_master.xlsx          (operacional, manual)
  - data/results/*.json               (group, knockout, standings)
  - input_lock/*.xlsx → output/users/profiles/*.json  (predicciones)

Tier 2 — Official Scoring
  - scoring/group_stage_score.js
  - scoring/knockout_stage_score.js
  - scoring/standings_score.js
  (única capa autorizada para calcular puntos)

Tier 3 — Audit Layer
  - output/scores/leaderboard.json
  - output/scores/score_details.json
  - output/scores/snapshots/*

Tier 4 — Derived Analytics
  - analytics/{core,timeline,engagement,intelligence}/outputs/*.json
  - analytics/outputs/user_metrics.json
  (Analytics CONSUME score_details, no recalculan scoring)

Tier 5 — Runtime Identity Layer
  - analytics/runtime_profiles/outputs/archetypes.json
  - analytics/runtime_profiles/outputs/traits.json
  - contracts/analytics/runtime_profiles/archetype_registry_v1.json
  (Runtime identities consumen analytics outputs + snapshots.
   NUNCA modifican scoring, rankings, ni analytics canónicas.)
```

Analytics **nunca** debe convertirse en source of truth para scoring.

---

## 4. Arquitectura del pipeline

```
fixture_master.xlsx ──┐
                      ├─→ ingest_fixture_master.js ─→ data/results/*.json
input_lock/*.xlsx ────┴─→ parse_excel.js ────────→ output/users/profiles/*.json
                                                      + output/users/index.json

(predicciones + results) ─→ scoring/* (via score.js) ─→ leaderboard + score_details + snapshots

score_details + snapshots
  ─→ analytics/* (core metrics)

analytics outputs + snapshots
  ─→ runtime_profiles/*
  ─→ archetypes.json + traits.json

contracts/analytics/analytics_contracts_v2.md ─→ build_presentation.js ─→ analytics_presentation_v2.json

Todos los artifacts ─→ sync_to_public.js ─→ frontend/public/data/
```

Orquestador: `run_pipeline.js` (cleanup → ingest → scores → metrics → presentation → payouts → sync).

---

## 5. Contratos en `contracts/analytics/` (9 archivos)

Separación intencional de gobernanza. **NO mezclar responsabilidades entre archivos.**

| Archivo | Naturaleza | Modificable a mano |
|---|---|---|
| `metric_registry_v2.json` | Contrato técnico (lifecycle_status, value_range, depends_on, supports_*) | Sí, cuidadoso |
| `analytics_activation_rules_v2.json` | Governance estadística (umbrales de maturity) | Sí |
| `runtime_insight_registry_v2.json` | Insights derivados (capa narrativa runtime) | Sí |
| `analytics_contracts_v2.md` | Semántica humana por métrica (Gaming Name, Qué mide, Featured, Unit) | Sí — source of truth narrativa |
| `analytics_presentation_v2.json` | Display data derivada del .md | **NO** — generado por `scripts/build_presentation.js` |
| `analytics_narrative_guidelines_v2.md` | Tono narrativo | Sí |
| `analytics_tyers_guidelines_v2.md` | Filosofía tiers analytics | Sí |
| `archetype_guidelines_v2.md` | Filosofía archetypes | Sí |
| `runtime_card_philosophy_v2.md` | Filosofía runtime cards | Sí |
| `tiering_guidelines_v2.md` | Filosofía tiers global | Sí |

**Regla:** si necesitas display_name/short_description/featured/unit para el frontend, agrégalo al `.md` y regenera con `node scripts/build_presentation.js`. NO contamines `metric_registry_v2.json` con datos de presentación.

---

## 6. Runtime Competitive Profiles (Tier 5)

### Archivos de gobernanza

```
contracts/analytics/runtime_profiles/
  - archetypes.md                        # Filosofía narrativa y competitiva
  - archetype_registry_v1.json           # Canonical runtime archetype definitions
  - archetype_activation_rules_v1.json   # Runtime activation governance
  - runtime_profile_governance_v1.md    # Runtime stability philosophy
```

### Jerarquía de identidad (orden estricto)

1. **Archetype** — máximo 1. Identidad dominante del torneo. Escaso, prestigioso, persistente.
2. **Momentum State** — máximo 1. Temporal, dinámico, derivado de snapshots recientes. (Sistema deferred.)
3. **Traits** — 0–3. Complementarios, secundarios, descriptivos. Nunca compiten visualmente con el archetype.

### Reglas de activación

- Un archetype NO debe activarse por muestras pequeñas, ruido temporal, o demasiado temprano.
- `under_assignment_preferred: true` — es preferible NO asignar archetype que asignar uno incorrecto.
- Los criterios consideran: minimum sample size, timeline persistence, consistency across snapshots, confidence thresholds.
- Archetype stability: no debe fluctuar agresivamente entre snapshots.

### Regla de gobernanza frontend (CRÍTICA)

El hook `usePlayerProfile` expone **SOLO** `active_archetype` a la capa de UI.
`eligible_archetypes` y `activation_reasons` son datos de gobernanza interna — **NUNCA** llegan al frontend.

```js
// CORRECTO — solo active_archetype llega a la UI
const activeArchetypeId = userArchetypeEntry?.active_archetype ?? null
const archetype = activeArchetypeId ? (registryMap[activeArchetypeId] ?? null) : null

// INCORRECTO — esto NO debe suceder
const eligible = userArchetypeEntry?.eligible_archetypes  // ← governance data, no presentación
```

### Archetypes v1 (producción)

| ID | Display | Rarity | Activación |
|---|---|---|---|
| `front_runner` | Front Runner | elite | Dominio sostenido de ranking + baja volatilidad |
| `sharpshooter` | Sharpshooter | elite | Precisión de marcadores élite sostenida |
| `clutch_hunter` | Elimination Specialist | uncommon_rare | Rendimiento superior en fase eliminatoria |
| `consistency_machine` | Consistency Machine | rare | Estabilidad cross-phase + floor competitivo top-50% |

### Distribución actual (post-calibración threshold, Mayo 2026)

- `front_runner`: 1 usuario — apropiado para elite
- `sharpshooter`: 2 usuarios — apropiado para elite
- `clutch_hunter`: 2 usuarios — apropiado para uncommon_rare
- `consistency_machine`: 0 usuarios actualmente — under_assignment correcto
- fallback: 7 usuarios

### Correcciones de threshold aplicadas

- **Bug crítico resuelto:** `TOTAL_ENTRIES = payoutStructure.entries` devolvía `Array.prototype.entries` (función, no número), deshabilitando silenciosamente los checks de worst_rank y consistency_score. Fix: `total_entries` se inyecta desde `BuildUserMetrics.js` vía `leaderboard.length`.
- **Phase delta corregido:** ahora usa max-spread de las tres fases (group, standings, knockout), no solo group↔knockout.
- **Rank changes reducido:** de 0.50 a 0.35 del total de snapshots.
- **Payout zone dinamizado:** de `rank <= 20` hardcodeado a `Math.ceil(leaderboard.length * 0.20)`.

---

## 7. Filosofía central del sistema — Competitive Intelligence Platform

### Lo que este sistema ES

Este sistema es una **plataforma de competitive intelligence runtime**. Cada elemento visible — ranking, archetype, waveform, densidad de tickers, apuestas vivas — es una derivación determinística de scoring real, no una declaración editorial subjetiva.

La identidad competitiva de un usuario **emerge** desde sus datos. No se le asigna arbitrariamente. No se decora. No se gamifica.

### Lo que este sistema NO es — explícitamente

| Categoría | Por qué se rechaza |
|---|---|
| Red social | No hay interacción, followers, ni contenido generado por usuarios |
| Mobile game | No hay XP, niveles, progresión artificial, ni reward loops |
| Achievement system | Los archetypes no se "desbloquean" — se derivan o no se derivan |
| Engagement farming UI | No hay notificaciones push, streaks, ni mechanics de retención artificial |
| Casino gamification | No hay loot-boxes visuales, gradientes excitantes, ni glow de rarity agresivo |
| Dashboard BI | No hay tablas de datos crudos, exportaciones, ni panels de métricas apiladas |
| Perfil social | No hay bio, foto, follows, ni comparaciones sociales |

### El estándar de referencia

El sistema debe sentirse como **competitive intelligence aplicada al fútbol predictivo**. La referencia mental correcta es un broadcast deportivo premium o una plataforma de scouting analítico — no una app de fantasy casual ni un dashboard corporativo.

Cada pantalla debe poder responderse: *"¿Qué está comunicando esto sobre el estado competitivo real de este jugador?"* Si la respuesta es ambigua o decorativa, la pantalla está mal.

---

## 8. Player Profile — Filosofía oficial

### El perfil es una identidad competitiva persistente

El Player Profile no es una tarjeta decorativa. No es un resumen de estadísticas. No es un perfil social con datos deportivos.

Es la **representación visual de cómo un usuario ha compitido en este torneo** — cuál es su patrón dominante, cuál es su posición relativa, cómo evoluciona su rendimiento fase a fase, y qué identidad emerge de todo eso.

### Las preguntas que el perfil debe responder (en orden)

1. **¿Quién eres en este torneo?** → HeroIdentitySection: archetype, nombre, posición
2. **¿Cómo estás posicionado?** → Ranking, zona de pago, momentum
3. **¿Cómo evolucionó tu torneo?** → Por Fase: waveform acumulativa
4. **¿Dónde está el torneo ahora mismo?** → Estado del Torneo: density field
5. **¿Qué apuestas vivas tienes?** → Apuestas Vivas: campeón, tercer lugar, final
6. **¿Cuál es el detalle?** → Predicciones tab, Auditoría tab

### Principios de representación

- **Posición competitiva** se comunica con ranking + densidad poblacional (Estado del Torneo), no solo con un número.
- **Estabilidad** se comunica con la forma de la waveform Por Fase y la historia del ranking.
- **Momentum** se comunica con el MovementChip y la dirección de la waveform final.
- **Comportamiento runtime** se comunica con el archetype y los traits secundarios.
- **Narrativa de torneo** se comunica con la evolución acumulativa (Y scale compartida entre fases).
- **Identidad emergente** se comunica con el archetype — visual, tipografía, rareza percibida.

### Jerarquía visual del perfil (regla, no sugerencia)

```
NIVEL 1 — Identidad dominante
  HeroIdentitySection (archetype + posición)
  → responde QUIÉN eres

NIVEL 2 — Estado del torneo
  Estado del Torneo (density field, posición relativa)
  → responde DÓNDE estás

NIVEL 3 — Narrativa de rendimiento
  Por Fase (waveform acumulativa, territorios)
  → responde CÓMO llegaste aquí

NIVEL 4 — Compromisos vivos
  Apuestas Vivas (campeón, tercer lugar, final)
  → responde QUÉ está en juego
```

### El tab de Resumen es el núcleo narrativo

El Resumen no es un dump de datos. Es una historia coherente del torneo del usuario en orden cronológico-narrativo. Cada sección responde una pregunta antes de entregar datos.

---

## 9. Runtime Narrative System

### Definición

El Runtime Narrative System es el conjunto de señales derivadas del scoring real que forman una historia coherente del torneo de cada usuario. No es ficción editorial — es la historia que los datos cuentan.

### Componentes del sistema narrativo

| Señal | Fuente de datos | Narrativa que comunica |
|---|---|---|
| Archetype | archetypes.json → registry | Identidad competitiva dominante del torneo |
| Ranking + movimiento | leaderboard + snapshots | Posición actual y dirección reciente |
| Waveform de ranking | timelineRaceSnapshots → rank por snapshot | Evolución de posición en la carrera a lo largo del torneo |
| Density field | consistencia_ranking → todos los usuarios | Posición relativa en el campo completo |
| Traits | traits.json | Patrones secundarios observados |
| Apuestas vivas | campeon_vivo | Compromisos activos con consecuencias scoring |
| Estado del torneo | ranking position percentile | Dónde estás en el campo en este momento |

### Regla fundamental de la narrativa

**Toda narrativa debe derivar de scoring real.** Nada en el Player Profile debe comunicar algo que no esté respaldado por un dato concreto del pipeline. Los elementos decorativos (glow, colores de fase) son *texture* — amplifican la narrativa, no la inventan.

La waveform de `PhasePerformanceCard` ya NO es pseudoaleatoria — es Runtime Truth completa: cada punto es un snapshot real de ranking (Mayo 2026).

### Continuidad narrativa obligatoria

La waveform Por Fase usa **rank trajectory real** (no eficiencia acumulativa) para preservar la continuidad narrativa. Un usuario no tiene tres historias independientes — tiene una carrera continua que cruza fases. La Y compartida (rank 1=top, N=bottom) hace visible esa continuidad.

Las líneas de stroke conectan en el bridge dot de Standings (`standDotX`). La narrativa visual no puede tener saltos entre Grupos → Standings → Knockout.

---

## 10. Archetype Design Philosophy — Contratos oficiales

### Los archetypes son identidades raras, no achievements

Un archetype no es un logro por llegar a N puntos. Es un **patrón dominante de comportamiento competitivo** observado con suficiente evidencia estadística a lo largo del tiempo. La diferencia es fundamental:

- Un achievement se otorga por un evento. Un archetype se deriva de un patrón.
- Un achievement puede compartirlo cualquiera. Un archetype lo tiene quien lo exhibe.
- Un achievement es binario. Un archetype requiere estabilidad temporal.

### Under-assignment es correcto

El sistema debe preferir **no asignar** archetype a asignar uno incorrecto. Un fallback honesto es mejor que una identidad inflada. Cuando `consistency_machine` tiene 3 usuarios de 12 con rendimientos mediocres, el sistema está mal calibrado — no bien intencionado. La rareza percibida es parte del contrato con el usuario.

### Distribución objetivo por tamaño de torneo

| Archetype | Rarity | % máximo del campo |
|---|---|---|
| `front_runner` | elite | ~10% |
| `sharpshooter` | elite | ~15% |
| `clutch_hunter` | uncommon_rare | ~20% |
| `consistency_machine` | moderately_rare | ~20% |
| fallback | — | resto |

En un torneo de 19: máximo 2 usuarios por archetype elite, máximo 3-4 por uncommon_rare/rare.

### El fallback debe sentirse neutral, no inferior

El estado de fallback representa **identidad aún no revelada** — no fracaso competitivo. Un usuario en posición #3 puede estar en fallback porque sus patrones no son estables aún. El fallback no juzga el rendimiento; comunica que el torneo todavía no ha definido una identidad dominante para ese usuario.

**Visual del fallback aprobado:**
- Tres anillos orbitales concéntricos, stroke puro, sin fill, radio creciente
- Núcleo azul pequeño (r≈2.8), sin glow agresivo
- Opacity total: 0.50
- Copy: "El torneo aún no revela tu identidad."
- Sin título "Participante Oficial" — ese copy sonaba a feature desactivada

**Lo que el fallback NO debe ser:**
- Una versión degradada del archetype más simple
- Un estado vacío sin intención visual
- Un mensaje tutorial ("actívate completando N partidas")
- Un visual poderoso, amenazante, o con dirección clara (flechas, rayos, cruces)

### Distinguibilidad visual entre archetypes

Los cuatro archetypes deben ser visualmente distinguibles incluso sin leer el texto. Esto se logra via el asset PNG específico de cada archetype (en `frontend/public/assets/archetypes/`). Los assets NO son decoración — son la primera señal de identidad.

Reglas para futuros assets de archetype:
- Deben tener lenguaje visual propio, no compartir formas con otros archetypes
- Deben poder leerse a 84×84px con opacity 0.52
- No deben competir con el texto — son soporte atmosférico, no protagonistas

### Rarity glow — reglas

- El glow de rarity es sutil y atmosférico. No es una badge que grita.
- El borde del HeroIdentitySection cambia de color según rarity/posición — eso es suficiente.
- Los archetypes elite tienen borde dorado tenue (rgba(255,184,0,0.35)) solo para el #1.
- No agregar gradientes radiales explosivos, ni animaciones de rareza al descubrimiento.

---

## 11. Filosofía visual oficial — Visual System

### El sistema visual no es minimalista ni maximalista

El sistema opera en un punto de densidad intencional: **información compacta, no información escasa**. Hay mucho que comunicar; el reto es hacerlo sin ruido.

- **NO minimalista vacío:** los espacios en blanco deben ser respiros, no ausencia de ambición.
- **NO maximalista gamer:** cada elemento gana su lugar justificando la pregunta que responde.

### Visual Density Rules

**Reglas obligatorias para toda nueva vista:**

1. **Cada sección responde exactamente una pregunta.** Si una sección no puede articularse como una pregunta y una respuesta, está mal diseñada.

2. **La jerarquía visual se construye con tipografía y espaciado, no con color.** El color es acento, no estructura.

3. **Densidad controlada:** preferir compactar verticalmente antes que paginar. Pero compactar tiene límite — legibilidad primero.

4. **Evitar panels vacíos.** Si un dato no existe aún, el componente no renderiza (null return), no renderiza un placeholder genérico.

5. **Evitar labels redundantes.** Si el contexto ya deja claro qué es el dato, el label es ruido.

6. **Máximo 3 niveles de jerarquía tipográfica por sección.** Más de 3 crea ruido sin ganar claridad.

7. **Las visualizaciones SVG son datos, no decoración.** Si el SVG no comunica algo específico, no debe existir.

### Paleta de tonos editorial

El sistema tiene un tono editorial consistente:
- Números son soporte de narrativa, no protagonistas
- Las visualizaciones comunican antes que el texto
- El texto expande o matiza lo que la visualización ya dijo
- Los iconos son acento funcional, nunca decoración

### Atmósfera visual

El sistema opera bajo una atmósfera de **broadcast deportivo nocturno**: oscuro, preciso, técnico, con acentos de color que representan competencia real (azul, naranja, verde, amarillo) sin volverse neón de arcade.

---

## 12. Territorial Visualization Philosophy — Por Fase

### Los tres territorios y su significado

El sistema "Por Fase" no es un gráfico de barras con tres columnas. Es un **mapa territorial del torneo** donde cada zona tiene naturaleza distinta:

```
GRUPOS (G_W = 500)
  Territorio amplio y volátil
  - Muchos partidos: máxima exposición a varianza
  - La base se construye aquí
  - La waveform puede oscilar significativamente
  - Es el período más largo de formación de identidad

STANDINGS (S_W = 120)
  Checkpoint estrecho de verdad absoluta
  - Un solo momento de evaluación
  - La tabla final es inmodificable
  - Representa un DOT BRIDGE: un único punto que conecta Grupos con Knockout
  - No hay línea horizontal — es el punto de inflexión entre territorios
  - La estrechez visual comunica precisión, no importancia menor

KNOCKOUT (K_W = 380)
  Territorio de presión y supervivencia
  - Cada partido elimina
  - Volatilidad significativa pero menor que grupos (menos partidos)
  - Es donde la identidad competitiva se confirma o colapsa
```

### La asimetría visual NO es estética — es arquitectónica

Los widths asimétricos (500 / 120 / 380) representan la naturaleza distinta de cada fase:
- Grupos es el período más largo → territorio más amplio
- Standings es un único snapshot → checkpoint compacto
- Knockout tiene más peso de scoring que grupos por partido, pero menos partidos → amplio pero no tanto como grupos

Esta asimetría no puede igualarse sin destruir la lectura narrativa.

### Escala Y compartida — regla obligatoria

Las tres fases comparten exactamente la misma escala Y (rank 1 arriba → rank N abajo). Esto hace visible la dirección del torneo: si el usuario sube en ranking de Grupos a Knockout, la línea desciende visualmente. Si baja, la línea asciende. La dirección narrativa es explícita.

Escala Y independiente por fase está **prohibida** — neutraliza el poder narrativo del gráfico.

La escala Y es de **ranking real**, no de eficiencia acumulativa. `rankToY(r) = PAD_T + ((r - 1) / Math.max(1, N - 1)) * usableH`. Rank #1 = Y más alta (top). Rank #N = Y más baja (bottom).

### Continuidad de stroke

Las líneas de cada fase conectan en el bridge point de Standings (`standDotX = S_START + S_W/2 = 560`):
- El stroke de Grupos termina exactamente en `(standDotX, standY)`
- Standings no tiene stroke propio — es un único dot en `(standDotX, standY)`
- El stroke de Knockout parte exactamente desde `(standDotX, standY)`
- Los fills de Grupos y Knockout también se cierran/abren en `standDotX`

Si las líneas no conectan, la narrativa de evolución continua se rompe.

### Y de ranking real, no eficiencia acumulativa

La posición Y de cada punto en la waveform representa el **ranking real del usuario en ese snapshot** (de `timelineRaceSnapshots`). No es eficiencia — es posición de carrera.

Un usuario que fue #2 en grupos, #5 en standings, y #1 en knockout verá una línea que baja, toca el bridge dot en posición media, y sube al top en knockout. Esta historia es más honesta y directamente auditable que la eficiencia acumulativa.

### Los dots dentro de la waveform

Los puntos sobre el stroke de Grupos y Knockout representan **snapshots reales** del `timelineRaceSnapshots`. Cada dot es un partido jugado. No son pseudoaleatorios — son el historial real del ranking del usuario snapshot a snapshot. La forma emerge de los datos, no de un PRNG.

---

## 13. Estado del Torneo — Filosofía del Density Field

### Qué es el density field

El Estado del Torneo es un **campo de densidad posicional**: 100 ticks uniformes que representan todo el campo competitivo, donde la posición del usuario se mapea por percentil (no por rank absoluto).

### Por qué 100 ticks siempre

Con N=12 participantes, 12 ticks serían demasiado escasos — la visualización se vería vacía. 100 ticks siempre produce la sensación de densidad competitiva real, independientemente de N. La posición del usuario se calcula: `x = ((rank - 1) / (N - 1)) * SVG_W`.

### Jerarquía de altura — regla visual

Los ticks tienen altura diferenciada por zona:
- **Zona de premio:** ticks casi a full height, glow cálido (dorado)
- **Zona neutral:** ticks bajos (26% del height), bajo contraste
- **Marker del usuario:** bloom de 3 capas (outer glow / mid glow / core), protagonista absoluto
- **Ghost marker (posición anterior):** altura intermedia (68%), dashed, opacidad reducida

Esta jerarquía no puede aplanarse. El usuario debe ser inmediatamente reconocible sin leer texto.

---

## 14. Motion & FX Constraints

### Principio rector

El movimiento y los efectos de luz son **amplificadores de narrativa**, no entretenimiento visual. Si un efecto no refuerza algo que los datos ya están diciendo, no debe existir.

### Reglas de motion

- **Framer Motion:** solo para transiciones de entrada de secciones principales (opacity + y offset, 0.3s). No para loops, bounces, ni efectos de "vida".
- **Animaciones de loop:** solo para LoadingState (shimmer pulsante). Nunca en el perfil activo.
- **SVG animation:** no usar `<animate>` ni `@keyframes` dentro del perfil. Las visualizaciones son estáticas una vez renderizadas.

### Reglas de glow / FX

- **Glow del marker de usuario (Estado del Torneo):** 3 capas concéntricas (outer, mid, core). Sutil — no explosivo.
- **Borde de la HeroIdentitySection:** cambia de color según rarity/posición. Esto es suficiente como señal de rarity.
- **Archetype asset:** opacity 0.52. Si sube a 1.0, compite con el texto.
- **Fill de waveform:** opacity 0.18–0.30. Si sube a 0.5+, oscurece el territorio innecesariamente.
- **Gradientes:** solo como fills de waveform (area bajo la curva). No en borders, badges, ni texto.

### Lo que nunca debe existir

- Animaciones de "descubrimiento" de archetype (reveal dramático, shake, flash)
- Particles, confetti, explosiones visuales en ningún contexto
- Glow pulsante en archetypes activos
- Transiciones de 1+ segundos en el perfil principal
- Parallax, scroll-triggered animations, sticky effects en el perfil

---

## 15. Anti-goals explícitos (NO hacer, nunca)

### Arquitectura

- NO agregar backend, base de datos, autenticación, microservicios
- NO reescribir el sistema desde cero
- NO refactors masivos sin aprobación explícita
- NO frameworks adicionales sin justificación
- NO lógica de scoring fuera de `scoring/*`
- NO inferencia runtime compleja en el frontend
- NO magic calculations en ninguna capa fuera de su tier asignado
- NO modificar `output/scores/leaderboard.json` ni `score_details.json` a mano
- NO inventar valores default para esconder bugs — mejor falla ruidosa

### Visual / UX

- NO loot-box aesthetics (gradientes llamativos, glow effects de rarity agresivos)
- NO casino UI (chips apilados, badges en competencia, información sin jerarquía)
- NO dashboard BI aesthetic en el PlayerProfile
- NO comprimir tanto que rompa la legibilidad
- NO exponer eligible_archetypes o activation_reasons al frontend
- NO tratar el archetype como metadata secundaria — es la identidad dominante
- NO estados vacíos sin fallback visual coherente

### Gobernanza de archetypes

- NO activar archetypes prematuramente
- NO asignar por performance puntual — solo por patrones sostenidos
- NO modificar display_name de un archetype sin actualizar todos los assets y contratos
- NO agregar más de 6-7 archetypes en v1 del sistema (dilución de rareza)
- NO crear archetypes que compartan zona de activación sin frontera clara

### Features que deben resistirse

Estas features parecen buenas ideas pero destruyen la integridad del sistema:

| Feature | Por qué resistirla |
|---|---|
| XP / Niveles dentro del torneo | Convierte identidad derivada en mecánica de progresión artificial |
| Archetype progression ("evolucionar de rare a elite") | Destroza el determinismo — la identidad se gana o no se gana |
| Historial visible de archetypes pasados | Diluye el presente — el usuario es lo que es ahora |
| User-selectable archetypes | Destruye la premisa fundamental: la identidad emerge, no se elige |
| Notificaciones de cambio de archetype | Mecánica de game loop — convierte governance en engagement farming |
| Archetype leaderboard ("¿quién tiene más elite archetypes?") | Crea meta-competencia sobre el sistema de identidad |
| Reaction buttons en el perfil | Convierte un sistema analítico en red social |
| Badges masivos por micro-logros | Inflación visual — destruye la rareza de los archetypes |
| Streak counters | Engagement farming — no aporta inteligencia competitiva |
| "Profile completeness" metrics | Gamifica la existencia de datos, no el rendimiento real |
| Comparación directa entre archetypes ("Sharpshooter > Front Runner") | Los archetypes son identidades, no poderes con jerarquía |

---

## 16. Hall of Fame — Dirección conceptual

### El Hall of Fame es un espacio ceremonial, no un leaderboard extendido

El Hall of Fame no es "la tabla pero más larga". Es un **registro histórico de excelencia competitiva** dentro del sistema. Debe sentirse:

- **Histórico:** preserva logros pasados con peso permanente
- **Escaso:** no todos entran — solo rendimientos excepcionalmente evidentes
- **Ceremonial:** la presentación refleja el peso de lo que representa
- **Frío:** sin animaciones de celebración exuberante — la excelencia habla sola

### Lo que el Hall of Fame debe comunicar

- Quién dominó el torneo y en qué momento
- Qué archetypes se manifestaron a lo largo del torneo completo
- Qué récords de rendimiento son dignos de registro permanente

### Lo que el Hall of Fame NO debe ser

- Un leaderboard con skin diferente
- Una galería de badges coleccionables
- Un sistema de likes o votes sobre logros
- Un feed de actividad ("ayer X alcanzó Y")
- Un espacio infinito — la escasez es parte de su valor

### Principio de diseño

El Hall of Fame debe poder estar vacío durante la mayor parte del torneo y poblarse gradualmente con solo los entradas que genuinamente lo merezcan. Un Hall of Fame con 12 entradas en un torneo de 12 personas no es un Hall of Fame — es un leaderboard con nombre distinto.

---

## 17. Frontend Governance — Principios para nuevas vistas

Toda nueva página, tab, o subtab debe cumplir estos principios antes de ser construida:

### Checklist de una nueva vista

**Antes de diseñar:**
- [ ] ¿Qué pregunta responde esta vista? (debe ser una pregunta específica)
- [ ] ¿Desde qué datos reales del pipeline se deriva?
- [ ] ¿Existe ya una vista que responde esta pregunta? (si sí, no duplicar)
- [ ] ¿Es el momento correcto del torneo para esta información?

**Durante el diseño:**
- [ ] ¿Tiene jerarquía visual clara (máximo 3 niveles)?
- [ ] ¿Cada sección responde exactamente una pregunta?
- [ ] ¿El usuario puede leer el estado en <5 segundos sin scrollear?
- [ ] ¿Hay algún elemento que no esté respaldado por un dato real?

**Antes de implementar:**
- [ ] ¿Es coherente con la atmósfera visual del resto del sistema?
- [ ] ¿Preserva la rareza del sistema de archetypes?
- [ ] ¿Evita duplicar lógica que ya existe en otra capa?
- [ ] ¿Falla ruidosamente si los datos no existen?

### Reglas de coherencia narrativa

1. **Toda nueva vista deriva de runtime truth.** Si el dato no existe en el pipeline, no se inventa.
2. **Preservar jerarquía visual del sistema.** El archetype siempre es el elemento de mayor peso visual en vistas de perfil.
3. **Preservar rareza.** Una nueva vista no puede hacer que los archetypes parezcan más comunes de lo que son.
4. **Mantener coherencia de tono.** El tono es analítico-narrativo, no tutorial ni celebratorio.
5. **Respetar el sistema de capas.** Los componentes del frontend no calculan, no derivan, no transforman datos — solo presentan lo que el pipeline ya determinó.

### Subtabs de PlayerProfile — Estado y dirección

| Tab | Estado | Descripción |
|---|---|---|
| Resumen | ✅ Implementado | Identidad + Estado del Torneo + Por Fase + Apuestas Vivas |
| Predicciones | ✅ Implementado | Subtabs Grupos + Bracket. Default inteligente: Grupos si fase de grupos, Bracket si hay resultados knockout |
| Línea de Tiempo | ✅ Implementado | Carrera de ranking por snapshot. PACK context con nombres reales de jugadores cercanos en ranking |
| Scoring & Auditability | ✅ Implementado | 4 subtabs data-driven desde `contracts/ui/scoring_integrity_v1.json`: Overview, Scoring, Payouts (broker/terminal), Backstage (Matrix theme) |

---

## 18. Estado actual del sistema (Mayo 2026)

### Pipeline funcionando end-to-end

- Pipeline completo (ingest → scores → metrics → presentation → payouts → sync)
- Tier 5 Runtime Identity: archetypes.json + traits.json generados y sinced
- `usePlayerProfile.js` consume 3 archivos runtime (fetchOptional)
- 19 usuarios, 6 métricas core, archetypes calibrados
- Dev server: `cd frontend && npm run dev` → http://localhost:5173/Quinela-MundialFIFA-2026/

### PlayerProfile/index.jsx — Componentes implementados

| Componente | Estado | Descripción |
|---|---|---|
| `HeroIdentitySection` | ✅ | Archetype + posición + puntos + breakdown bar. Layout 38fr/62fr. |
| `TournamentStateCard` | ✅ | Density field 100 ticks, percentile-based, zona/neutral/ghost/player bloom. Props: `snapshots`, `userId` (para best rank con noise suppression). |
| `PhasePerformanceCard` | ✅ | Rank trajectory real desde `timelineRaceSnapshots`. 3 territorios asimétricos. Y = ranking (1=top, N=bottom). Bridge dot en Standings. Props: `snapshots`, `userId`, `totalParticipants`. |
| `ChampionAliveCard` | ✅ | Apuestas vivas: campeón / tercer lugar / la final. Grid 3 columnas. |
| `ResumenTab` | ✅ | Orden: Estado → Por Fase → Apuestas Vivas |
| `PredictionsTab` | ✅ | Subtabs Grupos + Bracket. Default inteligente por fase del torneo |
| `TimelineTab` | ✅ | Carrera de ranking + PACK context con nombres reales |
| `ScoringAuditability` (tab "Scoring & Auditability") | ✅ | 4 subtabs data-driven desde JSON. Componente separado en `ScoringAuditability.jsx` |

### Archetype assets

```
frontend/public/assets/archetypes/
  clutch_hunter.png
  consistency_machine.png
  front_runner.png
  sharpshooter.png
```

Ruta en el frontend: `${import.meta.env.BASE_URL}${archetype.asset}` (requiere BASE_URL por `base: '/Quinela-MundialFIFA-2026/'` en vite.config.js).

### ToDos documentados

- `historial_ranking.json` es huérfano: frontend lo usa pero pipeline no lo genera. Derivar de `timeline_race.json` en el hook.
- `consenso_partidos` genera `matches: []` — contrato evolucionó, pendiente de investigar.
- `precision_avance.json` pendiente de QA.
- Relación entre traits y archetypes sin definición explícita: traits pueden contradecir archetypes actualmente (ej. `consistency_machine` + `high_volatility`). Pendiente de resolver en contrato.
- `high_volatility` trait dispara en ~8/12 usuarios — threshold demasiado bajo, describe artefacto del torneo no patrón real.
- `PlayerProfile/index.jsx` tiene ~2600+ líneas — refactor por componentes pendiente (no urgente). `ScoringAuditability.jsx` ya fue extraído como componente separado.
- Escritura de archivos grandes en Windows mount: usar Python script (`python3 /tmp/write_xxx.py`) — los file tools truncan silenciosamente. Verificar siempre con `wc -l`.

---

## 19. Stack técnico frontend

- React 18 + Vite (`base: '/Quinela-MundialFIFA-2026/'`)
- React Router
- Framer Motion (transiciones de entrada únicamente)
- Lucide React (iconos funcionales)
- CSS variables (`var(--color-surface)`, etc.) en `src/styles/`
- Inline styles únicamente — no CSS modules, no Tailwind, no media queries
- SVG inline para toda visualización de datos

**Convenciones:**
- Hooks en `src/hooks/` son adaptadores delgados — sin lógica de negocio
- Loaders en `src/data/loaders/` son thin wrappers sobre `fetchJSON`
- URLs centralizadas en `src/config/urls.js`
- `fetchOptional` para datos que pueden no existir aún (runtime profiles, payouts)
- Assets en `public/` siempre con `import.meta.env.BASE_URL` prefix

---

## 20. Sistemas deferred (no implementar aún)

| Sistema | Estado | Razón de espera |
|---|---|---|
| Momentum State | Diseñado, no implementado | Requiere más snapshots para señal confiable |
| Dark/Light theme toggle | Pendiente | No urgente, CSS vars ya preparadas |
| PlayerProfile refactor por componentes | Pendiente | index.jsx ~2600+ líneas, funciona OK |
| historialRanking pivot a timeline_race | Pendiente | Requiere cambio en hook + eliminar archivo huérfano |
| consenso_partidos storytelling | Pendiente | Contrato evolucionó, implementación a actualizar |
| precision_avance revisión | Pendiente | QA pendiente |
| Grupos status chip (Clasificado/En disputa/Eliminado) | Pendiente v2 | Requiere motor de decisión matemática. Diferido a v2 |

| Trait system recalibración | Pendiente | high_volatility threshold demasiado bajo, trait↔archetype contradicciones |

---

## 21. Decisiones ya tomadas (no re-debatir sin razón fuerte)

- `best_third` se captura **manualmente** (TRUE/FALSE) en fixture_master, NO se calcula con criterios FIFA
- Frontend es **render-only** — no calcula scoring ni deriva métricas oficiales
- `advance_team` = canonical entity value; `breakdown.advance` = scoring boolean
- `exact_goals` reemplaza `exact_score`
- `standings.details` es parte crítica del audit layer
- Perfiles de usuario viven en `output/users/profiles/` (subfolder)
- Units canon en analytics: `percent` (0–1), `count`, `rank`, `boolean`, `timeline`
- `active_archetype` es el único campo de runtime identity que llega al frontend
- `temporal_group_standings.json` es **visual-only** — no afecta scoring oficial. Se genera con `scripts/temporal_group_standings.js` post-scoring. Desempate simplificado (PTS → DG → GF → alfabético). No es clasificación oficial FIFA
- Scoring & Auditability es completamente **data-driven** desde `contracts/ui/scoring_integrity_v1.json`. Los campos `meta`, `visual`, y `section.motion` controlan render sin tocar código
- `useIsMobile(breakpoint)` se implementa inline en cada página (no hook global), consistente con inline styles only
- En grupos: `V` = visitante gana, `L` = local gana, `E` = empate. Labels de display: VIS / LOC / EMP
- Match cards de Grupos muestran `#match_id` real del JSON en el footer (no número de jornada artificial)
- `BracketAuditSection.jsx`: columna "PRED → REAL". Equipo real diferente al predicho: muestra `──▶` + equipo en rojo. Predicho correcto: en dorado
- `temporal_group_standings.json` es **visual-only** — no afecta scoring oficial. Se genera con `scripts/temporal_group_standings.js` post-scoring. Desempate simplificado (PTS → DG → GF → alfabético). No es clasificación oficial FIFA
- Scoring & Auditability es completamente **data-driven** desde `contracts/ui/scoring_integrity_v1.json`. Los campos `meta`, `visual`, y `section.motion` controlan render sin tocar código
- `useIsMobile(breakpoint)` se implementa inline en cada página (no hook global), consistente con inline styles only
- En grupos: `V` = visitante gana (away win), `L` = local gana (home win), `E` = empate. Labels display: VIS/LOC/EMP
- Match cards de Grupos muestran `#match_id` real del JSON en el footer (no número de jornada artificial)
- `BracketAuditSection.jsx`: columna "PRED → REAL". Equipo real diferente al predicho: muestra `──▶` + equipo real en rojo. Equipo predicho correcto: en dorado
- Layout HeroIdentitySection: 38fr/62fr con identity side como centro emocional
- Por Fase usa Y acumulativo, no Y por fase aislada
- Por Fase usa widths asimétricos (G_W=500, S_W=120, K_W=380) — no igualar
- Estado del Torneo usa 100 ticks uniformes por percentil, no N ticks por rank
- Archetype fallback: tres anillos orbitales + núcleo azul + "El torneo aún no revela tu identidad."
- evaluateConsistencyMachine usa `total_entries` de `metrics`, no carga payouts.json
- **PhasePerformanceCard usa rank trajectory real**, no waveform pseudoaleatoria. Datos: `timelineRaceSnapshots` (mismo JSON que TimelineTab). Y scale = ranking. La migración de pseudoaleatorio a datos reales ya fue ejecutada.
- **Best rank noise suppression**: el "Mejor: #X" en `TournamentStateCard` suprime best ranks logrados en M1–M12 a menos que el rank sea meaningfully mejor que el promedio early (`bestRankRaw < earlyAvgRank * 0.6`). Constante: `NOISE_WINDOW = 12`. Razón: un #1 en M1 con todos empatados no es señal real.
- **Bracket winner/loser styling**: no se aplica opacity al row completo. Solo se dimean nombre + flag del perdedor (`color: var(--color-text-3)`, `opacity: 0.4` en el img del flag). El score chip siempre es legible.
- **Bracket WT chip** (tipo de tiempo): chip neutral para todos (`color: var(--color-text-1)`, `background: rgba(226,232,240,0.10)`). PEN no es rojo, TE no es ámbar — un solo estilo para evitar exceso de color.
- **TR como default**: `const wt = !pending&&result ? (result.winner_type ? WINNER_LABEL[result.winner_type] : 'TR') : null`. Si `winner_type` es null (tiempo regular), el chip muestra `TR`. `WINNER_LABEL = { REGULAR_TIME:'TR', EXTRA_TIME:'TE', PENALTIES:'Pen' }`.
- **Bracket tooltip usa `position: fixed`**: el contenedor del bracket tiene `overflowY: 'hidden'` y no puede mezclarse con `overflow: visible`. La solución es guardar `wrapRef.current.getBoundingClientRect()` en estado al hover y posicionar el tooltip con coordenadas viewport (`position: fixed`).
- **Groups NO OFICIAL chip**: cuando `temporalStandings` existe pero el torneo no ha terminado la fase de grupos, se muestra un chip rojo `✕ NO OFICIAL` junto al header de standings. Chip style: `color: #F87171`, `background: rgba(248,113,113,0.10)`, `border: 1px solid rgba(248,113,113,0.25)`.
- **VozUnanimeCard título 3-estado**: el título es condicional según `mostUnanimous?.consensus_hit`: `true` → "Todos lo Vieron Venir", `false` → "Nadie lo Vio Venir", `null/undefined` → "La Esperanza de Todos".

---

## 22. Comandos útiles

```bash
# Pipeline completo
node run_pipeline.js

# Solo archetypes (después de ajustar thresholds)
node analytics/runtime_profiles/scripts/generate_archetypes.js

# Solo sync (después de regenerar outputs)
node scripts/sync_to_public.js

# Solo presentation (después de editar el .md)
node scripts/build_presentation.js

# Dev server
cd frontend && npm run dev

# Build production
cd frontend && npm run build

# Verificar líneas de archivo (Windows mount trunca silenciosamente)
wc -l frontend/src/pages/PlayerProfile/index.jsx

# Validar JSX desde sandbox
node -e "const {parse}=require('/tmp/jsxcheck/node_modules/@babel/parser'); const src=require('fs').readFileSync('frontend/src/pages/PlayerProfile/index.jsx','utf8'); try{parse(src,{sourceType:'module',plugins:['jsx']});console.log('✓',src.split('\n').length,'lines')}catch(e){console.log('✗ line',e.loc?.line,e.message.slice(0,60))}"
```

---

## 23. Cómo trabajar con el usuario

- **Habla español.** El usuario es hispanohablante. También domina inglés.
- **Sé breve y honesto.** Sin flattery. Si una idea es mala, explicarlo con respeto y argumentos.
- **No asumas.** Si falta info para una decisión, preguntar antes de ejecutar.
- **Pelotea ideas antes de ejecutar.** Conversar → ajustar → aprobar → entonces escribir código.
- **Crítica constructiva > validación.** Cuando pide criterio, darlo con argumentos, no con "lo que prefieras".
- **Citar líneas y archivos exactos** al hablar de cambios.
- **Cambios grandes:** proponer diff en chat → esperar aprobación → ejecutar.
- **Al terminar:** reportar qué cambió, qué quedó pendiente, qué verificar manualmente.
- **Escritura de archivos grandes:** usar Python script — los file tools truncan silenciosamente en el mount de Windows.

**Distribución de modelos sugerida:**
- Opus → arquitectura, decisiones, debug de drift, evaluar trade-offs, auditorías conceptuales
- Sonnet → ejecutar tareas ya acordadas, aplicar diffs aprobados, escribir código siguiendo specs claras

---

## 24. Filosofía central (no negociable)

- Transparencia
- Reproducibilidad
- Determinismo
- Auditabilidad
- JSON-only pipeline
- No hidden logic
- No magic calculations
- Evitar drift entre capas
- Minimizar lógica implícita
- Fallar ruidosamente, nunca silenciosamente
- La identidad emerge desde datos reales — no se declara editorialmente
- Under-assignment es correcto — mejor no asignar que asignar mal
- La rareza es un contrato con el usuario — inflación la destruye

---

## 25. Design System — tokens, tipografía y patrones visuales

> Para construir cualquier tab nuevo, usar **exclusivamente** inline styles con estas variables. No usar Tailwind utilities, no agregar CSS modules.

### CSS Variables (globals.css)

```css
/* Fondos */
--color-bg:           #0B1120   /* fondo de página */
--color-surface:      #111827   /* card principal */
--color-surface-2:    #1F2937   /* card anidada / row highlight */
--color-border:       #2D3748   /* borde estándar */
--color-border-light: #374151   /* borde sutil */

/* Acentos */
--color-primary:      #38BDF8   /* azul principal (grupos, links) */
--color-primary-dim:  #0284C7   /* azul apagado */
--color-accent:       #FBBF24   /* dorado / warning / elite */
--color-accent-dim:   #D97706

/* Semánticos */
--color-success:      #34D399   /* correcto, positivo */
--color-error:        #F87171   /* incorrecto, negativo */
--color-warning:      #FBBF24   /* advertencia */
--color-pending:      #4B5563   /* pendiente / inactivo */

/* Texto */
--color-text-1:       #F1F5F9   /* texto principal */
--color-text-2:       #94A3B8   /* texto secundario */
--color-text-3:       #64748B   /* texto terciario / labels */

/* Tipografías */
--font-display:  'DM Sans', sans-serif     /* headings, nombres */
--font-body:     'DM Sans', sans-serif     /* párrafos, valores */
--font-mono:     'IBM Plex Mono', monospace /* labels técnicos, rankings, datos */

/* Layout */
--nav-height: 56px
```

### Colores de fase (constante compartida)

```js
// Usar siempre estos valores — no inventar variaciones
const PHASE_COLORS = {
  group:     '#38BDF8',   // azul (primario)
  standings: '#A78BFA',   // violeta
  knockout:  '#FB923C',   // naranja
}
```

### Escala tipográfica real (patrones extraídos de PlayerProfile)

| Uso | fontSize | fontFamily | color |
|---|---|---|---|
| Nombre principal (hero) | `1.75rem` | `font-display` | `text-1` |
| Ranking hero | `0.82rem` | `font-mono` | `text-3` |
| Section label (uppercase) | `0.68rem` | `font-mono` | `text-3` |
| Section heading | `0.9rem` | `font-display` | `text-2` |
| Valor de dato | `0.85rem` | `font-mono` | `text-1` |
| Valor secundario | `0.78rem` | `font-body` | `text-2` |
| Nota / caption | `0.72rem` | `font-body` | `text-3` |

### Patrón de card (sección)

```jsx
// Card estándar — usar para toda sección nueva
<div style={{
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  padding: '1.25rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
}}>

  {/* Label de sección */}
  <div style={{
    fontSize: '0.68rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  }}>
    NOMBRE DE SECCIÓN
  </div>

  {/* Contenido */}
</div>
```

### Patrón de row de dato

```jsx
// Row con label izquierda + valor derecha
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-2)' }}>Label</span>
  <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-1)' }}>
    valor
  </span>
</div>
```

### Divider

```jsx
<div style={{ borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }} />
```

### Reglas de construcción visual

- **Inline styles únicamente.** No agregar clases Tailwind, no crear archivos CSS.
- **No usar colores hardcodeados** fuera de `PHASE_COLORS`. Todo lo demás usa variables CSS.
- **borderRadius: 12** para cards principales, **borderRadius: 8** para elementos internos.
- **gap: '1rem'** entre secciones dentro de una tab. **gap: '0.5rem'** entre rows.
- **SVG inline** para cualquier visualización. No usar librerías de charts externas.
- La tab entera vive como JSX dentro de `PlayerProfile/index.jsx`. No crear archivos separados por tab.

---

## 26. Mapa de archivos del frontend

```
frontend/src/
  App.jsx                          # Router principal
  main.jsx                         # Punto de entrada

  config/
    urls.js                        # ← FUENTE DE VERDAD para todas las URLs de datos
    metricRegistry.js              # Config de display de métricas

  constants/
    stages.js                      # Constantes de fases del torneo

  data/loaders/
    fetchJSON.js                   # Fetch que lanza error si falla
    fetchOptional.js               # Fetch que retorna null si falla (usar para runtime profiles, payouts)
    index.js

  hooks/
    usePlayerProfile.js            # Hook principal del perfil — carga todos los datos del usuario
    useLeaderboard.js              # Hook del leaderboard global
    useTimeline.js                 # Hook de timeline global (existe, no es el mismo que PlayerProfile)
    useBracket.js                  # Hook del bracket

  layouts/
    MainLayout.jsx                 # Nav + contenedor principal

  pages/
    PlayerProfile/
      index.jsx                    # ~2600 líneas — TODOS los componentes del perfil viven aquí
      BracketAuditSection.jsx      # Auditoría del bracket (standalone). PRED → REAL con colores gold/red y ──▶
      ScoringAuditability.jsx      # 4 subtabs Scoring & Auditability. Data-driven desde scoring_integrity_v1.json
    Leaderboard/index.jsx
    Analytics/index.jsx
    Timeline/index.jsx             # Timeline global (carrera de ranking, NO perfil individual)
    Bracket/index.jsx
    Groups/index.jsx                   # Página completa: standings temporal + partidos por #match_id + puntos por usuario. Mobile responsive (1col < 768px)
    HallOfFame/index.jsx
    NotFound/index.jsx

  routes/index.jsx                 # Definición de rutas React Router

  styles/
    globals.css                    # ← FUENTE DE VERDAD del design system (CSS variables, fuentes)

  utils/
    teams.js                       # loadTeamMap() — carga mapa id→nombre de equipo
```

### URLs de datos (desde urls.js — referencia completa)

| Key | Archivo | Uso |
|---|---|---|
| `leaderboard` | `data/scores/leaderboard.json` | Rankings y puntos actuales |
| `scoreDetails` | `data/scores/score_details.json` | Detalle partido a partido |
| `userMetrics` | `data/analytics/user_metrics.json` | Métricas analytics por usuario |
| `timelineRace` | `data/analytics/timeline/timeline_race.json` | Historial de ranking por snapshot |
| `consistenciaRanking` | `data/analytics/timeline/consistencia_ranking.json` | Score de consistencia |
| `historialRanking` | `data/analytics/timeline/historial_ranking.json` | ⚠️ Huérfano — pipeline no genera |
| `precisionGeneral` | `data/analytics/core/precision_general.json` | Precisión global |
| `precisionAvance` | `data/analytics/core/precision_avance.json` | Precisión de avances |
| `precisionTabla` | `data/analytics/core/precision_tabla.json` | Precisión de standings |
| `precisionMarcadoresExactos` | `data/analytics/core/precision_marcadores_exactos.json` | Precisión de marcadores exactos |
| `eficienciaDePuntos` | `data/analytics/core/eficiencia_de_puntos.json` | Eficiencia de puntos |
| `consensoPartidos` | `data/analytics/engagement/consenso_partidos.json` | ⚠️ genera matches:[] |
| `campeonVivo` | `data/analytics/intelligence/campeon_vivo.json` | Estado del campeón predicho |
| `archetypes` | `data/analytics/runtime_profiles/archetypes.json` | Archetype activo por usuario |
| `traits` | `data/analytics/runtime_profiles/traits.json` | Traits secundarios |
| `archetypeRegistry` | `data/analytics/archetype_registry_v1.json` | Definiciones visuales de archetypes |
| `temporalGroupStandings` | `data/scores/temporal_group_standings.json` | Standings temporales por grupo (snapshot-based, visual only, no afecta scoring) |
| `groupResults` | `data/results/group_results.json` | Resultados oficiales de grupos |
| `knockoutResults` | `data/results/knockout_results.json` | Resultados oficiales de knockout |
| `standingsResults` | `data/results/standings_results.json` | Clasificación oficial de standings |
| `matchesMetadata` | `data/metadata/matches_metadata.json` | Metadata de partidos |
| `payouts` | `data/payout/payouts.json` | Estructura de premios |

---

## 27. Shapes de datos clave

### leaderboard.json (Array)

```json
[{
  "user_id": "621DA87FB2",
  "display_name": "MrPerfect",
  "total_points": 314,
  "breakdown": {
    "group": 65,
    "standings": 120,
    "knockout": 129
  },
  "rank": 1,
  "percentile_general": 100
}]
```

### score_details.json (Array — Auditoría tab)

```json
[{
  "user_id": "621DA87FB2",
  "display_name": "MrPerfect",

  "group": [
    {
      "match_id": 2,
      "prediction": "E",
      "result": "L",
      "points": 0,
      "breakdown": { "correct": false }
    }
  ],

  "standings": [
    {
      "group": "A",
      "total_points": 2,
      "positions": [
        {
          "position": 1,
          "predicted_team": "Czechia",
          "real_team": "Mexico",
          "correct": false,
          "points": 0
        }
      ]
    }
  ],

  "knockout": [
    {
      "match_id": 73,
      "prediction": {
        "home_team": "Mexico",
        "away_team": "Suiza",
        "home_goals": 2,
        "away_goals": 0,
        "advance_team": "Mexico"
      },
      "result": {
        "home_team": "Sudafrica",
        "away_team": "Canada",
        "home_goals": 2,
        "away_goals": 0,
        "advance_team": "Sudafrica"
      },
      "points": 3,
      "breakdown": {
        "home_team": false,
        "away_team": false,
        "home_goals": true,
        "away_goals": true,
        "exact_goals": true,
        "advance": false
      }
    }
  ]
}]
```

### user_metrics.json (Métricas analytics por usuario)

```json
{
  "generated_at": "2026-05-22T...",
  "users": [{
    "user_id": "728342EC3B",
    "display_name": "BtoZ",
    "metrics": {

      "precision_general": {
        "metric_id": "precision_general",
        "value": 0.585,
        "ranking": 3,
        "percentile": 83.33,
        "tier": null,
        "extra": {
          "best_category": "knockout",
          "worst_category": "group",
          "category_breakdown": {
            "group":     { "correct": 24, "possible": 71, "accuracy": 33.8 },
            "standings": { "correct": 20, "possible": 48, "accuracy": 41.67 },
            "knockout":  { "correct": 23, "possible": 32, "accuracy": 71.9 }
          }
        }
      },

      "eficiencia_de_puntos": {
        "metric_id": "eficiencia_de_puntos",
        "value": 0.623,
        "ranking": 2,
        "percentile": 91.67,
        "tier": null,
        "extra": {
          "stage_breakdown": {
            "group":     { "earned": 47, "available": 72 },
            "standings": { "earned": 75, "available": 120 },
            "knockout":  { "earned": 79, "available": 192 }
          }
        }
      }

      // también disponibles: precision_marcadores_exactos, precision_tabla,
      //                       consistencia_ranking, campeon_vivo
    }
  }]
}
```

### timeline_race.json (Línea de Tiempo tab)

```json
{
  "generated_at": "2026-05-22T...",
  "metric": "timeline_race",
  "snapshots": [
    {
      "snapshot_index": 0,
      "snapshot_match_id": "+",
      "stage": "group",
      "generated_at": "...",
      "users": [
        {
          "user_id": "621DA87FB2",
          "display_name": "MrPerfect",
          "rank": 1,
          "previous_rank": 1,
          "rank_delta": 0,
          "movement": "same",   // "new" | "same" | "up" | "down"
          "total_points": 314,
          "is_leader": true
        }
      ]
    }
    // 105 snapshots totales (Mayo 2026)
  ]
}
```

### archetypes.json (Runtime profiles)

```json
{
  "generated_at": "...",
  "users": [{
    "user_id": "621DA87FB2",
    "display_name": "MrPerfect",
    "active_archetype": "front_runner",   // null si no tiene
    "previous_archetype": "front_runner",
    "archetype_changed": false,
    "change_type": null,
    // governance only — NO exponer al frontend:
    "eligible_archetypes": ["front_runner"],
    "rejected_by_precedence": [],
    "activation_reasons": ["sustained_high_ranking"]
  }]
}
```

### archetype_registry_v1.json (Definiciones visuales)

```json
{
  "archetypes": [{
    "id": "front_runner",
    "display_name": "Front Runner",
    "short_description": "Control sostenido del torneo.",
    "short_metric": "Dominio total en ranking promedio",
    "identity_formula": "Se mantiene arriba cuando el torneo aprieta.",
    "rarity_tier": "elite",
    "asset": "assets/archetypes/front_runner.png"
  }]
}
```
⚠️ Este archivo tiene contenido extra después del JSON principal — usar `JSONDecoder.raw_decode()` si se necesita parsear en Python. En el frontend, `fetchJSON` lo maneja sin problema.

### temporal_group_standings.json (Standings temporales — visual only)

```json
{
  "generated_at": "2026-05-25T...",
  "snapshot_match_id": 72,
  "stage": "group_temporal",
  "deterministic": true,
  "disclaimer": "Standings temporales utilizados exclusivamente para visualización competitiva.",
  "tiebreakers": ["PTS", "DG", "GF", "Alphabetical"],
  "groups": [{
    "group": "A",
    "table": [{
      "team": "Mexico",
      "pts": 7, "pj": 3, "pg": 2, "pe": 1, "pp": 0,
      "gf": 8, "gc": 3, "dg": 5,
      "position": 1,
      "form": ["W", "D", "W"]
    }]
  }]
}
```

⚠️ **Visual only.** No refleja desempates directos FIFA. Generado por `scripts/temporal_group_standings.js` después del paso de scoring. Posiciones clasificadas en front como: pos 1-2 = clasifica a R32 (barra azul), pos 3-4 = sin clasificación (barra gris).

Scoring de posiciones: pos1=4pts · pos2=3pts · pos3=2pts · pos4=1pt

### traits.json (Array)

```json
[{
  "user_id": "728342EC3B",
  "display_name": "BtoZ",
  "traits": [
    {
      "id": "high_volatility",
      "label": "Alta volatilidad",
      "description": "Usuario con cambios fuertes de posición durante el torneo.",
      "confidence": "high",
      "metrics": { "rank_swing": 9, "volatility_threshold": 5 }
    }
  ],
  "metrics": {
    "volatility": {
      "best_rank": 1, "worst_rank": 10, "rank_swing": 9, "volatility_score": 0.75
    },
    "momentum": {
      "trend": "stable",   // "up" | "down" | "stable"
      "recent_delta": 0,
      "momentum_strength": 0,
      "recent_ranks": [7, 7, 7]
    },
    "phase_strength": {
      "strongest_phase": "knockout",
      "confidence": "high",
      "strength_delta": 0.38,
      "group_accuracy": 0.34,
      "knockout_accuracy": 0.72
    },
    "advance_accuracy": {
      "accuracy": 0.56, "correct": 18, "total_matches": 32
    }
  }
}]
```

---

## 28. Patrón de construcción de tab

Toda tab de PlayerProfile vive como función dentro de `PlayerProfile/index.jsx`. No se crean archivos separados por tab (excepción: `BracketAuditSection.jsx` que es un componente grande reutilizable).

### Template de tab mínima

```jsx
// =====================
// NOMBRE_TAB
// =====================

function NombreTab({ data }) {

  // Extraer lo que necesitas del data object
  const { leaderboard, scoreDetail, metrics, rankingHistory } = data

  // Si el dato no existe, no renderizar
  if (!scoreDetail) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ===================== */}
      {/* SECCIÓN 1             */}
      {/* ===================== */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>

        <div style={{
          fontSize: '0.68rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Nombre de Sección
        </div>

        {/* contenido */}

      </div>

    </div>
  )
}
```

### Data disponible en `data` (del hook usePlayerProfile)

```js
const {
  leaderboard,        // objeto del usuario en leaderboard (total_points, rank, breakdown, percentile_general)
  scoreDetail,        // objeto del usuario en score_details (group[], standings[], knockout[])
  metrics,            // objeto del usuario en user_metrics.users[].metrics
  rankingHistory,     // objeto del usuario en historialRanking.users[] (⚠️ huérfano)
  payoutEntry,        // objeto del usuario en payouts.positions[] (fetchOptional)
  matchMap,           // { [match_id]: matchMetadata }
  snapUser,           // usuario en el último snapshot de timelineRace
  groupResults,       // resultados oficiales de grupos
  teamMap,            // { [team_id]: { name, flag } }
  totalParticipants,  // leaderboard.length
  archetype,              // { id, display_name, short_description, identity_formula, rarity_tier, asset }
  traits,                 // array de traits del usuario
  campeonVivo,            // datos de campeonVivo (fetchOptional)
  timelineRaceSnapshots,  // snapshots[] del timeline_race.json — usado por PhasePerformanceCard y TournamentStateCard
} = data
```

### Cómo registrar una tab nueva

```jsx
// En el componente PlayerProfile, en la sección de tabs:
const TABS = ['Resumen', 'Predicciones', 'Línea de Tiempo', 'Auditoría']

// En el render:
{activeTab === 'Nombre Tab' && <NombreTab data={data} />}
```

### Para tabs que necesitan datos adicionales

Si una tab necesita datos que `usePlayerProfile` no carga (ej. `precisionGeneral`), agregarlos al hook:

```js
// En usePlayerProfile.js, agregar al Promise.all:
fetchJSON(DATA_URLS.precisionGeneral),

// En el .then(), recibir el valor:
.then(([..., precisionData]) => {
  const precisionEntry = precisionData?.users?.find(u => u.user_id === userId)
  setData({ ..., precisionEntry })
})
```

### Referencia semántica de métricas

Para entender **qué mide** cada métrica, cómo se calcula, qué NO mide, y su gaming name:

```
contracts/analytics/analytics_contracts_v2.md
```

Para límites técnicos (value_range, minimum_sample_size, supports_percentiles, etc.):

```
contracts/analytics/metric_registry_v2.json
```

Para display_name, short_description y featured status listos para el frontend:

```
contracts/analytics/analytics_presentation_v2.json
  → generado por: node scripts/build_presentation.js
  → NO editar a mano
```

---

## 29. Runtime Truth vs Presentation Texture

Este es uno de los contratos más importantes del sistema. Todo elemento visual del perfil cae en exactamente una de estas dos categorías — nunca en ambas.

### Runtime Truth — dato canónico, auditable, inmutable

Es el valor que viene del pipeline. Se puede trazar desde un partido real hasta el número en pantalla. No puede inventarse, estimarse, ni aproximarse visualmente.

| Elemento | Fuente canónica |
|---|---|
| Posición Y de cada punto en PhasePerformanceCard | `timelineRaceSnapshots[i].users[userId].rank` → `rankToY(r)` |
| Forma del stroke en PhasePerformanceCard | Snapshot reales por partido — no pseudoaleatorio |
| Bridge dot de Standings | Último snapshot de stage=standings → rank real |
| Posición del marker en Estado del Torneo | `leaderboard.rank` → percentil `(rank-1)/(N-1)` |
| El archetype asignado | `archetypes.json → active_archetype` → registry |
| Puntos por fase | `leaderboard.breakdown.{group, standings, knockout}` |
| Traits | `traits.json` → derivados de analytics reales |
| Movimiento de ranking (up/down/same) | `timeline_race.json → movement` |
| Best rank (con noise suppression) | `timelineRaceSnapshots` → mínimo rank, filtrado por `NOISE_WINDOW=12` y `earlyAvgRank * 0.6` |

**Regla:** si un elemento de UI modifica, suaviza, o aproxima un Runtime Truth, es un bug, no un feature.

---

### Presentation Texture — amplificación visual, no dato

Es el elemento visual que comunica *cualidad* (volatilidad, densidad, atmósfera), pero cuyo valor exacto no representa un dato real. Su propósito es amplificar la narrativa que el Runtime Truth ya establece — nunca crear narrativa propia.

| Elemento | Qué amplifica | Lo que NO es |
|---|---|---|
| **Fill bajo la curva** (opacity 0.18–0.30) | Territorio visual de la fase | Área proporcional a puntos |
| **Glow del marker** (3 capas concéntricas) | Prominencia del usuario en el campo | Percentil exacto visualmente codificado |
| **100 ticks del density field** | Campo competitivo completo | N participantes reales como ticks |
| **Anillos orbitales del fallback** | Estado de identidad sin convergencia | Ausencia de datos específicos |
| **Glow de rarity en HeroSection** | Escasez del archetype | Nivel matemático de rendimiento |

⚠️ **La waveform ya NO es Presentation Texture.** A partir del rediseño de Mayo 2026, la forma del stroke y los dots de `PhasePerformanceCard` son Runtime Truth: representan snapshots reales del `timelineRaceSnapshots`. Cada punto es un partido real. El PRNG fue eliminado.

---

### La regla de separación

```
Runtime Truth  →  define la posición, el valor, la identidad
Presentation Texture  →  amplifica esa verdad con forma, atmósfera, densidad

Presentation Texture NUNCA puede:
  - inventar una posición no respaldada por dato
  - sugerir una dirección que el dato no confirma
  - crear la ilusión de más información de la que existe
  - ser interpretada como dato por un usuario o por otro sistema
```

### La waveform ahora usa datos reales — PRNG eliminado (Mayo 2026)

La waveform de `PhasePerformanceCard` fue migrada de pseudoaleatoria a datos reales. La función `buildWavePoints` fue reemplazada por un mapeo directo de `timelineRaceSnapshots` a coordenadas SVG.

Cada punto de la curva representa un snapshot real: `{ idx, matchId, stage, rank }`. La posición Y es `rankToY(rank)`. No hay PRNG ni seed.

Esta migración fue posible cuando `timelineRaceSnapshots` quedó disponible en el hook `usePlayerProfile` a través del ResumenTab. La waveform ahora es Runtime Truth de principio a fin.

---

## 30. Narrative Hierarchy

La narrativa competitiva es la unidad fundamental de diseño de este sistema. Todo elemento visual, toda métrica, toda visualización existe para servir a la narrativa — no al revés.

### La jerarquía

```
NIVEL 1 — NARRATIVA COMPETITIVA
  ¿Quién es este usuario en este torneo?
  ¿Cuál es su historia?
  ¿Qué patrón dominante ha exhibido?

    domina sobre ↓

NIVEL 2 — ESTADO POSICIONAL
  ¿Dónde está ahora?
  ¿Cómo se mueve?
  ¿Qué zona ocupa?

    domina sobre ↓

NIVEL 3 — MÉTRICAS ANALÍTICAS
  precision_general, eficiencia_de_puntos,
  consistencia_ranking, etc.

    domina sobre ↓

NIVEL 4 — DETALLE TÉCNICO
  Partidos individuales, desglose por grupo,
  breakdown de scoring

    domina sobre ↓

NIVEL 5 — TEXTURA VISUAL
  Waveform, glow, dots, density
  (amplificación, no información)
```

### Consecuencias prácticas de esta jerarquía

**Al diseñar una nueva sección:** la primera pregunta es "¿qué narrativa comunica esto?" — no "¿qué dato muestra esto?". Si no hay narrativa, no hay sección.

**Al elegir qué mostrar primero:** lo que tiene mayor peso narrativo va arriba. Una waveform que cuenta la historia del torneo va antes que una tabla de precisión por fase.

**Al resolver conflictos de espacio:** se recorta desde el Nivel 4 y 5 hacia arriba, nunca al revés. Nunca se sacrifica narrativa para dar espacio a detalle técnico.

**Al evaluar si un elemento pertenece al perfil:** si el elemento solo existe para el Nivel 4 o 5 y no sirve a ningún nivel superior, no pertenece en el Resumen. Pertenece en Auditoría o en Predicciones.

**Al evaluar un archetype:** el archetype es Nivel 1. Ninguna métrica de Nivel 3 puede contradecirlo visualmente. Los traits son Nivel 2–3 y deben tratarse como soporte, no como protagonistas.

### El anti-patrón más común

Agregar métricas al Resumen porque "son interesantes" o "ya están disponibles". La disponibilidad del dato no justifica su presencia. La pregunta es: **¿a qué narrativa sirve este dato en este momento del torneo para este usuario?** Si la respuesta requiere más de una oración para justificarse, el dato no pertenece en el Resumen.

### El estándar de calidad de una pantalla

Una pantalla bien diseñada en este sistema puede describirse en una oración narrativa:

> "Esta pantalla te dice quién eres en el torneo, dónde estás ahora, y cómo llegaste aquí."

Si la descripción de una pantalla nueva requiere listar los datos que muestra en lugar de la historia que cuenta, la pantalla está mal diseñada.
