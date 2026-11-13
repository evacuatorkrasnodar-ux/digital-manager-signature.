/* SEYVEO / Work header v2.
   Completely rebuilt isolated header: one component, one material source.
   Shadow DOM prevents all legacy app/global CSS from styling its controls.
   The existing Work Shell owns navigation and dialogs, not visual styles. */
(()=>{
 'use strict';
 const styles=String.raw`
 :host {
  --gutter-l:max(20px,calc(12px + env(safe-area-inset-left,0px)));
  --gutter-r:max(20px,calc(12px + env(safe-area-inset-right,0px)));
  --gutter-t:calc(24px + env(safe-area-inset-top,0px));
  display:block;
  box-sizing:border-box;
  flex:none;
  order:0;
  align-self:flex-start;
  width:calc(100% + var(--gutter-l) + var(--gutter-r));
  min-height:calc(var(--sv-header-row,62px) + var(--gutter-t));
  height:calc(var(--sv-header-row,62px) + var(--gutter-t));
  margin:calc(-1 * var(--gutter-t)) 0 0 calc(-1 * var(--gutter-l));
  color:var(--sv-header-ink,#1C1C1E);
  background:transparent;
  border:0;
  border-radius:0;
  box-shadow:none;
  filter:none;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
 }
 @media(max-width:649px){
  :host { --gutter-t:calc(16px + env(safe-area-inset-top,0px)); }
 }
 :host([hidden]){display:none!important}
 *,*::before,*::after{box-sizing:border-box}
 .bar {
  width:100%;
  height:100%;
  display:grid;
  grid-template-columns:var(--sv-header-slot,42px) minmax(0,1fr) var(--sv-header-slot,42px);
  align-items:center;
  column-gap:var(--sv-header-gap,8px);
  padding:var(--gutter-t) var(--gutter-r) 0 var(--gutter-l);
  margin:0;
  border:0;
  border-radius:0;
  box-shadow:none;
  background:#FFFFFF; /* Match the white content surface, no grey header strip. */
 }
 .title {
  grid-column:2;grid-row:1;
  min-width:0;margin:0;padding:0;
  font-size:var(--sv-header-title-size,20px);font-weight:var(--sv-header-title-weight,590);line-height:var(--sv-header-title-leading,1.2);
  letter-spacing:var(--sv-header-title-tracking,-.02em);text-align:center;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  color:inherit;
 }
 .month {
  grid-column:1 / 3;grid-row:1;justify-self:start;align-self:center;
  display:flex;align-items:baseline;gap:6px;
  max-width:100%;min-width:0;padding:0;margin:0;
  appearance:none;border:0;border-radius:0;background:transparent;
  box-shadow:none;color:inherit;cursor:pointer;text-align:left;
  font:680 clamp(21px,5.7vw,26px)/1.15 -apple-system,BlinkMacSystemFont,"SF Pro Display",system-ui,sans-serif;
  letter-spacing:-.035em;white-space:nowrap;
  -webkit-tap-highlight-color:transparent;
 }
 .month[hidden]{display:none!important}
 .month-name{display:block;color:inherit}
 .month-year{display:block;color:#EC636E;font-variant-numeric:tabular-nums}
 :host([data-theme="dark"]) .month-year{color:#F47883}
 .month:focus-visible{outline:2px solid currentColor;outline-offset:5px;border-radius:3px}
 .control {
  appearance:none;-webkit-appearance:none;
  grid-row:1;
  width:var(--sv-header-slot,42px);height:var(--sv-header-slot,42px);min-width:var(--sv-header-slot,42px);min-height:var(--sv-header-slot,42px);
  display:grid;place-items:center;
  padding:0;margin:0;
  border-radius:50%;
  border:var(--sv-header-circle-border,1.75px solid rgba(255,255,255,.94));
  background:var(--sv-header-circle,rgba(190,193,202,.43));
  -webkit-backdrop-filter:var(--sv-header-circle-filter,blur(12px) saturate(108%));
  backdrop-filter:var(--sv-header-circle-filter,blur(12px) saturate(108%));
  box-shadow:var(--sv-header-circle-shadow,0 0 0 .7px rgba(164,170,184,.30));
  color:var(--sv-header-icon-ink,#0B0B0D);
  cursor:pointer;
  -webkit-tap-highlight-color:transparent;
  touch-action:manipulation;
 }
 .back{grid-column:1;justify-self:start}
 .action{grid-column:3;justify-self:end}
 .control[hidden]{display:none!important}
 .control svg{
  display:block;width:var(--sv-header-action-icon,22px);height:var(--sv-header-action-icon,22px);
  stroke:currentColor;stroke-width:1.8;fill:none;
  stroke-linecap:round;stroke-linejoin:round;
 }
 /* Larger back chevron, same delicate hairline. Keep the button rim and Plus untouched. */
 .back svg{width:var(--sv-header-back-icon,25px);height:var(--sv-header-back-icon,25px);stroke-width:var(--sv-header-back-weight,1.45)}
 .action svg{width:var(--sv-header-action-icon,22px);height:var(--sv-header-action-icon,22px);stroke-width:var(--sv-header-action-weight,1.85)}
 .control:active{opacity:.72}
 .control:focus-visible{outline:2px solid currentColor;outline-offset:2px}
 :host([data-theme="dark"]){color:var(--sv-header-ink,#F6F6F8)}
 :host([data-theme="dark"]) .bar{
  background:var(--sv-header-surface,#202023);border:0;box-shadow:none
 }
 :host([data-theme="dark"]) .control{
  background:var(--sv-header-circle,#38383A);color:var(--sv-header-icon-ink,#F6F6F8);
  border:var(--sv-header-circle-border,1px solid rgba(255,255,255,.14));
  -webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:none
 }
 @media(prefers-reduced-transparency:reduce){
  :host(:not([data-theme="dark"])) .control{
   background:#E3E4E9;
   -webkit-backdrop-filter:none;backdrop-filter:none
  }
 }
 `;
 const BACK='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14.5 5-7 7 7 7"/></svg>';
 const PLUS='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v16M4 12h16"/></svg>';
 const SEARCH='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 5 5"/></svg>';
 function create(){
  const host=document.createElement('seyveo-work-head');
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML='<style>'+styles+'</style><header class="bar"><button class="control back" type="button" aria-label="Вернуться назад">'+BACK+'</button><button class="month" type="button" aria-label="Вернуться к сегодняшнему дню" hidden><span class="month-name">Ноябрь</span><span class="month-year">2026</span></button><h1 class="title">Мои дела</h1><button class="control action" type="button" aria-label="Добавить дело">'+PLUS+'</button></header>';
  const back=shadow.querySelector('.back');
  const title=shadow.querySelector('.title');
  const month=shadow.querySelector('.month');
  const add=shadow.querySelector('.action');
  host.dataset.theme=document.documentElement.dataset.theme==='dark'?'dark':'light';
  return {host,back,title,month,add,icons:{plus:PLUS,search:SEARCH}};
 }
 window.SEYVEO_WORK_HEADER=Object.freeze({create});
})();