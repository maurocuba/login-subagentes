(function () {
  'use strict';

  var CLAVE_TOKEN = 'token';

  var saludo = document.getElementById('saludo');
  var correo = document.getElementById('correo');
  var botonCerrar = document.getElementById('cerrar');
  var cajaError = document.getElementById('error');

  function leerToken() {
    try {
      return sessionStorage.getItem(CLAVE_TOKEN);
    } catch (e) {
      return null;
    }
  }

  function borrarToken() {
    try {
      sessionStorage.removeItem(CLAVE_TOKEN);
    } catch (e) {
      // nada que hacer
    }
  }

  function irAlLogin() {
    borrarToken(); // imprescindible: index.html redirige aquí si hay token
    window.location.replace('/index.html');
  }

  var token = leerToken();
  if (!token) {
    irAlLogin();
    return;
  }

  var cabecera = { 'Authorization': 'Bearer ' + token };

  // Cargar datos del usuario
  fetch('/api/me', { method: 'GET', headers: cabecera })
    .then(function (respuesta) {
      if (respuesta.status === 401) {
        irAlLogin();
        return null;
      }
      if (respuesta.status !== 200) {
        throw new Error('estado ' + respuesta.status);
      }
      return respuesta.json();
    })
    .then(function (datos) {
      if (!datos) return; // ya se redirigió
      if (!datos.usuario) throw new Error('respuesta inesperada');
      saludo.textContent = 'Hola, ' + datos.usuario.nombre;
      correo.textContent = datos.usuario.email;
      botonCerrar.disabled = false;
    })
    .catch(function () {
      saludo.textContent = 'No se pudo cargar tu información';
      cajaError.textContent = 'No se pudo conectar con el servidor. Revisa tu conexión y recarga la página.';
      // Se permite cerrar sesión aunque falle la carga.
      botonCerrar.disabled = false;
    });

  // Cerrar sesión
  botonCerrar.addEventListener('click', function () {
    if (botonCerrar.disabled) return; // evita doble envío
    botonCerrar.disabled = true;
    botonCerrar.textContent = 'Cerrando…';

    fetch('/api/logout', { method: 'POST', headers: cabecera })
      .catch(function () {
        // Si falla la red igual se cierra la sesión localmente.
      })
      .then(function () {
        irAlLogin();
      });
  });
})();
