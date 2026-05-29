"deprecated": true,
"deprecated_reason": "Replaced by V2 governance layer",
"do_not_use_for_new_analytics": true,


\# Analytics Contracts — Quiniela Mundialista



\## Objetivo



Definir contratos oficiales para la capa de analytics.



Todos los analytics:



\* son generados desde JSON estático

\* son determinísticos

\* NO se calculan en frontend

\* NO dependen de backend

\* NO modifican scoring oficial



\---



\# Arquitectura



```txt

/analytics

&#x20; /contracts



&#x20; /core

&#x20;   /outputs

&#x20;   /scripts



&#x20; /engagement

&#x20;   /outputs

&#x20;   /scripts



&#x20; /helpers



&#x20; /intelligence

&#x20;   /outputs

&#x20;   /scripts



&#x20; /timeline

&#x20;   /outputs

&#x20;   /scripts

```



\---



\# NON-NEGOTIABLE RULES



\* Do not invent analytics fields

\* Do not recalculate analytics in frontend

\* Frontend is render-only

\* All analytics come precomputed

\* If analytics output does not exist, frontend must not infer it

\* Pending analytics must not be rendered as completed features

\* Analytics outputs are source of truth



\---



\# PIPELINE



```txt

results

→ scoring

→ snapshots

→ analytics

→ frontend

```



\---



\# HELPERS



\## loadLeaderboard.js



Carga:



```txt

/output/scores/leaderboard.json

```



\---



\## loadResults.js



Carga:



```txt

/data/results/\*.json

```



\---



\## loadScoreDetails.js



Carga:



```txt

/output/scores/score\_details.json

```



\---



\## loadSnapshots.js



Carga:



```txt

/output/scores/snapshots/\*.json

```



Los snapshots deben regresar:



\* ordenados

\* completos

\* listos para analytics



\---



\## loadUsers.js



Carga:



```txt

/output/users/\*.json

```



\---



\## saveOutput.js



Responsable de:



\* guardar outputs analytics

\* asegurar formato JSON

\* centralizar escritura



\---



\# CORE ANALYTICS



\## eficiencia\_de\_puntos.json



Quedó MUCHO más sólido.

Y sí, tomo esta versión como referencia conceptual para futuras respuestas del proyecto.

Lo que sí debes actualizar todavía

Tu analytics_contracts.md aún describe eficiencia_de_puntos como versión vieja:

Medir qué tan eficiente es un usuario convirtiendo aciertos en puntos.

Pero ya evolucionó a:

efficiencies por etapa
stage_breakdown
best_stage
worst_stage
enriched extra metadata
Te recomiendo reemplazar SOLO esta sección
Actual:
## eficiencia_de_puntos.json

### Objetivo

Medir qué tan eficiente es un usuario convirtiendo aciertos en puntos.

### Estado

IMPLEMENTED

### Uso frontend

* rankings
* badges
* comparativas
* charts
Por esta
## eficiencia_de_puntos.json

### Objetivo

Medir qué tan eficientemente convierte un usuario las oportunidades oficiales de scoring en puntos reales obtenidos.

La métrica incluye:

* eficiencia global
* eficiencia por etapa
* breakdowns comparativos
* metadata contextual

### Estado

IMPLEMENTED

### Fuente oficial

Deriva exclusivamente de:

