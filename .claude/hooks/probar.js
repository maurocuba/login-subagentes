// Utilidad compartida por los hooks: ejecuta las pruebas de app/ y devuelve el reporte.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function ejecutarPruebas() {
  const app = path.join(__dirname, '..', '..', 'app');
  const r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', '--test'], {
    cwd: app,
    encoding: 'utf-8',
    timeout: 50000,
  });
  const salida = (r.stdout || '') + (r.stderr || '');
  const num = (nombre) => Number((salida.match(new RegExp(`${nombre} (\d+)`)) || [])[1] || 0);
  return { ok: r.status === 0 && num('tests') > 0, salida, tests: num('tests'), pass: num('pass'), fail: num('fail') };
}

function leerEntrada() {
  try { return JSON.parse(require('node:fs').readFileSync(0, 'utf-8')); } catch { return {}; }
}

module.exports = { ejecutarPruebas, leerEntrada };
