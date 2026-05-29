# Arquitectura Conceptual — Player Profile
**QMF 2026 · Runtime Competitive Profiles**
_v1.0 — 2026-05-20_

---

## 0. Principios de diseño que gobiernan esta arquitectura

1. **El frontend es render-only.** Ningún componente calcula, agrega, ni deriva valores. Todo número visible debe existir como campo en un JSON.
2. **Jerarquía narrativa estricta:** Archetype → Traits → Analytics → Raw metrics.
3. **Cada componente tiene un contrato de datos explícito.** Si el campo no existe en un JSON verificado, el componente no se implementa.
4. **Los componentes bloqueados se diseñan pero no se implementan** hasta que el pipeline los soporte.
5. **Momentum States: DIFERIDOS.** El espacio arquitectónico se reserva pero no se renderiza.

---

## 0.1 Refinamientos oficiales (post-revisión v1.1)

### identity_formula — aprobado como identity layer oficial
La capa de identidad del Hero queda fijada como:
- `display_name` — nombre del archetype
- `short_description` — descripción técnica breve
- `identity_formula` — pieza narrativa principal

Tono correcto para `identity_formula`: fantasy football / broadcast deportivo. Resumen emocional del torneo sin exageración épica ni lenguaje gamer.

### PlayerCard — "Predicciones bloqueadas" se mueve a Auditoría
El Hero debe comunicar identidad, posición y evolución. "Predicciones bloqueadas" es metadata de transparencia, no señal competitiva. Se mueve a `AuditoriaTab`. Queda eliminado de `TournamentMeta`.

### TraitsList — jerarquía visual extremadamente subordinada
Reglas de diseño no negociables para traits:
- Sin iconografía dominante
- Sin chips de color agresivo
- Sin múltiples niveles de jerarquía interna
- Tamaño de texto reducido respecto al archetype
- El archetype debe dominar el espacio visual de ArchetypeCard sin competencia

### RankingChart — núcleo emocional del perfil, no analytics visual
El chart no es decoración ni visualización de datos. Es la historia del torneo. Diseño objetivo: limpio, legible, deportivo. Sin overlays excesivos, sin anotaciones simultáneas múltiples, sin estética financiera.

### TimelineTab — evolución competitiva, no log técnico
La Timeline debe sentirse como narrativa deportiva con resolución completa. Cuando existan transiciones de archetype y snapshots clave, será la pieza de mayor valor narrativo del sistema.

### "En Zona de Premio" — validado arquitectónicamente
`rank <= payout_structure.paid_positions` es comparación render-only válida. No contradice la separación archetype/payout. Son capas distintas.

### Percentil general — PREGUNTA ABIERTA (ver Sección 2.1.1)
El display "Top 17% general" tiene tono de dashboard SaaS. Se exploran alternativas antes de implementar.

---

## 1. Árbol de componentes

```
PlayerProfilePage
├── HeroSection                          [IMPLEMENTABLE — datos listos]
│   ├── PlayerCard
│   │   ├── PlayerHeader
│   │   ├── ScoreDisplay
│   │   └── TournamentMeta
│   └── ArchetypeCard
│       ├── ArchetypeIdentity
│       ├── [MomentumSlot — RESERVADO, DIFERIDO]
│       └── TraitsList
├── TabNav
│   └── tabs: Resumen · Predicciones · Desglose · Línea de Tiempo · Auditoría
└── TabContent
    ├── ResumenTab
    │   ├── TournamentStateCard          [PARCIAL — faltan 2 campos de pipeline]
    │   ├── RankingChart                 [IMPLEMENTABLE — datos listos]
    │   ├── PhasePerformanceCard         [IMPLEMENTABLE — datos listos]
    │   └── TournamentMomentsCard        [BLOQUEADO — pipeline pendiente]
    ├── PrediccionesTab                  [DIFERIDO — diseño pendiente]
    ├── DesglosePuntosTab                [DIFERIDO — diseño pendiente]
    ├── TimelineTab                      [IMPLEMENTABLE — datos listos]
    └── AuditoriaTab                     [IMPLEMENTABLE — datos listos]
```

---

## 2. HeroSection

### Objetivo narrativo
Responder en 3 segundos: **¿quién eres competitivamente en este torneo?**

No es un scoreboard. Es una identidad competitiva con contexto de posición.

