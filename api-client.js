/* API helper for both local Flask pages and the separate GitHub Pages / tunnel setup. */
(() => {
  // The HTTPS tunnel address is configured in api-config.js and changes when a Quick Tunnel restarts.
  const apiBase = String(window.SKILLLINK_API_BASE || '').trim().replace(/\/+$/, '');
  const apiUrl = path => apiBase ? `${apiBase}${path.startsWith('/') ? path : `/${path}`}` : path;

  // Attach cookies on cross-origin tunnel requests and fetch a CSRF token before every write.
  async function api(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers || {});
    if (apiBase) {
      try {
        if (new URL(apiBase).protocol !== 'https:') throw new Error();
      } catch {
        throw new Error('The SkillLink API address must be a valid HTTPS Cloudflare Tunnel URL.');
      }
    }
    if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type','application/json');
    if (!['GET','HEAD','OPTIONS'].includes(method)) {
      const csrfResponse = await fetch(apiUrl('/api/csrf'),{credentials:'include',cache:'no-store'});
      const csrfBody = await csrfResponse.json();
      headers.set('X-CSRFToken',csrfBody.csrfToken);
    }
    let response;
    try {
      response = await fetch(apiUrl(path),{...options,method,headers,credentials:'include',cache:'no-store'});
    } catch (cause) {
      const problem = new Error('SkillLink could not reach the backend. Check that Flask and the Cloudflare Tunnel are running and that api-config.js has the current tunnel URL.');
      problem.cause = cause;
      throw problem;
    }
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || `Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }
  window.SkillLinkAPI = { request: api };
})();
