// source/js/app.js

(function () {
  const {
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_KEY
  } = window.APP_CONFIG || {};

  // ========= STORAGE =========

  function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || null;
  }

  function getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || null;
  }

  function getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveSessionFromAuthResponse(data) {
    if (!data) return;
    if (data.access_token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    }
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
  }

  function clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isLoggedIn() {
    return !!getAccessToken() && !!getCurrentUser();
  }

  // ========= API WRAPPER =========

  async function apiFetch(path, options = {}) {
    const url = buildApiUrl(path);

    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');

    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(body);
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body
    });

    if (response.status === 401) {
      // Sesión inválida, lo echamos elegantemente
      clearSession();
      if (!window.location.pathname.endsWith('sesion.html')) {
        window.location.href = 'sesion.html';
      }
      throw new Error('No autorizado');
    }

    if (response.status === 204) {
      return null;
    }

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const msg = (data && (data.error || data.message)) ||
        `Error HTTP ${response.status}`;
      throw new Error(msg);
    }

    return data;
  }

  // ========= HEADER / UI AUTH =========

  function getFileName() {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1].toLowerCase();
  }

  function setupHeaderAuthUI() {
    const header = document.querySelector('.barra-arriba, .barraArriba, .site-header');
    if (!header) return;

    const container = header.querySelector('.container');
    if (!container) return;

    const user = getCurrentUser();
    const logged = !!user;

    // Login / registro en inicio
    const loginLink = document.querySelector('a[href="sesion.html"]');
    const registerLink = document.querySelector('a[href="registro.html"]');

    if (loginLink) loginLink.style.display = logged ? 'none' : '';
    if (registerLink) registerLink.style.display = logged ? 'none' : '';

    // Span con info usuario
    let userSpan = container.querySelector('#headerUserSummary');
    if (!userSpan) {
      userSpan = document.createElement('span');
      userSpan.id = 'headerUserSummary';
      userSpan.className = 'text-white ms-3';
      container.appendChild(userSpan);
    }

    if (!logged) {
      userSpan.textContent = '';
      userSpan.style.display = 'none';
    } else {
      userSpan.style.display = 'inline-block';
      userSpan.innerHTML = `
        Hola, <a href="perfil.html" class="text-decoration-underline text-white">
          ${user.username || 'usuario'}
        </a>
      `;
    }

    // Link "Cerrar sesión" dinámico
    let logoutLink = container.querySelector('[data-role="logout-link"]');
    if (!logoutLink) {
      logoutLink = document.createElement('a');
      logoutLink.href = '#';
      logoutLink.dataset.role = 'logout-link';
      logoutLink.className = 'botones-barra ms-3';
      logoutLink.textContent = 'Cerrar sesión';
      container.appendChild(logoutLink);
    }

    if (!logged) {
      logoutLink.style.display = 'none';
    } else {
      logoutLink.style.display = 'inline-block';
    }

    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      clearSession();
      window.location.href = 'index.html';
    });
  }

  // ========= ROUTE GUARDS =========

  function applyRouteGuards() {
    const file = getFileName();

    const protectedPages = [
      'perfil.html',
      'billetera.html',
      'ruleta.html'
    ];

    if (protectedPages.includes(file) && !isLoggedIn()) {
      window.location.href = 'sesion.html';
      return;
    }

    const authPages = [
      'sesion.html',
      'registro.html'
    ];

    if (authPages.includes(file) && isLoggedIn()) {
      window.location.href = 'index.html';
    }
  }

  // ========= SALDO DESDE API (OPCIONAL) =========

  async function fetchBilleteraForCurrentUser() {
    const user = getCurrentUser();
    if (!user) return null;

    // Estrategia: GET /billetera/ y filtramos por usuario.id
    const list = await apiFetch('/billetera/');
    if (!Array.isArray(list)) return null;
    const w = list.find(item => item.usuario && item.usuario.id === user.id);
    return w || null;
  }

  // exponemos helpers globales que usaremos en otros scripts
  window.apiFetch = apiFetch;
  window.getCurrentUser = getCurrentUser;
  window.saveSessionFromAuthResponse = saveSessionFromAuthResponse;
  window.clearSession = clearSession;
  window.isLoggedIn = isLoggedIn;
  window.fetchBilleteraForCurrentUser = fetchBilleteraForCurrentUser;

  document.addEventListener('DOMContentLoaded', function () {
    applyRouteGuards();
    setupHeaderAuthUI();
  });
})();
