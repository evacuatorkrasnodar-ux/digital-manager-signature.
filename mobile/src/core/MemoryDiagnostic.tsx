import React, { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { planOfflineReply, offlineFallback } from './offlineBrain.mjs';
import { proposeMemoryAction, confirmMemorySave, recallPersonalNotes, type MemoryProposal } from './seyveoMemoryBridge';

export function MemoryDiagnostic({onChange}:{onChange:()=>void}) {
 const [input,setInput]=useState('');
 const [pending,setPending]=useState<MemoryProposal|null>(null);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const savingRef=useRef(false);
 const prepare=()=>{
  if(busy)return;
  if(/^(?:сэйви[,!\s]*)?(?:что ты (?:запомнила|помнишь)|покажи (?:мои )?заметки)\??$/iu.test(input.trim())){
   setPending(null);void recall();return;
  }
  const proposal=proposeMemoryAction(input);
  setPending(proposal);
  if(proposal){setMessage('Сэйви: сохранить это в защищённой памяти?');return;}
  const plan=planOfflineReply(input,{modelReady:false,packs:[]});
  setMessage(offlineFallback(plan)||'Сэйви пока не умеет выполнять это действие. Никаких изменений не сделано.');
 };
 const confirm=async()=>{
  if(busy||savingRef.current||!pending)return;
  savingRef.current=true;
  setBusy(true);
  try{
   const reply=await confirmMemorySave(pending);
   setPending(null);setInput('');setMessage(reply.message);onChange();
  }catch{setMessage('Сохранение не выполнено. Проверь SecureVault.');}
  finally{savingRef.current=false;setBusy(false);}
 };
 const recall=async()=>{
  if(busy||savingRef.current)return;
  setBusy(true);
  try{
   const reply=await recallPersonalNotes();
   const visible=(reply.notes||[]).slice(0,10);
   setMessage(reply.message+(visible.length?'\n'+visible.map((n,i)=>`${i+1}. ${n.text}`).join('\n'):'')+(reply.notes&&reply.notes.length>10?'\nПоказаны первые 10 заметок.':''));
  }catch{setMessage('Не удалось прочитать SecureVault.');}
  finally{setBusy(false);}
 };
 const button=(label:string,action:()=>void,disabled=false)=>
  <Pressable accessibilityRole="button" disabled={disabled} onPress={action}
   style={{padding:14,borderWidth:1,borderColor:'#3b625b',borderRadius:14,marginTop:10,opacity:disabled?.5:1}}>
   <Text style={{color:'#f3faf7',textAlign:'center'}}>{label}</Text>
  </Pressable>;
 return <View style={{backgroundColor:'#172729',padding:20,borderRadius:20,marginTop:14}}>
  <Text style={{color:'#f3faf7',fontSize:17}}>Сэйви · личная память</Text>
  <Text style={{color:'#b0cfc5',marginTop:8}}>Диагностика текстовых команд без облака и голосовой модели.</Text>
  <TextInput multiline maxLength={4200} value={input} onChangeText={t=>{setInput(t);setPending(null);setMessage('');}}
   placeholder="Сэйви, запомни..." placeholderTextColor="#b0cfc5"
   style={{color:'#f3faf7',borderWidth:1,borderColor:'#3b625b',padding:12,minHeight:65,marginTop:12}}/>
  {button('Спросить Сэйви',prepare,busy||!input.trim())}
  {pending?<View>
   <Text style={{color:'#f3faf7',marginTop:12}}>{pending.text}</Text>
   {button('Подтвердить сохранение',()=>{void confirm();},busy)}
   {button('Отмена',()=>{setPending(null);setMessage('Запись отменена.');},busy)}
  </View>:null}
  {button('Что ты запомнила?',()=>{void recall();},busy)}
  {message?<Text accessibilityRole="text" style={{color:'#b0cfc5',marginTop:12}}>{message}</Text>:null}
 </View>;
}
