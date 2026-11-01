import React,{useEffect,useState} from 'react';
import {View,Text,TextInput,Pressable} from 'react-native';
import {startNativeTrack,stopNativeTrack} from './nativeMusicEngine';
import {SharedMediaStatus} from './SharedMediaStatus';

/** Developer-only diagnostic for a directly licensed HTTPS audio URL. */
export function MusicEngineDiagnostic(){
 const [url,setUrl]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 useEffect(()=>()=>stopNativeTrack(),[]);
 async function start(){
  if(busy)return;
  try{
   const parsed=new URL(url.trim());
   if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw Error('invalid-url');
   setBusy(true);setMessage('Запускаем нативное аудио…');
   await startNativeTrack(parsed.href,'Тест SEYVEO Music');
   setMessage('Команда запуска отправлена. Реальное состояние показано ниже.');
  }catch{setMessage('Не удалось начать воспроизведение. Укажите прямую HTTPS-ссылку на разрешённый аудиофайл.')}
  finally{setBusy(false)}
 }
 return <View style={{backgroundColor:'#172729',borderColor:'#3b625b',borderWidth:1,borderRadius:18,padding:14,marginTop:18}}>
  <Text style={{color:'#f3faf7',fontSize:16}}>SEYVEO Music · проверка движка</Text>
  <Text style={{color:'#b0cfc5',fontSize:12,marginTop:7}}>Для разработчика: прямая ссылка на аудио, которое разрешено воспроизводить. Никакого извлечения музыки с чужих сайтов.</Text>
  <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="url" value={url} onChangeText={setUrl} placeholder="https://.../audio.mp3" placeholderTextColor="#8aa9a2" style={{color:'#f3faf7',paddingVertical:12}}/>
  <View style={{flexDirection:'row',gap:16,alignItems:'center'}}>
   <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void start()}><Text style={{color:'#94e0c4'}}>▶ Проверить</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>{stopNativeTrack();setMessage('Остановлено')}}><Text style={{color:'#94e0c4'}}>■ Стоп</Text></Pressable>
  </View>
  {message?<Text style={{color:'#b0cfc5',marginTop:9,fontSize:12}}>{message}</Text>:null}
  <SharedMediaStatus/>
 </View>
}
