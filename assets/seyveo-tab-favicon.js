/* Browser-tab identity only. Installed PWA touch icons are independent. */
(() => {
  const links = Array.from(document.querySelectorAll('link[data-seyveo-favicon]'));
  if (!links.length || typeof window.matchMedia !== 'function') return;

  const theme = window.matchMedia('(prefers-color-scheme: dark)');
  const update = () => {
    for (const link of links) {
      const target = theme.matches ? link.dataset.iconDark : link.dataset.iconLight;
      if (target && link.getAttribute('href') !== target) link.setAttribute('href', target);
    }
  };

  update();
  if (typeof theme.addEventListener === 'function') theme.addEventListener('change', update);
  else if (typeof theme.addListener === 'function') theme.addListener(update);
})();
