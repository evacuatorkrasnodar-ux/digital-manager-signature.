/* SEYVEO Smart Home demo. Virtual controls ONLY. No device connections. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const home=$('seyveoSmartHomeHome'),world=$('seyveoSmartHomeWorld');
if(!home||!world)return;
const KEY='seyveo-smart-home-demo-v1';
const initial={living:false,bedroom:false,outlet:false,temp:22,provider:'alice'};
const providers={alice:'Алиса · Яндекс',marusya:'Маруся · VK',salut:'Салют · Сбер',apple:'Apple Home',google:'Google Home',alexa:'Amazon Alexa',smartthings:'SmartThings'};
const has=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
function restore(){try{
 const s=JSON.parse(localStorage.getItem(KEY)||'null');
 if(!s||typeof s!=='object')return {...initial};
 return {living:s.living===true,bedroom:s.bedroom===true,outlet:s.outlet===true,
 temp:Number.isFinite(s.temp)?Math.max(16,Math.min(30,Math.round(s.temp))):22,
 provider:has(providers,s.provider)?s.provider:'alice'};
}catch{return {...initial}}}
let state=restore(),message='Виртуальный пульт готов.';
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{message='Демо работает, но не сохраняется на устройстве.'}}
function tile(id,label,icon){
 const on=state[id];
 return '<button type="button" class="svh-device" data-sh="toggle" data-id="'+id+'" aria-pressed="'+on+'">'+
 '<span class="svh-symbol" aria-hidden="true">'+icon+'</span><span class="svh-label">'+label+'</span>'+
 '<span class="svh-muted">'+(on?'Включено':'Выключено')+'</span></button>';
}
function content(inWorld){
 return '<header class="svh-top"><div><small>SEYVEO SMART HOME · ДЕМО</small><h3>Мой дом</h3></div>'+
 '<button type="button" class="svh-text-action" data-sh="'+(inWorld?'open':'close')+'">'+(inWorld?'На главную ›':'Свернуть ↑')+'</button></header>'+
 '<p class="svh-subtitle">Сэйви рядом. Всё под твоим контролем.</p>'+
 '<div class="svh-tiles" role="group" aria-label="Виртуальные устройства">'+
 tile('living','Гостиная','☼')+tile('bedroom','Спальня','✧')+tile('outlet','Розетка','⌁')+'</div>'+
 '<div class="svh-climate"><span>Климат</span><div><button type="button" data-sh="minus" aria-label="Температура ниже">−</button>'+
 '<output>'+state.temp+'°</output><button type="button" data-sh="plus" aria-label="Температура выше">+</button></div></div>'+
 '<div class="svh-scenes"><button type="button" data-sh="arrival">Я дома <span>›</span></button>'+
 '<button type="button" data-sh="sleep">Спокойной ночи <span>›</span></button></div>'+
 '<details class="svh-sources"><summary>Экосистемы · '+providers[state.provider]+'</summary>'+
 '<div class="svh-source-list">'+Object.entries(providers).map(([id,name])=>
 '<button type="button" data-sh="provider" data-id="'+id+'" aria-pressed="'+(state.provider===id)+'">'+name+'</button>').join('')+'</div>'+
 '<small>Выбор источника — только для демонстрации. Аккаунты не подключены.</small></details>'+
 '<p class="svh-message" role="status" aria-live="polite">'+message+'</p>'+
 '<p class="svh-honest">Демо · ни одна команда не отправляется реальной технике.</p>';
}
function paint(){
 for(const [root,inWorld] of [[home,false],[world,true]]){
  const expanded=root.querySelector('.svh-sources')?.open;
  const active=root.contains(document.activeElement)?document.activeElement:null;
  const action=active?.dataset.sh,id=active?.dataset.id;
  root.innerHTML=content(inWorld);
  if(expanded)root.querySelector('.svh-sources').open=true;
  if(action){
   const match=[...root.querySelectorAll('button[data-sh]')].find(b=>b.dataset.sh===action&&b.dataset.id===id);
   match?.focus({preventScroll:true});
  }
 }
}
function close(){home.hidden=true}
function open(){
 window.SEYVEO_CLOSE_WORLD_MENU?.();
 if($('calendarSpaceDialog')?.open)$('calendarSpaceDialog').close();
 if($('ask')&&!$('ask').hidden)$('hideInput')?.click();
 if($('homePage')?.hidden)$('navHome')?.click();
 home.hidden=false;paint();return true;
}
function change(action,id){
 if(action==='open'){open();return message}
 if(action==='close'){close();return message}
 if(action==='toggle'&&['living','bedroom','outlet'].includes(id)){
  state[id]=!state[id];
  message=(id==='living'?'Свет в гостиной':id==='bedroom'?'Свет в спальне':'Розетка')+
  (state[id]?' включён':' выключен')+' · демо.';
 }else if(action==='plus'||action==='minus'){
  state.temp=Math.min(30,Math.max(16,state.temp+(action==='plus'?1:-1)));
  message='Температура '+state.temp+'° · демо.';
 }else if(action==='arrival'){
  Object.assign(state,{living:true,bedroom:false,temp:23});
  message='«Я дома» · виртуальный сценарий выполнен.';
 }else if(action==='sleep'){
  Object.assign(state,{living:false,bedroom:false,outlet:false,temp:20});
  message='«Спокойной ночи» · виртуальный сценарий выполнен.';
 }else if(action==='provider'&&has(providers,id)){
  state.provider=id;message=providers[id]+' выбрана. Настоящего подключения нет.';
 }else return '';
 save();paint();return message;
}
for(const root of [home,world])root.addEventListener('click',event=>{
 const btn=event.target.closest('button[data-sh]');
 if(btn)change(btn.dataset.sh,btn.dataset.id);
});
function parse(raw){
 if(typeof raw!=='string'||raw.length>220||/[\n\r;]/.test(raw))return null;
 const s=raw.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').trim()
  .replace(/^(?:сейви|сейва|сэйви|seyveo)[\s,!:.-]*/,'').replace(/[!?.]+$/,'').trim();
 if(/^(?:(?:покажи|открой|включи|открыть)\s+)?(?:мой\s+дом|умный\s+дом|пульт\s+(?:дома|умного\s+дома))$/.test(s))return {a:'open'};
 const voice=s.match(/^(?:переключи(?:сь)?|давай переключимся|перейди)\s+(?:меня\s+)?(?:на\s+)?(алису|марусю|салют)$/);
 if(voice)return {a:'provider',id:voice[1]==='алису'?'alice':voice[1]==='марусю'?'marusya':'salut'};
 if(/^(?:я дома|я приехал|я вернулся|запусти сценарий я дома)$/.test(s))return {a:'arrival'};
 if(/^(?:спокойной ночи|запусти сценарий спокойной ночи)$/.test(s))return {a:'sleep'};
 const light=s.match(/^(включи|выключи)\s+(?:свет|освещение)(?:\s+в\s+(гостиной|спальне))?$/);
 if(light)return {a:'light',id:light[2]==='спальне'?'bedroom':'living',on:light[1]==='включи'};
 const temp=s.match(/^(?:установи|поставь|сделай)\s+температуру\s+(?:в\s+доме\s+)?(?:на\s+)?(\d{2})\s*(?:градусов|градуса|градус|°)?$/);
 if(temp&&+temp[1]>=16&&+temp[1]<=30)return {a:'temperature',temp:+temp[1]};
 return null;
}
function handle(text){
 const p=parse(text);if(!p)return null;
 if(p.a==='light'){state[p.id]=p.on;message=(p.id==='living'?'Гостиная':'Спальня')+(p.on?' · свет включён':' · свет выключен')+' в демо.';save();paint()}
 else if(p.a==='temperature'){state.temp=p.temp;message='Климат · '+p.temp+'° в демо.';save();paint()}
 else if(p.a==='open')message='Показываю виртуальный пульт дома.';
 else change(p.a,p.id);
 open();return {message,kind:'smart-home-demo'};
}
window.SEYVEO_SMART_HOME=Object.freeze({open,close,handle,understand:parse,state:()=>({...state})});
window.addEventListener('hashchange',()=>{if($('homePage')?.hidden)close()});
paint();
})();