const crypto = require('node:crypto');

// Formato guardado: "<salt hex>:<hash hex>" (scrypt, 64 bytes de salida).
const LONGITUD_HASH = 64;
const LONGITUD_SALT = 16;

function hashPassword(plano) {
  const salt = crypto.randomBytes(LONGITUD_SALT);
  const hash = crypto.scryptSync(String(plano), salt, LONGITUD_HASH);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verificarPassword(plano, guardado) {
  if (typeof guardado !== 'string') return false;

  const partes = guardado.split(':');
  if (partes.length !== 2) return false;

  const salt = Buffer.from(partes[0], 'hex');
  const esperado = Buffer.from(partes[1], 'hex');
  if (salt.length === 0 || esperado.length === 0) return false;

  const calculado = crypto.scryptSync(String(plano), salt, esperado.length);
  return crypto.timingSafeEqual(calculado, esperado);
}

module.exports = { hashPassword, verificarPassword };
