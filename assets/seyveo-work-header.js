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
 --work-left:max(8px,env(safe-area-inset-left,0px));
 --work-right:max(12px,env(safe-area-inset-right,0px));
 --work-top:6px;
 display:block;box-sizing:border-box;flex:none;order:0;align-self:stretch;
 width:100%;max-width:100%;height:50px;min-height:50px;margin:0;
 color:var(--sv-header-ink,#1C1C1E);
 background:transparent;border:0;box-shadow:none;filter:none;
 font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
}
:host([data-work-tabs="true"]){height:78px;min-height:78px}
:host([hidden]){display:none!important}
*,*::before,*::after{box-sizing:border-box}
.bar{
 display:grid;grid-template-columns:44px 44px minmax(0,1fr) 44px;
 grid-template-rows:44px minmax(0,1fr);column-gap:8px;align-items:center;
 width:100%;height:100%;margin:0;
 padding:var(--work-top) var(--work-right) 0 var(--work-left);
 background:#fff;border:0;border-radius:0;box-shadow:none;overflow:visible;
}
:host(:not([data-work-tabs="true"])) .bar{grid-template-rows:44px}
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
 box-sizing:border-box;flex:0 0 44px;width:44px;min-width:44px;max-width:44px;
 height:44px;min-height:44px;max-height:44px;
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
.back svg{width:23px;height:23px;stroke-width:1.45}
.action{grid-column:4;grid-row:1;justify-self:end}
.action svg{width:22px;height:22px;stroke-width:1.8}
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
/* In Cabinet Back, Review and Plus share one grid row.
   In My Tasks the SAME actions sit in one capsule at upper right. */
.sv-history-dual{display:contents}
.sv-history-search,.sv-history-select{display:none}
:host([data-task-tools="true"]) .sv-history-dual{
 grid-column:3/5;grid-row:1;justify-self:end;align-self:center;
 display:flex;align-items:center;justify-content:center;
 width:134px;height:44px;margin:0;padding:0 4px;gap:0;
 border:var(--sv-white-pearl-edge,.75px solid rgba(255,255,255,.88));
 border-radius:999px;background:var(--sv-white-pearl-surface,rgba(255,255,255,.18));
 box-shadow:var(--sv-white-pearl-dock-shadow,0 7px 21px rgba(42,52,72,.105));
 -webkit-backdrop-filter:var(--sv-white-pearl-blur,blur(4px) saturate(104%));
 backdrop-filter:var(--sv-white-pearl-blur,blur(4px) saturate(104%));
}
:host([data-task-tools="true"]) .sv-history-dual .control,
:host([data-task-tools="true"]) .sv-history-dual .control:is(:hover,:focus,:active){
 display:grid;flex:0 0 42px;width:42px;min-width:42px;max-width:42px;
 height:42px;min-height:42px;max-height:42px;
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
:host([data-task-selecting="true"]) .sv-history-dual{
 width:44px;height:44px;padding:0 1px;
}
:host([data-task-selecting="true"]) .sv-history-dual .control:not(.sv-history-search){display:none!important}
:host([data-task-selecting="true"]) .sv-history-dual .sv-history-search{
 display:grid;flex:0 0 42px;width:42px;height:42px;
}
.calendar-jump{
 grid-column:1/3;grid-row:1;justify-self:start;align-self:center;
 display:inline-flex;align-items:center;gap:9px;
 appearance:none;border:0;background:transparent;padding:0;margin:0;
 color:#A83D27;font:560 16.5px/1.2 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
 letter-spacing:-.012em;cursor:pointer;-webkit-tap-highlight-color:transparent;
}
.calendar-jump svg{
 display:block;width:23px;height:22px;fill:none;stroke:currentColor;
 stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;
}
.calendar-jump[hidden],.month[hidden]{display:none!important}
.calendar-jump:focus-visible,.month:focus-visible{
 outline:2px solid currentColor;outline-offset:3px;border-radius:3px;
}
.month{
 grid-column:1/4;grid-row:1;justify-self:start;align-self:center;
 display:flex;align-items:baseline;gap:5px;max-width:100%;min-width:0;
 margin:0;padding:0;appearance:none;border:0;border-radius:0;
 background:transparent;box-shadow:none;color:inherit;cursor:pointer;
 font:600 clamp(28px,7.3vw,32px)/1.12 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
 letter-spacing:-.032em;white-space:nowrap;-webkit-tap-highlight-color:transparent;
}
:host([data-agenda="true"]) .month{grid-row:2;align-self:center}
.month-name{display:block;color:inherit;font-weight:620}
.month-year{
 display:block;color:#B23D2A;font-size:1em;font-weight:400;
 font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;
 letter-spacing:-.028em;font-variant-numeric:proportional-nums lining-nums;
}
:host([data-calendar-period="true"]) .title{
 display:flex;align-items:center;justify-content:center;gap:5px;
 font-size:19px;font-weight:620;letter-spacing:-.025em;overflow:visible;
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
:host([data-theme="dark"]) .control,
:host([data-theme="dark"]) .control:is(:hover,:focus,:active){
 border:var(--sv-header-circle-border,1px solid rgba(255,255,255,.14));
 background:var(--sv-header-circle,#38383A);
 color:var(--sv-header-icon-ink,#F6F6F8);
 box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none;opacity:1;
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
 const BACK='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14.5 5-7 7 7 7"/></svg>';
 const PLUS='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v16M4 12h16"/></svg>';
 const SEARCH='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 5 5"/></svg>';
 function create(){
  const host=document.createElement('seyveo-work-head');
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML='<style>'+styles+'</style><header class="bar"><button class="control back sv-canonical-back" type="button" aria-label="Вернуться назад">'+BACK+'</button><button class="calendar-jump" type="button" aria-label="Открыть все календари" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg><span>Все календари</span></button><button class="month" type="button" aria-label="Открыть календарь" hidden><span class="month-name">Ноябрь</span><span class="month-year">2026</span></button><h1 class="title">Мои дела</h1><button class="control action" type="button" aria-label="Добавить дело">'+PLUS+'</button></header>';
  const back=shadow.querySelector('.back');
  const title=shadow.querySelector('.title');
  const month=shadow.querySelector('.month');
  const calendarJump=shadow.querySelector('.calendar-jump');
  const add=shadow.querySelector('.action');
  host.dataset.theme=document.documentElement.dataset.theme==='dark'?'dark':'light';
  return {host,back,title,month,calendarJump,add,icons:{plus:PLUS,search:SEARCH}};
 }
 window.SEYVEO_WORK_HEADER=Object.freeze({create});
})();
