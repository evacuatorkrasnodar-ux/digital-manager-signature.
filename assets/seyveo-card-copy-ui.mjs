/* Non-invasive structured-copy enhancer for Quiet Cinema demos.
   Adds compact explanation without modifying orb, dock, animations or action handlers. */
import {trainingCardCopy} from './seyveo-card-copy.mjs';
const host=document.getElementById('seyveoLivingTiles');
if(host){
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
  if(!data){prior?.remove();return;}
  if(prior?.dataset.kind===kind)return;
  prior?.remove();
  const guide=make('section','');guide.className='sv-copy-guide';guide.dataset.kind=kind;
  guide.setAttribute('aria-label','Пояснение Сэйви');
  // Facts, drafts and Sayvi suggestions are already shown by Quiet Cinema.\n  // Keep one concise additional reason instead of duplicating three sections.\n  for(const [label,value] of [['Почему важно',data.reason]]){
   const box=document.createElement('div');box.append(make('small',label),make('p',value));guide.append(box);
  }
  const hero=original.querySelector('.lm-hero');
  if(hero)hero.after(guide);else original.prepend(guide);
 }
 const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(render)});
 observer.observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['data-lm-subject','data-lm-mode']});
 render();
}
