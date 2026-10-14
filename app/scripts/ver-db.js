// Muestra el contenido de la base de datos (usuarios y sesiones activas).
// Uso: npm run db:ver   (desde app/)
const { abrirDb } = require('../db/db.js');

const db = abrirDb();
try {
  console.log('\n=== Tabla usuarios ===');
  const usuarios = db.prepare('SELECT id, email, nombre, password_hash, creado_en FROM usuarios').all();
  console.table(
    usuarios.map((u) => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      password_hash: u.password_hash.slice(0, 24) + '…',
      creado_en: u.creado_en,
    }))
  );

  console.log('\n=== Tabla sesiones (aparece una fila por cada login) ===');
  const sesiones = db.prepare('SELECT token, usuario_id, expira_en FROM sesiones').all();
  if (sesiones.length === 0) console.log('(vacía: nadie ha iniciado sesión)');
  else
    console.table(
      sesiones.map((s) => ({ token: s.token.slice(0, 16) + '…', usuario_id: s.usuario_id, expira_en: s.expira_en }))
    );
} finally {
  db.close();
}
