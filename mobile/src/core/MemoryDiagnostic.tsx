import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { proposeMemoryAction, confirmMemorySave, recallPersonalNotes, type MemoryProposal } from './seyveoMemoryBridge';

export function MemoryDiagnostic({onChange}:{onChange:()=>void}) {
 const [input,setInput]=useState('');
 const [pending,setPending]=useState<MemoryProposal|null>(null);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const prepare=()=>{
  const proposal=proposeMemoryAction(input);
  setPending(proposal);
  setMessage(proposal?'Сэйви: сохранить это в защищённой памяти?':'Сэйви: начни с команды «Запомни ...».');
 };
 const confirm=async()=>{
  if(busy||!pending)return;
  setBusy(true);
  try{
   const reply=await confirmMemorySave(pending);
   setPending(null);setInput('');setMessage(reply.message);onChange();
  }catch{setMessage('Сохранение не выполнено. Проверь SecureVault.');}
  finally{setBusy(false);}
 };
 const recall=async()=>{
  if(busy)return;
  setBusy(true);
  try{
   const reply=await recallPersonalNotes();
   setMessage(reply.message+' '+(reply.notes||[]).map(n=>n.text).join(' · '));
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
  {button('Подготовить запись',prepare,busy||!input.trim())}
  {pending?<View>
   <Text style={{color:'#f3faf7',marginTop:12}}>{pending.text}</Text>
   {button('Подтвердить сохранение',()=>{void confirm();},busy)}
   {button('Отмена',()=>{setPending(null);setMessage('Запись отменена.');},busy)}
  </View>:null}
  {button('Что ты запомнила?',()=>{void recall();},busy)}
  {message?<Text style={{color:'#b0cfc5',marginTop:12}}>{message}</Text>:null}
 </View>;
}
