/* SEYVEO · living vapour beneath the pearl glass.
   Low-frequency, periodic turbulence flows around the sculpted ribbon ring.
   The full-resolution alpha artwork masks every smoke pixel, keeping the
   aperture, side windows and crisp clear-glass rims untouched. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('sayvi-ribbon') === '0' || params.get('sayvi-smoke') === '0') return;

  const orb = document.getElementById('orb');
  const hero = document.getElementById('plasmaVisual');
  if (!orb || !hero || !document.documentElement.classList.contains('sv-living-ribbon')) return;
  if (orb.querySelector('.sv-ribbon-inner-smoke')) return;

  const smoke = document.createElement('canvas');
  smoke.className = 'sv-ribbon-inner-smoke';
  smoke.setAttribute('aria-hidden', 'true');
  smoke.width = 192;
  smoke.height = 192;
  const ctx = smoke.getContext('2d', {alpha: true});
  if (!ctx) return;
  hero.insertAdjacentElement('afterend', smoke);

  const source = hero.getAttribute('src') || 'assets/seyveo-living-ribbon-v5.webp?v=1';
  const styles = document.createElement('style');
  styles.id = 'sv-ribbon-inner-smoke-styles';
  styles.textContent = `
    html.sv-living-ribbon #orb > .sv-ribbon-inner-smoke {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      padding: 0;
      margin: 0;
      display: block;
      background: transparent;
      pointer-events: none;
      transform-origin: 50% 50%;
      image-rendering: auto;
      opacity: .56;
      mix-blend-mode: multiply;
      filter: blur(1.9px);
      -webkit-mask: url("${source}") center / contain no-repeat;
      mask: url("${source}") center / contain no-repeat;
      animation: sv-ribbon-floating-tilt 15.2s ease-in-out infinite;
    }
    html.sv-living-ribbon[data-theme="light"] #orb > .sv-ribbon-inner-smoke {
      opacity: .39;
    }
    html.sv-living-ribbon #orb.seyveo-presence-listening > .sv-ribbon-inner-smoke {
      opacity: .64;
    }
    html.sv-living-ribbon #orb.seyveo-presence-speaking > .sv-ribbon-inner-smoke {
      opacity: .73;
    }
    @media (prefers-reduced-motion: reduce) {
      html.sv-living-ribbon #orb > .sv-ribbon-inner-smoke {
        animation: none !important;
        filter: blur(2px);
        opacity: .23;
      }
    }
  `;
  document.head.appendChild(styles);

  // Wrapping angular noise eliminates a seam at the left side of the ring.
  const hash = (x, y) => {
    let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const smooth = v => v * v * (3 - 2 * v);
  const noise = (u, v, period) => {
    const ix = Math.floor(u), iy = Math.floor(v);
    const fx = smooth(u - ix), fy = smooth(v - iy);
    const x0 = ((ix % period) + period) % period;
    const x1 = (x0 + 1) % period;
    const a = hash(x0, iy) * (1 - fx) + hash(x1, iy) * fx;
    const b = hash(x0, iy + 1) * (1 - fx) + hash(x1, iy + 1) * fx;
    return a * (1 - fy) + b * fy;
  };

  const {width, height} = smoke;
  const image = ctx.createImageData(width, height);
  const pixels = image.data;
  const cells = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x + .5) / width * 2 - 1;
      const dy = (y + .5) / height * 2 - 1;
      const radius = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI);
      const start = smooth(Math.min(1, Math.max(0, (radius - .17) / .16)));
      const end = 1 - smooth(Math.min(1, Math.max(0, (radius - .71) / .20)));
      cells.push(angle, radius, start * end);
    }
  }

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  let lastFrame = -Infinity;
  let running = false;
  const interval = 1000 / 16; // Gentle smoke, inexpensive on iPhone XR.
  const render = (milliseconds) => {
    const seconds = milliseconds / 1000;
    for (let k = 0, c = 0; k < pixels.length; k += 4, c += 3) {
      const angle = cells[c], radius = cells[c + 1], ring = cells[c + 2];
      if (ring < .005) {pixels[k + 3] = 0; continue;}

      // Oppositely drifting vapour layers travel along the ribbon curvature.
      const radial = radius * 7.6;
      const wave = Math.sin(angle * Math.PI * 6 + seconds * .11) * .25;
      const broad = noise(angle * 8 + seconds * .095, radial + wave, 8);
      const fine = noise(angle * 16 - seconds * .14, radial * 2.0 - wave, 16);
      const density = Math.max(0, (broad * .67 + fine * .33 - .39) * 2.8);
      const alpha = Math.min(255, Math.round(density * ring * 146));
      // The dark teal current is inside the glass, never a dark line on top.
      pixels[k] = 41;
      pixels[k + 1] = 83;
      pixels[k + 2] = 83;
      pixels[k + 3] = alpha;
    }
    ctx.putImageData(image, 0, 0);
  };

  const frame = now => {
    if (!running) return;
    if (!document.hidden && visible && now - lastFrame >= interval) {
      render(now);
      lastFrame = now;
    }
    requestAnimationFrame(frame);
  };
  const start = () => {
    if (running || reduceMotion.matches) return;
    running = true;
    requestAnimationFrame(frame);
  };
  const stop = () => {running = false;};
  const handleMotion = () => {
    if (reduceMotion.matches) {stop(); render(0);}
    else start();
  };
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', handleMotion);
  else if (reduceMotion.addListener) reduceMotion.addListener(handleMotion);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
    }, {threshold: .01}).observe(orb);
  }
  handleMotion();
})();
