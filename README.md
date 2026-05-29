# QMF 2026 — Quiniela Mundial FIFA 2026

Quiniela privada para el Mundial FIFA 2026. 19 participantes. Sin backend, sin base de datos — todo el estado del sistema vive en archivos JSON versionados.

---

## Qué es

Una plataforma de competitive intelligence aplicada a una quiniela de fútbol. Los participantes predicen resultados de grupos, posiciones de tabla y partidos eliminatorios. El sistema los evalúa con scoring determinístico, construye un historial de ranking partido a partido, y deriva identidades competitivas (archetypes) a partir de los patrones que emergen a lo largo del torneo.

No hay lógica oculta. Cada punto es auditable hasta el partido que lo generó.

---

## Cómo funciona


fixture_master.xlsx  →  resultados oficiales (data/results/*.json)
input_lock/*.xlsx    →  predicciones de usuarios (output/users/profiles/*.json)
                              ↓
                    scoring/* (group · standings · knockout)
                              ↓
                    leaderboard.json + score_details.json + snapshots/
                              ↓
                    analytics/* (métricas · timeline · archetypes)
                              ↓
                    frontend/public/data/  →  React (Vite)


**Fases del scoring**

| Fase | Qué se evalúa | Puntos máx. |
|---|---|---|
| Grupos | Resultado del partido (L / E / V) | 72 pts |
| Standings | Posición final de cada equipo en su grupo | 120 pts |
| Eliminatorias | Equipos, goles, marcador exacto por partido | 180 pts |
| Bonos | Campeón (15 pts) + Tercer lugar (5 pts) | 20 pts |

Los marcadores de eliminatorias corresponden al resultado a 90 minutos. Tiempo extra y penales solo determinan el equipo que avanza.

---

## Cómo recalcular

### Pipeline completo (después de cargar nuevos resultados)


node run_pipeline.js


Ejecuta en orden: ingest → scoring → métricas → presentation → payouts → sync al frontend.

### Pasos individuales


# Solo sincronizar outputs al frontend (sin recalcular)
node scripts/sync_to_public.js

# Solo archetypes (después de ajustar thresholds)
node analytics/runtime_profiles/scripts/generate_archetypes.js

# Solo presentation layer (después de editar analytics_contracts_v2.md)
node scripts/build_presentation.js


### Dev server


cd frontend && npm run dev
# → http://localhost:5173/Quinela-MundialFIFA-2026/


---

## Estructura clave


data/results/          # Resultados oficiales (fuente de verdad)
input_lock/            # Predicciones bloqueadas al inicio del torneo
output/users/          # Perfiles de usuario procesados
output/scores/         # Leaderboard, score_details, snapshots
analytics/             # Métricas derivadas (no re-calculan scoring)
contracts/             # Gobernanza semántica del sistema
frontend/              # React + Vite (render-only, sin lógica de negocio)


**Regla fundamental:** solo `scoring/*` puede calcular puntos. Analytics y frontend consumen los outputs — nunca los redefinen.
