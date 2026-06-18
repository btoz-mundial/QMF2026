/**
 * validate_json.js
 * -----------------------------------------------------------------------------
 * Recorre los directorios de datos y valida que TODOS los .json parseen.
 * Detecta específicamente el relleno de bytes nulos (\x00) que el pipeline
 * ha dejado al escribir sobre el folder montado — corrupción que vuelve el
 * JSON inválido y tumba al frontend al cargar.
 *
 * Uso:
 *   node scripts/validate_json.js          → valida; exit 1 si algo falla
 *   node scripts/validate_json.js --fix    → trunca bytes nulos y re-valida
 *
 * Pensado para correr al final del pipeline (después de sync_to_public) y/o
 * como pre-commit, para no publicar JSON corrupto silenciosamente.
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');

const SCAN_DIRS = [
  'data',
  'frontend/public/data',
  'output',
];

const FIX = process.argv.includes('--fix');

// ── helpers ──────────────────────────────────────────────────────────────────

function walk(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc; // directorio inexistente: se ignora
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      walk(full, acc);
    } else if (e.isFile() && e.name.endsWith('.json')) {
      acc.push(full);
    }
  }
  return acc;
}

function rstripNuls(buf) {
  let end = buf.length;
  while (end > 0 && (buf[end - 1] === 0x00 || buf[end - 1] === 0x20 ||
                     buf[end - 1] === 0x0a || buf[end - 1] === 0x0d ||
                     buf[end - 1] === 0x09)) {
    end--;
  }
  return buf.subarray(0, end);
}

// ── main ─────────────────────────────────────────────────────────────────────

const files = [];
for (const d of SCAN_DIRS) walk(path.join(BASE_DIR, d), files);

let ok = 0;
const nulFixed = [];
const failures = [];

for (const f of files) {
  const raw = fs.readFileSync(f);
  const hadNuls = raw.includes(0x00);

  // Primer intento: parsear tal cual.
  try {
    JSON.parse(raw.toString('utf8'));
    if (!hadNuls) { ok++; continue; }
  } catch (_) {
    // sigue abajo
  }

  // Falló o tenía nulos: intentar limpiar el relleno.
  const clean = rstripNuls(raw);
  try {
    JSON.parse(clean.toString('utf8'));
  } catch (e) {
    failures.push({ file: f, error: e.message });
    continue;
  }

  // El contenido es válido tras quitar relleno → es solo corrupción de bytes nulos.
  if (FIX) {
    fs.writeFileSync(f, Buffer.concat([clean, Buffer.from('\n')]));
    nulFixed.push(f);
  } else {
    failures.push({
      file: f,
      error: `JSON válido pero con ${raw.length - clean.length} bytes de relleno (nulos/espacios). Corre con --fix.`,
    });
  }
}

const rel = (f) => path.relative(BASE_DIR, f);

console.log(`Archivos .json escaneados: ${files.length}`);
console.log(`Sanos: ${ok}`);
if (FIX) console.log(`Reparados (relleno truncado): ${nulFixed.length}`);
console.log(`Con problemas: ${failures.length}`);

if (nulFixed.length) {
  console.log('\nReparados:');
  for (const f of nulFixed) console.log('  ✔', rel(f));
}

if (failures.length) {
  console.log('\n❌ PROBLEMAS:');
  for (const { file, error } of failures) console.log('  -', rel(file), '→', error);
  process.exit(1);
}

console.log('\n✅ Todos los JSON son válidos.');
