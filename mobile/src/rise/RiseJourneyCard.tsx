import React,{useEffect,useState} from 'react';
import {loadRiseAnswers,saveRiseAnswer,loadRiseProgress,setRiseProgress,loadCategorizedRiseCosts,addCategorizedRiseCost,loadRiseAvailableFunds,saveRiseAvailableFunds} from './riseRepository';
import {View,Text,TextInput,Pressable,StyleSheet} from 'react-native';
import {nextStep} from './journey.mjs';
import {plan} from './plan.mjs';
import {financeSummary,fundingGap} from './finance.mjs';
import {firstSalesSteps} from './first-sales.mjs';
import {breakEvenOrders} from './sales-math.mjs';

export function RiseJourneyCard(){
 const [answers,setAnswers]=useState<Record<string,string>>({});
 const [draft,setDraft]=useState('');
 const [completed,setCompleted]=useState<string[]>([]);
 const [savingStep,setSavingStep]=useState(false);
 const [costs,setCosts]=useState<{id:number;name:string;amount:number;kind:string}[]>([]);
 const [costKind,setCostKind]=useState<'startup'|'monthly'>('startup');
 const [costName,setCostName]=useState('');
 const [costAmount,setCostAmount]=useState('');
 const [availableFunds,setAvailableFunds]=useState('');
 const [salePrice,setSalePrice]=useState('');
 const [saleCost,setSaleCost]=useState('');
 const [fundsSaved,setFundsSaved]=useState(true);
 const [status,setStatus]=useState<'loading'|'ready'|'unavailable'>('loading');
 useEffect(()=>{let active=true;Promise.all([loadRiseAnswers(),loadRiseProgress(),loadCategorizedRiseCosts(),loadRiseAvailableFunds()]).then(([data,progress,rows,funds])=>{if(active){setAnswers(data);setCompleted(progress);setCosts(rows);setAvailableFunds(funds);setStatus('ready')}}).catch(()=>{if(active)setStatus('unavailable')});return()=>{active=false}},[]);
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
  try{await addCategorizedRiseCost(costName.trim(),amount,costKind);setCosts(await loadCategorizedRiseCosts());setCostName('');setCostAmount('')}
  catch{setStatus('unavailable')}
  finally{setSavingStep(false)}
 };
 const persistFunds=async()=>{
  if(status!=='ready'||fundsSaved)return;
  try{await saveRiseAvailableFunds(availableFunds);setFundsSaved(true)}catch{setStatus('unavailable')}
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
  {step.key==='plan'?<View><Text style={styles.question}>Черновая смета</Text><Pressable accessibilityRole="button" onPress={()=>setCostKind(k=>k==='startup'?'monthly':'startup')} style={styles.button}><Text style={styles.heading}>Тип: {costKind==='startup'?'Разовый расход':'Ежемесячный расход'} · изменить</Text></Pressable><TextInput accessibilityLabel="Статья расхода" value={costName} onChangeText={setCostName} placeholder="Например, оборудование" placeholderTextColor="#a9bbaf" maxLength={120} style={styles.input}/><TextInput accessibilityLabel="Сумма расхода" value={costAmount} onChangeText={setCostAmount} keyboardType="number-pad" placeholder="Сумма в выбранной валюте" placeholderTextColor="#a9bbaf" style={styles.input}/><Pressable accessibilityRole="button" disabled={status!=='ready'||savingStep} onPress={()=>{void saveCost()}} style={styles.button}><Text style={styles.heading}>Добавить расход</Text></Pressable>{costs.map(row=><Text key={row.id} style={styles.note}>{row.name} ({row.kind==='monthly'?'ежемесячно':'разово'}): {row.amount}</Text>)}<Text style={styles.question}>Разовые: {financeSummary(costs).startup} · В месяц: {financeSummary(costs).monthly} · С запасом на 3 месяца: {financeSummary(costs).total}</Text><TextInput accessibilityLabel="Имеющийся бюджет" value={availableFunds} onChangeText={value=>{setAvailableFunds(value);setFundsSaved(false)}} keyboardType="number-pad" placeholder="Сколько денег уже есть?" placeholderTextColor="#a9bbaf" style={styles.input}/><Pressable accessibilityRole="button" disabled={status!=='ready'||fundsSaved} onPress={()=>{void persistFunds()}} style={styles.button}><Text style={styles.heading}>{fundsSaved?'Бюджет сохранён':'Сохранить бюджет'}</Text></Pressable>{/^\d+$/.test(availableFunds)&&Number.isSafeInteger(Number(availableFunds))&&Number(availableFunds)<=1e12?<Text style={styles.question}>Не хватает: {fundingGap(costs,Number(availableFunds)).shortfall} · Остаток: {fundingGap(costs,Number(availableFunds)).remaining}</Text>:null}<Text style={styles.note}>Все суммы в одной валюте. Цены задаёт пользователь.</Text></View>:null}
  {step.key==='plan'?<View><Text style={styles.question}>Первые клиенты · план</Text>{firstSalesSteps.map((item,i)=><Text key={item.id} style={styles.note}>{i+1}. {item.title}</Text>)}<Text style={styles.note}>Пока это план, а не настоящие заявки клиентов.</Text></View>:null}
  {step.key==='plan'?<View><Text style={styles.question}>Сколько заказов нужно?</Text><TextInput accessibilityLabel="Цена одного заказа" value={salePrice} onChangeText={setSalePrice} keyboardType="number-pad" placeholder="Цена заказа" placeholderTextColor="#a9bbaf" style={styles.input}/><TextInput accessibilityLabel="Переменные расходы на заказ" value={saleCost} onChangeText={setSaleCost} keyboardType="number-pad" placeholder="Затраты на заказ" placeholderTextColor="#a9bbaf" style={styles.input}/>{/^\\d+$/.test(salePrice)&&/^\\d+$/.test(saleCost)&&Number(salePrice)<=1e10&&Number(saleCost)<=1e10?(()=>{const result=breakEvenOrders(financeSummary(costs).monthly,Number(salePrice),Number(saleCost));return <Text style={styles.note}>{result.possible?'Для покрытия указанных ежемесячных расходов нужно примерно '+result.orders+' заказов.':'Цена должна превышать переменные расходы на заказ.'}</Text>})():null}<Text style={styles.note}>Без налогов, сезонности и непредвиденных расходов. Расчёт предварительный.</Text></View>:null}
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
