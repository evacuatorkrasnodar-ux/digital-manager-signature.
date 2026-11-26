/* SEYVEO / Work header v2.
   Completely rebuilt isolated header: one component, one material source.
   Shadow DOM prevents all legacy app/global CSS from styling its controls.
   The existing Work Shell owns navigation and dialogs, not visual styles. */
(()=>{
 'use strict';
 const styles=String.raw`
/* Work 44px navigation · single private stylesheet, no press overlays.
   Original buttons and Work Shell listeners remain intact. */
:host{
 --work-left:max(12px,env(safe-area-inset-left,0px));
 --work-right:max(12px,env(safe-area-inset-right,0px));
 /* One 44px button axis with 14px of breathing room on every Work page. */
 --work-top:var(--sv-apple-top-gap,14px);
 display:block;box-sizing:border-box;flex:none;order:0;align-self:stretch;
 width:100%;max-width:100%;height:var(--sv-header-work-row,58px);min-height:var(--sv-header-work-row,58px);margin:0;
 color:var(--sv-header-ink,#1C1C1E);
 background:transparent;border:0;box-shadow:none;filter:none;
 font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
}
:host([data-work-tabs="true"]){height:var(--sv-header-work-tabs-row,74px);min-height:var(--sv-header-work-tabs-row,74px)}
:host([hidden]){display:none!important}
*,*::before,*::after{box-sizing:border-box}
.bar{
 display:grid;grid-template-columns:var(--sv-nav-single-size,44px) var(--sv-nav-single-size,44px) minmax(0,1fr) var(--sv-nav-single-size,44px);
 grid-template-rows:var(--sv-nav-single-size,44px);column-gap:8px;row-gap:0;
 align-items:center;align-content:start;
 width:100%;height:100%;margin:0;
 padding:var(--work-top) var(--work-right) 0 var(--work-left);
 background:#fff;border:0;border-radius:0;box-shadow:none;overflow:visible;
}
:host([data-work-tabs="true"]) .bar{grid-template-rows:var(--sv-nav-single-size,44px)}
:host(:not([data-work-tabs="true"])) .bar{grid-template-rows:var(--sv-nav-single-size,44px)}
.title{
 grid-column:2/4;grid-row:1;align-self:center;min-width:0;max-width:100%;
 margin:0;padding:0;color:inherit;
 font:590 var(--sv-header-title-size,20px)/1.2 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
 letter-spacing:var(--sv-header-title-tracking,-.02em);
 text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.title[hidden]{display:none!important}
.control{
 appearance:none;-webkit-appearance:none;
 grid-row:1;display:grid;place-items:center;align-self:center;justify-self:center;
 box-sizing:border-box;flex:0 0 var(--sv-nav-single-size,44px);width:var(--sv-nav-single-size,44px);min-width:var(--sv-nav-single-size,44px);max-width:var(--sv-nav-single-size,44px);
 height:var(--sv-nav-single-size,44px);min-height:var(--sv-nav-single-size,44px);max-height:var(--sv-nav-single-size,44px);
 padding:0;margin:0;border-radius:50%;
 border:var(--sv-header-circle-border,var(--sv-white-pearl-edge,.75px solid rgba(255,255,255,.88)));
 background:var(--sv-header-circle,var(--sv-white-pearl-surface,rgba(255,255,255,.18)));
 color:var(--sv-header-icon-ink,#0B0B0D);
 box-shadow:var(--sv-header-circle-shadow,var(--sv-white-pearl-circle-shadow,0 7px 19px rgba(42,52,72,.13)));
 -webkit-backdrop-filter:var(--sv-header-circle-filter,var(--sv-white-pearl-blur,blur(4px) saturate(104%)));
 backdrop-filter:var(--sv-header-circle-filter,var(--sv-white-pearl-blur,blur(4px) saturate(104%)));
 cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;
 transform:none;translate:none;scale:1;opacity:1;filter:none;
 transition:none;animation:none;
}
.control:is(:hover,:focus,:active){
 /* Exactly the same paint as at rest, not a pressed alternative. */
 border:var(--sv-header-circle-border,var(--sv-white-pearl-edge,.75px solid rgba(255,255,255,.88)));
 background:var(--sv-header-circle,var(--sv-white-pearl-surface,rgba(255,255,255,.18)));
 box-shadow:var(--sv-header-circle-shadow,var(--sv-white-pearl-circle-shadow,0 7px 19px rgba(42,52,72,.13)));
 transform:none;translate:none;scale:1;opacity:1;filter:none;
 transition:none;animation:none;
}
.control[hidden]{display:none!important}
.control:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.control svg{
 display:block;width:22px;height:22px;flex:none;
 fill:none;stroke:currentColor;stroke-width:1.7;
 stroke-linecap:round;stroke-linejoin:round;
 transform:none;transition:none;filter:none;
}
.back{grid-column:1;grid-row:1;justify-self:start}
.back svg{width:22px;height:22px;stroke-width:1.55}
.action{grid-column:4;grid-row:1;justify-self:end}
.action svg{width:28px;height:28px;stroke-width:1.65}
.sv-review-cards-control{
 grid-column:2;grid-row:1;justify-self:start;
 position:relative;overflow:visible;
}
.sv-review-cards-control svg{width:20px;height:20px;stroke-width:1.6}
.sv-review-cards-badge:not([hidden]){
 position:absolute;top:3px;right:1px;display:grid;place-items:center;
 min-width:14px;height:14px;padding:0 3px;
 border:1.5px solid #fff;border-radius:999px;background:#D6534A;color:#fff;
 font:600 9px/1 -apple-system,BlinkMacSystemFont,sans-serif;
 box-shadow:0 1px 2px rgba(0,0,0,.08);pointer-events:none;
}
/* One fixed 44px button axis: the same controls and tap sizes stay in
   place for Calendar, Cabinet and the other root Work sections. */
.sv-history-dual{display:contents}
.sv-history-search,.sv-history-select{display:none}
:host([data-task-tools="true"]) .sv-history-dual{
 grid-column:3/5;grid-row:1;justify-self:end;align-self:center;
 display:flex;align-items:center;justify-content:center;
 width:var(--sv-nav-triple-width,134px);height:var(--sv-nav-capsule-height,44px);margin:0;padding:0 var(--sv-nav-capsule-padding,3px);gap:0;
 border:var(--sv-white-pearl-edge,.75px solid rgba(255,255,255,.88));
 border-radius:var(--sv-nav-capsule-radius,999px);background:var(--sv-white-pearl-surface,rgba(255,255,255,.18));
 box-shadow:var(--sv-nav-capsule-shadow,var(--sv-white-pearl-dock-shadow,0 7px 21px rgba(42,52,72,.105)));
 -webkit-backdrop-filter:var(--sv-white-pearl-blur,blur(4px) saturate(104%));
 backdrop-filter:var(--sv-white-pearl-blur,blur(4px) saturate(104%));
}
:host([data-task-tools="true"]) .sv-history-dual .control,
:host([data-task-tools="true"]) .sv-history-dual .control:is(:hover,:focus,:active){
 display:grid;flex:0 0 var(--sv-nav-capsule-cell,42px);width:var(--sv-nav-capsule-cell,42px);min-width:var(--sv-nav-capsule-cell,42px);max-width:var(--sv-nav-capsule-cell,42px);
 height:var(--sv-nav-capsule-cell,42px);min-height:var(--sv-nav-capsule-cell,42px);max-height:var(--sv-nav-capsule-cell,42px);
 margin:0;padding:0;border:0;border-radius:50%;
 background:transparent;background-image:none;box-shadow:none;
 -webkit-backdrop-filter:none;backdrop-filter:none;
 opacity:1;filter:none;transform:none;translate:none;scale:1;
 transition:none;animation:none;
}
:host([data-task-tools="true"]) .sv-history-dual .sv-history-search,
:host([data-task-tools="true"]) .sv-history-dual .sv-review-cards-control{display:grid}
:host([data-task-tools="true"]) .sv-history-dual .sv-history-select{display:none!important}
:host([data-history="true"]) .sv-review-cards-control{display:none!important}
/* Cabinet's two existing actions occupy the same pearl capsule as
   My Tasks; no new controls or old left-side Back button. */
:host([data-business-tools="true"]) .sv-history-dual{
 grid-column:3/5;grid-row:1;justify-self:end;align-self:center;
 display:flex;align-items:center;justify-content:center;
 width:var(--sv-nav-double-width,92px);height:var(--sv-nav-capsule-height,44px);margin:0;padding:0 var(--sv-nav-capsule-padding,3px);gap:0;
 border:var(--sv-white-pearl-edge,.75px solid rgba(255,255,255,.88));
 border-radius:var(--sv-nav-capsule-radius,999px);background:var(--sv-white-pearl-surface,rgba(255,255,255,.18));
 box-shadow:var(--sv-nav-capsule-shadow,var(--sv-white-pearl-dock-shadow,0 7px 21px rgba(42,52,72,.105)));
 -webkit-backdrop-filter:var(--sv-white-pearl-blur,blur(4px) saturate(104%));
 backdrop-filter:var(--sv-white-pearl-blur,blur(4px) saturate(104%));
}
:host([data-business-tools="true"]) .sv-history-dual :is(.sv-history-search,.sv-history-select){
 display:none!important;
}
:host([data-business-tools="true"]) .sv-history-dual :is(.sv-review-cards-control,.action),
:host([data-business-tools="true"]) .sv-history-dual :is(.sv-review-cards-control,.action):is(:active,:hover,:focus){
 display:grid;flex:0 0 var(--sv-nav-capsule-cell,42px);width:var(--sv-nav-capsule-cell,42px);min-width:var(--sv-nav-capsule-cell,42px);max-width:var(--sv-nav-capsule-cell,42px);
 height:var(--sv-nav-capsule-cell,42px);min-height:var(--sv-nav-capsule-cell,42px);max-height:var(--sv-nav-capsule-cell,42px);
 margin:0;padding:0;border:0;border-radius:50%;
 background:transparent;background-image:none;box-shadow:none;
 -webkit-backdrop-filter:none;backdrop-filter:none;
 opacity:1;filter:none;transform:none;translate:none;scale:1;
 transition:none;animation:none;
}
:host([data-business-tools="true"]) .sv-history-dual .sv-review-cards-control{order:1}
:host([data-business-tools="true"]) .sv-history-dual .action{order:2}
:host([data-business-tools="true"]) .title{pointer-events:none}
.company[hidden]{display:none!important}
:host([data-business-tools="true"]) .bar{grid-template-columns:minmax(0,1fr) var(--sv-nav-double-width,92px);column-gap:8px}
:host([data-business-tools="true"]) .sv-history-dual{grid-column:2;grid-row:1}
.company{
 grid-column:1;grid-row:1;align-self:center;justify-self:start;
 display:flex;align-items:center;gap:6px;min-width:0;max-width:100%;height:44px;
 padding:0 0 0 12px;margin:0;border:0;background:transparent;color:inherit;
 font:620 clamp(18px,5.4vw,24px)/1.15 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
 letter-spacing:-.025em;text-align:left;cursor:pointer;appearance:none;-webkit-appearance:none;
 -webkit-tap-highlight-color:transparent;transform:none;transition:none;
}
.company-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.company svg{display:block;flex:0 0 14px;width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}
.company:focus-visible{outline:2px solid currentColor;outline-offset:2px;border-radius:5px}


/* Dedicated All Tasks search: direct sibling of Back, using .control. */
:host([data-task-selecting="true"]) .sv-history-dual{display:none!important}
.sv-all-tasks-search{grid-column:4;grid-row:1;justify-self:end}
.sv-all-tasks-search svg{width:22px;height:22px;stroke-width:1.65}
.month[hidden]{display:none!important}
.month:focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:3px}
.month{
 grid-column:1/4;grid-row:1;justify-self:start;align-self:center;
 display:flex;align-items:baseline;gap:5px;max-width:100%;min-width:0;
 margin:0;padding:0;appearance:none;border:0;border-radius:0;
 background:transparent;box-shadow:none;color:inherit;cursor:pointer;
 font:600 clamp(28px,7.3vw,32px)/1.12 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
 letter-spacing:-.032em;white-space:nowrap;-webkit-tap-highlight-color:transparent;
}
/* Compact Work agenda: one shared row, no extra "All calendars" line.
   The month itself opens Calendar, alongside the original three 42px actions.
   Keep the 134px three-action capsule; narrower would shrink the touch areas. */
:host([data-agenda="true"]) .bar{
 grid-template-columns:minmax(0,1fr) var(--sv-nav-triple-width,134px);
 grid-template-rows:var(--sv-nav-single-size,44px);column-gap:8px;
}
:host([data-agenda="true"]) .month{
 grid-column:1;grid-row:1;justify-self:start;align-self:center;
 min-width:0;max-width:100%;overflow:hidden;
 font-size:clamp(21px,6.2vw,26px);
 line-height:1.12;font-weight:620;
 transform:none;transition:none;
}
:host([data-agenda="true"]) .month-name{
 min-width:0;overflow:hidden;text-overflow:ellipsis;
}
:host([data-agenda="true"]) .sv-history-dual{
 grid-column:2;grid-row:1;justify-self:end;width:var(--sv-nav-triple-width,134px);
}
/* Same right-hand action order as Cabinet: History · Cards · Plus.
   CSS-only reorder keeps original listeners, 42px slots and stable capsule. */
:host([data-agenda="true"]) .sv-history-dual .sv-history-search{order:1}
:host([data-agenda="true"]) .sv-history-dual .sv-review-cards-control{order:2}
:host([data-agenda="true"]) .sv-history-dual .action{order:3}

/* Root sections are named in the segmented tab bar. Nested/history
   screens retain the original first-row heading. */
:host([data-work-tabs="true"]:not([data-agenda="true"])) .title:not([hidden]){
 grid-column:2/4;grid-row:1;justify-self:stretch;align-self:center;
 font-size:20px;line-height:1.2;font-weight:590;letter-spacing:-.02em;
 text-align:center;padding:0;
}
.month-name{display:block;color:inherit;font-weight:620}
.month-year{
 display:block;color:#B23D2A;font-size:1em;font-weight:400;
 font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;
 letter-spacing:-.028em;font-variant-numeric:proportional-nums lining-nums;
}
/* Long week ranges must stay between Back and Add even at narrow widths.
   Only the year with its zodiac artwork needs the flex layout. */
:host([data-calendar-period="true"]) .title{
 display:block;min-width:0;max-width:100%;
 font-size:clamp(16px,4.8vw,19px);font-weight:620;letter-spacing:-.025em;
 overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
:host([data-calendar-period="true"]) .title:has(.sv-zodiac-symbol){
 display:flex;align-items:center;justify-content:center;gap:5px;
}
.sv-zodiac-symbol{
 display:inline-grid;place-items:center;flex:none;width:39px;height:39px;
 font-size:27px;line-height:1;filter:drop-shadow(0 2px 4px rgba(172,98,56,.12));
}
.sv-zodiac-symbol svg{display:block;width:39px;height:39px;overflow:visible;animation:horseBreathe 4.8s ease-in-out infinite}
.horse-heat{animation:horseGlow 4.8s ease-in-out infinite}
.horse-spark{animation:horseSpark 4.8s ease-in-out infinite}
@keyframes horseBreathe{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-1.3px) rotate(1.3deg)}}
@keyframes horseGlow{0%,100%{opacity:.2}50%{opacity:.75}}
@keyframes horseSpark{0%,100%{opacity:.15}45%{opacity:.78}65%{opacity:.35}}
@media(prefers-reduced-motion:reduce){.sv-zodiac-symbol svg,.horse-heat,.horse-spark{animation:none!important}}
:host([data-theme="dark"]){color:var(--sv-header-ink,#F6F6F8)}
:host([data-theme="dark"]) .bar{background:var(--sv-header-surface,#202023)}
/* The approved full-header glass is painted once behind this Shadow DOM.
   Do not cover it with the old opaque white toolbar. */
:host(:not([data-theme="dark"])[data-sv-full-glass-control]) .bar{
 background:transparent!important;background-image:none!important;
}
@media(prefers-reduced-transparency:reduce){
 :host(:not([data-theme="dark"])) .bar{background:#fff!important}
}
:host([data-theme="dark"]) .control,
:host([data-theme="dark"]) .control:is(:hover,:focus,:active){
 border:var(--sv-header-circle-border,1px solid rgba(255,255,255,.14));
 background:var(--sv-header-circle,#38383A);
 color:var(--sv-header-icon-ink,#F6F6F8);
 box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none;opacity:1;
}
:host([data-theme="dark"][data-business-tools="true"]) .sv-history-dual{
 background:var(--sv-header-circle,#38383A);
 border:var(--sv-header-circle-border,1px solid rgba(255,255,255,.14));
 box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none;
}
:host([data-theme="dark"][data-business-tools="true"]) .sv-history-dual :is(.sv-review-cards-control,.action),
:host([data-theme="dark"][data-business-tools="true"]) .sv-history-dual :is(.sv-review-cards-control,.action):is(:hover,:focus,:active){
 border:0;background:transparent;box-shadow:none;
}
:host([data-theme="dark"][data-task-tools="true"]) .sv-history-dual{
 background:var(--sv-header-circle,#38383A);
 border:var(--sv-header-circle-border,1px solid rgba(255,255,255,.14));
 box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none;
}
:host([data-theme="dark"][data-task-tools="true"]) .sv-history-dual .control,
:host([data-theme="dark"][data-task-tools="true"]) .sv-history-dual .control:is(:hover,:focus,:active){
 border:0;background:transparent;box-shadow:none;
}
:host([data-theme="dark"]) .calendar-jump,:host([data-theme="dark"]) .month-year{color:#F47883}
@media(prefers-reduced-transparency:reduce){
 :host(:not([data-theme="dark"])) .control{
  background:var(--sv-white-pearl-solid,#fff);
  -webkit-backdrop-filter:none;backdrop-filter:none;
 }
}
`;
 const BACK=window.SEYVEO_NAV_GLYPHS?.svg('back')||'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>';
 const PLUS=window.SEYVEO_NAV_GLYPHS?.svg('plus')||'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5.5v13M5.5 12h13"/></svg>';
 const SEARCH=window.SEYVEO_NAV_GLYPHS?.svg('search')||'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.8" cy="10.8" r="6.6"/><path d="M15.7 15.7 L21 21"/></svg>';
 function create(){
  const host=document.createElement('seyveo-work-head');
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML='<style>'+styles+'</style><header class="bar"><button class="control back sv-canonical-back" type="button" aria-label="Вернуться назад">'+BACK+'</button><button class="month" type="button" aria-label="Открыть календарь" hidden><span class="month-name">Ноябрь</span><span class="month-year">2026</span></button><button class="company" type="button" aria-label="Открыть профиль компании" hidden><span class="company-name">Моя компания</span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg></button><h1 class="title">Мои дела</h1><button class="control action" type="button" aria-label="Добавить дело">'+PLUS+'</button></header>';
  const back=shadow.querySelector('.back');
  const title=shadow.querySelector('.title');
  const month=shadow.querySelector('.month');
  const company=shadow.querySelector('.company');
  const add=shadow.querySelector('.action');
  host.dataset.theme=document.documentElement.dataset.theme==='dark'?'dark':'light';
  return {host,back,title,month,company,add,icons:{plus:PLUS,search:SEARCH}};
 }
 window.SEYVEO_WORK_HEADER=Object.freeze({create});
})();
