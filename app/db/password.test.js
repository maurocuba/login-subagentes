const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verificarPassword } = require('./password.js');

test('hashPassword genera formato "salt:hash" en hexadecimal', () => {
  const guardado = hashPassword('Demo123!');
  assert.match(guardado, /^[0-9a-f]+:[0-9a-f]+$/);
});

test('verificarPassword acepta la contraseña correcta', () => {
  const guardado = hashPassword('Demo123!');
  assert.equal(verificarPassword('Demo123!', guardado), true);
});

test('verificarPassword rechaza una contraseña incorrecta', () => {
  const guardado = hashPassword('Demo123!');
  assert.equal(verificarPassword('otra', guardado), false);
});

test('la misma contraseña produce hashes distintos (salt aleatorio)', () => {
  assert.notEqual(hashPassword('Demo123!'), hashPassword('Demo123!'));
});

// FALLA A PROPÓSITO: para ver una prueba en rojo en la pestaña Actions.
// Un hash scrypt nunca es igual a la contraseña en texto plano, pero aquí se afirma lo contrario.
test('[FALLO INTENCIONAL] el hash guardado es igual a la contraseña en texto plano', () => {
  assert.equal(hashPassword('Demo123!'), 'Demo123!');
});
