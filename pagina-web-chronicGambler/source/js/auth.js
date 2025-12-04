// source/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
  setupLoginForm();
  setupRegisterForm();
  setupForgotForm();
});

// ========== LOGIN ==========

function setupLoginForm() {
  const form = document.getElementById('formLogin');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('usuario');
    const passwordInput = document.getElementById('password');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      alert('Debes ingresar usuario y contraseña.');
      return;
    }

    try {
      const data = await fetchLogin(username, password);
      window.saveSessionFromAuthResponse(data);
      // después de login, al perfil
      window.location.href = 'perfil.html';
    } catch (err) {
      console.error(err);
      alert('No se pudo iniciar sesión: ' + err.message);
    }
  });
}

async function fetchLogin(username, password) {
  // Si tu backend exige hash (ej: MD5), acá es donde tendrías que aplicarlo
  const body = { username, password };

  return await window.apiFetch('/auth/login/', {
    method: 'POST',
    body
  });
}

// ========== REGISTRO ==========
// source/js/auth.js (Solo la parte de registro)
function setupRegisterForm() {
  const form = document.getElementById('formRegistro');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Capturamos los campos (SIN RUT)
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    // const rutInput = document.getElementById('rut');  <-- ADIOS
    const fechaInput = document.getElementById('fecha-nacimiento');
    const usuarioInput = document.getElementById('Usuario');
    const emailInput = document.getElementById('email-reg');
    const passInput = document.getElementById('password-reg');
    const passConfirmInput = document.getElementById('confirm-password');

    const nombre = nombreInput.value.trim();
    const apellido = apellidoInput.value.trim();
    const fecha_nacimiento = fechaInput.value;
    const username = usuarioInput.value.trim();
    const correo = emailInput.value.trim();
    const password = passInput.value;
    const passConfirm = passConfirmInput.value;

    if (!username || !password || !nombre || !apellido || !correo) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (password !== passConfirm) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    try {
      // 2. Payload limpio
      const payload = {
        username,
        password,
        nombre,
        apellido,
        // rut, <-- ADIOS
        correo,
        fecha_nacimiento
      };

      await window.apiFetch('/auth/register/', {
        method: 'POST',
        body: payload
      });

      alert('¡Registro exitoso! Ahora inicia sesión.');
      window.location.href = 'Sesion.html';
      
    } catch (err) {
      console.error(err);
      alert('Error en el registro: ' + err.message);
    }
  });
}

// ========== RECUPERAR CONTRASEÑA (FAKE) ==========

function setupForgotForm() {
  const form = document.getElementById('formRecuperar');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email-forgot').value.trim();
    if (!email) {
      alert('Ingresa tu correo.');
      return;
    }
    // Acá iría el endpoint real si existiera
    alert('Si el correo existe, recibirás instrucciones para recuperar tu contraseña.');
  });
}
