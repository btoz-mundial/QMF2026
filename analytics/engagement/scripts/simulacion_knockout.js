/**
 * simulacion_knockout.js
 *
 * Fuente de datos EXCLUSIVA del simulador de eliminatorias (Fase 2).
 * NO es una métrica de Mente Colectiva: consenso_partidos.js / consenso_votantes.js
 * quedan intactos. Este builder solo prepara, para los PRÓXIMOS N partidos de
 * knockout pendientes, las predicciones CRUDAS de cada usuario, para que el
 * frontend aplique la regla oficial (knockoutRule) — una sola fuente de verdad.
 *
 * Determinístico, auditable, sin escribir resultados ni snapshots oficiales.
 * Auto-cableado: generate_all_analytics.js ejecuta todo script en scripts/;
 * sync_to_public.js copia el dir engagement/outputs completo al frontend.
 */
const fs = require('fs');
const path = require('path');

const { loadUsers } = require('../helpers/loadUsers');
const { saveOutput } = require('../../helpers/saveOutput');

// Cuántos partidos próximos exponer (1 ahora; margen para crecer a 3).
const NEXT_N = 3;

// engagement/scripts → engagement → analytics → raíz del repo
const ROOT = path.join(__dirname, '..', '..', '..');

const loadJSON = p => JSON.parse(fs.readFileSync(p, 'utf-8'));

// "28-Jun" + "10:00" → epoch ms (2026). Infinity si no parsea (no debe colarse como próximo).
const MONTHS = {
  ene: 0, jan: 0, feb: 1, mar: 2, abr: 3, apr: 3, may: 4,
  jun: 5, jul: 6, ago: 7, aug: 7, sep: 8, oct: 9, nov: 10, dic: 11, dec: 11,
};
function kickoffTs(md) {
  if (!md) return Infinity;
  const [d, mon] = String(md.match_date ?? '').split('-');
  const month = MONTHS[String(mon ?? '').trim().toLowerCase().slice(0, 3)];
  const day = parseInt(d, 10);
  if (month == null || Number.isNaN(day)) return Infinity;
  const [hh, mm] = String(md.kickoff_utc ?? '00:00').split(':');
  return new Date(2026, month, day, parseInt(hh, 10) || 0, parseInt(mm, 10) || 0).getTime();
}

// =====================================
// LOAD
// =====================================
const users = loadUsers();
const knockoutResults = loadJSON(path.join(ROOT, 'data', 'results', 'knockout_results.json'));
const metaRaw = loadJSON(path.join(ROOT, 'data', 'metadata', 'matches_metadata.json'));
const metaArr = Array.isArray(metaRaw) ? metaRaw : (metaRaw.matches || Object.values(metaRaw));
const metaById = {};
for (const m of metaArr) metaById[m.match_id] = m;

// Índice de predicciones de knockout por usuario y match_id.
const picksByMatch = {};
for (const u of users) {
  for (const k of (u.knockout || [])) {
    if (!picksByMatch[k.match_id]) picksByMatch[k.match_id] = [];
    picksByMatch[k.match_id].push({
      user_id: u.user_id,
      home_team: k.home_team ?? null,
      away_team: k.away_team ?? null,
      home_goals: k.home_goals ?? null,
      away_goals: k.away_goals ?? null,
      advance_team: k.advance_team ?? null,   // conservado: 0 pts directos, pero completa el dataset
    });
  }
}

// =====================================
// PRÓXIMOS N PENDIENTES (por FECHA/HORA, nunca por match_id)
// =====================================
// Orden cronológico robusto: round_order PRIMARIO (una ronda nunca se juega antes
// que la previa; inmune a fechas semilla erróneas como el 104 "19-Jun"), luego
// fecha+hora dentro de la ronda, y match_id solo como desempate estable.
// NO se asume que match_id = orden cronológico (es desempate de último recurso).
const pending = knockoutResults
  .filter(m => m.status !== 'final')
  .sort((a, b) => {
    const ra = a.round_order ?? Infinity;
    const rb = b.round_order ?? Infinity;
    if (ra !== rb) return ra - rb;
    const ta = kickoffTs(metaById[a.match_id]);
    const tb = kickoffTs(metaById[b.match_id]);
    if (ta !== tb) return ta - tb;
    return a.match_id - b.match_id;
  })
  .slice(0, NEXT_N);

const matches = pending.map(m => {
  const md = metaById[m.match_id] || {};
  return {
    match_id: m.match_id,
    stage: m.stage,
    // Equipos REALES del cruce (null hasta que la ronda previa los fije).
    home_team: m.home_team ?? null,
    away_team: m.away_team ?? null,
    match_date: md.match_date ?? null,
    kickoff_utc: md.kickoff_utc ?? null,
    // Predicciones CRUDAS por usuario (sin precalcular puntos).
    picks: picksByMatch[m.match_id] || [],
  };
});

// =====================================
// SAVE
// =====================================
const output = {
  generated_at: new Date().toISOString(),
  metric: 'simulacion_knockout',
  next_count: NEXT_N,
  matches,
};

const outputPath = path.join(__dirname, '..', 'outputs', 'simulacion_knockout.json');
saveOutput(outputPath, output);

console.log('✅ simulacion_knockout.json generado —', matches.length, 'partidos próximos,',
  matches.reduce((s, m) => s + m.picks.length, 0), 'picks');
