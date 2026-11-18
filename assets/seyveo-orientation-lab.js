/* SEYVEO · optional iPhone motion study (?sayvi-motion=1).
   No sensor reads or permission prompts occur without a deliberate tap.
   Orientation values are used only in this page; nothing is stored or sent. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('sayvi-motion') !== '1') return;

  const root = document.documentElement;
  const orb = document.getElementById('orb');
  const home = document.getElementById('homePage');
  if (!orb || !home) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sv-motion-lab-switch';
  button.textContent = 'Включить 3D';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', 'Включить отклик Сэйви на наклон телефона');
  document.body.appendChild(button);
  const updateVisibility = () => { button.hidden = home.hidden; };
  new MutationObserver(updateVisibility).observe(home, {
    attributes: true, attributeFilter: ['hidden']
  });
  updateVisibility();

  const reflection = document.createElement('span');
  reflection.className = 'sv-motion-lab-reflection';
  reflection.setAttribute('aria-hidden', 'true');
  orb.appendChild(reflection);

  const style = document.createElement('style');
  style.textContent = `
    .sv-motion-lab-switch {
      position: fixed;
      z-index: 2000;
      right: 16px;
      bottom: calc(96px + env(safe-area-inset-bottom, 0px));
      min-height: 38px;
      padding: 0 15px;
      border: 1px solid rgba(132,160,161,.31);
      border-radius: 22px;
      background: rgba(242,249,248,.89);
      color: #264448;
      -webkit-backdrop-filter: blur(18px) saturate(120%);
      backdrop-filter: blur(18px) saturate(120%);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.85), 0 3px 15px rgba(52,91,95,.12);
      font: 500 13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      letter-spacing: -.01em;
      cursor: pointer;
      touch-action: manipulation;
    }
    .sv-motion-lab-switch[hidden] {display: none !important}
    .sv-motion-lab-switch[aria-pressed="true"] {
      background: rgba(217,237,234,.94);
      border-color: rgba(108,156,150,.5);
    }
    html[data-theme="dark"] .sv-motion-lab-switch {
      color: #e9f6f4;
      background: rgba(38,57,60,.90);
    }
    #orb > .sv-motion-lab-reflection {
      position: absolute;
      inset: 0;
      z-index: 1;
      display: none;
      pointer-events: none;
      opacity: .42;
      transform-origin: 50% 50%;
      background:
        radial-gradient(ellipse 40% 47%
          at var(--sv-glint-x, 50%) var(--sv-glint-y, 47%),
          rgba(255,255,255,.75),rgba(224,254,250,.20) 51%,transparent 90%),
        radial-gradient(ellipse 42% 40%
          at var(--sv-shadow-x, 52%) var(--sv-shadow-y, 55%),
          rgba(66,132,135,.25),transparent 85%);
      -webkit-mask: url("assets/seyveo-living-ribbon-v5.webp?v=1") center / contain no-repeat;
      mask: url("assets/seyveo-living-ribbon-v5.webp?v=1") center / contain no-repeat;
      mix-blend-mode: soft-light;
    }
    html.sv-motion-lab-active #orb #plasmaVisual,
    html.sv-motion-lab-active #orb > .sv-ribbon-glass-composite,
    html.sv-motion-lab-active #orb::before,
    html.sv-motion-lab-active #orb::after,
    html.sv-motion-lab-active #orb > .sv-motion-lab-reflection {
      transform: perspective(900px)
        rotateX(var(--sv-motion-rx, 0deg))
        rotateY(var(--sv-motion-ry, 0deg))
        rotateZ(var(--sv-motion-rz, 0deg));
    }
    html.sv-motion-lab-active #orb #plasmaVisual {
      animation: sv-ribbon-pearl-breathe 7.2s ease-in-out infinite;
    }
    html.sv-motion-lab-active #orb > .sv-ribbon-glass-composite {
      animation: sv-ribbon-pearl-breathe 7.2s ease-in-out infinite;
    }
    html.sv-motion-lab-active #orb::before {
      animation: sv-ribbon-liquid-flow 12.6s cubic-bezier(.4,0,.6,1) infinite alternate;
    }
    html.sv-motion-lab-active #orb::after {
      animation: sv-ribbon-glass-caustic 9s ease-in-out infinite;
    }
    html.sv-motion-lab-active #orb > .sv-motion-lab-reflection {display: block}
    html.sv-motion-lab-active #orb.seyveo-presence-listening :is(#plasmaVisual,.sv-ribbon-glass-composite) {
      animation-duration: 3.5s;
    }
    html.sv-motion-lab-active #orb.seyveo-presence-speaking :is(#plasmaVisual,.sv-ribbon-glass-composite) {
      animation-duration: 2.5s;
    }
    html.sv-motion-lab-active #orb.seyveo-presence-listening::before {
      animation-duration: 6.4s;
    }
    html.sv-motion-lab-active #orb.seyveo-presence-speaking::before {
      animation-duration: 4.7s;
    }
    @media (prefers-reduced-motion: reduce) {
      html.sv-motion-lab-active #orb #plasmaVisual,
      html.sv-motion-lab-active #orb > .sv-ribbon-glass-composite,
      html.sv-motion-lab-active #orb::before,
      html.sv-motion-lab-active #orb::after,
      html.sv-motion-lab-active #orb > .sv-motion-lab-reflection {
        animation: none !important;
        transform: none !important;
      }
      html.sv-motion-lab-active #orb > .sv-motion-lab-reflection {display: none}
    }
  `;
  document.head.appendChild(style);

  let enabled = false;
  let sensorSeen = false;
  let base = null;
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let frame = 0;
  let previousEventTime = 0;
  let noticeTimer = 0;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function showTemporary(message) {
    clearTimeout(noticeTimer);
    button.textContent = message;
    noticeTimer = setTimeout(() => {
      button.textContent = enabled ? '3D · Вкл' : 'Включить 3D';
    }, 2500);
  }

  function resetPose() {
    base = null;
    targetX = targetY = 0;
    if (enabled && !document.hidden && !frame) frame = requestAnimationFrame(applyPose);
  }

  function applyPose() {
    frame = 0;
    if (!enabled || document.hidden || home.hidden) return;
    const dx = targetX - currentX;
    const dy = targetY - currentY;
    currentX += dx * .15;
    currentY += dy * .15;
    orb.style.setProperty('--sv-motion-rx', currentX.toFixed(3) + 'deg');
    orb.style.setProperty('--sv-motion-ry', currentY.toFixed(3) + 'deg');
    orb.style.setProperty('--sv-motion-rz', (currentY * .17).toFixed(3) + 'deg');
    orb.style.setProperty('--sv-glint-x', (50 + currentY * 3.0).toFixed(2) + '%');
    orb.style.setProperty('--sv-glint-y', (47 + currentX * 2.7).toFixed(2) + '%');
    orb.style.setProperty('--sv-shadow-x', (52 - currentY * 2.5).toFixed(2) + '%');
    orb.style.setProperty('--sv-shadow-y', (55 - currentX * 2.3).toFixed(2) + '%');
    if (Math.abs(dx) > .008 || Math.abs(dy) > .008) frame = requestAnimationFrame(applyPose);
  }

  function onOrientation(event) {
    if (!enabled || document.hidden || home.hidden) return;
    if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    sensorSeen = true;
    const now = performance.now();
    if (now - previousEventTime < 30) return;
    previousEventTime = now;
    if (!base) {
      base = { beta: event.beta, gamma: event.gamma };
      return; // The current phone pose is the neutral position.
    }
    const wrappedBeta = ((event.beta - base.beta + 540) % 360) - 180;
    const gammaDelta = event.gamma - base.gamma;
    targetX = Math.max(-3, Math.min(3, wrappedBeta * .20));
    targetY = Math.max(-3, Math.min(3, -gammaDelta * .20));
    if (!frame) frame = requestAnimationFrame(applyPose);
  }

  function disable() {
    enabled = false;
    root.classList.remove('sv-motion-lab-active');
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', 'Включить отклик Сэйви на наклон телефона');
    button.textContent = 'Включить 3D';
    window.removeEventListener('deviceorientation', onOrientation);
    cancelAnimationFrame(frame);
    frame = 0;
    resetPose();
    currentX = currentY = 0;
    for (const variable of ['--sv-motion-rx','--sv-motion-ry','--sv-motion-rz',
      '--sv-glint-x','--sv-glint-y','--sv-shadow-x','--sv-shadow-y'])
      orb.style.removeProperty(variable);
  }

  button.addEventListener('click', async () => {
    if (enabled) {
      disable();
      return;
    }
    if (reduceMotion.matches) {
      showTemporary('Движение отключено в iOS');
      return;
    }
    if (typeof window.DeviceOrientationEvent === 'undefined') {
      showTemporary('Нет датчиков движения');
      return;
    }
    try {
      // iOS requires this call directly from a user gesture.
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          showTemporary('Доступ не разрешён');
          return;
        }
      }
      enabled = true;
      sensorSeen = false;
      resetPose();
      root.classList.add('sv-motion-lab-active');
      button.setAttribute('aria-pressed', 'true');
      button.setAttribute('aria-label', 'Выключить отклик Сэйви на наклон телефона');
      button.textContent = '3D · Вкл';
      window.addEventListener('deviceorientation', onOrientation, {passive:true});
      setTimeout(() => {
        if (enabled && !sensorSeen) showTemporary('Наклони iPhone');
      }, 4000);
    } catch {
      showTemporary('Датчики недоступны');
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    resetPose();
  });
  window.addEventListener('orientationchange', resetPose, {passive:true});
  reduceMotion.addEventListener?.('change', () => {
    if (reduceMotion.matches && enabled) disable();
  });
})();
