// Crea las tablas y el usuario de prueba. Se puede ejecutar varias veces sin fallar.
// Uso: npm run db:init  (desde app/)
const { abrirDb, crearTablas, crearUsuario } = require('./db.js');

const db = abrirDb();
try {
  crearTablas(db);
  const usuario = crearUsuario(db, {
    email: 'demo@upb.edu',
    nombre: 'Usuario Demo',
    password: 'Demo123!',
  });
  console.log(`Base de datos lista. Usuario de prueba: ${usuario.email}`);
} finally {
  db.close();
}
