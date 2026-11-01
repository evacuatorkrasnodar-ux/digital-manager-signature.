import React,{useEffect,useRef,useState} from 'react';
import {loadBrowserSession,saveBrowserSession} from './session-store';
import {View,Text,TextInput,Pressable,ScrollView,Alert} from 'react-native';
import {File,Paths} from 'expo-file-system';
import {translateText,translateEndpoint,usableTranslationEndpoint} from './translate-service';
import {WebView} from 'react-native-webview';
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
 async function downloadRequested(downloadUrl:string){
  try{
   const u=new URL(downloadUrl);
   if(u.protocol!=='https:'||u.username||u.password){setTranslationNotice('Разрешены только защищённые HTTPS-загрузки.');return}
   Alert.alert('Загрузить файл?',u.hostname,[{text:'Отмена',style:'cancel'},{text:'Загрузить',onPress:()=>{void (async()=>{
    try{
     const basename=(u.pathname.split('/').pop()||'download').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,72)||'download';
     const destination=new File(Paths.document,Date.now()+'-'+basename);
     const file=await File.downloadFileAsync(u.href,destination);
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
 function select(tab:Tab){setActive(tab.id);setAddress(tab.url);setBack(false);setForward(false)}
 function add(){if(tabs.length>=30)return;const t={id:nextId,url:HOME};setTabs(old=>[...old,t]);setNextId(n=>n+1);select(t)}
 function close(id:number){const left=tabs.filter(t=>t.id!==id);if(!left.length){const t={id:nextId,url:HOME};setNextId(n=>n+1);setTabs([t]);select(t);return}setTabs(left);if(active===id)select(left[Math.max(0,tabs.findIndex(t=>t.id===id)-1)])}
 function navigate(){const value=address.trim();const raw=value.includes('://')?value:'https://'+value;try{const url=new URL(raw);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error();setTabs(old=>old.map(t=>t.id===active?{...t,url:url.href}:t));setAddress(url.href)}catch{setAddress(current.url)}}
 return <View style={{flex:1,backgroundColor:'#11161b'}}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0,maxHeight:58}} contentContainerStyle={{padding:8,alignItems:'center',gap:6}}>
   {tabs.map(t=><View key={t.id} style={{flexDirection:'row',alignItems:'center',borderRadius:15,borderWidth:1,borderColor:t.id===active?'#acc9ce':'#56646b',backgroundColor:t.id===active?'#34434a':'#242e35'}}>
    <Pressable onPress={()=>select(t)} accessibilityRole="button" style={{padding:10,maxWidth:145}}><Text numberOfLines={1} style={{color:'#f3f6f7',fontSize:12}}>{new URL(t.url).hostname}</Text></Pressable>
    <Pressable onPress={()=>close(t.id)} accessibilityRole="button" accessibilityLabel="Закрыть вкладку" style={{padding:10}}><Text style={{color:'#d5dfe0'}}>×</Text></Pressable>
   </View>)}
   <Pressable onPress={add} accessibilityRole="button" accessibilityLabel="Новая вкладка" style={{padding:10}}><Text style={{color:'white',fontSize:23}}>＋</Text></Pressable>
  </ScrollView>
  <TextInput value={address} onChangeText={setAddress} onSubmitEditing={navigate} keyboardType="url" autoCapitalize="none" autoCorrect={false} style={{color:'white',padding:12}}/>
  <WebView onMessage={event=>{if(!translating)void handleTranslationMessage(event.nativeEvent.data)}} onFileDownload={({nativeEvent})=>{void downloadRequested(nativeEvent.downloadUrl)}} key={current.id} ref={web} source={{uri:current.url}} style={{flex:1}} onNavigationStateChange={event=>{setAddress(event.url);setBack(event.canGoBack);setForward(event.canGoForward);setTabs(old=>old.map(t=>t.id===current.id?{...t,url:event.url}:t))}}/>
  {translationNotice?<Text accessibilityRole="alert" style={{color:'#cfdbdf',paddingHorizontal:12,fontSize:12}}>{translationNotice}</Text>:null}
  {translated?<ScrollView style={{maxHeight:210,backgroundColor:'#263039',padding:12}}><Pressable onPress={()=>setTranslated('')}><Text style={{color:'white',textAlign:'right'}}>Закрыть ×</Text></Pressable><Text style={{color:'white',fontSize:14,lineHeight:22}}>{translated}</Text></ScrollView>:null}
  <View style={{flexDirection:'row',justifyContent:'space-around',padding:12}}>
   <Pressable disabled={!back} onPress={()=>web.current?.goBack()}><Text style={{color:'white'}}>Назад</Text></Pressable>
   <Pressable disabled={!forward} onPress={()=>web.current?.goForward()}><Text style={{color:'white'}}>Вперёд</Text></Pressable>
   <Pressable onPress={()=>web.current?.reload()}><Text style={{color:'white'}}>Обновить</Text></Pressable>
   <Pressable onPress={navigate}><Text style={{color:'white'}}>Открыть</Text></Pressable>
   <Pressable onPress={translateInfo}><Text style={{color:'white'}}>Перевод</Text></Pressable>
  </View>
 </View>
}
