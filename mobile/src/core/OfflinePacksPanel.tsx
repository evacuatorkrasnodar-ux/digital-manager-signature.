import React,{useEffect,useMemo,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {createNativeOfflinePackManager} from './nativeOfflinePacks';
import type {InstalledPack} from './expoPackStorage.mjs';

const colors={text:'#f3faf7',sub:'#b0cfc5',border:'#3b625b'};
export function OfflinePacksPanel(){
 const manager=useMemo(()=>createNativeOfflinePackManager(),[]);
 const [items,setItems]=useState<InstalledPack[]>([]);
 const [confirm,setConfirm]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const refresh=async()=>{try{setItems(await manager.list());setError('')}catch{setError('Не удалось прочитать офлайн-пакеты.')}};
 useEffect(()=>{void refresh()},[manager]);
 const remove=async(id:string)=>{
  if(busy)return;
  setBusy(true);
  try{
   const result=await manager.remove(id);
   setConfirm(null);
   if(result.status!=='removed')setError('Пакет нельзя удалить: '+result.status);
   await refresh();
  }catch{setError('Удаление не выполнено.')}
  finally{setBusy(false)}
 };
 return <View style={{borderColor:colors.border,borderWidth:1,borderRadius:20,padding:18,marginTop:16}}>
  <Text style={{color:colors.text,fontSize:17}}>Офлайн-возможности</Text>
  <Text style={{color:colors.sub,marginTop:8}}>Дополнительные компоненты хранятся отдельно от личной памяти. Проверенный каталог загрузок пока не подключён.</Text>
  {items.length===0?<Text style={{color:colors.sub,marginTop:12}}>Нет установленных пакетов.</Text>:null}
  {items.map(item=><View key={item.id} style={{borderTopWidth:1,borderColor:colors.border,paddingVertical:12,marginTop:8}}>
   <Text style={{color:colors.text}}>{item.title}</Text>
   <Text style={{color:colors.sub}}>{Math.ceil(item.bytes/1048576)} МБ</Text>
   {confirm===item.id?<View>
    <Text style={{color:colors.sub,marginTop:8}}>Удалить только этот офлайн-пакет? Личные заметки сохранятся.</Text>
    <Pressable disabled={busy} onPress={()=>void remove(item.id)}><Text style={{color:colors.text,marginTop:12}}>Подтвердить удаление</Text></Pressable>
    <Pressable disabled={busy} onPress={()=>setConfirm(null)}><Text style={{color:colors.sub,marginTop:12}}>Отмена</Text></Pressable>
   </View>:<Pressable disabled={busy} onPress={()=>setConfirm(item.id)}><Text style={{color:colors.text,marginTop:12}}>Удалить пакет</Text></Pressable>}
  </View>)}
  {error?<Text style={{color:colors.sub,marginTop:12}}>{error}</Text>:null}
  <Pressable disabled={busy} onPress={()=>void refresh()}><Text style={{color:colors.text,marginTop:16}}>Обновить список</Text></Pressable>
 </View>;
}
