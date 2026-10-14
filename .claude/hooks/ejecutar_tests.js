// HOOK · PostToolUse (Edit|Write)
// Después de editar un .js ejecuta las pruebas. Si fallan -> exit 2 y Claude recibe el reporte.
const { ejecutarPruebas, leerEntrada } = require('./probar.js');

const ruta = leerEntrada().tool_input?.file_path || '';
if (!ruta.endsWith('.js')) process.exit(0);

const r = ejecutarPruebas();
if (!r.ok) {
  console.error(
    '❌ El hook ejecutó las pruebas después de tu cambio y FALLARON.\n' +
      'Revisa el error y corrige lo que haga falta:\n\n' + r.salida.slice(-3000)
  );
  process.exit(2);
}
console.log(JSON.stringify({ systemMessage: `✅ Hook de pruebas: ${r.pass}/${r.tests} pruebas OK` }));
