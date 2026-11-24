/* SEYVEO · native scroll-under glass. One visual layer, no scroll interception. */
(()=>{
'use strict';
const ids=['seyveoCompanyDialog','seyveoQrCardDialog','seyveoContactsDialog'];
for(const id of ids){
 const screen=document.getElementById(id);
 const body=document.getElementById(id+'Scroll');
 if(!screen||!body)continue;
 const header=Array.from(screen.children).find(el=>el.matches('header,.seyveo-passport-dialog-head'));
 if(!header)continue;
 const material=document.createElement('span');
 material.className='sv-scroll-glass-material';
 material.setAttribute('aria-hidden','true');
 header.prepend(material);
 header.classList.add('sv-scroll-glass-head');
 let pending=false;
 const measure=()=>{
  if(!screen.open)return;
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
  if(!screen.open)return;
  const progress=Math.max(0,Math.min(1,body.scrollTop/12));
  screen.style.setProperty('--sv-scroll-glass-opacity',String(progress));
 };
 body.addEventListener('scroll',()=>{
  if(!pending){pending=true;requestAnimationFrame(paint)}
 },{passive:true});
 new MutationObserver(()=>{if(screen.open){measure();requestAnimationFrame(measure)}})
  .observe(screen,{attributes:true,attributeFilter:['open','data-sv-company-mode','data-sv-company-filled']});
 if(typeof ResizeObserver==='function')new ResizeObserver(measure).observe(header);
 window.addEventListener('resize',measure,{passive:true});
 if(screen.open)measure();
}
})();