### Layout
```
┌─────────────────────────────────┬──────────────────────────────┐
│  PlayerCard (~55%)              │  ArchetypeCard (~45%)        │
│                                 │                              │
│  [Avatar]  Nombre               │  ──── IDENTIDAD ────         │
│            #7 de 12             │  Elimination Specialist       │
│            199 pts              │  "Eleva su nivel en          │
│                                 │   eliminación directa."      │
│  ▓▓░░ Grupos     18 pts         │  "Crece cuando llegan los    │
│  ▓▓▓▓ Tabla      81 pts         │   partidos decisivos."       │
│  ▓▓▓▓ Knockout  100 pts         │                              │
│                                 │  [MomentumSlot — DIFERIDO]   │
│  Top 17% general                │                              │
│                                 │  · Preciso en avances        │
│                                 │  · Alta volatilidad          │
│                                 │  · Especialista knockout     │
└─────────────────────────────────┴──────────────────────────────┘
```

### 2.1 PlayerCard

**Componentes internos:**

`PlayerHeader`
- Avatar: inicial del nombre (generado desde display_name, sin imagen externa)
- Nombre: `leaderboard[user].display_name`
- Rango badge: `leaderboard[user].rank` + total de usuarios (`leaderboard.length`)

`ScoreDisplay`
- Total: `leaderboard[user].total_points`
- 3 barras proporcionales al máximo posible por fase:
  - Grupos: `breakdown.group`
  - Tabla: `breakdown.standings`
  - Knockout: `breakdown.knockout`
- Las barras son visuales comparativas entre sí, no contra un absoluto. El ancho relativo entre las 3 barras es suficiente narrativamente.

`TournamentMeta`
- Contexto de posición: display pendiente de decisión narrativa (ver Sección 2.1.1).
- "Predicciones bloqueadas": **ELIMINADO del Hero** — movido a AuditoriaTab. Es metadata de transparencia, no señal competitiva.

### 2.1.1 Display de posición contextual — RESUELTO

**Formato oficial aprobado: `Percentil [N]`**

Ejemplo: "Percentil 83" para el jugador en el top 17%.

**Justificación (escala):** el sistema está diseñado para hasta ~120 jugadores. A esa escala, el rank numérico solo (`#73 de 120`) requiere esfuerzo mental para interpretarse. `Percentil [N]` escala limpio de 12 a 120 participantes sin cambiar el componente. Número alto = mejor posición, más intuitivo competitivamente que "Top X%". Tono esports/broadcast.

**Contrato de datos:**
- Campo: `leaderboard[user].percentile_general` (entero 0–100)
- Calculado en pipeline, no en frontend
- Display: `"Percentil " + percentile_general`

**Separación de conceptos confirmada:**
- `percentile_general` → posición relativa general (escala 0–100)
- Badge "En Zona de Premio" → `rank <= paid_positions` → relevancia económica del torneo
- Son lecturas distintas y compatibles en el Hero

### 2.2 ArchetypeCard

**Componentes internos:**

`ArchetypeIdentity`
- `archetype_registry[active_archetype].display_name` → nombre del archetype
- `archetype_registry[active_archetype].short_description` → descripción corta
- `archetype_registry[active_archetype].identity_formula` → frase narrativa
- Fallback si `active_archetype === null`: mostrar "Participante Oficial" (definido en registry.rules.fallback_identity). Sin identity_formula en el fallback — display neutro, sin narrativa competitiva.

`MomentumSlot` — RESERVADO, NO IMPLEMENTAR
- El espacio se reserva en el layout pero no renderiza nada.
- Cuando momentum states se implementen, este slot mostrará: estado (ej. "En Ascenso") + delta reciente.
- Por ahora: slot invisible, sin placeholder text.

`TraitsList`
- `traits[user].traits[]` → máximo 3, en orden de confidence descendente.
- Cada trait: solo `label`. Sin descripción, sin porcentajes, sin iconos.
- Si `traits[]` está vacío: el slot desaparece. Sin placeholder.

**Reglas de jerarquía visual (no negociables):**
- El archetype domina el espacio visual de ArchetypeCard sin competencia.
- `identity_formula` es la pieza narrativa principal — el eye-catcher emocional del perfil.
- Los traits son matices y contexto, no headlines. Su presencia refuerza el archetype sin opacarlo.
- Sin colores agresivos, chips enormes, ni iconografía llamativa en traits.
- Máximo un nivel de jerarquía visual: todos los traits al mismo nivel entre sí, todos subordinados al archetype.

---

## 3. TabNav

5 tabs. El tab activo por defecto es **Resumen**.

