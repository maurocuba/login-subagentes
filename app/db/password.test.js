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

// Corregido tras el bloqueo del hook verificar_push: antes afirmaba que el hash era IGUAL
// al texto plano (a propósito, para verlo en rojo en Actions). Lo correcto es lo contrario.
test('el hash guardado NO es igual a la contraseña en texto plano', () => {
  const guardado = hashPassword('Demo123!');
  assert.notEqual(guardado, 'Demo123!');
  assert.ok(!guardado.includes('Demo123!'));
});
