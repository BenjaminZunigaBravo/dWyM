
window.APP_CONFIG = {
  API_BASE_URL: 'https://udp.coningenio.cl/2025-2/chronicGamblers/api/v1',
  ACCESS_TOKEN_KEY: 'casino_cg_access_token',
  REFRESH_TOKEN_KEY: 'casino_cg_refresh_token',
  USER_KEY: 'casino_cg_current_user'
};

function buildApiUrl(path) {
  const base = window.APP_CONFIG.API_BASE_URL.replace(/\/+$/, '');
  const p = String(path || '').replace(/^\/+/, '');
  return `${base}/${p}`;
}

window.buildApiUrl = buildApiUrl;
