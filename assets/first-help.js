/* SEYVEO / Первая помощь v1
   In-place, opt-in interactive tour. No screenshots, external requests or
   duplicated business data. Highlights actual controls without changing them.
   First-launch offer only for new local users; always replayable in Management. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const ui=$('firstHelpCoach'),panel=$('firstHelpPanel'),spot=$('firstHelpSpot');
const shades=[0,1,2,3].map(i=>$('firstHelpShade'+i));
const title=$('firstHelpTitle'),text=$('firstHelpText'),count=$('firstHelpCount');
const go=$('firstHelpNext'),back=$('firstHelpBack'),exit=$('firstHelpExit');
const badge=$('firstHelpBadge'),progress=$('firstHelpProgress');
const entry=$('openFirstHelp'),onboard=$('onboardDialog');
if(!ui||!panel||!spot||shades.some(x=>!x)||!entry)return;
const KEY='seyveo-first-help-seen-v1';
const FIRST=!safeGet(KEY)&&![
 'dm-signature-living-v2','dm-signature-living-v1','seyveo-notes-v1',
 'seyveo-first-acquaintance-v1','seyveo-first-acquaintance-skipped-v1'
].some(x=>safeGet(x)!==null);
const steps=[
 {name:'Привет! Я SEYVEO.',body:'Покажу, как со мной общаться и где искать нужное. Одно действие за раз — всё просто.',target:'orb',button:'Начать',label:'ПЕРВОЕ ЗНАКОМСТВО'},
 {name:'Вот ваш помощник',body:'Нажмите на центральную кнопку внизу. Она откроет поле для вопроса.',target:'assistantButton',button:'Дальше',hint:'Нажмите подсвеченную кнопку'},
 {name:'Можно просто написать',body:'Например: «Что у меня сегодня?». Нажмите «Попробовать пример» — я сам покажу, как это работает.',target:'ask',button:'Попробовать пример',hint:'Можно также написать свой вопрос'},
 {name:'Вот как я отвечаю',body:'Сфера мягко оживает, а ответ появляется под ней. В истории разговор можно найти снова.',target:'orb',button:'Показать разделы',hint:'Ответ — пока демонстрационный'},
 {name:'Дела',body:'Здесь ваши задачи, поручения и история. Нажмите «Дела» в нижней панели.',target:'navTasks',button:'Дальше',hint:'Попробуйте нажать кнопку'},
 {name:'Картина',body:'Здесь показатели бизнеса. Пока часть цифр демонстрационная. Нажмите «Картина».',target:'navPicture',button:'Дальше',hint:'Здесь видно состояние дел'},
 {name:'Управление',body:'Здесь меняют настройки и запускают «Первую помощь» снова. Нажмите «Управление».',target:'navManage',button:'Дальше',hint:'Помощь можно повторить в любой момент'},
 {name:'Мой мир',body:'Глобус наверху открывает личные разделы: календарь, блокнот, здоровье, заботу и людей. Нажмите на него.',target:'homeWorldTrigger',button:'Дальше',hint:'Личное — отдельно от бизнеса'},
 {name:'Готово! Вы умеете главное.',body:'Нажать. Спросить. Получить ответ. Остальное подскажу по ходу работы. А если забудете — повторите урок в «Управлении».',target:'orb',button:'Закончить',label:'ВЫ УЖЕ ЗНАКОМЫ'}
];
let active=false,step=0,previousFocus=null,lastSuccess='';
let reflow=0;
function safeGet(k){try{return localStorage.getItem(k)}catch{return null}}
function seen(){try{localStorage.setItem(KEY,'1')}catch{}}
function feedback(){document.dispatchEvent(new Event('seyveo:silk-touch'))}
function navigateHome(){
 if(location.hash){
  $('navHome')?.click();
 }
 if(!$('homeWorldPopover')?.hidden){
  $('homeWorldTrigger')?.click();
 }
}
function cleanPaint(){
 for(const e of shades){e.style.cssText='';e.hidden=true}
 spot.hidden=true;
}
function rectFor(target){
 if(!target)return null;
 const r=target.getBoundingClientRect();
 if(r.width<2||r.height<2)return null;
 const vw=document.documentElement.clientWidth||window.innerWidth;
 const vh=window.visualViewport?.height||window.innerHeight;
 const offset=window.visualViewport?.offsetTop||0;
 // An offscreen target cannot be meaningfully spotlighted; show a centered
 // explanation instead of a marker outside the user's visible viewport.
 if(r.right<=0||r.left>=vw||r.bottom<=offset||r.top>=offset+vh)return null;
 const x=Math.max(4,r.left-7),y=Math.max(offset+4,r.top-7);
 const right=Math.min(vw-4,r.right+7),bottom=Math.min(offset+vh-4,r.bottom+7);
 return {x,y,w:Math.max(0,right-x),h:Math.max(0,bottom-y),vw,top:offset,vh};
}
function shade(el,left,top,width,height){
 const visible=width>0&&height>0;
 el.hidden=!visible;
 if(visible){
  el.style.left=left+'px';el.style.top=top+'px';
  el.style.width=width+'px';el.style.height=height+'px';
 }
}
function layout(){
 if(!active)return;
 const row=steps[step],target=$(row.target);
 const r=rectFor(target);
 const vw=document.documentElement.clientWidth||window.innerWidth;
 const vh=window.visualViewport?.height||window.innerHeight;
 const offset=window.visualViewport?.offsetTop||0;
 if(r&&r.w>0&&r.h>0){
  const endY=r.y+r.h;
  shade(shades[0],0,offset,vw,Math.max(0,r.y-offset));
  shade(shades[1],0,r.y,Math.max(0,r.x),r.h);
  shade(shades[2],r.x+r.w,r.y,Math.max(0,vw-r.x-r.w),r.h);
  shade(shades[3],0,endY,vw,Math.max(0,offset+vh-endY));
  spot.hidden=false;
  Object.assign(spot.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});
 }else{
  cleanPaint();
  shade(shades[0],0,offset,vw,vh);
 }
 // Position a small lesson card away from the highlighted control; preserve
 // the dock, orb and viewport inset. No layout changes to the underlying app.
 const cardW=Math.max(220,Math.min(vw-28,344));
 const cardH=panel.offsetHeight||205;
 const pad=12;
 const lower=r?r.y+r.h+15:offset+vh*.46;
 const upper=r?r.y-cardH-15:offset+vh*.2;
 let top;
 if(r&&lower+cardH<=offset+vh-pad)top=lower;
 else if(r&&upper>=offset+pad)top=upper;
 else top=offset+Math.max(pad,(vh-cardH)/2);
 if(step===0||step===8)top=offset+Math.max(pad,Math.min(vh-cardH-pad,vh*.60));
 top=Math.max(offset+pad,Math.min(offset+vh-cardH-pad,top));
 panel.style.width=cardW+'px';
 panel.style.left=Math.round((vw-cardW)/2)+'px';
 panel.style.top=Math.round(top)+'px';
}
function scheduleLayout(){
 if(reflow)cancelAnimationFrame(reflow);
 reflow=requestAnimationFrame(()=>{reflow=0;layout()});
}
function update(){
 if(!active)return;
 if(step===1||step===3||step===7)navigateHome();
 if(step===2&&$('ask')?.hidden){
  // If user chose "Дальше" without touching the main action, open the
  // existing real composer rather than manufacturing a second input.
  $('assistantButton')?.click();
 }
 if(step===2){
  const q=$('question');
  if(document.activeElement===q)q.blur();
  // Opening the real composer may schedule a keyboard focus on the next
  // animation frame; release it for a clear first-help card on iPhone.
  setTimeout(()=>{if(active&&step===2&&document.activeElement===q){q.blur();scheduleLayout()}},160);
 }
 if(step===7&&$('homeWorldPopover')&&!$('homeWorldPopover').hidden)
  $('homeWorldTrigger')?.click();
 count.textContent=(step+1)+' / '+steps.length;
 title.textContent=steps[step].name;
 text.textContent=steps[step].body;
 badge.textContent=steps[step].label||(lastSuccess?'ПОЛУЧИЛОСЬ':'ПОДСКАЗКА SEYVEO');
 const blockedExample=step===2&&!!$('question')?.value.trim()&&(
  $('question').value.trim()!=='Что у меня сегодня?'||
  $('composerModeNotes')?.getAttribute('aria-pressed')==='true'
 );
 const hint=blockedExample
  ?'У вас уже есть собственный текст. Не буду его изменять. Можно продолжить без примера.'
  :steps[step].hint||'Можете пропустить знакомство в любой момент';
 $('firstHelpHint').textContent=lastSuccess?lastSuccess+' · '+hint:hint;
 ui.dataset.success=lastSuccess?'yes':'no';
 go.textContent=blockedExample?'Пропустить пример':steps[step].button;
 back.hidden=step===0;
 progress.replaceChildren(...steps.map((_,i)=>{
  const dot=document.createElement('span');
  dot.className=i<=step?'is-active':'';
  return dot;
 }));
 ui.dataset.step=String(step);
 scheduleLayout();
 // Move the reading cursor to the changed guidance, not to an unrelated
 // behind-the-tour control. Touch users see the same real highlighted UI.
 try{panel.focus({preventScroll:true})}catch{}
}
function setStep(index,success=''){
 if(!active)return;
 lastSuccess=success;
 step=Math.max(0,Math.min(steps.length-1,index));
 if(step===3&&!$('orbInlineReply')?.hidden){
  document.dispatchEvent(new CustomEvent('seyveo:assistant-presence',{detail:{phase:'text'}}));
 }
 update();
}
function finish(){
 if(!active)return;
 seen();
 active=false;ui.hidden=true;cleanPaint();
 window.dispatchEvent(new Event('seyveo:first-help-finished'));
 if(!$('homeWorldPopover')?.hidden)$('homeWorldTrigger')?.click();
 // Don't force navigation or erase text drafts; respect where the lesson ends.
 if(previousFocus?.isConnected&&previousFocus.id==='openFirstHelp'&&!$('managePage')?.hidden){
  previousFocus.focus({preventScroll:true});
 }
}
function start(){
 if(active)return;
 if(document.querySelector('dialog[open]'))return;
 previousFocus=document.activeElement;
 navigateHome();
 step=0;lastSuccess='';active=true;ui.hidden=false;feedback();
 update();
 document.dispatchEvent(new CustomEvent('seyveo:assistant-presence',{detail:{phase:'text'}}));
}
function example(){
 const input=$('question'),form=$('ask');
 if(!input||!form)return setStep(4);
 const existing=input.value.trim();
 const isNote=$('composerModeNotes')?.getAttribute('aria-pressed')==='true';
 // The guide must never overwrite an existing user draft or silently
 // convert a note into an assistant message.
 if(existing&&(existing!=='Что у меня сегодня?'||isNote)){
  // Use the existing close control: it saves the draft, dismisses the
  // keyboard/composer and exposes the real navigation dock for the tour.
  if(!$('ask')?.hidden)$('hideInput')?.click();
  return setStep(4);
 }
 if(isNote)$('composerModeAsk')?.click();
 input.value='Что у меня сегодня?';
 input.dispatchEvent(new Event('input',{bubbles:true}));
 try{form.requestSubmit()}catch{
  $('composerCompactSend')?.click();
 }
 // If the host returned a different kind of editor (such as a calendar
 // review), don't falsely claim that the sphere just replied.
 if($('orbInlineReply')?.hidden)return setStep(4);
 setStep(3,'Отлично, вы получили первый ответ!');
}
function next(){
 feedback();
 if(step===2){example();return}
 if(step>=steps.length-1){finish();return}
 setStep(step+1);
}
entry.addEventListener('click',start);
go.addEventListener('click',next);
back.addEventListener('click',()=>{
 if(step<=0)return;
 feedback();
 setStep(step-1);
});
exit.addEventListener('click',finish);
document.addEventListener('keydown',e=>{
 if(!active)return;
 if(e.key==='Escape'){e.stopPropagation();finish()}
});
$('assistantButton')?.addEventListener('click',()=>{
 if(active&&step===1)setTimeout(()=>setStep(2,'Отлично, вы открыли помощника!'),100);
});
$('ask')?.addEventListener('submit',()=>{
 if(active&&step===2&&$('composerModeAsk')?.getAttribute('aria-pressed')==='true'){
  setTimeout(()=>{if(active&&step===2&&$('orbInlineReply')&&!$('orbInlineReply').hidden)
    setStep(3,'Отлично, вы получили ответ!')},120);
 }
},true);
for(const [id,index,success] of [
 ['navTasks',5,'Вы открыли Дела!'],
 ['navPicture',6,'Вы открыли Картину!'],
 ['navManage',7,'Вы открыли Управление!'],
 ['homeWorldTrigger',8,'Вы нашли Мой мир!']
]){
 $(id)?.addEventListener('click',()=>{
  if(!active||step!==index-1)return;
  setTimeout(()=>{if(active&&step===index-1)setStep(index,success)},80);
 });
}
window.addEventListener('resize',scheduleLayout,{passive:true});
window.visualViewport?.addEventListener('resize',scheduleLayout,{passive:true});
window.visualViewport?.addEventListener('scroll',scheduleLayout,{passive:true});
window.addEventListener('scroll',scheduleLayout,{passive:true});
window.addEventListener('hashchange',scheduleLayout);
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&active)finish();
});
window.SEYVEO_FIRST_HELP={start,isActive:()=>active};
// On first fresh local launch, existing owner-acquaintance has priority.
// Existing installations are NOT interrupted. Mark the invitation as seen
// only after it is actually offered, including when dismissed.
if(FIRST){
 const offer=()=>{
  if(safeGet(KEY)||active||document.hidden||location.hash||document.querySelector('dialog[open]'))return;
  seen();start();
 };
 let fired=false;
 const once=()=>{
  if(fired)return;
  fired=true;setTimeout(offer,1200);
 };
 setTimeout(()=>{
  if(onboard?.open){
   onboard.addEventListener('close',once,{once:true});
   // Opening other dialogs is never required for this feature.
  }else once();
 },14000);
}
})();