/* Shared site navigation, accessible slide-out menu, account links, and appearance.
   This file runs on every page and provides the common interactions used there. */
(() => {
  // Read the shared API helper when a page needs signed-in account information.
  const api = window.SkillLinkAPI?.request;
  const root = document.documentElement;
  const themeKey = 'skilllink.theme';
  const themePreference = localStorage.getItem(themeKey) || 'system';
  const themeMedia = matchMedia('(prefers-color-scheme: dark)');
  const systemDark = themeMedia.matches;
  root.dataset.theme = themePreference === 'system' ? (systemDark ? 'dark' : 'light') : themePreference;
  root.dataset.themePreference = themePreference;
  root.dataset.contrast = localStorage.getItem('skilllink.contrast') || 'normal';
  root.dataset.reduceMotion = localStorage.getItem('skilllink.reduceMotion') || 'false';

  document.querySelectorAll('[data-year],#year').forEach(node => { node.textContent = new Date().getFullYear(); });
  const nav = document.querySelector('.site-header .nav');
  if (!nav) return;

  // Inject the same menu button and drawer into each shared page header.
  if (!document.querySelector('#menuTrigger')) {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = 'menuTrigger';
    trigger.className = 'menu-trigger';
    trigger.setAttribute('aria-label', 'Open navigation menu');
    trigger.setAttribute('aria-controls', 'siteDrawer');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span aria-hidden="true">&#9776;</span><span class="menu-trigger-label">Menu</span>';
    nav.insertBefore(trigger, nav.querySelector('.button') || null);

    const drawer = document.createElement('div');
    drawer.id = 'drawerLayer';
    drawer.className = 'drawer-layer';
    drawer.hidden = true;
    drawer.innerHTML = `<button class="drawer-backdrop" type="button" data-close-drawer aria-label="Close navigation menu"></button>
      <aside class="site-drawer" id="siteDrawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle" tabindex="-1">
        <div class="drawer-heading"><div><p class="eyebrow">SKILLLINK MENU</p><h2 id="drawerTitle">Where to?</h2></div><button class="icon-button" type="button" data-close-drawer aria-label="Close menu">&#215;</button></div>
        <nav class="drawer-links" aria-label="Main menu">
          <a href="index.html#home"><span aria-hidden="true">&#8962;</span>Home</a>
          <a href="index.html#providers"><span aria-hidden="true">&#9906;</span>Find a service</a>
          <a href="settings.html"><span aria-hidden="true">&#9881;</span>General settings</a>
          <a href="help.html"><span aria-hidden="true">&#63;</span>Help &amp; customer care</a>
          <a href="terms.html"><span aria-hidden="true">&#167;</span>Terms of service</a>
          <a href="about.html"><span aria-hidden="true">&#9432;</span>About SkillLink</a>
        </nav>
        <div class="drawer-account"><p class="eyebrow">YOUR ACCOUNT</p><a id="drawerAccountLink" href="login.html">Sign in or create an account</a><a id="drawerDashboardLink" class="hidden" href="customer-dashboard.html">My dashboard</a><a id="drawerSavedLink" class="hidden" href="saved.html">Saved providers</a><button id="drawerLogout" class="hidden" type="button" data-logout>Log out</button></div>
        <div class="drawer-support"><p class="eyebrow">CUSTOMER CARE</p><p>Call: <a href="tel:0768606059">0768606059</a> · <a href="tel:0116415958">0116415958</a></p><p>WhatsApp: <a href="https://wa.me/254768606059" target="_blank" rel="noopener noreferrer">0768606059</a> · <a href="https://wa.me/254116415958" target="_blank" rel="noopener noreferrer">0116415958</a></p><p>Email: <a href="mailto:-apollojunior97@gmail.com">-apollojunior97@gmail.com</a><br><a href="mailto:stem.drf@gmail.com">stem.drf@gmail.com</a></p><a href="help.html">Visit Help &amp; customer care</a></div>
      </aside>`;
    document.body.append(drawer);
  }

  if (!document.querySelector('#themeToggle')) {
    const theme = document.createElement('button');
    theme.type = 'button';
    theme.id = 'themeToggle';
    theme.className = 'theme-toggle';
    theme.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
    theme.innerHTML = `<span aria-hidden="true">${root.dataset.theme === 'dark' ? '&#9728;' : '&#9790;'}</span><span class="theme-toggle-label">${root.dataset.theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>`;
    nav.insertBefore(theme, nav.querySelector('.button') || null);
  }

  // Keep account actions together so the menu stays at the header's far-right edge.
  let actions = nav.querySelector('.nav-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'nav-actions';
    const callToAction = nav.querySelector(':scope > .button');
    [document.querySelector('#themeToggle'), callToAction, document.querySelector('#menuTrigger')]
      .filter(Boolean)
      .forEach(control => actions.append(control));
    nav.append(actions);
  }

  let previousFocus = null;
  // Open and close the accessible drawer while preserving keyboard focus.
  function openDrawer() {
    const layer = document.querySelector('#drawerLayer');
    previousFocus = document.activeElement;
    layer.hidden = false;
    document.querySelector('#menuTrigger').setAttribute('aria-expanded', 'true');
    document.querySelector('.site-drawer [data-close-drawer]').focus();
    document.body.classList.add('drawer-open');
  }
  function closeDrawer() {
    const layer = document.querySelector('#drawerLayer');
    if (!layer || layer.hidden) return;
    layer.hidden = true;
    document.querySelector('#menuTrigger').setAttribute('aria-expanded', 'false');
    document.body.classList.remove('drawer-open');
    previousFocus?.focus();
  }
  // Save a light, dark, or system preference and update the page immediately.
  function setTheme(preference) {
    localStorage.setItem(themeKey, preference);
    root.dataset.themePreference = preference;
    root.dataset.theme = preference === 'system' ? (themeMedia.matches ? 'dark' : 'light') : preference;
    const button = document.querySelector('#themeToggle');
    if (button) {
      const dark = root.dataset.theme === 'dark';
      button.innerHTML = `<span aria-hidden="true">${dark ? '&#9728;' : '&#9790;'}</span><span class="theme-toggle-label">${dark ? 'Light mode' : 'Dark mode'}</span>`;
      button.setAttribute('aria-pressed', String(dark));
    }
    window.dispatchEvent(new CustomEvent('skilllink:themechange', { detail: { preference } }));
  }

  themeMedia.addEventListener?.('change', event => {
    if ((localStorage.getItem(themeKey) || 'system') !== 'system') return;
    root.dataset.theme = event.matches ? 'dark' : 'light';
    const button = document.querySelector('#themeToggle');
    if (button) {
      button.innerHTML = `<span aria-hidden="true">${event.matches ? '&#9728;' : '&#9790;'}</span><span class="theme-toggle-label">${event.matches ? 'Light mode' : 'Dark mode'}</span>`;
      button.setAttribute('aria-pressed', String(event.matches));
    }
  });

  // Use delegated events because the menu controls are injected dynamically.
  document.addEventListener('click', async event => {
    if (event.target.closest('#menuTrigger')) openDrawer();
    if (event.target.closest('[data-close-drawer]')) closeDrawer();
    const themeSettings = event.target.closest('[data-set-theme]');
    if (themeSettings) setTheme(themeSettings.dataset.setTheme);
    if (event.target.closest('#themeToggle')) setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    if (event.target.closest('[data-logout]') && api) {
      try { await api('/api/auth/logout', { method: 'POST' }); location.href = 'index.html'; }
      catch (error) { alert(error.message); }
    }
  });
  document.addEventListener('keydown', event => {
    const layer = document.querySelector('#drawerLayer');
    if (event.key === 'Escape' && layer && !layer.hidden) closeDrawer();
    if (event.key === 'Tab' && layer && !layer.hidden) {
      const focusable = [...layer.querySelectorAll('a[href],button:not([disabled])')].filter(node => !node.classList.contains('hidden'));
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
    }
  });

  // Resolve account-specific destinations only from the signed server session.
  if (api) api('/api/auth/me').then(result => {
    const user = result.user;
    if (!user) return;
    const account = document.querySelector('#drawerAccountLink');
    account.href = 'account.html';
    account.textContent = `${user.name} · Account settings`;
    const dashboard = document.querySelector('#drawerDashboardLink');
    dashboard.href = user.role === 'provider' ? 'provider-dashboard.html' : 'customer-dashboard.html';
    dashboard.textContent = user.role === 'provider' ? 'Provider dashboard' : 'Customer dashboard';
    dashboard.classList.remove('hidden');
    document.querySelector('#drawerLogout').classList.remove('hidden');
    if (user.role === 'customer') document.querySelector('#drawerSavedLink').classList.remove('hidden');
    const cta = nav.querySelector('.button');
    if (cta) {
      cta.href = dashboard.href;
      cta.textContent = user.role === 'provider' ? 'Provider dashboard' : 'My account';
    }
  }).catch(() => {});
})();
