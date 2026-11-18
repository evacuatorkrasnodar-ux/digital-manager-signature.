/* SEYVEO · living vapour beneath the pearl glass.
   Low-frequency, periodic turbulence flows around the sculpted ribbon ring.
   The full-resolution alpha artwork masks every smoke pixel, keeping the
   aperture, side windows and crisp clear-glass rims untouched. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('sayvi-ribbon') === '0' ||
      params.get('sayvi-smoke') === '0' ||
      params.get('sayvi-engine') === 'canvas') return;

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
  // A slow CSS-only current remains visible even on browsers that throttle
  // canvas paints. Its clear gaps also make the moving vapour easy to read.
  const veil = document.createElement('span');
  veil.className = 'sv-ribbon-traveling-veil';
  veil.setAttribute('aria-hidden', 'true');
  hero.insertAdjacentElement('afterend', veil);
  veil.insertAdjacentElement('afterend', smoke);

  const source = hero.getAttribute('src') || 'assets/seyveo-living-ribbon-v5.webp?v=1';
  const styles = document.createElement('style');
  styles.id = 'sv-ribbon-inner-smoke-styles';
  styles.textContent = `
    html.sv-living-ribbon #orb > .sv-ribbon-traveling-veil {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: block;
      overflow: hidden;
      pointer-events: none;
      transform-origin: 50% 50%;
      opacity: .76;
      mix-blend-mode: multiply;
      -webkit-mask: url("${source}") center / contain no-repeat;
      mask: url("${source}") center / contain no-repeat;
      animation: sv-ribbon-floating-tilt 15.2s ease-in-out infinite;
    }
    html.sv-living-ribbon #orb > .sv-ribbon-traveling-veil::before,
    html.sv-living-ribbon #orb > .sv-ribbon-traveling-veil::after {
      content: "";
      position: absolute;
      inset: -17%;
      border-radius: 50%;
      pointer-events: none;
      transform-origin: 50% 50%;
      filter: blur(13px);
      background: conic-gradient(from 8deg at 50% 50%,
        transparent 0deg 16deg,
        rgba(33,79,80,.04) 28deg,
        rgba(21,59,62,.46) 57deg,
        rgba(45,96,96,.10) 91deg,
        transparent 118deg 185deg,
        rgba(22,63,67,.06) 199deg,
        rgba(22,63,67,.37) 228deg,
        rgba(34,83,85,.06) 264deg,
        transparent 286deg 360deg);
      animation: sv-ribbon-vapour-circulate 43s linear infinite;
    }
    html.sv-living-ribbon #orb > .sv-ribbon-traveling-veil::after {
      opacity: .58;
      background: conic-gradient(from 182deg at 50% 50%,
        transparent 0deg 53deg,
        rgba(27,67,69,.08) 70deg,
        rgba(21,58,62,.34) 103deg,
        rgba(40,85,86,.06) 139deg,
        transparent 159deg 300deg,
        rgba(28,73,74,.19) 324deg,
        transparent 350deg 360deg);
      animation: sv-ribbon-vapour-counter 61s linear infinite;
    }
    html.sv-living-ribbon[data-theme="light"] #orb > .sv-ribbon-traveling-veil {
      opacity: .62;
    }
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
      opacity: .62;
      mix-blend-mode: multiply;
      filter: blur(1.9px);
      -webkit-mask: url("${source}") center / contain no-repeat;
      mask: url("${source}") center / contain no-repeat;
      animation: sv-ribbon-floating-tilt 15.2s ease-in-out infinite;
    }
    html.sv-living-ribbon[data-theme="light"] #orb > .sv-ribbon-inner-smoke {
      opacity: .49;
    }
    html.sv-living-ribbon #orb.seyveo-presence-listening > .sv-ribbon-inner-smoke {
      opacity: .71;
    }
    html.sv-living-ribbon #orb.seyveo-presence-speaking > .sv-ribbon-inner-smoke {
      opacity: .79;
    }
    @keyframes sv-ribbon-vapour-circulate {
      from {transform: rotate(-28deg)}
      to {transform: rotate(332deg)}
    }
    @keyframes sv-ribbon-vapour-counter {
      from {transform: rotate(36deg)}
      to {transform: rotate(-324deg)}
    }
    @media (prefers-reduced-motion: reduce) {
      html.sv-living-ribbon #orb > .sv-ribbon-traveling-veil,
      html.sv-living-ribbon #orb > .sv-ribbon-traveling-veil::before,
      html.sv-living-ribbon #orb > .sv-ribbon-traveling-veil::after {
        animation: none !important;
      }
      html.sv-living-ribbon #orb > .sv-ribbon-traveling-veil {opacity: .22}
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
  // Separated vapour pockets, each with its own slow orbital direction.
  // Clear glass always remains BETWEEN them; there is no uniform fog sheet.
  const vapour = [
    {at: .045, speed: .012, radius: .45, span: .068, depth: .16, strength: 1},
    {at: .285, speed: -.009, radius: .57, span: .062, depth: .13, strength: .84},
    {at: .535, speed: .011, radius: .41, span: .071, depth: .16, strength: .93},
    {at: .775, speed: -.008, radius: .56, span: .058, depth: .14, strength: .81}
  ];
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
  let renderedFrames = 0;
  const interval = 1000 / 16; // Gentle smoke, inexpensive on iPhone XR.
  const render = (milliseconds) => {
    const seconds = milliseconds / 1000;
    for (let k = 0, c = 0; k < pixels.length; k += 4, c += 3) {
      const angle = cells[c], radius = cells[c + 1], ring = cells[c + 2];
      if (ring < .005) {pixels[k + 3] = 0; continue;}

      // Four distinct translucent pockets glide along the curved glass.
      // Their soft gaussian tails dissipate completely in the clear gaps.
      let pocket = 0;
      for (const wisp of vapour) {
        const phase = angle - wisp.at - seconds * wisp.speed;
        const delta = phase - Math.round(phase); // continuous around the ring
        const curl = Math.sin(delta * 31 + seconds * .19) * .024;
        const radialOffset = (radius - wisp.radius - curl) / wisp.depth;
        const angularOffset = delta / wisp.span;
        pocket += wisp.strength * Math.exp(-.5 * (
          angularOffset * angularOffset + radialOffset * radialOffset
        ));
      }

      // Fine turbulence changes the silhouette of each wisp while its
      // overall path continues smoothly, independent of the glass tilt.
      const radial = radius * 7.6;
      const wave = Math.sin(angle * Math.PI * 6 + seconds * .13) * .19;
      const broad = noise(angle * 8 + seconds * .18, radial + wave, 8);
      const fine = noise(angle * 16 - seconds * .24, radial * 2 - wave, 16);
      const texture = Math.max(0, Math.min(1, (broad * .62 + fine * .38 - .28) * 2.4));
      const density = Math.min(1, pocket) * ring * (.28 + .72 * texture);
      const alpha = Math.min(255, Math.round(density * 225));
      // The dark teal current is inside the glass, never a dark line on top.
      pixels[k] = 41;
      pixels[k + 1] = 83;
      pixels[k + 2] = 83;
      pixels[k + 3] = alpha;
    }
    ctx.putImageData(image, 0, 0);
    renderedFrames++;
    // A tiny diagnostics hook lets us distinguish a browser that really
    // stopped animating from smoke that is simply too subtle to perceive.
    if (renderedFrames === 1 || renderedFrames % 16 === 0) {
      smoke.dataset.renderedFrames = String(renderedFrames);
    }
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