| Tab | Estado | Descripción |
|---|---|---|
| Resumen | Implementable (parcial) | Vista narrativa del torneo |
| Predicciones | Diferido | Detalle por partido |
| Desglose de Puntos | Diferido | Breakdown de scoring |
| Línea de Tiempo | Implementable | Timeline completo |
| Auditoría | Implementable | Fuentes y trazabilidad |

Los tabs Predicciones y Desglose comparten datos de `score_details.json` pero requieren diseño específico antes de implementar. Se dejan diferidos para no asumir estructura.

---

## 4. ResumenTab

### 4.0 Nota sobre paid_positions scaling

`payout_structure.json` define actualmente `paid_positions: 2` para 12 jugadores. La regla de escala oficial es **1/4 a 1/5 del total de usuarios** (ej: 24–30 posiciones pagas para 120 jugadores).

Implicación arquitectónica: `paid_positions` es un campo manual en `payout_structure.json`. Cuando el número de participantes reales se defina, este campo debe actualizarse. El componente "En Zona de Premio" (`rank <= paid_positions`) sigue funcionando sin cambios en el frontend — solo cambia el valor en el JSON.

No es un problema de pipeline automático; es un campo de governance manual del torneo.

### 4.1 TournamentStateCard

**Objetivo:** ¿Dónde has estado en este torneo? No solo ahora — el arco completo.

**Campos implementables ahora:**

| Dato | Fuente | Campo |
|---|---|---|
| Mejor posición | `user_metrics.consistencia_ranking.extra.best_rank` | ✅ |
| Peor posición | `user_metrics.consistencia_ranking.extra.worst_rank` | ✅ |
| Rango actual | `leaderboard[user].rank` | ✅ |
| En zona de premio (Sí/No) | `leaderboard[user].rank <= payout_structure.paid_positions` | ✅ (render-only con campos ya disponibles) |
| Pts en Knockout | `leaderboard[user].breakdown.knockout` | ✅ |
| Mejor fase (label) | `user_metrics.precision_general.extra.best_category` | ✅ |

**Campos que requieren pipeline antes de implementar:**

