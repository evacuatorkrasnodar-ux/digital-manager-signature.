import React,{useEffect,useState} from 'react';
import {View,Text} from 'react-native';
import {sharedMediaSession,type MediaSnapshot} from './sharedMediaSession';

/** Read-only shared media indicator. Controls require a native playback engine. */
export function SharedMediaStatus(){
 const [media,setMedia]=useState<MediaSnapshot>(()=>sharedMediaSession.getSnapshot());
 useEffect(()=>sharedMediaSession.subscribe(setMedia),[]);
 if(media.phase==='idle'||!media.origin)return null;
 const state=media.phase==='playing'?'Воспроизведение':media.phase==='paused'?'Пауза':media.phase==='loading'?'Загрузка':'Ошибка';
 return <View accessibilityRole="summary" style={{backgroundColor:'#223138',borderTopWidth:1,borderColor:'#53636c',paddingVertical:8,paddingHorizontal:14}}>
  <Text style={{color:'#f3f8f7',fontSize:12}} numberOfLines={1}>{media.origin==='browser'?'Браузер':'SEYVEO Music'} · {state}</Text>
  <Text style={{color:'#bdcacc',fontSize:11}} numberOfLines={1}>{media.title}</Text>
 </View>;
}
