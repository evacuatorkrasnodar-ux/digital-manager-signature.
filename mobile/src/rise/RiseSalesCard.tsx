import React,{useEffect,useState} from 'react';
import {View,Text,TextInput,Pressable} from 'react-native';
import {loadRiseSales,addRiseSale,type RiseSale} from './riseRepository';
import {salesProgress,compareSalesMonths} from './sales-progress.mjs';
export function RiseSalesCard({monthlyFixed=0}:{monthlyFixed?:number}){
 const [rows,setRows]=useState<RiseSale[]>([]);
 const [revenue,setRevenue]=useState('');
 const [cost,setCost]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState(false);
 useEffect(()=>{loadRiseSales().then(setRows).catch(()=>setError(true))},[]);
 const current=new Date();
 const monthKey=current.getFullYear()+'-'+String(current.getMonth()+1).padStart(2,'0');
 const monthRows=rows.filter(row=>row.soldOn?.startsWith(monthKey+'-'));
 const prior=new Date(current.getFullYear(),current.getMonth()-1,1);
 const priorKey=prior.getFullYear()+'-'+String(prior.getMonth()+1).padStart(2,'0');
 const priorRows=rows.filter(row=>row.soldOn?.startsWith(priorKey+'-'));
 const previous=priorRows.reduce((a,r)=>({orders:a.orders+1,revenue:a.revenue+r.revenue,cost:a.cost+r.cost}),{orders:0,revenue:0,cost:0});
 const totals=monthRows.reduce((a,r)=>({revenue:a.revenue+r.revenue,cost:a.cost+r.cost}),{revenue:0,cost:0});
 const insight=compareSalesMonths({...totals,orders:monthRows.length},previous);
 const progress=salesProgress(totals.revenue,totals.cost,monthlyFixed);
 const valid=[revenue,cost].every(x=>/^[0-9]+$/.test(x)&&Number(x)<=1e10);
 const save=async()=>{
  if(!valid||busy)return;
  setBusy(true);
  try{await addRiseSale(Number(revenue),Number(cost));setRows(await loadRiseSales());setRevenue('');setCost('')}
  catch{setError(true)}
  finally{setBusy(false)}
 };
 return <View style={{paddingTop:18}}>
  <Text style={{color:'#95d9bd'}}>SEYVEO RISE · Продажи вручную</Text>
  <TextInput value={revenue} onChangeText={setRevenue} keyboardType="number-pad" placeholder="Выручка" accessibilityLabel="Выручка" style={{color:'#fff',padding:12}}/>
  <TextInput value={cost} onChangeText={setCost} keyboardType="number-pad" placeholder="Затраты" accessibilityLabel="Затраты" style={{color:'#fff',padding:12}}/>
  <Pressable accessibilityRole="button" disabled={!valid||busy||error} onPress={()=>{void save()}}><Text style={{color:'#95d9bd',padding:12}}>Сохранить продажу</Text></Pressable>
  <Text style={{color:'#fff'}}>Записей за месяц: {monthRows.length} · Выручка: {totals.revenue} · Переменные затраты: {totals.cost}</Text>
  <Text style={{color:'#fff'}}>Вклад в покрытие расходов: {progress.contribution} · Осталось покрыть: {progress.remaining}</Text>
  <Text style={{color:'#95d9bd'}}>Сэйви · Сравнение с прошлым месяцем</Text>
  <Text style={{color:'#fff'}}>Изменение маржинального дохода: {insight.change}</Text>
  <Text style={{color:'#abc7bc'}}>{insight.advice}</Text>
  <Text style={{color:'#abc7bc',fontSize:12}}>Расчёт за текущий месяц по последним 500 записям. Старые продажи без даты исключены. Не является бухгалтерской отчётностью.</Text>
  {error?<Text style={{color:'#fff'}}>Ошибка защищённого хранилища</Text>:null}
 </View>;
}
