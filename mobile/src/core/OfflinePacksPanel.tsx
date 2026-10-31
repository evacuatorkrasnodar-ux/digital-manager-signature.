import React,{useEffect,useMemo,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {createNativeOfflinePackManager} from './nativeOfflinePacks';
import type {InstalledPack} from './expoPackStorage.mjs';
import {validateOfflineCatalog} from './offlineCatalog.mjs';
const catalog:InstalledPack[]=validateOfflineCatalog([],[]);

const colors={text:'#f3faf7',sub:'#b0cfc5',border:'#3b625b'};
export function OfflinePacksPanel(){
 const manager=useMemo(()=>createNativeOfflinePackManager(),[]);
 const [items,setItems]=useState<InstalledPack[]>([]);
 const [confirm,setConfirm]=useState<string|null>(null);
 const [installConfirm,setInstallConfirm]=useState<string|null>(null);
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
  <Text style={{color:colors.sub,marginTop:8}}>Дополнительные компоненты хранятся отдельно от личной памяти. Установка доступна только для опубликованных и проверенных пакетов.</Text>
  {catalog.length===0?<Text style={{color:colors.sub,marginTop:12}}>Проверенных пакетов для скачивания пока нет.</Text>:null}
  {catalog.filter(p=>!items.some(x=>x.id===p.id)).map(p=><View key={p.id} style={{paddingVertical:12}}><Text style={{color:colors.text}}>{p.title}</Text>{installConfirm===p.id?<View><Text style={{color:colors.sub}}>Скачать {Math.ceil(p.bytes/1048576)} МБ?</Text><Pressable disabled={busy} onPress={()=>{setBusy(true);void manager.install(p).then(()=>refresh()).catch(()=>setError('Не удалось установить пакет.')).finally(()=>{setBusy(false);setInstallConfirm(null)})}}><Text style={{color:colors.text}}>Подтвердить</Text></Pressable><Pressable onPress={()=>setInstallConfirm(null)}><Text style={{color:colors.sub}}>Отмена</Text></Pressable></View>:<Pressable disabled={busy} onPress={()=>setInstallConfirm(p.id)}><Text style={{color:colors.text}}>Скачать</Text></Pressable>}</View>)}
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
