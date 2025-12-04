// source/js/profile.js

document.addEventListener('DOMContentLoaded', () => {
  const file = window.location.pathname.split('/').pop().toLowerCase();
  if (file !== 'perfil.html') return;

  renderProfileFromSession();
});

function renderProfileFromSession() {
  const user = window.getCurrentUser();
  if (!user) {
      // Si no hay usuario, redirigir al login
      window.location.href = 'sesion.html';
      return;
  }

  console.log("Datos del usuario cargados:", user); // Para que veas en la consola (F12) qué datos llegan

  // 1. Nombre de usuario en el encabezado
  const nombreSpan = document.getElementById('perfilNombreUsuario');
  if (nombreSpan) {
    // Intenta mostrar Nombre + Apellido, si no hay, muestra el Username
    if (user.nombre && user.apellido) {
        nombreSpan.textContent = `${user.nombre} ${user.apellido}`;
    } else {
        nombreSpan.textContent = user.username || 'Usuario';
    }
  }

  // 2. Rellenar los inputs del formulario
  // Usamos una función auxiliar para no repetir código
  const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
  };

  // Mapeo exacto con tu Base de Datos (Foto 2) y Login PHP
  setVal('perfil-username', user.username); // O user.rut si prefieres mostrar el RUT aquí
  
  // Aquí corregimos: user.nombre (singular) en vez de user.nombres
  setVal('perfil-nombre', user.nombre); 
  
  // Aquí corregimos: user.apellido (singular) en vez de user.apellidos
  setVal('perfil-apellido', user.apellido); 
  
  setVal('perfil-fecha', user.fecha_nacimiento);
  
  // Aquí corregimos: user.correo en vez de user.email (según tu BD)
  // Pero por si acaso el PHP manda 'email', probamos ambos.
  setVal('perfil-correo', user.correo || user.email); 
  
  // Contraseña ficticia visual
  setVal('perfil-contrasena', '********');
}