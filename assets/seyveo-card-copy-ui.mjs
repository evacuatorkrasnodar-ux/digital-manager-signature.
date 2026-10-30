/* Non-invasive structured-copy enhancer for Quiet Cinema demos.
   Adds compact explanation without modifying orb, dock, animations or action handlers. */
import {trainingCardCopy} from './seyveo-card-copy.mjs';
const host=document.getElementById('seyveoLivingTiles');
if(host){
 const mobileCss=document.createElement('link');mobileCss.rel='stylesheet';mobileCss.href='assets/seyveo-card-mobile-density.css?v=5';document.head.append(mobileCss);
 const style=document.createElement('style');
 style.textContent='.sv-copy-guide{margin:6px 0 10px;padding:8px 0;border-top:1px solid var(--soft-line,#ffffff25);display:grid;gap:9px}.sv-copy-guide p{margin:2px 0 0;font-size:13px;line-height:1.45;color:var(--text,#fff)}.sv-copy-guide small{display:block;font-size:10px;letter-spacing:.09em;color:var(--secondary,#b9c8c1);text-transform:uppercase}';
 document.head.append(style);
 const make=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;return el};
 let scheduled=false;
 function render(){
  scheduled=false;
  const field=host.querySelector('.lm-field');
  const original=field?.querySelector('.lm-primary');
  const kind=field?.dataset.lmSubject;
  const data=field?.dataset.lmMode==='preview'?trainingCardCopy(kind):null;
  const prior=original?.querySelector('.sv-copy-guide');
  if(!data){prior?.remove();field?.querySelector('.sv-card-expand')?.remove();field?.classList.remove('sv-card-expanded');return;}
  // The work preview already shows Elena's message in its hero; no second text block.
  if(kind==='work'){prior?.remove();field.querySelector('.sv-card-expand')?.remove();field.classList.remove('sv-card-expanded');return;}
  // A newly featured card starts compact; switching cards never keeps
  // the previous card's expanded state.
  if(field.dataset.svCopyKind!==kind){
   field.dataset.svCopyKind=kind;
   field.classList.remove('sv-card-expanded');
   const oldToggle=field.querySelector('.sv-card-expand');
   if(oldToggle){oldToggle.textContent='Развернуть';oldToggle.setAttribute('aria-expanded','false');}
  }
  let toggle=field.querySelector('.sv-card-expand');
  if(!toggle){toggle=make('button','Развернуть');toggle.type='button';toggle.className='sv-card-expand';toggle.setAttribute('aria-expanded','false');toggle.addEventListener('click',()=>{const expanded=field.classList.toggle('sv-card-expanded');toggle.textContent=expanded?'Свернуть':'Развернуть';toggle.setAttribute('aria-expanded',String(expanded));});const actions=field.querySelector('.lm-actions');if(actions)actions.after(toggle);else original.append(toggle);}
  if(field.querySelector('.lm-mail-content:not([hidden]) textarea, .lm-document-content:not([hidden]) textarea')){field.classList.add('sv-card-expanded');toggle.textContent='Свернуть';toggle.setAttribute('aria-expanded','true');}
  if(prior?.dataset.kind===kind)return;
  prior?.remove();
  const guide=make('section','');guide.className='sv-copy-guide';guide.dataset.kind=kind;
  guide.setAttribute('aria-label','Пояснение Сэйви');
  // Facts, drafts and Sayvi suggestions are already shown by Quiet Cinema.
  // Keep one concise additional reason instead of duplicating three sections.
  for(const [label,value] of [['Почему важно',data.reason]]){
   const box=document.createElement('div');box.append(make('small',label),make('p',value));guide.append(box);
  }
  const hero=original.querySelector('.lm-hero');
  if(hero)hero.after(guide);else original.prepend(guide);
 }
 const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(render)});
 observer.observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['data-lm-subject','data-lm-mode']});
 render();
}
