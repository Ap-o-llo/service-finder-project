/* Accessibility and appearance preferences live in this browser only. */
(() => {
  const $ = selector => document.querySelector(selector);
  const highContrast = $('#highContrast');
  const reduceMotion = $('#reduceMotion');
  const updateThemeChoices = () => {
    const preference = localStorage.getItem('skilllink.theme') || 'system';
    document.querySelectorAll('[data-set-theme]').forEach(button => {
      const selected = button.dataset.setTheme === preference;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  };
  // Persist an accessibility toggle locally and apply it to the page.
  function saveBoolean(key, checked, apply) {
    localStorage.setItem(key, String(checked));
    apply(checked);
  }
  highContrast.checked = localStorage.getItem('skilllink.contrast') === 'high';
  reduceMotion.checked = localStorage.getItem('skilllink.reduceMotion') === 'true';
  document.documentElement.dataset.contrast = highContrast.checked ? 'high' : 'normal';
  document.documentElement.dataset.reduceMotion = String(reduceMotion.checked);
  updateThemeChoices();

  highContrast.addEventListener('change', () => saveBoolean('skilllink.contrast', highContrast.checked, enabled => {
    document.documentElement.dataset.contrast = enabled ? 'high' : 'normal';
  }));
  reduceMotion.addEventListener('change', () => saveBoolean('skilllink.reduceMotion', reduceMotion.checked, enabled => {
    document.documentElement.dataset.reduceMotion = String(enabled);
  }));
  document.addEventListener('click', event => {
    if (event.target.closest('[data-set-theme]')) setTimeout(updateThemeChoices, 0);
    if (event.target.closest('#resetSettings')) {
      ['skilllink.theme', 'skilllink.contrast', 'skilllink.reduceMotion'].forEach(key => localStorage.removeItem(key));
      highContrast.checked = false;
      reduceMotion.checked = false;
      document.documentElement.dataset.contrast = 'normal';
      document.documentElement.dataset.reduceMotion = 'false';
      document.documentElement.dataset.themePreference = 'system';
      const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
      const toggle = $('#themeToggle');
      if (toggle) {
        toggle.innerHTML = `<span aria-hidden="true">${isDark ? '&#9728;' : '&#9790;'}</span><span class="theme-toggle-label">${isDark ? 'Light mode' : 'Dark mode'}</span>`;
        toggle.setAttribute('aria-pressed', String(isDark));
      }
      $('#settingsMessage').textContent = 'Preferences reset.';
      $('#settingsMessage').classList.remove('hidden');
      updateThemeChoices();
    }
  });
})();
