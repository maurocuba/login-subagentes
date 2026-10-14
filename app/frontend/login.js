(function () {
  'use strict';

  var CLAVE_TOKEN = 'token';

  // Si ya hay un token guardado, ir directo a la bienvenida.
  // (bienvenida.js borra el token si el servidor responde 401, así no hay bucle.)
  try {
    if (sessionStorage.getItem(CLAVE_TOKEN)) {
      window.location.replace('/bienvenida.html');
      return;
    }
  } catch (e) {
    // sessionStorage no disponible: se sigue mostrando el formulario.
  }

  var form = document.getElementById('form-login');
  var inputEmail = document.getElementById('email');
  var inputPassword = document.getElementById('password');
  var boton = document.getElementById('boton');
  var cajaError = document.getElementById('error');

  function mostrarError(mensaje) {
    cajaError.textContent = mensaje; // textContent: nunca innerHTML
  }

  function limpiarError() {
    cajaError.textContent = '';
  }

  function setEnviando(enviando) {
    boton.disabled = enviando;
    boton.textContent = enviando ? 'Entrando…' : 'Entrar';
    form.setAttribute('aria-busy', enviando ? 'true' : 'false');
  }

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (boton.disabled) return; // evita doble envío

    var email = inputEmail.value.trim();
    var password = inputPassword.value;

    limpiarError();

    if (!email || !password) {
      mostrarError('Ingresa tu correo y tu contraseña.');
      (email ? inputPassword : inputEmail).focus();
      return;
    }

    setEnviando(true);

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    })
      .then(function (respuesta) {
        return respuesta
          .json()
          .catch(function () { return {}; })
          .then(function (datos) {
            return { estado: respuesta.status, datos: datos };
          });
      })
      .then(function (r) {
        if (r.estado === 200 && r.datos && r.datos.token) {
          try {
            sessionStorage.setItem(CLAVE_TOKEN, r.datos.token);
          } catch (e) {
            mostrarError('Tu navegador no permite guardar la sesión. Revisa la configuración e inténtalo de nuevo.');
            setEnviando(false);
            return;
          }
          window.location.replace('/bienvenida.html');
          return;
        }

        if (r.estado === 400) {
          mostrarError((r.datos && r.datos.error) || 'Faltan datos. Revisa el formulario.');
        } else if (r.estado === 401) {
          mostrarError((r.datos && r.datos.error) || 'Credenciales inválidas');
          inputPassword.value = '';
          inputPassword.focus();
        } else {
          mostrarError('Ocurrió un problema en el servidor. Inténtalo de nuevo en unos minutos.');
        }
        setEnviando(false);
      })
      .catch(function () {
        mostrarError('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
        setEnviando(false);
      });
  });
})();
