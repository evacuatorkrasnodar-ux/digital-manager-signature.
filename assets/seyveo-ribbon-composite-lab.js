/* SEYVEO · optional true composited living glass experiment.
   ?sayvi-engine=canvas uses one visible high-resolution canvas for both
   the existing approved sculpture and its independently moving vapour.
   The ordinary image remains untouched as a reliable fallback. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('sayvi-engine') !== 'canvas') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const orb = document.getElementById('orb');
  const hero = document.getElementById('plasmaVisual');
  if (!orb || !hero) return;

  const image = new Image();
  image.decoding = 'async';
  image.src = hero.currentSrc || hero.src;
  image.onload = () => {
    const composite = document.createElement('canvas');
    composite.className = 'sv-ribbon-glass-composite';
    composite.setAttribute('aria-hidden', 'true');
    const ctx = composite.getContext('2d', {alpha: true});
    if (!ctx) return;

    const field = document.createElement('canvas');
    const size = 216;
    field.width = field.height = size;
    const fieldCtx = field.getContext('2d', {alpha: true});
    if (!fieldCtx) return;
    const fieldImage = fieldCtx.createImageData(size, size);
    const fieldPixels = fieldImage.data;

    const maskedSmoke = document.createElement('canvas');
    const maskCtx = maskedSmoke.getContext('2d', {alpha: true});
    if (!maskCtx) return;

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
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const target = Math.min(1050, Math.ceil(diameter * dpr));
      if (Math.abs(target - resolution) < 40) return;
      resolution = target;
      composite.width = composite.height = target;
      maskedSmoke.width = maskedSmoke.height = target;
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
          const a = wrapped / p.span;
          const r = (radius - p.radius - bend) / p.depth;
          body += p.strength * Math.exp(-.5 * (a * a + r * r));
        }
        const radial = radius * 7.9;
        const broad = noise(angle * 8 + seconds * .18, radial + seconds * .026, 8);
        const detail = noise(angle * 16 - seconds * .20, radial * 2.15, 16);
        const cloud = Math.max(.12, Math.min(1, (broad * .65 + detail * .35 - .27) * 2.5));
        const density = Math.min(1, body) * ring * cloud;
        fieldPixels[i] = 42;
        fieldPixels[i + 1] = 80;
        fieldPixels[i + 2] = 83;
        fieldPixels[i + 3] = Math.round(Math.min(255, density * 225));
      }
      fieldCtx.putImageData(fieldImage, 0, 0);
    };

    const render = seconds => {
      resize();
      renderField(seconds);
      ctx.clearRect(0, 0, resolution, resolution);
      ctx.drawImage(image, 0, 0, resolution, resolution);

      maskCtx.clearRect(0, 0, resolution, resolution);
      maskCtx.filter = `blur(${Math.max(3, resolution / 170)}px)`;
      maskCtx.drawImage(field, 0, 0, resolution, resolution);
      maskCtx.filter = 'none';
      maskCtx.globalCompositeOperation = 'destination-in';
      maskCtx.drawImage(image, 0, 0, resolution, resolution);
      maskCtx.globalCompositeOperation = 'source-over';

      ctx.save();
      ctx.globalAlpha = .84;
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(maskedSmoke, 0, 0);
      ctx.restore();
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
        transform-origin:50% 50%;backface-visibility:hidden;
        --sv-ribbon-light:drop-shadow(0 0 12px rgba(108,177,179,.15));
        --sv-ribbon-soft-glass:brightness(1) saturate(1);
        animation:sv-ribbon-pearl-breathe 7.2s ease-in-out infinite,
                  sv-ribbon-floating-tilt 15.2s ease-in-out infinite;
      }
      html.sv-ribbon-composite-ready[data-theme="light"] #orb > .sv-ribbon-glass-composite {
        --sv-ribbon-light:drop-shadow(0 6px 13px rgba(77,129,130,.20));
        --sv-ribbon-soft-glass:brightness(1.10) saturate(.87);
      }
      html.sv-ribbon-composite-ready #orb::before {opacity:.17}
      html.sv-ribbon-composite-ready #orb::after {opacity:.09}
    `;
    document.head.appendChild(style);
    document.documentElement.classList.add('sv-ribbon-composite-ready');

    let lastTime = -Infinity;
    let frames = 0;
    let visible = true;
    const refreshMs = 1000 / 20;
    const tick = now => {
      if (!document.hidden && visible && now - lastTime >= refreshMs) {
        render(now / 1000);
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
})();
