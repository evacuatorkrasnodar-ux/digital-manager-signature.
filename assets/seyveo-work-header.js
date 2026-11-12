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
  min-height:calc(62px + var(--gutter-t));
  height:calc(62px + var(--gutter-t));
  margin:calc(-1 * var(--gutter-t)) 0 0 calc(-1 * var(--gutter-l));
  color:#1C1C1E;
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
  grid-template-columns:42px minmax(0,1fr) 42px;
  align-items:center;
  column-gap:8px;
  padding:var(--gutter-t) var(--gutter-r) 0 var(--gutter-l);
  margin:0;
  border:0;
  border-radius:0;
  box-shadow:none;
  background:#F2F2F7;
 }
 .title {
  grid-column:2;grid-row:1;
  min-width:0;margin:0;padding:0;
  font-size:18.5px;font-weight:580;line-height:1.2;
  letter-spacing:-.02em;text-align:center;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  color:inherit;
 }
 .control {
  appearance:none;-webkit-appearance:none;
  grid-row:1;
  width:42px;height:42px;min-width:42px;min-height:42px;
  display:grid;place-items:center;
  padding:0;margin:0;
  border-radius:50%;
  border:1.75px solid rgba(255,255,255,.94);
  background:rgba(190,193,202,.43);
  -webkit-backdrop-filter:blur(12px) saturate(108%);
  backdrop-filter:blur(12px) saturate(108%);
  box-shadow:0 0 0 .7px rgba(164,170,184,.30),
   inset 0 1px 1px rgba(75,82,96,.055),
   inset 0 -1px 0 rgba(255,255,255,.18),
   inset .6px 0 .7px rgba(255,255,255,.16),
   inset -.6px 0 .8px rgba(75,82,96,.055),
   0 1px 2px rgba(82,88,103,.045);
  color:#0B0B0D;
  cursor:pointer;
  -webkit-tap-highlight-color:transparent;
  touch-action:manipulation;
 }
 .back{grid-column:1;justify-self:start}
 .action{grid-column:3;justify-self:end}
 .control[hidden]{display:none!important}
 .control svg{
  display:block;width:21px;height:21px;
  stroke:currentColor;stroke-width:1.8;fill:none;
  stroke-linecap:round;stroke-linejoin:round;
 }
 .action svg{width:22px;height:22px;stroke-width:1.85}
 .control:active{opacity:.72}
 .control:focus-visible{outline:2px solid currentColor;outline-offset:2px}
 :host([data-theme="dark"]){color:#F6F6F8}
 :host([data-theme="dark"]) .bar{
  background:#202023;border:0;box-shadow:none
 }
 :host([data-theme="dark"]) .control{
  background:#38383A;color:#F6F6F8;
  border:1px solid rgba(255,255,255,.14);
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
  shadow.innerHTML='<style>'+styles+'</style><header class="bar"><button class="control back" type="button" aria-label="Вернуться назад">'+BACK+'</button><h1 class="title">Мои дела</h1><button class="control action" type="button" aria-label="Добавить дело">'+PLUS+'</button></header>';
  const back=shadow.querySelector('.back');
  const title=shadow.querySelector('.title');
  const add=shadow.querySelector('.action');
  host.dataset.theme=document.documentElement.dataset.theme==='dark'?'dark':'light';
  return {host,back,title,add,icons:{plus:PLUS,search:SEARCH}};
 }
 window.SEYVEO_WORK_HEADER=Object.freeze({create});
})();