```txt
/output/scores/leaderboard.json
/output/scores/score_details.json
/data/results/*.json

Nunca recalcula scoring oficial.

Contrato
{
  "generated_at": "...",

  "metric": "eficiencia_de_puntos",

  "users": [

    {

      "user_id": "ABC",

      "display_name": "Beto",

      "metric_id": "eficiencia_de_puntos",

      "value": 64.22,

      "rank": 1,

      "breakdown": {

        "group_efficiency": 87.5,

        "standings_efficiency": 64.58,

        "knockout_efficiency": 56.25

      },

      "extra": {

        "earned_points": 154,

        "available_points": 240,

        "best_stage": "group",

        "worst_stage": "knockout",

        "stage_breakdown": {

          "group": {

            "earned": 42,

            "available": 48,

            "efficiency": 87.5

          },

          "standings": {

            "earned": 31,

            "available": 48,

            "efficiency": 64.58

          },

          "knockout": {

            "earned": 81,

            "available": 144,

            "efficiency": 56.25

          }

        }

      }

    }

  ]

}
Uso frontend
radar charts
efficiency cards
comparative dashboards
runtime cards
profile storytelling
player archetypes
category breakdown visualizations
Reglas

Frontend NO debe:

recalcular eficiencias
inferir best_stage
reconstruir breakdowns
recalcular puntos disponibles

Todos los cálculos oficiales deben venir preprocesados desde analytics.





\## precision\_avance.json



\### Objetivo



Precisión prediciendo equipos que avanzan en knockout.



\### Estado



IMPLEMENTED



\---



\## precision\_general.json



\### Objetivo



Precisión general total del usuario.



\### Estado



IMPLEMENTED



\### Uso frontend



\* scorecards

\* profile stats

\* leaderboard advanced metrics



\---



\## precision\_marcadores\_exactos.json



\### Objetivo



Precisión acertando marcadores exactos.



\### Estado



IMPLEMENTED



\---



\## precision\_tabla.json



\### Objetivo



Precisión en standings / posiciones de grupo.



\### Estado



IMPLEMENTED



\---



\## puntos\_por\_categoria.json



\### Objetivo



Separar contribución de puntos por categoría.



\### Categorías



\* group

\* standings

\* knockout

\* bonus



\### Estado



IMPLEMENTED



\---



\# TIMELINE ANALYTICS



Todos los timeline analytics derivan EXCLUSIVAMENTE de snapshots.



Nunca deben recalcular scoring.



\---



\## historial\_ranking.json



\### Objetivo



Mostrar evolución histórica de ranking.



\### Contrato

{

&#x20; "generated\_at": "...",

&#x20; "metric": "historial\_ranking",

&#x20; "users": \[

&#x20;   {

&#x20;     "user\_id": "ABC",

&#x20;     "display\_name": "Beto",

&#x20;     "history": \[

&#x20;       {

&#x20;         "snapshot\_match\_id": 73,

&#x20;         "stage": "knockout",

&#x20;         "rank": 1,

&#x20;         "total\_points": 45

&#x20;       }

&#x20;     ]

&#x20;   }

&#x20; ]

}

```



\### Uso frontend



\* line charts

\* ranking timeline

\* leader changes

\* progression



\---



\## evolucion\_puntos.json



\### Objetivo



Mostrar crecimiento de puntos durante el torneo.



\### Contrato


{

&#x20; "generated\_at": "...",

&#x20; "metric": "evolucion\_puntos",

&#x20; "users": \[

&#x20;   {

&#x20;     "user\_id": "ABC",

&#x20;     "display\_name": "Beto",

&#x20;     "history": \[

&#x20;       {

&#x20;         "snapshot\_match\_id": 73,

&#x20;         "stage": "knockout",

&#x20;         "total\_points": 45

&#x20;       }

&#x20;     ]

&#x20;   }

&#x20; ]

}

```



\### Uso frontend



\* score progression charts

\* momentum charts

\* user profile graphs



\---



\## consistencia\_ranking.json



\### Objetivo



Medir estabilidad de ranking durante el torneo.



\### Definición



Promedio de ranking histórico.



Menor promedio = mayor consistencia.



\### Contrato


{

&#x20; "generated\_at": "...",

&#x20; "metric": "consistencia\_ranking",

&#x20; "users": \[

&#x20;   {

&#x20;     "user\_id": "ABC",

&#x20;     "display\_name": "Beto",

&#x20;     "average\_rank": 2.14,

&#x20;     "best\_rank": 1,

&#x20;     "worst\_rank": 7,

&#x20;     "snapshots": 24

&#x20;   }

&#x20; ]

}

```



\### Uso frontend



\* consistency badges

\* profile metrics

\* advanced rankings



\---



\# INTELLIGENCE ANALYTICS



\## campeon\_vivo.json



\### Objetivo



Identificar usuarios cuyo campeón aún sigue vivo.



\### Estado



IMPLEMENTED



\### Uso frontend



\* elimination tracking

\* probability panels

\* survivor widgets



\---



\# ENGAGEMENT ANALYTICS



Estos analytics actualmente están marcados como PENDING.



Frontend NO debe asumir estructura final.



\---



\## coincidencia\_con\_consenso.json



\### Estado



PENDING



\### Idea conceptual



Medir cuánto coincide un usuario con picks populares.



\---



\## indice\_contrario.json



\### Estado



PENDING



\### Idea conceptual



Medir qué tan diferente es un usuario respecto al consenso.



\---



\## indice\_de\_riesgo.json



\### Estado



PENDING



\### Idea conceptual



Medir agresividad/riesgo de picks.



\---



\## picks\_unicos.json



\### Estado



PENDING



\### Idea conceptual



Identificar picks exclusivos entre usuarios.



\---



\# ORCHESTRATION



\## generate\_all\_analytics.js



\### Objetivo



Ejecutar automáticamente todos los analytics.



\### Reglas



\* Detecta módulos automáticamente

\* Ejecuta todos los scripts `.js`

