import React,{useState} from 'react';
import {View,Text,TextInput,Pressable,StyleSheet} from 'react-native';

export type ChatNotice={id:string;sender:string;channel:'work'|'family';message:string};
type Props={notice:ChatNotice;draftSuggestion?:string;onSend?:(id:string,text:string)=>Promise<boolean>;onOpenChat?:()=>void;onDismiss?:()=>void;demo?:boolean};
export function HomeChatCard({notice,draftSuggestion,onSend,onOpenChat,onDismiss,demo=false}:Props){
 const [mode,setMode]=useState<'choose'|'suggest'|'write'>('choose');
 const [draft,setDraft]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const submit=async()=>{
  const text=draft.trim();
  if(!onSend||!text||busy)return;
  setBusy(true);setError('');
  try{const delivered=await onSend(notice.id,text);if(delivered){onDismiss?.()}else setError('Не удалось отправить. Сообщение сохранено в поле ответа.')}
  catch{setError('Не удалось отправить. Попробуйте ещё раз.')}
  finally{setBusy(false)}
 };
 return <View style={s.card}>
  <Text style={s.overline}>{notice.channel==='family'?'СЕМЕЙНЫЙ ЧАТ':'РАБОЧИЙ ЧАТ'} {demo?'· ДЕМО':''}</Text>
  <Text style={s.name}>{notice.sender}</Text>
  <Text style={s.message}>{notice.message}</Text>
  {mode==='choose'?<View style={s.row}>
   <Pressable accessibilityRole="button" onPress={()=>{setDraft(draftSuggestion??'');setMode('suggest')}} style={s.primary}><Text style={s.primaryText}>Ответит Сэйви</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>{setDraft('');setMode('write')}} style={s.action}><Text style={s.actionText}>Ответить самому</Text></Pressable>
  </View>:<View>
   <Text style={s.hint}>{mode==='suggest'?'Черновик Сэйви · проверь перед отправкой':'Ваш ответ'}</Text>
   <TextInput multiline accessibilityLabel="Текст ответа" value={draft} onChangeText={setDraft} maxLength={4000} placeholder="Написать ответ…" placeholderTextColor="#8eaa9e" style={s.input}/>
   <View style={s.row}>
    <Pressable accessibilityRole="button" disabled={!onSend||busy||!draft.trim()} onPress={()=>{void submit()}} style={s.primary}><Text style={s.primaryText}>{busy?'Отправка…':'Отправить'}</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={()=>setMode('choose')} style={s.action}><Text style={s.actionText}>Назад</Text></Pressable>
   </View>
   {!onSend?<Text style={s.hint}>Отправка ещё не подключена к чату.</Text>:null}
   {!!error?<Text style={s.warning}>{error}</Text>:null}
  </View>}
  {onOpenChat?<Pressable accessibilityRole="button" onPress={onOpenChat} style={s.action}><Text style={s.actionText}>Открыть переписку</Text></Pressable>:null}
  <Text style={s.hint}>Карточка исчезнет только после подтверждённой отправки.</Text>
 </View>;
}
const s=StyleSheet.create({
 card:{backgroundColor:'#132922',borderColor:'#315a48',borderWidth:1,borderRadius:22,padding:18,marginTop:12},
 overline:{color:'#8be3b2',fontSize:11,letterSpacing:1},name:{color:'#f4fff8',fontSize:17,marginTop:8},
 message:{color:'#d7e6dc',fontSize:14,marginTop:10,lineHeight:21},
 row:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:14},
 primary:{backgroundColor:'#256b4d',borderRadius:20,paddingHorizontal:14,paddingVertical:10},
 primaryText:{color:'#fff',fontWeight:'600'},action:{paddingVertical:10,paddingHorizontal:8},
 actionText:{color:'#a0dfbc',fontSize:13},hint:{color:'#a4c4b3',fontSize:12,marginTop:12},
 input:{color:'#fff',borderColor:'#416758',borderWidth:1,borderRadius:12,padding:12,marginTop:8,minHeight:66},
 warning:{color:'#ffd4bd',fontSize:12,marginTop:8}
});
