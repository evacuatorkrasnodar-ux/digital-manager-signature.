import React,{useEffect,useState} from 'react';
import {View,Text,Pressable} from 'react-native';
import {sharedMediaSession,type MediaSnapshot} from './sharedMediaSession';

/** Sends play/pause requests to the current registered media provider. */
export function SharedMediaStatus(){
 const [media,setMedia]=useState<MediaSnapshot>(()=>sharedMediaSession.getSnapshot());
 useEffect(()=>sharedMediaSession.subscribe(setMedia),[]);
 if(media.phase==='idle'||!media.origin)return null;
 const state=media.phase==='playing'?'Воспроизведение':media.phase==='paused'?'Пауза':media.phase==='loading'?'Загрузка':'Ошибка';
 return <View accessibilityRole="summary" style={{backgroundColor:'#223138',borderTopWidth:1,borderColor:'#53636c',paddingVertical:8,paddingHorizontal:14}}>
  <Text style={{color:'#f3f8f7',fontSize:12}} numberOfLines={1}>{media.origin==='browser'?'Браузер':'SEYVEO Music'} · {state}</Text>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{color:'#bdcacc',fontSize:11,flex:1}} numberOfLines={1}>{media.title}</Text>
  {(media.phase==='playing'||media.phase==='paused')?<Pressable accessibilityRole="button" accessibilityLabel={media.phase==='playing'?'Пауза':'Продолжить'} onPress={()=>sharedMediaSession.sendCommand(media.phase==='playing'?'pause':'play')} style={{paddingHorizontal:12,paddingVertical:5}}><Text style={{color:'#f3f8f7',fontSize:18}}>{media.phase==='playing'?'Ⅱ':'▶'}</Text></Pressable>:null}</View>
 </View>;
}
