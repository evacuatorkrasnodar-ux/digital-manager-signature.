import React,{useRef,useState} from 'react';
import {View,Text,TextInput,Pressable,ScrollView} from 'react-native';
import {WebView} from 'react-native-webview';
type Tab={id:number;url:string};
const HOME='https://www.wikipedia.org/';
export function NativeBrowser(){
 const web=useRef<WebView>(null);
 const [tabs,setTabs]=useState<Tab[]>([{id:1,url:HOME}]);
 const [active,setActive]=useState(1);
 const [nextId,setNextId]=useState(2);
 const current=tabs.find(t=>t.id===active)||tabs[0];
 const [address,setAddress]=useState(HOME);
 const [back,setBack]=useState(false),[forward,setForward]=useState(false);
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
  <WebView key={current.id} ref={web} source={{uri:current.url}} style={{flex:1}} onNavigationStateChange={event=>{setAddress(event.url);setBack(event.canGoBack);setForward(event.canGoForward);setTabs(old=>old.map(t=>t.id===active?{...t,url:event.url}:t))}}/>
  <View style={{flexDirection:'row',justifyContent:'space-around',padding:12}}>
   <Pressable disabled={!back} onPress={()=>web.current?.goBack()}><Text style={{color:'white'}}>Назад</Text></Pressable>
   <Pressable disabled={!forward} onPress={()=>web.current?.goForward()}><Text style={{color:'white'}}>Вперёд</Text></Pressable>
   <Pressable onPress={()=>web.current?.reload()}><Text style={{color:'white'}}>Обновить</Text></Pressable>
   <Pressable onPress={navigate}><Text style={{color:'white'}}>Открыть</Text></Pressable>
  </View>
 </View>
}
