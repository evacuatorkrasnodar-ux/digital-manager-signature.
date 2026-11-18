/* SEYVEO · production living glass: sharp approved sculpture and moving vapour.
   The canvas preserves the exact 4-petal alpha silhouette and draws soft,
   intermittent smoke directly under the glass. ?sayvi-engine=image restores
   the previous static-image renderer; reduced-motion keeps a still image. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  // The approved velvet material is now standard in the white theme.
  // ?sayvi-matte=0 restores the previous glossy light rendering for QA.
  const matteEnabled = params.get('sayvi-matte') !== '0';
  // ?sayvi-smoke=100 is a reversible full-strength vapor experiment. The
  // gaps between plumes stay clear, so the glass never becomes a solid disc.
  const fullSmoke = params.get('sayvi-smoke') === '100';
  if (params.get('sayvi-engine') === 'image' ||
      params.get('sayvi-engine') === 'legacy' ||
      params.get('sayvi-ribbon') === '0' ||
      params.get('sayvi-smoke') === '0') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const orb = document.getElementById('orb');
  const hero = document.getElementById('plasmaVisual');
  if (!orb || !hero) return;

  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    const composite = document.createElement('canvas');
    composite.className = 'sv-ribbon-glass-composite';
    composite.setAttribute('aria-hidden', 'true');
    const ctx = composite.getContext('2d', {alpha: true});
    if (!ctx) return;

    const field = document.createElement('canvas');
    // The smoke is intentionally low frequency. A separate small field keeps
    // its noise soft while the glass itself stays at retina resolution.
    const size = 112;
    field.width = field.height = size;
    const fieldCtx = field.getContext('2d', {alpha: true});
    if (!fieldCtx) return;
    const fieldImage = fieldCtx.createImageData(size, size);
    const fieldPixels = fieldImage.data;

    const smooth = value => value * value * (3 - 2 * value);
    const hash = (x, y) => {
      let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    };
    const noise = (u, v, period) => {
      const ix = Math.floor(u), iy = Math.floor(v);
      const fx = smooth(u - ix), fy = smooth(v - iy);
      const x0 = ((ix % period) + period) % period;
      const x1 = (x0 + 1) % period;
      const a = hash(x0, iy) * (1 - fx) + hash(x1, iy) * fx;
      const b = hash(x0, iy + 1) * (1 - fx) + hash(x1, iy + 1) * fx;
      return a * (1 - fy) + b * fy;
    };

    // Four vapor pockets glide through the inner body. Between them the glass
    // is fully clear. Speeds differ, so this can never look like a rotating
    // static picture or a uniform dark overlay.
    const pockets = [
      {at: .07, speed: .016, radius: .44, span: .073, depth: .16, strength: 1.0},
      {at: .32, speed: -.011, radius: .56, span: .060, depth: .14, strength: .83},
      {at: .59, speed: .014, radius: .45, span: .067, depth: .17, strength: 1.0},
      {at: .85, speed: -.013, radius: .55, span: .054, depth: .15, strength: .88}
    ];
    const cells = new Float32Array(size * size * 3);
    for (let y = 0, offset = 0; y < size; y++) {
      for (let x = 0; x < size; x++, offset += 3) {
        const dx = (x + .5) / size * 2 - 1;
        const dy = (y + .5) / size * 2 - 1;
        const radius = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI);
        const inner = smooth(Math.min(1, Math.max(0, (radius - .18) / .16)));
        const outer = 1 - smooth(Math.min(1, Math.max(0, (radius - .72) / .17)));
        cells[offset] = angle;
        cells[offset + 1] = radius;
        cells[offset + 2] = inner * outer;
      }
    }

    let resolution = 0;
    const resize = () => {
      const diameter = Math.max(140, orb.getBoundingClientRect().width);
      // Supersample even on non-retina desktops: the oblique, thin glass lips
      // must not staircase when the sphere makes its gentle CSS 3D tilt.
      const dpr = Math.max(2.5, Math.min(3.5, window.devicePixelRatio || 1));
      const target = Math.min(1200, Math.ceil(diameter * dpr));
      if (Math.abs(target - resolution) < 40) return;
      resolution = target;
      composite.width = composite.height = target;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    };
    resize();

    const renderField = seconds => {
      for (let i = 0, cell = 0; i < fieldPixels.length; i += 4, cell += 3) {
        const angle = cells[cell], radius = cells[cell + 1], ring = cells[cell + 2];
        if (ring < .008) {fieldPixels[i + 3] = 0; continue;}
        let body = 0;
        for (const p of pockets) {
          const delta = angle - p.at - seconds * p.speed;
          const wrapped = delta - Math.round(delta);
          const bend = Math.sin(wrapped * 30 + seconds * .14) * .032;
          const a = wrapped / (p.span * (fullSmoke ? 1.28 : 1));
          const r = (radius - p.radius - bend) / (p.depth * (fullSmoke ? 1.14 : 1));
          body += p.strength * Math.exp(-.5 * (a * a + r * r));
        }
        const radial = radius * 7.9;
        const broad = noise(angle * 8 + seconds * .18, radial + seconds * .026, 8);
        const detail = noise(angle * 16 - seconds * .20, radial * 2.15, 16);
        const cloud = Math.max(.12, Math.min(1, (broad * .65 + detail * .35 - .27) * 2.5));
        const density = Math.min(1, body) * ring * cloud;
        const neutralMatte = matteEnabled && document.documentElement.dataset.theme === 'light';
        fieldPixels[i] = neutralMatte ? 63 : 42;
        fieldPixels[i + 1] = neutralMatte ? 66 : 80;
        fieldPixels[i + 2] = neutralMatte ? 72 : 83;
        fieldPixels[i + 3] = Math.round(Math.min(255, density * (fullSmoke ? 450 : 225)));
      }
      fieldCtx.putImageData(fieldImage, 0, 0);
    };

    const render = seconds => {
      resize();
      renderField(seconds);
      const lightMatte = matteEnabled &&
        document.documentElement.dataset.theme === 'light';
      ctx.clearRect(0, 0, resolution, resolution);
      // Remove the green pigment from the original artwork before adding
      // neutral pearl smoke. This preserves its geometry and alpha exactly.
      if (lightMatte) ctx.filter = 'grayscale(1) brightness(1.035)';
      ctx.drawImage(image, 0, 0, resolution, resolution);
      ctx.filter = 'none';
      // A source-atop blend uses the sculpture's EXISTING full-resolution alpha
      // as the mask. There is no extra downsampled edge or double-alpha pass:
      // the aperture and side air gap stay truly transparent. This also avoids
      // rebuilding a second full-resolution mask every animation frame.
      ctx.save();
      // The ordinary Home stays pixel-matched to the approved velvet look.
      // In the explicit experiment the plume reaches full opacity.
      ctx.globalAlpha = fullSmoke ? 1 : .78;
      ctx.globalCompositeOperation = 'source-atop';
      ctx.filter = `blur(${Math.max(3, resolution / 180)}px)`;
      ctx.drawImage(field, 0, 0, resolution, resolution);
      ctx.restore();

      if (lightMatte) {
        // A milky subsurface scattering layer turns clear polished glass into
        // frosted velvet. Source-atop keeps the exact petal transparency,
        // sharp openings and outer silhouette pixel-identical.
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = .25;
        ctx.fillStyle = '#e7e9ee';
        ctx.fillRect(0, 0, resolution, resolution);
        ctx.restore();
      }
    };

    // Show the replacement only after the first real composite exists.
    render(0);
    if (params.get('sayvi-qa') === '1') {
      window.__sayviCompositeRenderAt = render;
    }
    hero.insertAdjacentElement('afterend', composite);
    const style = document.createElement('style');
    style.id = 'sv-ribbon-glass-composite-style';
    style.textContent = `
      html.sv-ribbon-composite-ready #orb #plasmaVisual {opacity:0 !important}
      html.sv-ribbon-composite-ready #orb > .sv-ribbon-glass-composite {
        position:absolute;inset:0;width:100%;height:100%;display:block;
        z-index:2;pointer-events:none;background:transparent;
        image-rendering:auto;
        transform-origin:50% 50%;backface-visibility:hidden;
        --sv-ribbon-light:drop-shadow(0 0 12px rgba(108,177,179,.15));
        --sv-ribbon-soft-glass:brightness(1) saturate(1);
        animation:sv-ribbon-pearl-breathe 7.2s ease-in-out infinite,
                  sv-ribbon-floating-tilt 15.2s ease-in-out infinite;
      }
      html.sv-ribbon-composite-ready[data-theme="light"] #orb > .sv-ribbon-glass-composite {
        /* Neutral pearl material for the white theme; no green cast. */
        --sv-ribbon-light:drop-shadow(0 6px 13px rgba(70,79,94,.17));
        --sv-ribbon-soft-glass:brightness(.97) saturate(1.06);
      }
      html.sv-ribbon-composite-ready.sv-ribbon-matte-velvet[data-theme="light"] #orb > .sv-ribbon-glass-composite {
        --sv-ribbon-soft-glass:brightness(1.01) saturate(.78);
      }
      html.sv-ribbon-composite-ready #orb::before {opacity:.17}
      html.sv-ribbon-composite-ready #orb::after {opacity:.09}
    `;
    document.head.appendChild(style);
    document.documentElement.classList.add('sv-ribbon-composite-ready');
    if (matteEnabled) document.documentElement.classList.add('sv-ribbon-matte-velvet');

    let lastTime = -Infinity;
    let startTime = null;
    let frames = 0;
    let visible = true;
    // A gentle vapor current needs fewer redraws than the 60fps CSS movement.
    // The lighter mobile cadence also protects older iPhones from heating up.
    const refreshMs = 1000 / (matchMedia('(max-width:600px)').matches ? 16 : 20);
    const tick = now => {
      if (!document.hidden && visible && now - lastTime >= refreshMs) {
        if (startTime === null) startTime = now;
        render((now - startTime) / 1000);
        lastTime = now;
        frames++;
        if (frames % 20 === 0) composite.dataset.renderedFrames = String(frames);
      }
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
      }, {threshold: .01}).observe(orb);
    }
    requestAnimationFrame(tick);
  };
  image.onerror = () => {}; // Retain the original glass image on decode failure.
  image.src = hero.getAttribute('src') || hero.currentSrc || hero.src;
})();
