/* Opt-in study: ?sayvi-ribbon=1
   One shared frosted-glass ribbon for Home and dock; no geometry changes.
   The original Sayvi artwork remains the default without the query flag. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('sayvi-ribbon') !== '1') return;
  const hero = document.getElementById('plasmaVisual');
  const orb = document.getElementById('orb');
  if (!hero || !orb) return;

  const source = 'assets/seyveo-living-ribbon.png?v=1';
  const root = document.documentElement;
  root.classList.add('sv-ribbon-preview');
  orb.classList.add('sv-ribbon-preview');

  // The regular theme controller still owns appearance and may reset the src.
  // This isolated preview reapplies its artwork without modifying that controller.
  const syncArtwork = () => {
    if (hero.getAttribute('src') !== source) hero.setAttribute('src', source);
  };
  new MutationObserver(syncArtwork).observe(hero, {
    attributes: true, attributeFilter: ['src']
  });
  syncArtwork();

  const style = document.createElement('style');
  style.id = 'sv-ribbon-living-preview-style';
  style.textContent = `
    /* Keep the approved main sphere layout, button hit area and handoff unchanged. */
    html.sv-ribbon-preview #orb #plasmaVisual {
      --sv-ribbon-light: drop-shadow(0 0 12px rgba(108,177,179,.15));
      transform-origin: 50% 50%;
      backface-visibility: hidden;
      will-change: filter, transform;
      animation:
        sv-ribbon-pearl-breathe 7.2s ease-in-out infinite,
        sv-ribbon-floating-tilt 15.2s ease-in-out infinite;
    }
    html.sv-ribbon-preview[data-theme="light"] #orb #plasmaVisual {
      --sv-ribbon-light: drop-shadow(0 6px 13px rgba(77,129,130,.20));
    }
    /* A very slow liquid-pearl current inside the sculpted glass ribbons.
       Multiple broad caustics drift independently without moving the silhouette. */
    html.sv-ribbon-preview #orb::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      opacity: .46;
      background:
        radial-gradient(ellipse 38% 44% at 27% 51%,
          rgba(75,138,140,.52) 0%, rgba(122,183,181,.24) 48%, transparent 85%),
        radial-gradient(ellipse 45% 50% at 75% 45%,
          rgba(255,255,255,.82) 0%, rgba(235,255,252,.30) 47%, transparent 84%),
        radial-gradient(ellipse 42% 37% at 48% 76%,
          rgba(90,158,158,.36) 0%, rgba(178,220,214,.15) 47%, transparent 88%);
      background-size: 142% 127%, 133% 146%, 152% 131%;
      background-position: 8% 17%, 85% 74%, 31% 93%;
      -webkit-mask: url("assets/seyveo-living-ribbon.png?v=1") center / contain no-repeat;
      mask: url("assets/seyveo-living-ribbon.png?v=1") center / contain no-repeat;
      mix-blend-mode: soft-light;
      transform-origin: 50% 50%;
      animation:
        sv-ribbon-liquid-flow 12.6s cubic-bezier(.4,0,.6,1) infinite alternate,
        sv-ribbon-floating-tilt 15.2s ease-in-out infinite;
    }
    html.sv-ribbon-preview[data-theme="light"] #orb::before {
      opacity: .43;
      mix-blend-mode: multiply;
    }
    html.sv-ribbon-preview #orb::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      opacity: .27;
      background: linear-gradient(106deg,
        transparent 22%, rgba(223,251,248,.02) 35%,
        rgba(255,255,255,.65) 48%,
        rgba(210,246,243,.07) 60%, transparent 78%);
      background-size: 250% 100%;
      background-position: 0% 50%;
      -webkit-mask: url("assets/seyveo-living-ribbon.png?v=1") center / contain no-repeat;
      mask: url("assets/seyveo-living-ribbon.png?v=1") center / contain no-repeat;
      mix-blend-mode: screen;
      transform-origin: 50% 50%;
      animation:
        sv-ribbon-glass-caustic 9s ease-in-out infinite,
        sv-ribbon-floating-tilt 15.2s ease-in-out infinite;
    }
    /* Voice mist is refracted INSIDE the ribbons, never across the open center. */
    html.sv-ribbon-preview #orb .orb-mist,
    html.sv-ribbon-preview #orb .orb-logo-mist {
      -webkit-mask: url("assets/seyveo-living-ribbon.png?v=1") center / contain no-repeat;
      mask: url("assets/seyveo-living-ribbon.png?v=1") center / contain no-repeat;
    }
    html.sv-ribbon-preview #orb.seyveo-presence-listening #plasmaVisual {
      animation-duration: 3.5s,15.2s;
    }
    html.sv-ribbon-preview #orb.seyveo-presence-listening::before {
      opacity: .54;
      animation-duration: 6.4s,15.2s;
    }
    html.sv-ribbon-preview #orb.seyveo-presence-speaking #plasmaVisual {
      animation-duration: 2.5s,15.2s;
    }
    html.sv-ribbon-preview #orb.seyveo-presence-speaking::before {
      opacity: .65;
      animation-duration: 4.7s,15.2s;
    }
    html.sv-ribbon-preview #orb.seyveo-presence-listening::after,
    html.sv-ribbon-preview #orb.seyveo-presence-speaking::after {
      opacity: .42;
      animation-duration: 4.5s,15.2s;
    }
    /* Use the exact same Home artwork in the mini, including dark mode. */
    html.sv-ribbon-preview #assistantButton.sv-sayvi-velvet-ready > svg.button-art {
      opacity: 0 !important;
    }
    html.sv-ribbon-preview #assistantButton > .sv-sayvi-mini-copy {
      display: block !important;
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      width: 52px !important;
      height: 52px !important;
      max-width: 52px !important;
      max-height: 52px !important;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      border: 0 !important;
      border-radius: 50% !important;
      object-fit: contain !important;
      transform: translate(-50%,-50%) !important;
      pointer-events: none !important;
      z-index: 2 !important;
      filter: drop-shadow(0 0 4px rgba(118,177,176,.16)) !important;
    }
    @keyframes sv-ribbon-pearl-breathe {
      0%,100% {filter: var(--sv-ribbon-light) brightness(.985) saturate(.96)}
      52% {filter: var(--sv-ribbon-light) brightness(1.065) saturate(1.10)}
    }
    /* The actual #orb never moves here: only its three matched visual layers
       lean gently together. Handoff transforms and hit targets stay intact. */
    @keyframes sv-ribbon-floating-tilt {
      0%,100% {
        transform: perspective(900px) rotateX(-1.1deg) rotateY(-2.2deg) rotateZ(-.8deg);
      }
      50% {
        transform: perspective(900px) rotateX(1.3deg) rotateY(2.2deg) rotateZ(.8deg);
      }
    }
    @keyframes sv-ribbon-liquid-flow {
      0% {
        background-position: 8% 17%, 85% 74%, 31% 93%;
      }
      37% {
        background-position: 43% 45%, 56% 44%, 68% 63%;
      }
      72% {
        background-position: 75% 81%, 28% 21%, 42% 33%;
      }
      100% {
        background-position: 91% 59%, 10% 67%, 16% 15%;
      }
    }
    @keyframes sv-ribbon-glass-caustic {
      0%,8% {background-position: 0% 50%;opacity:.10}
      45%,58% {opacity:.30}
      92%,100% {background-position: 100% 50%;opacity:.10}
    }
    @media (prefers-reduced-motion: reduce) {
      html.sv-ribbon-preview #orb #plasmaVisual,
      html.sv-ribbon-preview #orb::before,
      html.sv-ribbon-preview #orb::after {
        animation: none !important;
        will-change: auto;
      }
      html.sv-ribbon-preview #orb::before {opacity:.22}
      html.sv-ribbon-preview #orb::after {opacity:.12}
    }
  `;
  document.head.appendChild(style);
})();
