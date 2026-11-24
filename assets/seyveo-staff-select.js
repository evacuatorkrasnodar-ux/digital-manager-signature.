/* Staff select: native value, validation and form submission remain the source
   of truth. The visible menu uses the shared SEYVEO menu material. */
(()=>{
'use strict';
const selectors=['#svRecruitDetail select[name="vacancy"]','#svcpBreakAfter','#svcpBreakMinutes'];
let active=null;
for(const selector of selectors){
 const select=document.querySelector(selector);if(!select||select.dataset.svCustomSelect)continue;
 const field=select.parentElement;
 const label=Array.from(field.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim()||'Выбрать';
 // Avoid nesting interactive buttons inside the native label.
 const wrapper=document.createElement('div');wrapper.className='sv-form-picker';
 const caption=document.createElement('span');caption.className='sv-form-picker-caption';caption.textContent=label;
 const trigger=document.createElement('button');trigger.type='button';trigger.className='sv-form-picker-trigger';
 const value=document.createElement('span');value.className='sv-form-picker-value';
 const arrow=document.createElement('span');arrow.className='sv-form-picker-arrow';arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg>';
 trigger.append(value,arrow);
 const menu=document.createElement('div');menu.className='sv-menu-surface sv-form-picker-menu';menu.id='svPicker-'+(select.id||select.name);menu.hidden=true;menu.setAttribute('role','group');menu.setAttribute('aria-label',label);
 trigger.setAttribute('aria-controls',menu.id);trigger.setAttribute('aria-expanded','false');
 const message=document.createElement('small');message.className='sv-form-picker-error';message.textContent='Выберите значение';message.hidden=true;
 field.before(wrapper);wrapper.append(caption,select,trigger,menu,message);if(field.tagName==='LABEL')field.remove();
 select.dataset.svCustomSelect='true';select.classList.add('sv-form-picker-native');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
 function sync(){
  value.textContent=select.selectedOptions[0]?.textContent||'Выбрать';
  trigger.setAttribute('aria-label',label+': '+value.textContent);
  trigger.disabled=select.disabled;
  if(select.value){message.hidden=true;trigger.removeAttribute('aria-invalid');}
  for(const item of menu.querySelectorAll('button'))item.setAttribute('aria-pressed',String(item.dataset.value===select.value));
 }
 function close(restore=false){menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(active?.trigger===trigger)active=null;if(restore)trigger.focus({preventScroll:true});}
 function rebuild(){
  menu.replaceChildren();
  for(const option of select.options){
   if(!option.value||option.hidden)continue;
   const item=document.createElement('button');item.type='button';item.className='sv-menu-choice';item.dataset.value=option.value;item.disabled=option.disabled;
   const text=document.createElement('span');text.textContent=option.textContent;
   const mark=document.createElement('span');mark.className='sv-form-picker-check';mark.textContent='✓';mark.setAttribute('aria-hidden','true');item.append(text,mark);
   item.setAttribute('aria-pressed',String(option.selected));
   item.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));sync();close(true)});
   menu.append(item);
  }
  if(!menu.children.length){const empty=document.createElement('p');empty.className='sv-form-picker-empty';empty.textContent='Сначала добавьте вакансию.';menu.append(empty);}
  sync();
 }
 function open(){
  active?.close();rebuild();menu.hidden=false;trigger.setAttribute('aria-expanded','true');active={trigger,wrapper,close};
  // Keep options inside the existing scrollport; choose the side with more room.
  const box=trigger.getBoundingClientRect(),scroll=wrapper.closest('.sv-page-scroll'),bounds=scroll?.getBoundingClientRect();
  const bottom=Math.min(window.innerHeight,bounds?.bottom||window.innerHeight);
  const top=Math.max(0,bounds?.top||0)+60;
  const below=bottom-box.bottom-8,above=box.top-top-8;
  wrapper.classList.toggle('sv-picker-up',below<Math.min(menu.scrollHeight,230)&&above>below);
  menu.style.maxHeight=Math.max(84,Math.min(260,Math.max(below,above)))+'px';
 }
 trigger.addEventListener('click',()=>{if(menu.hidden)open();else close()});
 trigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(menu.hidden)open();menu.querySelector('button:not(:disabled)')?.focus();}});
 wrapper.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!menu.hidden){e.preventDefault();e.stopPropagation();close(true);return}
  if(menu.hidden||!['ArrowDown','ArrowUp','Home','End'].includes(e.key)||e.target===trigger)return;
  const buttons=Array.from(menu.querySelectorAll('button:not(:disabled)'));if(!buttons.length)return;
  const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();
 });
 wrapper.addEventListener('focusout',()=>queueMicrotask(()=>{if(!wrapper.contains(document.activeElement))close()}));
 select.addEventListener('change',sync);
 select.addEventListener('invalid',e=>{e.preventDefault();message.hidden=false;trigger.setAttribute('aria-invalid','true');trigger.focus()});
 select.form?.addEventListener('reset',()=>queueMicrotask(sync));
 new MutationObserver(()=>{if(menu.hidden)sync();else rebuild()}).observe(select,{subtree:true,childList:true,attributes:true,characterData:true});
 const dialog=wrapper.closest('dialog');dialog?.addEventListener('close',()=>close());
 if(dialog)new MutationObserver(()=>{if(dialog.open)sync();else close()}).observe(dialog,{attributes:true,attributeFilter:['open']});
 window.addEventListener('seyveo:break-schedule-updated',sync);
 window.addEventListener('storage',sync);
 wrapper.closest('details')?.addEventListener('toggle',sync);
 sync();
}
document.addEventListener('pointerdown',e=>{if(active&&!active.wrapper.contains(e.target))active.close()},true);
})();
