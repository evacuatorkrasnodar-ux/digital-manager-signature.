/* SEYVEO · native scroll-under glass. One visual layer, no scroll interception. */
(()=>{
'use strict';
const ids=['seyveoCompanyDialog','seyveoQrCardDialog','seyveoContactsDialog','picturePage','svcpManagerPeople','svStaffInvitePage','svRecruitDetail','svHrInterview'];
const mounted=new WeakSet();
function register(screen){
 if(!screen||mounted.has(screen))return;
 const body=Array.from(screen.children).find(el=>el.classList.contains('sv-page-scroll'));
 if(!body)return;
 const header=Array.from(screen.children).find(el=>el.matches('header,.seyveo-passport-dialog-head'));
 if(!header)return;
 mounted.add(screen);
 const isActive=()=>screen.tagName==='DIALOG'?screen.open:!screen.hidden;
 const material=document.createElement('span');
 material.className='sv-scroll-glass-material';
 material.setAttribute('aria-hidden','true');
 header.prepend(material);
 header.classList.add('sv-scroll-glass-head');
 let pending=false;
 const measure=()=>{
  if(!isActive())return;
  const mode=getComputedStyle(body).display;
  if(mode==='contents'||mode==='none'){
   screen.classList.remove('sv-scroll-glass-ready');
   return;
  }
  const style=getComputedStyle(header);
  const gap=Math.max(0,parseFloat(style.marginBottom)||0);
  const height=header.getBoundingClientRect().height;
  if(height<=0)return;
  const overlap=Math.ceil(height+gap);
  screen.style.setProperty('--sv-scroll-underlap',overlap+'px');
  screen.style.setProperty('--sv-scroll-glass-tail',Math.max(12,gap+10)+'px');
  screen.classList.add('sv-scroll-glass-ready');
  paint();
 };
 const paint=()=>{
  pending=false;
  if(!isActive())return;
  const progress=Math.max(0,Math.min(1,body.scrollTop/12));
  screen.style.setProperty('--sv-scroll-glass-opacity',String(progress));
 };
 body.addEventListener('scroll',()=>{
  if(!pending){pending=true;requestAnimationFrame(paint)}
 },{passive:true});
 new MutationObserver(()=>{if(isActive()){measure();requestAnimationFrame(measure)}})
  .observe(screen,{attributes:true,attributeFilter:['open','hidden','data-sv-company-mode','data-sv-company-filled']});
 if(typeof ResizeObserver==='function')new ResizeObserver(measure).observe(header);
 window.addEventListener('resize',measure,{passive:true});
 if(isActive())measure();
}
function init(){for(const id of [...ids,'svStaffProfile'])register(document.getElementById(id));}
window.SEYVEO_SCROLL_GLASS=Object.freeze({register});
init();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
})();
