import React,{useRef,useState} from 'react';
import {View,Text,TextInput,Pressable} from 'react-native';
import {WebView} from 'react-native-webview';
export function NativeBrowser(){
 const web=useRef<WebView>(null);
 const [address,setAddress]=useState('https://www.wikipedia.org/');
 const [page,setPage]=useState(address);
 const [back,setBack]=useState(false);
 const [forward,setForward]=useState(false);
 function navigate(){
  const value=address.trim();
  const text=value.includes('://')?value:'https://'+value;
  try{const url=new URL(text);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error();setPage(url.href)}catch{setAddress(page)}
 }
 return <View style={{flex:1,backgroundColor:'#11161b'}}>
  <TextInput value={address} onChangeText={setAddress} onSubmitEditing={navigate} keyboardType="url" autoCapitalize="none" autoCorrect={false} style={{color:'white',padding:12}}/>
  <WebView ref={web} source={{uri:page}} style={{flex:1}} onNavigationStateChange={event=>{setAddress(event.url);setBack(event.canGoBack);setForward(event.canGoForward)}}/>
  <View style={{flexDirection:'row',justifyContent:'space-around',padding:12}}>
   <Pressable disabled={!back} onPress={()=>web.current?.goBack()}><Text style={{color:'white'}}>Назад</Text></Pressable>
   <Pressable disabled={!forward} onPress={()=>web.current?.goForward()}><Text style={{color:'white'}}>Вперёд</Text></Pressable>
   <Pressable onPress={()=>web.current?.reload()}><Text style={{color:'white'}}>Обновить</Text></Pressable>
   <Pressable onPress={navigate}><Text style={{color:'white'}}>Открыть</Text></Pressable>
  </View>
 </View>
}
