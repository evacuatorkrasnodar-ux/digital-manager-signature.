/* SEYVEO CONNECT · device companion shell.
   Browser-safe: no fake discovery, no unapproved permissions, no implied OS pairing.
   Actual audio test uses system selected output with explicit user gesture. */
(()=>{
'use strict';
const life=document.getElementById('lifePage');
const group=life?.querySelector('.sv-life-category[aria-labelledby="svLifeServicesTitle"] .sv-life-category-grid');
if(!life||!group)return;
const button=document.createElement('button');
button.type='button';button.className='calendar-space-button sv-connect-tile';
button.setAttribute('aria-label','Открыть SEYVEO CONNECT — устройства и звук');
button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 8.4a6.8 6.8 0 0 1 9.6 0M4.3 5.5a10.9 10.9 0 0 1 15.4 0M9.9 11.1a3 3 0 0 1 4.2 0"/><circle cx="12" cy="16.4" r="1.5"/></svg><span>CONNECT</span>';
group.append(button);
const dialog=document.createElement('dialog');
dialog.id='svConnectDialog';dialog.className='sv-connect-dialog';
dialog.setAttribute('aria-labelledby','svConnectHeading');
dialog.innerHTML=[
'<div class="sv-connect-sheet">',
'<header class="sv-connect-header"><button id="svConnectBack" class="sv-connect-back" type="button" aria-label="Назад в Мой мир"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg><span>Мой мир</span></button><span class="sv-connect-mark">SEYVEO CONNECT</span></header>',
'<h2 id="svConnectHeading">Сэйви рядом. На любом устройстве.</h2>',
'<p class="sv-connect-intro">Пока у SEYVEO нет собственной колонки, можно использовать устройства, которые у тебя уже есть. Начнём со звука — без лишних разрешений.</p>',
'<div class="sv-connect-category" role="group" aria-label="Тип устройства">',
'<button type="button" data-sv-connect-kind="speaker" aria-pressed="true">Колонка</button>',
'<button type="button" data-sv-connect-kind="headphones" aria-pressed="false">Наушники</button>',
'<button type="button" data-sv-connect-kind="phone" aria-pressed="false">Старый телефон</button>',
'<button type="button" data-sv-connect-kind="home" aria-pressed="false">Умный дом</button>',
'</div>',
'<section class="sv-connect-instructions" aria-live="polite"><h3 id="svConnectKindHeading"></h3><p id="svConnectKindDescription"></p><ol id="svConnectSteps"></ol></section>',
'<div class="sv-connect-test"><div><strong>Проверить звук</strong><p>Короткий сигнал прозвучит через выбранный телефоном аудиовыход.</p></div><button id="svConnectTest" type="button">Проиграть</button></div>',
'<p id="svConnectStatus" class="sv-connect-status" aria-live="polite"></p>',
'<p class="sv-connect-disclaimer">Подключение Bluetooth и выбор аудиовыхода выполняются средствами iOS или Android. Веб-версия SEYVEO не может сама сопрягать любую колонку, управлять чужими Wi-Fi-устройствами или слушать голос через выключенный телефон.</p>',
'</div>'
].join('');
document.body.append(dialog);
const $=id=>dialog.querySelector('#'+id);
const content={
 speaker:{heading:'Bluetooth-колонка',description:'Телефон остаётся мозгом Сэйви, а колонка воспроизводит звук. Обычная колонка без микрофона не слышит команды.',steps:['Включи колонку и переведи её в режим сопряжения.','Подключи колонку в настройках Bluetooth телефона.','Вернись сюда и нажми «Проиграть».']},
 headphones:{heading:'Bluetooth-наушники',description:'Сэйви может разговаривать через выбранный системой аудиовыход. Использование микрофона гарнитуры зависит от телефона и способа запуска приложения.',steps:['Подключи наушники в настройках Bluetooth.','Убедись, что телефон выводит звук в наушники.','Нажми «Проиграть» для проверки.']},
 phone:{heading:'Старый телефон или планшет',description:'Отдельная домашняя станция — перспективный режим SEYVEO. В прототипе можно открыть приложение на втором устройстве, но постоянное прослушивание голосовых команд в фоне ещё не поддерживается.',steps:['Подключи второй телефон к Wi-Fi и питанию.','Открой на нём SEYVEO через браузер.','Пока используй Сэйви на экране; автономный голосовой режим добавим в нативном приложении.']},
 home:{heading:'Wi-Fi и умный дом',description:'Лампы, розетки, датчики и другие устройства требуют совместимой системы или отдельной интеграции. Случайное Wi-Fi-устройство нельзя превратить в умное одним нажатием.',steps:['Узнай производителя и приложение устройства.','Проверь, поддерживает ли оно Matter или совместимое управление.','Когда интеграция появится в SEYVEO, подключи её через отдельное подтверждение.']}
};
function select(kind){
 const info=content[kind]||content.speaker;
 dialog.querySelectorAll('[data-sv-connect-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.svConnectKind===kind)));
 $('svConnectKindHeading').textContent=info.heading;
 $('svConnectKindDescription').textContent=info.description;
 $('svConnectSteps').replaceChildren();
 for(const line of info.steps){const li=document.createElement('li');li.textContent=line;$('svConnectSteps').append(li)}
 dialog.querySelector('.sv-connect-test').hidden=kind==='phone'||kind==='home';
 $('svConnectStatus').textContent='';
}
dialog.querySelectorAll('[data-sv-connect-kind]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.svConnectKind)));
function open(){
 select('speaker');
 try{if(!dialog.open)dialog.showModal()}catch{dialog.setAttribute('open','')}
}
function close(){if(dialog.open)dialog.close();else dialog.removeAttribute('open')}
button.addEventListener('click',open);
$('svConnectBack').addEventListener('click',close);
dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
$('svConnectTest').addEventListener('click',async()=>{
 const status=$('svConnectStatus'),test=$('svConnectTest');
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio){status.textContent='Проверка звука здесь не поддерживается. Попробуй воспроизвести музыку.';return}
 test.disabled=true;status.textContent='Проверяю аудиовыход…';
 let context;
 try{
  context=new Audio();
  await context.resume();
  if(context.state!=='running')throw Error('Audio output is unavailable');
  const now=context.currentTime;
  for(const [i,hz] of [660,880].entries()){
   const osc=context.createOscillator(),gain=context.createGain();
   osc.type='sine';osc.frequency.value=hz;
   const start=now+0.05+i*0.2;
   gain.gain.setValueAtTime(0,start);
   gain.gain.linearRampToValueAtTime(0.07,start+0.03);
   gain.gain.exponentialRampToValueAtTime(0.001,start+0.16);
   osc.connect(gain);gain.connect(context.destination);
   osc.start(start);osc.stop(start+0.17);
  }
  status.textContent='Сигнал отправлен в аудиовыход телефона. Если колонка подключена и выбрана в системе, звук должен быть слышен через неё.';
 }catch{
  status.textContent='Не получилось воспроизвести сигнал. Проверь громкость, подключение и настройки вывода звука.';
 }finally{
  test.disabled=false;
  if(context)window.setTimeout(()=>{context.close().catch(()=>{})},900);
 }
});
window.SEYVEO_CONNECT=Object.freeze({open});
})();