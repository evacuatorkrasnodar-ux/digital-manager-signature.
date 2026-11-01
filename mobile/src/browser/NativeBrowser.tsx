import React,{useEffect,useRef,useState} from 'react';
import {loadBrowserSession,saveBrowserSession} from './session-store';
import {browserLibrary,type SavedLink} from './browser-library';
import {checkBrowserAddress} from './address-safety';
import {loadCookieExceptions,saveCookieExceptions,hostnameForException,loadCookieBlock,saveCookieBlock} from './cookie-exceptions';
import {View,Text,TextInput,Pressable,ScrollView,Alert,Platform} from 'react-native';
import {File,Paths} from 'expo-file-system';
import {translateText,translateEndpoint,usableTranslationEndpoint} from './translate-service';
import {WebView} from 'react-native-webview';
import {sharedMediaSession} from '../media/sharedMediaSession';
type Tab={id:number;url:string;scrollY?:number};
const HOME='https://www.wikipedia.org/';
export function NativeBrowser(){
 const web=useRef<WebView>(null);
 const selectedTabId=useRef(1);
 const scrollPositions=useRef<Record<number,{url:string;y:number}>>({});
 const [tabs,setTabs]=useState<Tab[]>([{id:1,url:HOME}]);
 const [active,setActive]=useState(1);
 const [privateMode,setPrivateMode]=useState(false);
 const [blockThirdPartyCookies,setBlockThirdPartyCookies]=useState(false);
 useEffect(()=>{let alive=true;void loadCookieBlock().then(v=>{if(alive)setBlockThirdPartyCookies(v)});return()=>{alive=false}},[]);
 const [cookieExceptions,setCookieExceptions]=useState<string[]>([]);
 useEffect(()=>{let alive=true;void loadCookieExceptions().then(items=>{if(alive)setCookieExceptions(items)});return()=>{alive=false}},[]);
 const approvedNavigation=useRef<string|null>(null);
 const lastNormalId=useRef(1);
 const [nextId,setNextId]=useState(2);
 const [sessionReady,setSessionReady]=useState(false);
 useEffect(()=>{let mounted=true;void loadBrowserSession().then(saved=>{
  if(!mounted)return;
  if(saved){scrollPositions.current=Object.fromEntries(saved.tabs.map(t=>[t.id,{url:t.url,y:t.scrollY||0}]));selectedTabId.current=saved.active;setTabs(saved.tabs);setActive(saved.active);setNextId(Math.max(...saved.tabs.map(t=>t.id))+1);setAddress(saved.tabs.find(t=>t.id===saved.active)?.url||HOME)}
  setSessionReady(true);
 });return()=>{mounted=false}},[]);
 useEffect(()=>{if(sessionReady&&!privateMode)void saveBrowserSession(tabs.filter(t=>t.id!==0),active)},[tabs,active,sessionReady,privateMode]);
 const current=tabs.find(t=>t.id===active)||tabs[0];
 const currentHost=hostnameForException(current.url);
 const excepted=!privateMode&&!!currentHost&&cookieExceptions.includes(currentHost);
 function toggleCookieException(){
  if(!currentHost||Platform.OS!=='android')return;
  const next=excepted?cookieExceptions.filter(host=>host!==currentHost):[...cookieExceptions,currentHost];
  Alert.alert('Cookies для сайта',excepted?'Снова ограничить сторонние cookies для '+currentHost+'?':'Разрешить сторонние cookies для '+currentHost+'? Сайт перезагрузится.',[
   {text:'Отмена',style:'cancel'},{text:'Применить',onPress:()=>{void saveCookieExceptions(next).then(ok=>{if(ok)setCookieExceptions(next);else setTranslationNotice('Не удалось сохранить исключение.')})}}
  ]);
 }
 function togglePrivate(){
  if(!sessionReady)return;
  approvedNavigation.current=null;
  setLibraryMode(null);setTranslated('');setTranslationNotice('');
  sharedMediaSession.clear('browser');
  if(privateMode){
   setTabs(old=>old.filter(t=>t.id!==0));
   const normal=tabs.find(t=>t.id===lastNormalId.current)||tabs.find(t=>t.id!==0);
   if(normal){selectedTabId.current=normal.id;setActive(normal.id);setAddress(normal.url)}
   setPrivateMode(false);
  }else{
   lastNormalId.current=active;
   selectedTabId.current=0;setTabs(old=>[...old.filter(t=>t.id!==0),{id:0,url:HOME}]);
   setActive(0);setAddress(HOME);setPrivateMode(true);
  }
  setBack(false);setForward(false);setMediaVisible(false);setMediaPaused(false);
 }
 const [address,setAddress]=useState(HOME);
 const [back,setBack]=useState(false),[forward,setForward]=useState(false);
 const [translationNotice,setTranslationNotice]=useState('');
 const [translated,setTranslated]=useState('');
 const [translating,setTranslating]=useState(false);
 const [downloads,setDownloads]=useState<{name:string;uri:string}[]>([]);
 const [showDownloads,setShowDownloads]=useState(false);
 const [links,setLinks]=useState<SavedLink[]>([]);
 const [libraryMode,setLibraryMode]=useState<'history'|'favorites'|null>(null);
 async function openLibrary(mode:'history'|'favorites'){
  setLibraryMode(mode);setLinks(mode==='history'?await browserLibrary.history():await browserLibrary.favorites());
 }
 async function saveFavorite(){await browserLibrary.toggleFavorite(current.url);if(libraryMode==='favorites')setLinks(await browserLibrary.favorites())}
 function openSaved(url:string){setAddress(url);setTabs(old=>old.map(t=>t.id===active?{...t,url}:t));setLibraryMode(null)}
 async function downloadRequested(downloadUrl:string){
  try{
   const u=new URL(downloadUrl);
   if(u.protocol!=='https:'||u.username||u.password){setTranslationNotice('Разрешены только защищённые HTTPS-загрузки.');return}
   Alert.alert('Загрузить файл?',u.hostname,[{text:'Отмена',style:'cancel'},{text:'Загрузить',onPress:()=>{void (async()=>{
    try{
     const basename=(u.pathname.split('/').pop()||'download').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,72)||'download';
     const destination=new File(Paths.document,Date.now()+'-'+basename);
     const file=await File.downloadFileAsync(u.href,destination);
     setDownloads(previous=>[{name:file.name,uri:file.uri},...previous].slice(0,20));
     setTranslationNotice('Файл сохранён в приватном хранилище приложения: '+file.name);
    }catch{setTranslationNotice('Не удалось скачать файл. Возможно, сайту нужна авторизация или ссылка устарела.')}
   })()}}]);
  }catch{setTranslationNotice('Недопустимый адрес загрузки.')}
 }
 function translateInfo(){
  if(!usableTranslationEndpoint(translateEndpoint)){setTranslationNotice('Сервис перевода ещё не подключён. Текст сайта никуда не отправлен.');return}
  Alert.alert('Перевести страницу?', 'Текст открытой страницы будет отправлен в подключённый сервис перевода. Не переводите страницы с личными или секретными данными.',[
   {text:'Отмена',style:'cancel'},
   {text:'Перевести',onPress:()=>{setTranslated('');setTranslationNotice('Получаем текст страницы…');web.current?.injectJavaScript("(function(){var t=(document.body&&document.body.innerText||'').slice(0,10000);window.ReactNativeWebView.postMessage(JSON.stringify({type:'seyveo-translate',text:t}));})();true;")}}
  ]);
 }
 async function handleTranslationMessage(value:string){
  try{const msg=JSON.parse(value);if(msg?.type!=='seyveo-translate'||typeof msg.text!=='string')return;
   if(!msg.text.trim()){setTranslationNotice('Текст на странице не найден.');return}
   setTranslating(true);setTranslationNotice('Переводим текст…');
   const answer=await translateText(msg.text);setTranslated(answer);setTranslationNotice('Переведённый текст. Оригинальная страница не изменена.');
  }catch{setTranslationNotice('Не удалось перевести страницу. Проверьте подключение сервиса.')}finally{setTranslating(false)}
 }
 const [mediaPaused,setMediaPaused]=useState(false);
 const [mediaVisible,setMediaVisible]=useState(false);
 const activeMediaId=useRef<string|null>(null);
 useEffect(()=>()=>{sharedMediaSession.clear('browser')},[]);
 useEffect(()=>sharedMediaSession.registerControls('browser',String(active),command=>{if(command==='pause')pausePageMedia();else togglePageMedia()}),[active,mediaPaused]);
 useEffect(()=>{if(activeMediaId.current!==null&&activeMediaId.current!==String(active)){sharedMediaSession.clear('browser',activeMediaId.current);activeMediaId.current=null}},[active]);
 function captureScroll(){
  web.current?.injectJavaScript("window.ReactNativeWebView.postMessage(JSON.stringify({type:'seyveo-scroll',url:location.href,y:Math.max(0,Math.round(window.scrollY||0))}));true;");
 }
 function handleBrowserMessage(value:string){
  try{const msg=JSON.parse(value);
   if(msg?.type==='seyveo-scroll'&&typeof msg.url==='string'&&typeof msg.y==='number'&&Number.isFinite(msg.y)&&msg.y>=0){
    if(msg.url===current.url){const y=Math.min(Math.round(msg.y),2000000);scrollPositions.current[active]={url:msg.url,y};if(!privateMode)setTabs(old=>old.map(t=>t.id===active&&t.url===msg.url&&t.scrollY!==y?{...t,scrollY:y}:t))}
    return;
   }
   if(msg?.type==='seyveo-media'&&typeof msg.playing==='boolean'){
    setMediaPaused(!msg.playing);setMediaVisible(msg.playing||msg.present===true);
    const mediaId=String(active);
    if(msg.playing||msg.present===true){
     if(sharedMediaSession.report('browser',mediaId,current.url,msg.playing?'playing':'paused'))activeMediaId.current=mediaId;
    }else{sharedMediaSession.clear('browser',mediaId);activeMediaId.current=null}
    return;
   }
   if(msg?.type==='seyveo-translate'&&!translating)void handleTranslationMessage(value);
  }catch{/* Ignore arbitrary website messages */}
 }
 function togglePageMedia(){
  const action=mediaPaused?'play':'pause';
  web.current?.injectJavaScript("(function(){document.querySelectorAll('audio,video').forEach(function(el){if('"+action+"'==='pause'){el.pause()}else{var p=el.play();if(p&&p.catch)p.catch(function(){})}})})();true;");
  // State changes only after the page reports a real play/pause event.
  setTranslationNotice('Команда отправлена странице. Дождитесь подтверждения плеера; сторонние встроенные плееры могут не поддерживаться.');
 }
 function pausePageMedia(){
  // Only pauses media in the current document. Cross-origin frames may not be accessible.
  web.current?.injectJavaScript("document.querySelectorAll('audio,video').forEach(function(el){el.pause()});true;");
  setTranslationNotice('Воспроизведение на странице остановлено, если плеер доступен браузеру.');
 }
 function select(tab:Tab){captureScroll();selectedTabId.current=tab.id;setMediaVisible(false);setMediaPaused(false);setActive(tab.id);setAddress(tab.url);setBack(false);setForward(false)}
 function add(){if(privateMode)return;if(tabs.filter(t=>t.id!==0).length>=10){Alert.alert('Лимит вкладок','Можно сохранить до 10 обычных вкладок. Закройте одну, чтобы открыть новую.');return;}const t={id:nextId,url:HOME};setTabs(old=>[...old,t]);setNextId(n=>n+1);select(t)}
 function close(id:number){if(privateMode)return;const left=tabs.filter(t=>t.id!==id);if(!left.length){const t={id:nextId,url:HOME};setNextId(n=>n+1);setTabs([t]);select(t);return}setTabs(left);if(active===id)select(left[Math.max(0,tabs.findIndex(t=>t.id===id)-1)])}
 function navigate(){sharedMediaSession.clear('browser',String(active));activeMediaId.current=null;setMediaVisible(false);setMediaPaused(false);const value=address.trim();const raw=value.includes('://')?value:'https://'+value;try{const url=new URL(raw);const check=checkBrowserAddress(url.href);if(!check.allowed)throw Error();const open=()=>{setTabs(old=>old.map(t=>t.id===active?{...t,url:url.href}:t));setAddress(url.href)};if(check.warning)Alert.alert('Проверьте адрес',check.warning,[{text:'Отмена',style:'cancel'},{text:'Открыть',onPress:open}]);else open()}catch{setAddress(current.url)}}
 return <View style={{flex:1,backgroundColor:'#11161b'}}>
  <View style={{flexDirection:'row',justifyContent:'flex-end',alignItems:'center',gap:16,paddingHorizontal:12,paddingTop:5}}><Pressable accessibilityRole="button" accessibilityLabel="Переключить блокировку сторонних cookies" onPress={()=>{if(Platform.OS==='ios'){Alert.alert('Защита от отслеживания','Этот переключатель управляет сторонними cookies в Android WebView. В iOS действуют правила WebKit, а полноценная блокировка трекеров пока не подключена.');return}Alert.alert('Сторонние cookies',blockThirdPartyCookies?'Разрешить сторонние cookies? Страница перезагрузится.':'Ограничить сторонние cookies? Некоторые сайты могут потребовать повторный вход. Страница перезагрузится.',[{text:'Отмена',style:'cancel'},{text:'Применить',onPress:()=>{void saveCookieBlock(!blockThirdPartyCookies).then(ok=>{if(ok)setBlockThirdPartyCookies(v=>!v);else setTranslationNotice('Не удалось сохранить настройку cookies.')})}}])}}><Text style={{color:'#d6e3e5',fontSize:12}}>{Platform.OS==='ios'?'Приватность · iOS':blockThirdPartyCookies?'Cookies 3-х сторон: выкл.':'Cookies 3-х сторон: вкл.'}</Text></Pressable><Pressable accessibilityRole="button" disabled={!sessionReady} onPress={togglePrivate}><Text style={{color:privateMode?'#f0d7a4':'#d6e3e5'}}>{privateMode?'Закрыть приватную вкладку':'Приватная вкладка'}</Text></Pressable></View>
  {Platform.OS==='android'&&!privateMode&&blockThirdPartyCookies?<View style={{alignItems:'flex-end',paddingHorizontal:12}}><Pressable onPress={toggleCookieException} accessibilityRole="button"><Text style={{color:'#b8d3d0',fontSize:12}}>{excepted?'Убрать исключение · '+currentHost:'Разрешить cookies для сайта'}</Text></Pressable></View>:null}
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0,maxHeight:58}} contentContainerStyle={{padding:8,alignItems:'center',gap:6}}>
   {tabs.filter(t=>privateMode?t.id===0:t.id!==0).map(t=><View key={t.id} style={{flexDirection:'row',alignItems:'center',borderRadius:15,borderWidth:1,borderColor:t.id===active?'#acc9ce':'#56646b',backgroundColor:t.id===active?'#34434a':'#242e35'}}>
    <Pressable onPress={()=>select(t)} accessibilityRole="button" style={{padding:10,maxWidth:145}}><Text numberOfLines={1} style={{color:'#f3f6f7',fontSize:12}}>{(()=>{try{return new URL(t.url).hostname||'Вкладка'}catch{return 'Вкладка'}})()}</Text></Pressable>
    <Pressable onPress={()=>close(t.id)} accessibilityRole="button" accessibilityLabel="Закрыть вкладку" style={{padding:10}}><Text style={{color:'#d5dfe0'}}>×</Text></Pressable>
   </View>)}
   {!privateMode?<Pressable onPress={add} accessibilityRole="button" accessibilityLabel="Новая вкладка" style={{padding:10}}><Text style={{color:'white',fontSize:23}}>＋</Text></Pressable>:null}
  </ScrollView>
  <TextInput value={address} onChangeText={setAddress} onSubmitEditing={navigate} keyboardType="url" autoCapitalize="none" autoCorrect={false} style={{color:'white',padding:12}}/>
  <WebView onShouldStartLoadWithRequest={request=>{
   if(!request.isTopFrame)return true;
   const check=checkBrowserAddress(request.url);
   if(!check.allowed){setTranslationNotice(check.warning);return false}
   if(!check.warning||approvedNavigation.current===request.url)return true;
   // Main-frame navigations only; allow after explicit user confirmation.
   Alert.alert('Проверьте ссылку',check.warning,[{text:'Отмена',style:'cancel'},{
    text:'Открыть',onPress:()=>{
     approvedNavigation.current=request.url;
     setTabs(old=>old.map(t=>t.id===active?{...t,url:request.url}:t));
     setAddress(request.url);
    }
   }]);
   return false;
  }} onMessage={event=>handleBrowserMessage(event.nativeEvent.data)} onLoadEnd={()=>{const saved=scrollPositions.current[current.id];if(saved?.url===current.url&&saved.y>0)web.current?.injectJavaScript('setTimeout(function(){window.scrollTo(0,'+saved.y+')},350);true;');web.current?.injectJavaScript("(function(){if(window.__seyveoMediaWatch)return;window.__seyveoMediaWatch=true;function report(){var nodes=[].slice.call(document.querySelectorAll('audio,video'));var playing=nodes.some(function(n){return !n.paused&&!n.ended});window.ReactNativeWebView.postMessage(JSON.stringify({type:'seyveo-media',present:nodes.length>0,playing:playing}));}document.addEventListener('play',report,true);document.addEventListener('pause',report,true);document.addEventListener('ended',report,true);report();var last=0;window.addEventListener('scroll',function(){var now=Date.now();if(now-last<1500)return;last=now;window.ReactNativeWebView.postMessage(JSON.stringify({type:'seyveo-scroll',url:location.href,y:Math.max(0,Math.round(window.scrollY||0))}));},{passive:true});})();true;")}} onFileDownload={({nativeEvent})=>{if(!privateMode)void downloadRequested(nativeEvent.downloadUrl)}} incognito={privateMode} thirdPartyCookiesEnabled={!privateMode&&(!blockThirdPartyCookies||excepted)} key={(privateMode?'private':current.id)+'-'+(blockThirdPartyCookies&&!excepted?'strict':'normal')} ref={web} source={{uri:current.url}} allowsInlineMediaPlayback={true} allowsPictureInPictureMediaPlayback={true} mediaPlaybackRequiresUserAction={true} allowsFullscreenVideo={true} style={{flex:1}} onNavigationStateChange={event=>{if(selectedTabId.current!==current.id)return;try{const u=new URL(event.url);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return;setAddress(event.url);setBack(event.canGoBack);setForward(event.canGoForward);setTabs(old=>old.map(t=>t.id===current.id?{...t,url:event.url}:t));if(!privateMode)void browserLibrary.visit(event.url)}catch{}}}/>
  {mediaVisible?<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginHorizontal:12,marginVertical:5,paddingHorizontal:12,paddingVertical:8,borderRadius:16,borderWidth:1,borderColor:'#526670',backgroundColor:'#25343b'}}>
    <Text style={{color:'#e5eeed',fontSize:12}}>Медиа · текущая страница</Text>
    <Pressable accessibilityRole="button" onPress={togglePageMedia} accessibilityLabel={mediaPaused?'Продолжить медиа':'Пауза медиа'}><Text style={{color:'#e5eeed',fontSize:17}}>{mediaPaused?'▶':'Ⅱ'}</Text></Pressable>
   </View>:null}
  {translationNotice?<Text accessibilityRole="alert" style={{color:'#cfdbdf',paddingHorizontal:12,fontSize:12}}>{translationNotice}</Text>:null}
  {libraryMode?<View style={{maxHeight:200,backgroundColor:'#263039',padding:12}}>
   <View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={{color:'white'}}>{libraryMode==='history'?'История':'Избранное'}</Text><Pressable onPress={()=>setLibraryMode(null)}><Text style={{color:'white'}}>Закрыть ×</Text></Pressable></View>
   <ScrollView>{links.map((entry,i)=><Pressable key={entry.url+i} onPress={()=>openSaved(entry.url)} style={{paddingVertical:7}}><Text numberOfLines={1} style={{color:'#d9e9eb'}}>{entry.url}</Text></Pressable>)}</ScrollView>
   {libraryMode==='history'?<Pressable onPress={()=>{void browserLibrary.clearHistory().then(()=>setLinks([]))}}><Text style={{color:'#dfc4c4'}}>Очистить историю</Text></Pressable>:null}
  </View>:null}
  {showDownloads?<View style={{maxHeight:170,backgroundColor:'#263039',padding:12}}>
    <Text style={{color:'#eef4f3',fontSize:14,marginBottom:8}}>Загрузки · текущий сеанс</Text>
    <ScrollView>{downloads.length?downloads.map(item=><Text key={item.uri} numberOfLines={1} style={{color:'#d7e5e5',paddingVertical:6}}>{item.name}</Text>):<Text style={{color:'#c5d0d2'}}>Скачанных файлов в этом сеансе нет</Text>}</ScrollView>
    <Text style={{color:'#aabcc1',fontSize:11}}>Файлы остаются в хранилище приложения. Список после перезапуска пока не восстанавливается.</Text>
   </View>:null}
  {translated?<ScrollView style={{maxHeight:210,backgroundColor:'#263039',padding:12}}><Pressable onPress={()=>setTranslated('')}><Text style={{color:'white',textAlign:'right'}}>Закрыть ×</Text></Pressable><Text style={{color:'white',fontSize:14,lineHeight:22}}>{translated}</Text></ScrollView>:null}
  <View style={{flexDirection:'row',justifyContent:'space-around',padding:12}}>
   <Pressable disabled={!back} onPress={()=>web.current?.goBack()}><Text style={{color:'white'}}>Назад</Text></Pressable>
   <Pressable disabled={!forward} onPress={()=>web.current?.goForward()}><Text style={{color:'white'}}>Вперёд</Text></Pressable>
   <Pressable onPress={()=>web.current?.reload()}><Text style={{color:'white'}}>Обновить</Text></Pressable>
   <Pressable onPress={navigate}><Text style={{color:'white'}}>Открыть</Text></Pressable>
   <Pressable onPress={translateInfo}><Text style={{color:'white'}}>Перевод</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={togglePageMedia}><Text style={{color:'white'}}>{mediaPaused?'Продолжить':'Пауза'}</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>setShowDownloads(value=>!value)}><Text style={{color:'white'}}>Файлы</Text></Pressable>
   {!privateMode?<Pressable onPress={()=>void saveFavorite()}><Text style={{color:'white'}}>☆</Text></Pressable>:null}
   {!privateMode?<Pressable onPress={()=>void openLibrary('favorites')}><Text style={{color:'white'}}>Избранное</Text></Pressable>:null}
   {!privateMode?<Pressable onPress={()=>void openLibrary('history')}><Text style={{color:'white'}}>История</Text></Pressable>:null}
  </View>
 </View>
}
