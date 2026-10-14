const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
  crearSesion,
  buscarSesionValida,
  borrarSesion,
} = require('../db/db.js');
const { verificarPassword } = require('../db/password.js');

const DIR_FRONTEND = path.resolve(__dirname, '..', 'frontend');
const MAX_BODY = 1024 * 1024; // 1 MB

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function enviarJson(res, estado, objeto) {
  const cuerpo = JSON.stringify(objeto);
  res.writeHead(estado, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(cuerpo),
  });
  res.end(cuerpo);
}

function leerBody(req) {
  return new Promise((resolve, reject) => {
    const partes = [];
    let tam = 0;
    req.on('data', (c) => {
      tam += c.length;
      if (tam > MAX_BODY) {
        reject(Object.assign(new Error('Body demasiado grande'), { codigo: 'GRANDE' }));
        req.destroy();
        return;
      }
      partes.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')));
    req.on('error', reject);
  });
}

function tokenDeCabecera(req) {
  const h = req.headers.authorization;
  if (typeof h !== 'string') return null;
  const m = /^Bearer\s+(\S+)\s*$/i.exec(h);
  return m ? m[1] : null;
}

function usuarioPublico(fila) {
  return { id: fila.id, nombre: fila.nombre, email: fila.email };
}

function usuarioDeRequest(db, req) {
  const token = tokenDeCabecera(req);
  if (!token) return null;
  const sesion = buscarSesionValida(db, token);
  if (!sesion) return null;
  const fila = buscarUsuarioPorId(db, sesion.usuario_id);
  return fila ? usuarioPublico(fila) : null;
}

async function manejarLogin(db, req, res) {
  let texto;
  try {
    texto = await leerBody(req);
  } catch (e) {
    if (e.codigo === 'GRANDE') return enviarJson(res, 400, { error: 'Body demasiado grande' });
    throw e;
  }
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    return enviarJson(res, 400, { error: 'JSON inválido' });
  }
  if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
    return enviarJson(res, 400, { error: 'JSON inválido' });
  }
  const { email, password } = datos;
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    email.trim() === '' ||
    password === ''
  ) {
    return enviarJson(res, 400, { error: 'Email y contraseña son obligatorios' });
  }

  const fila = buscarUsuarioPorEmail(db, email.trim());
  if (!fila || !verificarPassword(password, fila.password_hash)) {
    return enviarJson(res, 401, { error: 'Credenciales inválidas' });
  }
  const token = crearSesion(db, fila.id);
  return enviarJson(res, 200, { token, usuario: usuarioPublico(fila) });
}

function manejarMe(db, req, res) {
  const usuario = usuarioDeRequest(db, req);
  if (!usuario) return enviarJson(res, 401, { error: 'No autorizado' });
  return enviarJson(res, 200, { usuario });
}

function manejarLogout(db, req, res) {
  const token = tokenDeCabecera(req);
  if (token) borrarSesion(db, token);
  res.writeHead(204);
  res.end();
}

function servirEstatico(req, res, pathname) {
  let relativa;
  try {
    relativa = decodeURIComponent(pathname);
  } catch {
    return enviarJson(res, 400, { error: 'Ruta inválida' });
  }
  if (relativa.includes('\0') || relativa.split(/[\\/]/).includes('..')) {
    return enviarJson(res, 403, { error: 'Acceso denegado' });
  }
  if (relativa === '/' || relativa === '') relativa = '/index.html';

  const archivo = path.resolve(DIR_FRONTEND, '.' + relativa);
  if (archivo !== DIR_FRONTEND && !archivo.startsWith(DIR_FRONTEND + path.sep)) {
    return enviarJson(res, 403, { error: 'Acceso denegado' });
  }

  fs.stat(archivo, (errStat, st) => {
    if (errStat || !st.isFile()) return enviarJson(res, 404, { error: 'No encontrado' });
    fs.readFile(archivo, (errLeer, datos) => {
      if (errLeer) return enviarJson(res, 404, { error: 'No encontrado' });
      const tipo = TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': datos.length });
      res.end(req.method === 'HEAD' ? undefined : datos);
    });
  });
}

function crearServidor(db) {
  return http.createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://localhost');

      if (pathname.startsWith('/api/')) {
        if (pathname === '/api/login') {
          if (req.method !== 'POST') return enviarJson(res, 405, { error: 'Método no permitido' });
          return await manejarLogin(db, req, res);
        }
        if (pathname === '/api/me') {
          if (req.method !== 'GET') return enviarJson(res, 405, { error: 'Método no permitido' });
          return manejarMe(db, req, res);
        }
        if (pathname === '/api/logout') {
          if (req.method !== 'POST') return enviarJson(res, 405, { error: 'Método no permitido' });
          return manejarLogout(db, req, res);
        }
        return enviarJson(res, 404, { error: 'No encontrado' });
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return enviarJson(res, 405, { error: 'Método no permitido' });
      }
      return servirEstatico(req, res, pathname);
    } catch (e) {
      console.error(e);
      if (!res.headersSent) enviarJson(res, 500, { error: 'Error interno' });
      else res.end();
    }
  });
}

module.exports = { crearServidor };

if (require.main === module) {
  const { abrirDb, crearTablas } = require('../db/db.js');
  const db = abrirDb();
  crearTablas(db);
  const puerto = Number(process.env.PORT) || 3000;
  crearServidor(db).listen(puerto, () => {
    console.log(`Servidor escuchando en http://localhost:${puerto}`);
  });
}
