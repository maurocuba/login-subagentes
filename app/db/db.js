const crypto = require('node:crypto');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { hashPassword } = require('./password.js');

const RUTA_POR_DEFECTO = path.join(__dirname, 'login.db');
const DURACION_SESION_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Abre la base SQLite. Sin argumento usa app/db/login.db.
 * abrirDb(':memory:') abre una base en memoria (útil para tests).
 */
function abrirDb(ruta = RUTA_POR_DEFECTO) {
  const db = new DatabaseSync(ruta);
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

/** Crea las tablas si no existen. Es idempotente. */
function crearTablas(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      creado_en TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sesiones (
      token TEXT PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      expira_en TEXT NOT NULL
    );
  `);
}

/**
 * Inserta un usuario con la contraseña hasheada (si el email ya existe, no hace nada).
 * Devuelve la fila del usuario (incluye password_hash: nunca enviarla al cliente).
 */
function crearUsuario(db, { email, nombre, password }) {
  const passwordHash = hashPassword(password);
  db.prepare(
    'INSERT OR IGNORE INTO usuarios (email, nombre, password_hash) VALUES (?, ?, ?)'
  ).run(email, nombre, passwordHash);
  return buscarUsuarioPorEmail(db, email);
}

function buscarUsuarioPorEmail(db, email) {
  return db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
}

function buscarUsuarioPorId(db, id) {
  return db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
}

/** Crea una sesión que expira en 2 horas y devuelve el token. */
function crearSesion(db, usuarioId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiraEn = new Date(Date.now() + DURACION_SESION_MS).toISOString();
  db.prepare(
    'INSERT INTO sesiones (token, usuario_id, expira_en) VALUES (?, ?, ?)'
  ).run(token, usuarioId, expiraEn);
  return token;
}

/**
 * Devuelve { usuario_id } si el token existe y no ha expirado; undefined en otro caso.
 * Ambas fechas son ISO 8601 en UTC (toISOString), por lo que la comparación de texto es correcta.
 */
function buscarSesionValida(db, token) {
  const fila = db
    .prepare('SELECT usuario_id FROM sesiones WHERE token = ? AND expira_en > ?')
    .get(token, new Date().toISOString());
  if (!fila) return undefined;
  return { usuario_id: fila.usuario_id };
}

function borrarSesion(db, token) {
  db.prepare('DELETE FROM sesiones WHERE token = ?').run(token);
}

module.exports = {
  abrirDb,
  crearTablas,
  crearUsuario,
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
  crearSesion,
  buscarSesionValida,
  borrarSesion,
};
