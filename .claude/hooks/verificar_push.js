// HOOK · PreToolUse (Bash|PowerShell)
// Antes de un `git push` ejecuta las pruebas. Si fallan -> exit 2: el push NO se hace.
const { ejecutarPruebas, leerEntrada } = require('./probar.js');

const comando = leerEntrada().tool_input?.command || '';
if (!/\bgit(?:\.exe)?\b[^\r\n;&|]*\bpush\b/i.test(comando)) process.exit(0);

const r = ejecutarPruebas();
if (!r.ok) {
  console.error(
    'PUSH BLOQUEADO: las pruebas fallaron o no se encontraron pruebas.\n' +
      'Corrige el problema, haz un nuevo commit y reintenta el push.\n\n' + r.salida.slice(-3000)
  );
  process.exit(2);
}
console.log(JSON.stringify({ systemMessage: `✅ Hook previo al push: ${r.pass}/${r.tests} pruebas OK; se permite continuar.` }));
