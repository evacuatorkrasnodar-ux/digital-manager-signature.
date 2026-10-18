/* SEYVEO wake-by-name preview. Requires a user gesture and explicit consent.
   Web Speech can transmit audio to a browser speech service. Nothing heard
   before the wake phrase is stored by this application. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const Speech=()=>window.SpeechRecognition||window.webkitSpeechRecognition;
let active=false,armed=false,engine=null,started=0,shortEnds=0;
let retryTimer=null,questionTimer=null,hintTimer=null;
const button=$('assistantButton'),status=$('wakeVoiceStatus');
function hint(message){
 const view=$('voiceHint');
 view.textContent=message;view.classList.add('active');
 clearTimeout(hintTimer);
 hintTimer=setTimeout(()=>view.classList.remove('active'),3600);
}
function state(message){status.hidden=false;$('wakeVoiceLabel').textContent=message}
function stop(message=''){
 active=false;armed=false;
 clearTimeout(retryTimer);clearTimeout(questionTimer);
 const old=engine;engine=null;
 if(old){try{old.abort()}catch{try{old.stop()}catch{}}}
 status.hidden=true;
 button.classList.remove('wake-ready','wake-awake');
 if(message)hint(message);
}
function ready(){
 if(!active)return;
 armed=false;clearTimeout(questionTimer);
 button.classList.remove('wake-awake');
 button.classList.add('wake-ready');
 state(wakeLabel());
}
function normalize(text){
 return String(text||'').toLowerCase().replace(/ё/g,'е')
  .replace(/[^a-zа-я\s-]/g,' ').replace(/\s+/g,' ').trim();
}
// Read the name at the moment of activation. Never turn microphone on just
// because a saved preference changed. No audio or transcripts are persisted.
const PROFILE='seyveo-first-acquaintance-v1';
const BRAND_WAKE=Object.freeze(['сейвео','сэйвео','сейвио','сейвеу','сей вео','сей-вео','сейв ео','сейв-ео','seyveo']);
function assistantNames(){
 let preferred='',aliases=[];
 try{
  const profile=JSON.parse(localStorage.getItem(PROFILE)||'null');
  if(typeof profile?.assistantName==='string')preferred=profile.assistantName.trim().slice(0,40);
  if(Array.isArray(profile?.assistantAliases))
   aliases=profile.assistantAliases.filter(name=>typeof name==='string').slice(0,5).map(name=>name.trim().slice(0,40));
 }catch{}
 // Compatibility with the name shown in early preview builds.
 if(preferred==='Милисса'){preferred='Мелисса';aliases=['Мили','Милисса',...aliases]}
 if(preferred==='Феликс')aliases=['Филя',...aliases];
 if(preferred==='Мелисса')aliases=['Мили',...aliases];
 return [...new Set([preferred,...aliases].filter(name=>normalize(name).length>=2))];
}
function wakeLabel(){
 const names=assistantNames().slice(0,2);
 return names.length?'Ожидаю «'+names.join('» или «')+'»':'Ожидаю «SEYVEO»';
}
function wakeTail(text){
 // Word-boundary search without a dynamic regular expression: custom names
 // cannot inject pattern syntax or wake on a substring of another word.
 const phrase=' '+normalize(text)+' ';
 let match=null;
 const phrases=[...assistantNames(),...BRAND_WAKE];
 for(const item of phrases){
  const name=normalize(item);
  if(name.length<2)continue;
  const found=phrase.indexOf(' '+name+' ');
  if(found>=0 && (!match || found<match.start || (found===match.start && name.length>match.length)))
   match={start:found,length:name.length,end:found+name.length+2};
 }
 return match?phrase.slice(match.end).trim():null;
}
function deliver(text){
 const phrase=String(text||'').trim();
 if(!phrase)return;
 stop();
 // The wake phrase is a voice conversation, not an instruction to open
 // the text composer. The shared interpreter opens only requested previews.
 if(typeof window.SEYVEO_VOICE_EXECUTE==='function')window.SEYVEO_VOICE_EXECUTE(phrase);
 else hint('Помощник ещё загружается. Попробуйте снова.');
}
function handleSpeech(text){
 if(!active||document.hidden||location.hash)return;
 const tail=wakeTail(text);
 if(tail!==null){
  armed=true;button.classList.remove('wake-ready');
  button.classList.add('wake-awake');
  state('Слушаю. Что нужно?');
  clearTimeout(questionTimer);
  questionTimer=setTimeout(ready,12000);
  if(tail)deliver(tail);
 }else if(armed)deliver(text);
}
function begin(){
 if(!active||document.hidden||location.hash)return;
 const Ctor=Speech();
 if(!Ctor){stop('Браузер не поддерживает обращение по имени.');return}
 try{
  const sr=new Ctor();
  engine=sr;sr.lang='ru-RU';sr.continuous=true;sr.interimResults=false;
  sr.maxAlternatives=1;started=Date.now();
  sr.onstart=()=>{
   if(!active||engine!==sr)return;
   if(armed)state('Слушаю. Что нужно?');
   else ready();
  };
  sr.onresult=e=>{
   if(!active||engine!==sr)return;
   for(let i=e.resultIndex||0;i<e.results.length;i++){
    const result=e.results[i];
    if(result.isFinal===false)continue;
    const phrase=result[0]?.transcript;
    if(phrase)handleSpeech(phrase);
   }
  };
  sr.onerror=e=>{
   if(!active||engine!==sr||e.error==='no-speech')return;
   if(['not-allowed','service-not-allowed','audio-capture'].includes(e.error))
    stop('Микрофон недоступен. Проверьте разрешения.');
   else stop('Браузер прервал прослушивание. Включите снова вручную.');
  };
  sr.onend=()=>{
   if(engine!==sr)return;
   engine=null;
   if(!active)return;
   if(document.hidden||location.hash){stop();return}
   shortEnds=Date.now()-started<7000?shortEnds+1:0;
   if(shortEnds>1){stop('Браузер завершил ожидание. Включите снова вручную.');return}
   state('Восстанавливаю прослушивание…');
   retryTimer=setTimeout(begin,650);
  };
  state('Включаю микрофон…');sr.start();
 }catch{stop('Браузер не разрешил продолжить прослушивание.')}
}
function start(){
 if(active){stop('Ожидание имени выключено');return}
 if(!Speech()){hint('Обращение по имени не поддерживается этим браузером.');return}
 active=true;armed=false;shortEnds=0;
 const hide=$('hideInput');
 if(hide&&$('ask')&&!$('ask').hidden)hide.click();
 begin();
}
function offer(){
 if(active){stop('Ожидание имени выключено');return}
 if(!Speech()){hint('Ожидание имени недоступно в этом браузере.');return}
 try{
  if(localStorage.getItem('seyveo-wake-consent-v1')==='yes'){start();return}
 }catch{}
 $('wakeVoiceConsent').showModal();
}
$('wakeVoiceMore').addEventListener('click',offer);
$('wakeVoiceStop').addEventListener('click',()=>stop('Ожидание имени выключено'));
$('wakeVoiceCancel').addEventListener('click',()=>$('wakeVoiceConsent').close());
$('wakeVoiceConfirm').addEventListener('click',()=>{
 $('wakeVoiceConsent').close();
 try{localStorage.setItem('seyveo-wake-consent-v1','yes')}catch{}
 start();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
window.addEventListener('hashchange',()=>{if(location.hash)stop()});
window.addEventListener('seyveo:manual-voice',()=>stop());
window.addEventListener('seyveo:profile-changed',()=>{if(active&&!armed)state(wakeLabel())});
window.addEventListener('storage',event=>{if(event.key===PROFILE&&active&&!armed)state(wakeLabel())});
})();
