import React,{useState} from 'react';
import {View,Text,TextInput,Pressable,StyleSheet} from 'react-native';
import {SeyveoActionButton} from './SeyveoActionButton';
import {iconAccents} from '../theme/iconAccents';

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
  <View style={s.headingRow}><Text style={[s.symbol,{color:notice.channel==='family'?iconAccents.family:iconAccents.chat}]}>{notice.channel==='family'?'♡':'✉'}</Text><Text style={s.overline}>{notice.channel==='family'?'СЕМЕЙНЫЙ ЧАТ':'РАБОЧИЙ ЧАТ'} {demo?'· ДЕМО':''}</Text></View>
  <Text style={s.name}>{notice.sender}</Text>
  <Text style={s.message}>{notice.message}</Text>
  {mode==='choose'?<View style={s.row}>
   <SeyveoActionButton label="Ответит Сэйви" onPress={()=>{setDraft(draftSuggestion??'');setMode('suggest')}} />
   <SeyveoActionButton kind="human" label="Ответить самому" onPress={()=>{setDraft('');setMode('write')}} />
  </View>:<View>
   <Text style={s.hint}>{mode==='suggest'?'Черновик Сэйви · проверь перед отправкой':'Ваш ответ'}</Text>
   <TextInput multiline accessibilityLabel="Текст ответа" value={draft} onChangeText={setDraft} maxLength={4000} placeholder="Написать ответ…" placeholderTextColor="#8eaa9e" style={s.input}/>
   <View style={s.row}>
    <SeyveoActionButton kind="human" label={busy?'Отправка…':'Отправить'} disabled={!onSend||busy||!draft.trim()} onPress={()=>{void submit()}} />
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
 headingRow:{flexDirection:'row',alignItems:'center',gap:10},symbol:{fontSize:22,fontWeight:'300'},
 card:{backgroundColor:'#091e18',borderColor:'#2a5344',borderWidth:1,borderRadius:26,padding:18,marginTop:12},
 overline:{color:'#8be3b2',fontSize:11,letterSpacing:1},name:{color:'#f4fff8',fontSize:17,marginTop:8},
 message:{color:'#d7e6dc',fontSize:14,marginTop:10,lineHeight:21},
 row:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:10,marginTop:18},
 primary:{backgroundColor:'#e8fff1',borderRadius:999,paddingHorizontal:18,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:8,borderWidth:1,borderColor:'#baf7d5',shadowColor:'#51d89d',shadowOpacity:0.21,shadowRadius:10,shadowOffset:{width:0,height:2},elevation:3},
 primaryText:{color:'#10251d',fontWeight:'700',fontSize:14},star:{color:'#123b2a',fontSize:24,lineHeight:25},secondary:{borderWidth:1,borderColor:'#426457',borderRadius:999,paddingHorizontal:17,paddingVertical:12,backgroundColor:'#10251e'},action:{paddingVertical:10,paddingHorizontal:8},
 actionText:{color:'#d5e8de',fontSize:14,fontWeight:'500'},hint:{color:'#a4c4b3',fontSize:12,marginTop:12},
 input:{color:'#fff',borderColor:'#416758',borderWidth:1,borderRadius:12,padding:12,marginTop:8,minHeight:66},
 warning:{color:'#ffd4bd',fontSize:12,marginTop:8}
});
