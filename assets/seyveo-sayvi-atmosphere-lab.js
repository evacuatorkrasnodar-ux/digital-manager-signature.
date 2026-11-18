/* SEYVEO · optional dark atmosphere behind the real living Sayvi.
   ?sayvi-atmosphere=1 is a reversible white-theme preview. Keep the glass,
   smoke, orb button, original Home→dock handoff and all other pages intact. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('sayvi-atmosphere') !== '1') return;
  const root = document.documentElement;
  const cluster = document.getElementById('orbCluster');
  const orb = document.getElementById('orb');
  if (!cluster || !orb || orb.parentNode !== cluster) return;

  const atmosphere = document.createElement('span');
  atmosphere.className = 'sv-sayvi-atmosphere';
  atmosphere.setAttribute('aria-hidden', 'true');
  cluster.insertBefore(atmosphere, orb);

  const style = document.createElement('style');
  style.id = 'sv-sayvi-atmosphere-style';
  style.textContent = `
    /* Only the hero receives its graphite-green optical environment. The
       white Apple-style Home and dock remain untouched. The vignette ends
       just beyond the ribbon, so it cannot darken the greeting or shortcuts. */
    html.sv-sayvi-atmosphere-preview[data-theme="light"] #homePage #orbCluster > .sv-sayvi-atmosphere {
      position:absolute !important;
      top:50%;left:50%;
      /* The visible petals occupy roughly 80% of their transparent canvas.
         Keep the dark field close to those petals: no heavy black ring. */
      width:calc(var(--sv-home-orb-size,315px) * .92);
      height:calc(var(--sv-home-orb-size,315px) * .92);
      max-width:400px;max-height:400px;
      border:0;border-radius:50%;
      margin:0;padding:0;
      transform:translate(-50%,-50%);
      pointer-events:none;z-index:0;
      background:
        radial-gradient(circle at 46% 43%,
          rgba(157,211,202,.14) 0%,
          rgba(98,164,154,.07) 46%,
          transparent 82%),
        radial-gradient(circle at 49% 47%,
          rgba(25,47,42,.99) 0%,
          rgba(18,41,36,.99) 43%,
          rgba(13,33,29,.97) 82%,
          rgba(13,33,29,.68) 89%,
          rgba(13,33,29,.24) 95%,
          rgba(13,33,29,0) 100%);
      filter:drop-shadow(0 0 19px rgba(105,182,172,.12));
      opacity:1;
      will-change:opacity;
      transition:opacity .46s cubic-bezier(.2,.7,.25,1);
    }
    html.sv-sayvi-atmosphere-preview[data-theme="dark"] #orbCluster > .sv-sayvi-atmosphere,
    html.sv-sayvi-atmosphere-preview.sv-sayvi-handoff-inflight #orbCluster > .sv-sayvi-atmosphere {
      opacity:0 !important;
    }
    /* The canvas stays round: only the same tiny, spring-soft return motion
       as the approved old sphere is made a little easier to perceive. */
    html.sv-sayvi-atmosphere-preview:not(.sv-motion-lab-active) #orb > .sv-ribbon-glass-composite {
      animation:sv-ribbon-pearl-breathe 7.2s ease-in-out infinite,
                sv-sayvi-satin-sway 20s ease-in-out infinite;
    }
    @keyframes sv-sayvi-satin-sway {
      0%,100% {transform:perspective(980px) rotateX(-1.4deg) rotateY(-2.6deg) rotateZ(-1.15deg)}
      50% {transform:perspective(980px) rotateX(1.7deg) rotateY(2.8deg) rotateZ(1.15deg)}
    }
    /* On unusually short landscape/browser windows the old Home compact
       layout overlaps the orb with status and shortcut text. Never put a
       dark backlight under black text in that constrained arrangement. */
    @media (max-height:600px) {
      html.sv-sayvi-atmosphere-preview #orbCluster > .sv-sayvi-atmosphere {
        opacity:0 !important;
      }
    }
    @media (prefers-reduced-motion:reduce) {
      html.sv-sayvi-atmosphere-preview #orb > .sv-ribbon-glass-composite {
        animation:none !important;transform:none !important;
      }
    }
  `;
  document.head.appendChild(style);
  root.classList.add('sv-sayvi-atmosphere-preview');
})();
