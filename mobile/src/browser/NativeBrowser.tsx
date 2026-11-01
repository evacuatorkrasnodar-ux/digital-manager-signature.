import React,{useEffect,useRef,useState} from 'react';
import {loadBrowserSession,saveBrowserSession} from './session-store';
import {View,Text,TextInput,Pressable,ScrollView,Alert} from 'react-native';
import {File,Paths} from 'expo-file-system';
import {translateText,translateEndpoint,usableTranslationEndpoint} from './translate-service';
import {WebView} from 'react-native-webview';
import {sharedMediaSession} from '../media/sharedMediaSession';
type Tab={id:number;url:string};
const HOME='https://www.wikipedia.org/';
export function NativeBrowser(){
 const web=useRef<WebView>(null);
 const [tabs,setTabs]=useState<Tab[]>([{id:1,url:HOME}]);
 const [active,setActive]=useState(1);
 const [nextId,setNextId]=useState(2);
 const [sessionReady,setSessionReady]=useState(false);
 useEffect(()=>{let mounted=true;void loadBrowserSession().then(saved=>{
  if(!mounted)return;
  if(saved){setTabs(saved.tabs);setActive(saved.active);setNextId(Math.max(...saved.tabs.map(t=>t.id))+1);setAddress(saved.tabs.find(t=>t.id===saved.active)?.url||HOME)}
  setSessionReady(true);
 });return()=>{mounted=false}},[]);
 useEffect(()=>{if(sessionReady)void saveBrowserSession(tabs,active)},[tabs,active,sessionReady]);
 const current=tabs.find(t=>t.id===active)||tabs[0];
 const [address,setAddress]=useState(HOME);
 const [back,setBack]=useState(false),[forward,setForward]=useState(false);
 const [translationNotice,setTranslationNotice]=useState('');
 const [translated,setTranslated]=useState('');
 const [translating,setTranslating]=useState(false);
 const [downloads,setDownloads]=useState<{name:string;uri:string}[]>([]);
 const [showDownloads,setShowDownloads]=useState(false);
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
 useEffect(()=>{if(activeMediaId.current!==null&&activeMediaId.current!==String(active)){sharedMediaSession.clear('browser',activeMediaId.current);activeMediaId.current=null}},[active]);
 function handleBrowserMessage(value:string){
  try{const msg=JSON.parse(value);
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
 function select(tab:Tab){setMediaVisible(false);setMediaPaused(false);setActive(tab.id);setAddress(tab.url);setBack(false);setForward(false)}
 function add(){if(tabs.length>=30)return;const t={id:nextId,url:HOME};setTabs(old=>[...old,t]);setNextId(n=>n+1);select(t)}
 function close(id:number){const left=tabs.filter(t=>t.id!==id);if(!left.length){const t={id:nextId,url:HOME};setNextId(n=>n+1);setTabs([t]);select(t);return}setTabs(left);if(active===id)select(left[Math.max(0,tabs.findIndex(t=>t.id===id)-1)])}
 function navigate(){sharedMediaSession.clear('browser',String(active));activeMediaId.current=null;setMediaVisible(false);setMediaPaused(false);const value=address.trim();const raw=value.includes('://')?value:'https://'+value;try{const url=new URL(raw);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error();setTabs(old=>old.map(t=>t.id===active?{...t,url:url.href}:t));setAddress(url.href)}catch{setAddress(current.url)}}
 return <View style={{flex:1,backgroundColor:'#11161b'}}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0,maxHeight:58}} contentContainerStyle={{padding:8,alignItems:'center',gap:6}}>
   {tabs.map(t=><View key={t.id} style={{flexDirection:'row',alignItems:'center',borderRadius:15,borderWidth:1,borderColor:t.id===active?'#acc9ce':'#56646b',backgroundColor:t.id===active?'#34434a':'#242e35'}}>
    <Pressable onPress={()=>select(t)} accessibilityRole="button" style={{padding:10,maxWidth:145}}><Text numberOfLines={1} style={{color:'#f3f6f7',fontSize:12}}>{new URL(t.url).hostname}</Text></Pressable>
    <Pressable onPress={()=>close(t.id)} accessibilityRole="button" accessibilityLabel="Закрыть вкладку" style={{padding:10}}><Text style={{color:'#d5dfe0'}}>×</Text></Pressable>
   </View>)}
   <Pressable onPress={add} accessibilityRole="button" accessibilityLabel="Новая вкладка" style={{padding:10}}><Text style={{color:'white',fontSize:23}}>＋</Text></Pressable>
  </ScrollView>
  <TextInput value={address} onChangeText={setAddress} onSubmitEditing={navigate} keyboardType="url" autoCapitalize="none" autoCorrect={false} style={{color:'white',padding:12}}/>
  <WebView onMessage={event=>handleBrowserMessage(event.nativeEvent.data)} onLoadEnd={()=>web.current?.injectJavaScript("(function(){if(window.__seyveoMediaWatch)return;window.__seyveoMediaWatch=true;function report(){var nodes=[].slice.call(document.querySelectorAll('audio,video'));var playing=nodes.some(function(n){return !n.paused&&!n.ended});window.ReactNativeWebView.postMessage(JSON.stringify({type:'seyveo-media',present:nodes.length>0,playing:playing}));}document.addEventListener('play',report,true);document.addEventListener('pause',report,true);document.addEventListener('ended',report,true);report();})();true;")} onFileDownload={({nativeEvent})=>{void downloadRequested(nativeEvent.downloadUrl)}} key={current.id} ref={web} source={{uri:current.url}} allowsInlineMediaPlayback={true} allowsPictureInPictureMediaPlayback={true} mediaPlaybackRequiresUserAction={true} allowsFullscreenVideo={true} style={{flex:1}} onNavigationStateChange={event=>{setAddress(event.url);setBack(event.canGoBack);setForward(event.canGoForward);setTabs(old=>old.map(t=>t.id===current.id?{...t,url:event.url}:t))}}/>
  {mediaVisible?<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginHorizontal:12,marginVertical:5,paddingHorizontal:12,paddingVertical:8,borderRadius:16,borderWidth:1,borderColor:'#526670',backgroundColor:'#25343b'}}>
    <Text style={{color:'#e5eeed',fontSize:12}}>Медиа · текущая страница</Text>
    <Pressable accessibilityRole="button" onPress={togglePageMedia} accessibilityLabel={mediaPaused?'Продолжить медиа':'Пауза медиа'}><Text style={{color:'#e5eeed',fontSize:17}}>{mediaPaused?'▶':'Ⅱ'}</Text></Pressable>
   </View>:null}
  {translationNotice?<Text accessibilityRole="alert" style={{color:'#cfdbdf',paddingHorizontal:12,fontSize:12}}>{translationNotice}</Text>:null}
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
  </View>
 </View>
}
