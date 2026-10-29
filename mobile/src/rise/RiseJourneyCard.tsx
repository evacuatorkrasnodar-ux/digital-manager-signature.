import React,{useEffect,useState} from 'react';
import {loadRiseAnswers,saveRiseAnswer} from './riseRepository';
import {View,Text,TextInput,Pressable,StyleSheet} from 'react-native';
import {nextStep} from './journey.mjs';

export function RiseJourneyCard(){
 const [answers,setAnswers]=useState<Record<string,string>>({});
 const [draft,setDraft]=useState('');
 const [status,setStatus]=useState<'loading'|'ready'|'unavailable'>('loading');
 useEffect(()=>{let active=true;loadRiseAnswers().then(data=>{if(active){setAnswers(data);setStatus('ready')}}).catch(()=>{if(active)setStatus('unavailable')});return()=>{active=false}},[]);
 const step=nextStep(answers);
 const advance=async()=>{
  if(status!=='ready'||step.key==='plan'||!draft.trim())return;
  setStatus('loading');
  try {await saveRiseAnswer(step.key,draft.trim().slice(0,240));
   setAnswers(previous=>({...previous,[step.key]:draft.trim().slice(0,240)}));setDraft('');setStatus('ready');
  } catch {setStatus('unavailable')}
 };
 return <View style={styles.card}>
  <Text style={styles.heading}>SEYVEO RISE · МОЙ ПУТЬ</Text>
  <Text style={styles.question}>{step.title}</Text>
  {status==='unavailable'?<Text style={styles.note}>Защищённое хранилище недоступно. Ответ не сохранён.</Text>:null}
  {step.key!=='plan'?<>
   <TextInput accessibilityLabel={step.title} placeholder="Ваш ответ" placeholderTextColor="#a9bbaf"
    value={draft} onChangeText={setDraft} maxLength={240} style={styles.input}/>
   <Pressable accessibilityRole="button" onPress={advance} disabled={status!=='ready'||!draft.trim()} style={styles.button}>
    <Text style={styles.heading}>Продолжить</Text>
   </Pressable>
  </>:null}
  <Text style={styles.note}>Ответы сохраняются только в зашифрованном хранилище этого устройства. Синхронизация пока не подключена.</Text>
 </View>;
}
const styles=StyleSheet.create({
 card:{marginTop:18,padding:20,borderRadius:20,backgroundColor:'#152623',borderWidth:1,borderColor:'#31564e'},
 heading:{color:'#95d9bd',fontSize:12,letterSpacing:1},
 question:{color:'#f3faf7',fontSize:18,marginTop:14},
 input:{color:'#f3faf7',borderBottomWidth:1,borderBottomColor:'#527469',marginTop:15,padding:10},
 button:{marginTop:14,padding:12},
 note:{marginTop:12,color:'#abc7bc',fontSize:12,lineHeight:18}
});
