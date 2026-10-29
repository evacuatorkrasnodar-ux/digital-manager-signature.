import React,{useEffect,useState} from 'react';
import {loadRiseAnswers,saveRiseAnswer,loadRiseProgress,setRiseProgress,loadRiseCosts,addRiseCost,type RiseCost} from './riseRepository';
import {View,Text,TextInput,Pressable,StyleSheet} from 'react-native';
import {nextStep} from './journey.mjs';
import {plan,sumBudget} from './plan.mjs';

export function RiseJourneyCard(){
 const [answers,setAnswers]=useState<Record<string,string>>({});
 const [draft,setDraft]=useState('');
 const [completed,setCompleted]=useState<string[]>([]);
 const [savingStep,setSavingStep]=useState(false);
 const [costs,setCosts]=useState<RiseCost[]>([]);
 const [costName,setCostName]=useState('');
 const [costAmount,setCostAmount]=useState('');
 const [status,setStatus]=useState<'loading'|'ready'|'unavailable'>('loading');
 useEffect(()=>{let active=true;Promise.all([loadRiseAnswers(),loadRiseProgress(),loadRiseCosts()]).then(([data,progress,rows])=>{if(active){setAnswers(data);setCompleted(progress);setCosts(rows);setStatus('ready')}}).catch(()=>{if(active)setStatus('unavailable')});return()=>{active=false}},[]);
 const step=nextStep(answers);
 const toggleStep=async(id:string)=>{
  if(status!=='ready'||savingStep)return;
  setSavingStep(true);
  const done=!completed.includes(id);
  try{await setRiseProgress(id,done);setCompleted(previous=>done?[...previous,id]:previous.filter(x=>x!==id))}
  catch{setStatus('unavailable')}
  finally{setSavingStep(false)}
 };
 const saveCost=async()=>{
  const amount=Number(costAmount);
  if(status!=='ready'||savingStep||!costName.trim()||!/^\d+$/.test(costAmount)||!Number.isSafeInteger(amount)||amount>1e10||costs.length>=100||!Number.isSafeInteger(costs.reduce((sum,row)=>sum+row.amount,amount)))return;
  setSavingStep(true);
  try{await addRiseCost(costName.trim(),amount);setCosts(await loadRiseCosts());setCostName('');setCostAmount('')}
  catch{setStatus('unavailable')}
  finally{setSavingStep(false)}
 };
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
  {step.key==='plan'?plan.map(([key,title],i)=><Pressable key={key} accessibilityRole="checkbox" accessibilityState={{checked:completed.includes(key),disabled:status!=='ready'||savingStep}} disabled={status!=='ready'||savingStep} onPress={()=>{void toggleStep(key)}} style={styles.button}><Text style={styles.note}>{completed.includes(key)?'✓':'○'} {i+1}. {title}</Text></Pressable>):null}
  {step.key==='plan'?<View><Text style={styles.question}>Черновая смета</Text><TextInput accessibilityLabel="Статья расхода" value={costName} onChangeText={setCostName} placeholder="Например, оборудование" placeholderTextColor="#a9bbaf" maxLength={120} style={styles.input}/><TextInput accessibilityLabel="Сумма расхода" value={costAmount} onChangeText={setCostAmount} keyboardType="number-pad" placeholder="Сумма в выбранной валюте" placeholderTextColor="#a9bbaf" style={styles.input}/><Pressable accessibilityRole="button" disabled={status!=='ready'||savingStep} onPress={()=>{void saveCost()}} style={styles.button}><Text style={styles.heading}>Добавить расход</Text></Pressable>{costs.map(row=><Text key={row.id} style={styles.note}>{row.name}: {row.amount}</Text>)}<Text style={styles.question}>Итого: {sumBudget(costs.map(row=>row.amount))}</Text><Text style={styles.note}>Все суммы в одной валюте. Цены задаёт пользователь.</Text></View>:null}
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
