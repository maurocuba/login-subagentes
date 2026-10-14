// Servidor del frontend, separado del backend (para mostrar los dos procesos en la demo).
// Sirve app/frontend/ y reenvía /api/* al backend (API_URL), así el navegador no necesita CORS.
// Uso: npm run frontend   (desde app/)
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PUERTO = Number(process.env.FRONT_PORT) || 5173;
const API_URL = new URL(process.env.API_URL || 'http://localhost:3001');
const DIR_FRONTEND = path.resolve(__dirname, '..', 'frontend');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.ico': 'image/x-icon',
};

function reenviarAlBackend(req, res) {
  const proxy = http.request(
    { hostname: API_URL.hostname, port: API_URL.port, path: req.url, method: req.method, headers: req.headers },
    (respuesta) => {
      res.writeHead(respuesta.statusCode, respuesta.headers);
      respuesta.pipe(res);
    }
  );
  proxy.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'El backend no está encendido (npm run backend)' }));
  });
  req.pipe(proxy);
}

function servirArchivo(req, res) {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const archivo = path.resolve(DIR_FRONTEND, '.' + (ruta === '/' ? '/index.html' : ruta));
  if (!archivo.startsWith(DIR_FRONTEND + path.sep)) {
    res.writeHead(403);
    return res.end('Prohibido');
  }
  fs.readFile(archivo, (err, contenido) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('No encontrado');
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream' });
    res.end(contenido);
  });
}

http
  .createServer((req, res) => {
    const hora = new Date().toLocaleTimeString();
    console.log(`[${hora}] ${req.method} ${req.url}`);
    if (req.url.startsWith('/api/')) return reenviarAlBackend(req, res);
    servirArchivo(req, res);
  })
  .listen(PUERTO, () => {
    console.log(`Frontend en http://localhost:${PUERTO}  (API → ${API_URL.origin})`);
  });