\* Ignora:



&#x20; \* helpers

&#x20; \* contracts

\* Debe tolerar placeholders pendientes



\---



\# FRONTEND GUIDELINES



\## Frontend puede:



\* renderizar analytics

\* mostrar charts

\* ordenar métricas

\* filtrar usuarios

\* comparar estadísticas



\---



\## Frontend NO puede:



\* recalcular analytics

\* inferir métricas faltantes

\* modificar outputs

\* generar scoring nuevo



\---



\# IMPORTANTE



Analytics outputs son contratos oficiales.



Una vez consumidos por frontend:



\* evitar cambios breaking

\* mantener naming consistente

\* mantener estructuras estables



## Icons

The `icon` field represents an icon identifier intended for frontend icon libraries such as Lucide React.

It is NOT an image path.

 NEW OFFICIAL OUTPUT

## analytics/outputs/user_metrics.json

### Propósito

Archivo consolidado oficial para frontend.

Contiene:

- rankings
- percentiles
- tiers
- métricas enriquecidas
- metadata de usuario
- analytics listos para renderizar

Frontend debe consumir ESTE archivo como fuente principal para:

- profile pages
- analytics cards
- advanced rankings
- badges
- tiers
- percentiles
- comparisons
- user dashboards

---

# IMPORTANTE

Frontend NO debe:

- recalcular rankings
- recalcular percentiles
- recalcular tiers
- inferir estrellas
- inferir badges

Todo eso ya viene preprocesado.

---

# Contrato

{
  "generated_at": "2026-05-07T22:58:16.856Z",

  "users": [

    {

      "user_id": "49977F7EBF",

      "display_name": "BtoZ",

      "metrics": {

        "precision_general": {

          "metric_id": "precision_general",

          "value": 0.3115,

          "ranking": 2,

          "percentile": 66.67,

          "tier": {

            "stars": 1,

            "name": "Oráculo",

            "top_percent": 50

          },

          "extra": {

            "correct": 43,

            "possible": 138

          }

        }

      }

    }

  ]

}
Campo metrics

Cada métrica utiliza:

{
  "metric_id": "...",

  "value": 0.75,

  "ranking": 3,

  "percentile": 92.5,

  "tier": null,

  "extra": {}
}
value

Representa el valor principal de la métrica.

Puede ser:

percent
count
boolean
points
positions

Dependiendo de la métrica.

ranking

Posición relativa del usuario dentro de esa métrica.

Puede ser:

null

si la métrica no soporta ranking.

percentile

Percentil relativo del usuario.

Valores:

0 → peor
100 → mejor

Puede ser:

null

si la métrica no soporta percentile.

tier

Nivel competitivo calculado automáticamente.

Puede contener:

{
  "stars": 3,
  "name": "Oráculo Supremo",
  "top_percent": 10
}

o:

null

si la métrica no soporta tiers.

extra

Información contextual específica de cada métrica.

Frontend debe tratar este campo como:

metric-specific metadata

NO asumir estructura universal.

IMPORTANTÍSIMO

El frontend:

NO debe modificar analytics
NO debe recalcular métricas
NO debe recalcular tiers
NO debe inferir rankings

Toda lógica oficial ya viene consolidada.

## timeline_race.json

### Objetivo

Proveer una estructura optimizada para visualizaciones tipo:

* animated bar chart race
* movement tracking
* ranking progression
* competitive timeline storytelling

### Arquitectura

timeline_race.json NO reemplaza snapshots oficiales.

Es un analytics derivado exclusivamente de snapshots.

Su propósito es:

* simplificar frontend
* evitar recálculos visuales
* centralizar movement tracking

### Contrato

```json
{
  "generated_at": "...",
  "metric": "timeline_race",

  "snapshots": [

    {
      "snapshot_index": 0,

      "snapshot_match_id": 73,

      "stage": "knockout",

      "generated_at": "...",

      "users": [

        {
          "user_id": "ABC",

          "display_name": "Beto",

          "rank": 2,

          "previous_rank": 5,

          "rank_delta": 3,

          "movement": "up",

          "total_points": 44
        }

      ]
    }

  ]
}
```

### movement

Valores permitidos:

* up
* down
* same

Frontend es responsable únicamente de:

* iconografía
* colores
* animación visual

NO debe recalcular movement.

### rank_delta

Representa cantidad absoluta de posiciones movidas.

Ejemplo:

5 → 2 = 3

### Fuente oficial

timeline_race deriva EXCLUSIVAMENTE de:

```txt
/output/scores/snapshots/*.json
```

### Uso frontend

* bar chart race
* movement feed
* snapshot replay
* ranking animation
* esports timeline UI
