const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { abrirDb, crearTablas, crearUsuario } = require('../db/db.js');
const { crearServidor } = require('./server.js');

const EMAIL = 'demo@upb.edu';
const PASSWORD = 'Demo123!';

let db;
let servidor;
let base;

before(async () => {
  db = abrirDb(':memory:');
  crearTablas(db);
  crearUsuario(db, { email: EMAIL, nombre: 'Usuario Demo', password: PASSWORD });
  servidor = crearServidor(db);
  await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  servidor.closeAllConnections?.();
  await new Promise((resolve) => servidor.close(resolve));
  db.close();
});

function login(cuerpo) {
  return fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  });
}

async function obtenerToken() {
  const res = await login({ email: EMAIL, password: PASSWORD });
  return (await res.json()).token;
}

test('login correcto devuelve token y usuario sin password_hash', async () => {
  const res = await login({ email: EMAIL, password: PASSWORD });
  assert.equal(res.status, 200);
  const cuerpo = await res.json();
  assert.equal(typeof cuerpo.token, 'string');
  assert.ok(cuerpo.token.length > 0);
  assert.deepEqual(Object.keys(cuerpo.usuario).sort(), ['email', 'id', 'nombre']);
  assert.equal(cuerpo.usuario.email, EMAIL);
  assert.equal(cuerpo.usuario.nombre, 'Usuario Demo');
  assert.ok(!JSON.stringify(cuerpo).includes('password'));
});

test('login con contraseña incorrecta -> 401', async () => {
  const res = await login({ email: EMAIL, password: 'mala' });
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: 'Credenciales inválidas' });
});

test('login con email inexistente -> 401 con el mismo mensaje', async () => {
  const res = await login({ email: 'nadie@upb.edu', password: PASSWORD });
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: 'Credenciales inválidas' });
});

test('login con campos vacíos o ausentes -> 400', async () => {
  for (const cuerpo of [
    { email: '', password: '' },
    { email: EMAIL, password: '' },
    { email: '', password: PASSWORD },
    { email: EMAIL },
    {},
    { email: 123, password: PASSWORD },
  ]) {
    const res = await login(cuerpo);
    assert.equal(res.status, 400, JSON.stringify(cuerpo));
    const json = await res.json();
    assert.equal(typeof json.error, 'string');
  }
});

test('login con JSON inválido -> 400', async () => {
  for (const cuerpo of ['{no es json', '', 'null', '[]']) {
    const res = await login(cuerpo);
    assert.equal(res.status, 400, `body: ${cuerpo}`);
    assert.equal(typeof (await res.json()).error, 'string');
  }
});

test('/api/me con token válido devuelve el usuario', async () => {
  const token = await obtenerToken();
  const res = await fetch(`${base}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  const cuerpo = await res.json();
  assert.deepEqual(Object.keys(cuerpo.usuario).sort(), ['email', 'id', 'nombre']);
  assert.equal(cuerpo.usuario.email, EMAIL);
  assert.ok(!JSON.stringify(cuerpo).includes('password'));
});

test('/api/me sin token -> 401', async () => {
  const res = await fetch(`${base}/api/me`);
  assert.equal(res.status, 401);
  assert.equal(typeof (await res.json()).error, 'string');
});

test('/api/me con token falso -> 401', async () => {
  const res = await fetch(`${base}/api/me`, { headers: { Authorization: 'Bearer falso123' } });
  assert.equal(res.status, 401);
});

test('logout invalida el token', async () => {
  const token = await obtenerToken();
  const cabeceras = { Authorization: `Bearer ${token}` };

  const antes = await fetch(`${base}/api/me`, { headers: cabeceras });
  assert.equal(antes.status, 200);

  const salida = await fetch(`${base}/api/logout`, { method: 'POST', headers: cabeceras });
  assert.equal(salida.status, 204);

  const despues = await fetch(`${base}/api/me`, { headers: cabeceras });
  assert.equal(despues.status, 401);
});

test('estáticos: path traversal bloqueado y archivo inexistente -> 404', async () => {
  const inexistente = await fetch(`${base}/no-existe.html`);
  assert.equal(inexistente.status, 404);

  const traversal = await fetch(`${base}/%2e%2e/db/db.js`);
  assert.ok([400, 403, 404].includes(traversal.status));
  assert.ok(!(await traversal.text()).includes('DatabaseSync'));
});
