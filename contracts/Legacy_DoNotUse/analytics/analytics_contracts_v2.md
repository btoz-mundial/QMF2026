# Analytics Contracts V2

## Objetivo

Este documento define el significado oficial de los analytics del sistema.

Su propósito es:

- congelar semántica
- evitar drift conceptual
- mantener consistencia narrativa
- proteger auditabilidad
- ayudar al frontend render-only
- ayudar a Claude a interpretar correctamente los analytics

Este documento NO define:

- lógica runtime
- rendering UI
- fórmulas ejecutables
- scoring oficial
- orchestration
- estilos visuales

El scoring oficial sigue viviendo exclusivamente en:

- scoring/*
- leaderboard.json
- score_details.json

---

# Filosofía General

Los analytics son una capa derivada e interpretativa construida sobre artifacts oficiales.

Los analytics:

- NO recalculan scoring
- NO alteran resultados oficiales
- NO son source of truth deportivo
- NO deben introducir lógica implícita

Todos los analytics deben:

- ser reproducibles
- ser auditables
- ser transparentes
- explicar qué miden
- explicar qué NO miden

---

# Definiciones Oficiales

## Precision

Precision representa:

aciertos / oportunidades evaluadas

NO depende del peso del scoring.

Mide frecuencia relativa de aciertos.

---

## Efficiency

Efficiency representa:

puntos_obtenidos / puntos_disponibles

Sí depende del peso del scoring oficial.

Mide aprovechamiento del sistema de puntuación.

---

## Consensus

Consensus representa:

distribución comunitaria de predicciones.

NO representa precisión real.

---

## Timeline

Timeline representa:

evolución histórica de snapshots oficiales.

---

# precision_general

## Gaming Name

Top Predictor

---

## Qué mide

Mide qué tan seguido un usuario acierta predicciones evaluadas del torneo.

Incluye:

- fase de grupos
- eliminatorias
- standings
- avances
- marcadores evaluados

---

## Cómo se calcula

aciertos_correctos / oportunidades_evaluadas

---

## Qué significa

Valores altos indican que el usuario acierta frecuentemente predicciones evaluadas.

---

## Qué NO significa

NO mide:

- valor ponderado del scoring
- dominancia del leaderboard
- dificultad relativa de aciertos
- calidad específica de eliminatorias

---

## Dependencias oficiales

- score_details.json

---

## Activación

Depende de:

precision_general_activation

---

## Advertencias estadísticas

Puede variar rápidamente durante etapas tempranas del torneo.

Los percentiles y ranking tiers pueden permanecer ocultos antes del estado stable.

---

# precision_avance

## Gaming Name

Killer Eliminations

---

## Qué mide

Mide qué tan seguido un usuario acierta qué equipos avanzan en eliminatorias.

---

## Cómo se calcula

avances_correctos / avances_evaluados

---

## Qué significa

Valores altos indican buena lectura del bracket eliminatorio.

---

## Qué NO significa

NO mide:

- marcadores exactos
- goles exactos
- puntos ponderados
- precisión de fase de grupos

---

## Dependencias oficiales

- score_details.json
- knockout_results.json
- standings_results.json

---

## Activación

Esta métrica se activa cuando el bracket oficial queda definido después del partido 72.

NO depende de partidos knockout jugados.

---

## Advertencias estadísticas

Puede cambiar rápidamente entre rondas eliminatorias.

---

# precision_marcadores_exactos

## Gaming Name

Ice Cold

---

## Qué mide

Mide qué tan seguido un usuario acierta marcadores exactos evaluados.

---

## Cómo se calcula

marcadores_exactos_correctos / marcadores_exactos_evaluados

---

## Qué significa

Valores altos indican alta precisión en predicciones exactas de marcador.

---

## Qué NO significa

NO mide:

- frecuencia general de aciertos
- valor total de scoring
- precisión de standings
- precisión de avances

---

## Dependencias oficiales

- score_details.json
- knockout_results.json

---

## Activación

Depende de:

precision_marcadores_exactos_activation

---

## Advertencias estadísticas

Es una métrica altamente volátil.

Samples pequeños pueden generar variaciones extremas.

---

# precision_tabla

## Gaming Name

Table Master

---

## Qué mide

Mide qué tan acertado un usuario pronosticó posiciones oficiales de standings.

---

## Cómo se calcula

posiciones_correctas / posiciones_evaluadas

---

## Qué significa

Valores altos indican buena lectura de desempeño grupal y clasificación.

---

## Qué NO significa

NO mide:

- precisión de partidos
- precisión de eliminatorias
- valor total de scoring
- precisión de marcadores exactos

---

## Dependencias oficiales

- standings_results.json
- score_details.json

---

## Activación

Se activa cuando los standings oficiales quedan definidos.

---

## Advertencias estadísticas

No debe interpretarse antes del cierre oficial de fase de grupos.

---

# eficiencia_de_puntos

## Gaming Name

Point Hunter

---

## Qué mide

Mide qué porcentaje de puntos disponibles ha conseguido un usuario.

---

## Cómo se calcula

puntos_obtenidos / puntos_disponibles

---

## Qué significa

Valores altos indican mejor aprovechamiento del sistema oficial de puntuación.

---

## Qué NO significa

NO mide:

- frecuencia relativa de aciertos
- dificultad de picks
- consistencia temporal

---

## Dependencias oficiales

- leaderboard.json
- score_details.json

---

## Activación

Depende de:

eficiencia_de_puntos_activation

---

## Advertencias estadísticas

Puede diferir significativamente de precision_general debido a pesos distintos del scoring.

---

# consistencia_ranking

## Gaming Name

Muro de Acero

---

## Qué mide

Mide estabilidad relativa de posiciones históricas en snapshots oficiales.

---

## Cómo se calcula

Se deriva de cambios de ranking entre snapshots históricos.

---

## Qué significa

Valores altos indican menor volatilidad de ranking a través del torneo.

---

## Qué NO significa

NO mide:

- cantidad de puntos
- precisión directa
- calidad absoluta de predicciones

---

## Dependencias oficiales

- snapshots
- leaderboard.json

---

## Activación

Depende de:

consistencia_ranking_activation

---

## Advertencias estadísticas

Requiere múltiples snapshots para ser interpretada correctamente.

---

# timeline_race

## Gaming Name

Timeline Race

---

## Qué mide

Representa la evolución histórica del leaderboard durante el torneo.

---

## Cómo se calcula

Se deriva de snapshots históricos oficiales.

---

## Qué significa

Permite visualizar:

- ascensos
- caídas
- cambios de liderazgo
- evolución competitiva

---

## Qué NO significa

NO representa:

- precisión
- eficiencia
- dominancia matemática
- skill absoluto

---

## Dependencias oficiales

- snapshots
- leaderboard.json

---

## Activación

Depende de:

timeline_race_activation

---

## Advertencias estadísticas

Etapas tempranas pueden generar movimientos muy bruscos.

---

# consenso_partidos

## Gaming Name

Mente Colectiva

---

## Qué mide

Mide tendencias colectivas de predicción entre usuarios.

---

## Cómo se calcula

Se deriva de distribución agregada de predicciones cargadas por usuarios.

---

## Qué significa

Permite identificar:

- picks populares
- picks divididos
- favoritos colectivos

---

## Qué NO significa

NO mide:

- precisión real
- calidad del pick
- probabilidad matemática
- resultados oficiales

---

## Dependencias oficiales

- users/*.json

---

## Activación

Depende de cantidad de usuarios cargados.

NO depende de resultados oficiales.

---

## Advertencias estadísticas

Samples pequeños pueden generar consensos engañosos.

---

# campeon_vivo

## Gaming Name

Still in the Race

---

## Qué mide

Indica si el campeón predicho por un usuario sigue vivo en el torneo.

---

## Cómo se calcula

Verifica si el campeón predicho continúa con posibilidad matemática de ganar el torneo.

---

## Qué significa

Permite identificar qué usuarios mantienen vivo su pick campeón.

---

## Qué NO significa

NO mide:

- precisión total
- calidad general del usuario
- puntos acumulados
- dominancia competitiva

---

## Dependencias oficiales

- knockout_results.json
- standings_results.json
- users/*.json

---

## Activación

Se activa cuando el bracket oficial queda definido después del partido 72.

---

## Advertencias estadísticas

Es un analytic de estado binario, no una métrica progresiva de precisión.