| Dato | Campo necesario | Dónde añadir |
|---|---|---|
| Match donde fue mejor (#4 en Match 72) | `consistencia_ranking.extra.best_rank_snapshot_id` | `user_metrics.json` |
| Match donde fue peor (#12 en Match 48) | `consistencia_ranking.extra.worst_rank_snapshot_id` | `user_metrics.json` |
| Snapshots consecutivos en zona de premio | `consistencia_ranking.extra.consecutive_payout_snapshots` | `user_metrics.json` |

Los tres son derivables desde `timeline_race.json` + `payout_structure.json`. La derivación debe hacerse en el script de analytics correspondiente, no en el frontend.

**Decisión de diseño — mostrar sin los campos pendientes:**
La primera versión de TournamentStateCard muestra lo que existe. Los "en Match 72" quedan pendientes como texto `—` hasta que el pipeline los provea. El componente no necesita todos los datos para funcionar.

### 4.2 RankingChart

**Objetivo:** Ver el arco completo del torneo de un vistazo.

**Datos:**
- Fuente única: `analytics/timeline/outputs/timeline_race.json`
- Filtrar por `user_id`
- X-axis: `snapshot_index` (0–87), con labels de fase en los boundaries:
  - index 0 → "Inicio"
  - index 71 → "Posiciones" (stage: standings)
  - index 73 → "Knockout"
- Y-axis: `rank`, invertido (rank 1 en la parte superior)
- Cada punto: `{ x: snapshot_index, y: rank, match_id: snapshot_match_id }`
- Tooltip al hover: rank + total_points en ese snapshot

**Filosofía de diseño (aprobada en revisión v1.1):** El RankingChart es el núcleo emocional del perfil, no una visualización de analytics. Es la historia visual completa del torneo. Debe sentirse limpio, deportivo, evolutivo — sin estética financiera, sin overlays excesivos, sin anotaciones simultáneas. Un usuario debe poder leerlo en segundos sin esfuerzo cognitivo.

**El componente no calcula nada.** Solo transforma el array de snapshots en puntos de gráfica. La única "transformación" es el filtrado por user_id, que es una operación de presentación, no de lógica.

**Nota sobre los stage boundaries:**
`timeline_race` tiene 3 stages: `group`, `standings`, `knockout`. El stage `standings` (snapshots 71-72) representa la evaluación de posiciones de grupo. En el eje X del chart, estos aparecen entre Grupos y Knockout, no como fase separada — el label puede decir "Posiciones" en ese boundary.

### 4.3 PhasePerformanceCard

**Objetivo:** ¿En qué eres bueno? ¿En qué no? Una respuesta clara, relativa al propio usuario.

**Diseño — 2 bloques, no 3+3:**

```
MEJOR FASE                          ÁREA DE MEJORA
standings · 85.4%                   group · 4.2%
Posiciones de grupo                 Fase de grupos

Marcador exacto: 21.6%
Precisión en avances: 80.0%
```

**Fuentes de datos:**

| Dato | Fuente | Campo |
|---|---|---|
| Mejor fase (id) | `user_metrics.precision_general.extra.best_category` | ✅ |
| Mejor fase (%) | `user_metrics.precision_general.extra.category_breakdown[best_category].accuracy` | ✅ |
| Peor fase (id) | `user_metrics.precision_general.extra.worst_category` | ✅ |
| Peor fase (%) | `user_metrics.precision_general.extra.category_breakdown[worst_category].accuracy` | ✅ |
| Marcador exacto % | `user_metrics.precision_marcadores_exactos.value × 100` | ✅ |
| Precisión avances % | `precision_avance[user].knockout_advancement_accuracy.accuracy_percent` | ✅ (archivo separado) |

**Pendiente de pipeline:** `precision_avance` no está integrado en `user_metrics`. El componente puede cargarlo como archivo adicional (`analytics/core/outputs/precision_avance.json`) hasta que se integre.

**Label de categoría:** el campo `best_category` devuelve `"standings"`, `"group"`, `"knockout"`. El frontend necesita un mapa de display:
```
group     → "Fase de grupos"
standings → "Posiciones de grupo"
knockout  → "Fase eliminatoria"
```
Este mapa vive en `src/config/` como constante estática. No es lógica de negocio.

### 4.4 TournamentMomentsCard

**Objetivo:** Los 3 momentos más narrativamente significativos del torneo del usuario.

**Estado: BLOQUEADO** — requiere nuevo output de pipeline.

**Qué necesita:** `output/scores/milestones.json`

```json
{
  "user_id": "...",
  "best_snapshot": {
    "snapshot_match_id": 89,
    "stage": "knockout",
    "rank_delta": 5,
    "pts_in_snapshot": 18,
    "rank_at_snapshot": 3
  },
  "worst_snapshot": {
    "snapshot_match_id": 48,
    "stage": "group",
    "rank_delta": -4,
    "pts_in_snapshot": 0,
    "rank_at_snapshot": 12
  },
  "biggest_phase_rise": {
    "from_stage": "group",
    "to_stage": "knockout",
    "rank_start": 11,
    "rank_end": 7,
    "positions_gained": 4
  }
}
```

**Derivación:** Todo calculable desde `timeline_race.json` + boundaries de stage. Script nuevo en `analytics/timeline/scripts/` o extensión del existente.

**Qué NO implementar:** "Momento Clave editorial" (ej. "Entraste a Top 10 en SF"). Sin definición técnica en contrato → no se implementa.

---

## 5. TimelineTab

**Objetivo:** La historia completa del torneo, snapshot a snapshot.

**Filosofía (aprobada en revisión v1.1):** La Timeline es evolución competitiva real, no un log técnico. Debe sentirse como narrativa deportiva con resolución completa. Cuando existan transiciones de archetype, saltos fuertes de ranking y cambios de fase visibles, se convierte en la pieza de mayor valor narrativo del sistema.

Implementación:
- Fuente única: `timeline_race.json`
- Resolución completa (88 snapshots)
- Tooltip enriquecido: rank, rank_delta (flecha ↑↓), total_points en ese snapshot
- Markers en boundaries de fase (group → standings → knockout)
- Potencial futuro: markers de transición de archetype cuando el pipeline los provea
- Sin cálculos adicionales

---

## 6. AuditoriaTab

**Objetivo:** Transparencia total y trazabilidad.

| Dato | Fuente |
|---|---|
| "Predicciones bloqueadas antes del torneo" | Invariante del sistema — copy estático |
| Fuente de resultados | Copy estático: `data/results/*.json` |
| Versión de scoring | Derivar de `package.json` o campo en `leaderboard.json` |
| Última actualización | `leaderboard.json.generated_at` o snapshot más reciente |
| Snapshot actual (match_id) | Último snapshot en `timeline_race.json` |
| Link a score_details | URL configurada en `src/config/urls.js` |

**Nota:** La mayoría del contenido de este tab es copy estático + campos de metadata que ya existen en los JSONs. Es el tab más barato de implementar y el más valioso para la filosofía del proyecto.

---

## 7. Contratos de datos por componente (resumen)

```
COMPONENTE              ARCHIVOS NECESARIOS                        ESTADO
──────────────────────────────────────────────────────────────────────────
PlayerCard              leaderboard.json                           ✅
TournamentMeta          leaderboard.json [+ percentile field]      ⚠️ falta campo
ArchetypeCard           archetypes.json                            ✅
                        archetype_registry_v1.json                 ✅
TraitsList              traits.json                                ✅
RankingChart            timeline_race.json                         ✅
TournamentStateCard     user_metrics.json                          ✅ (parcial)
                        leaderboard.json                           ✅
                        payout_structure.json                      ✅
                        [+ best/worst snapshot_id fields]          ⚠️ falta campo
PhasePerformanceCard    user_metrics.json                          ✅
                        precision_avance.json                      ✅ (separado)
TournamentMomentsCard   milestones.json                            ❌ no existe
TimelineTab             timeline_race.json                         ✅
AuditoriaTab            leaderboard.json (metadata)                ✅
                        timeline_race.json (last snapshot)         ✅
```

---

## 8. Pipeline work necesario antes de implementar cada bloque

En orden de impacto:

### Bloque A — Desbloquea TournamentMeta (Hero)
**Añadir `percentile_general` a `leaderboard.json`**
- Display oficial: `"Percentil [N]"` — aprobado
- Valor: entero 0–100 (mayor = mejor posición)
- Escala correctamente de 12 a ~120 jugadores
- Calculado en el script que genera leaderboard, no en frontend
- Alta prioridad: es parte visible del Hero

### Bloque B — Completa TournamentStateCard
**Añadir a `user_metrics.consistencia_ranking.extra`:**
- `best_rank_snapshot_id`: snapshot_match_id donde el usuario tuvo su best_rank
- `worst_rank_snapshot_id`: idem para worst_rank
- `consecutive_payout_snapshots`: count de snapshots consecutivos donde rank ≤ paid_positions

Todos derivables iterando `timeline_race.json` con `payout_structure.paid_positions`.

### Bloque C — Desbloquea TournamentMomentsCard
**Crear `output/scores/milestones.json`**
- best_snapshot, worst_snapshot, biggest_phase_rise por usuario
- Script nuevo en `analytics/timeline/scripts/build_milestones.js`
- Se integra en `run_pipeline.js` después de `timeline_race`

### Bloque D — Desbloquea "Apuestas Clave"
**Refactorizar `campeon_vivo.json` → `surviving_predictions.json`**
- Por usuario: qué equipos predijo en cada ronda y si siguen vivos
- Cruzar `user_profiles[user].knockout[].advance_team` con avances reales en `data/results/`
- Alta complejidad relativa, baja prioridad de UX vs los bloques anteriores

### Bloque E — Integración de precision_avance (nice-to-have)
**Mover `precision_avance` a `user_metrics.json`**
- Elimina la necesidad de cargar un archivo adicional en PhasePerformanceCard
- No bloquea nada — el componente puede cargar el archivo separado mientras tanto

---

## 9. Reglas de render-only (lo que el frontend NUNCA hace)

- No suma puntos
- No calcula porcentajes de accuracy
- No compara usuarios entre sí
- No determina si un archetype aplica
- No clasifica fortalezas/debilidades
- No infiere momentum
- No interpreta tendencias
- No decide qué traits mostrar (ya vienen en traits.json con max 3)
- No calcula percentiles
- No detecta momentos del torneo

La única "lógica" permitida en el frontend:
- Filtrado por user_id en arrays (operación de presentación)
- Map estático de `category_id → display_label` (constante de configuración)
- Comparar `rank <= paid_positions` para el badge "En Zona de Premio" (dos campos ya derivados, comparación trivial de presentación)

---

## 10. Orden de implementación sugerido

**Fase 1 — Core implementable ahora:**
1. HeroSection completo (excepto percentile_general)
2. RankingChart
3. PhasePerformanceCard
4. AuditoriaTab
5. TimelineTab

**Fase 2 — Tras pipeline Bloque A + B:**
6. TournamentMeta con percentil real
7. TournamentStateCard completo (con match_id de best/worst)

**Fase 3 — Tras pipeline Bloque C:**
8. TournamentMomentsCard

**Fase 4 — Tras pipeline Bloque D:**
9. "Apuestas Clave" / surviving_predictions UI

**Diferidos indefinidamente:**
- MomentumSlot (hasta implementar momentum states en pipeline)
- "Momento Clave" editorial (sin contrato técnico viable)
- PrediccionesTab y DesglosePuntosTab (requieren diseño específico)
