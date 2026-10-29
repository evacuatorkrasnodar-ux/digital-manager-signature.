import React,{useEffect,useState} from 'react';
import {View,Text,TextInput,Pressable} from 'react-native';
import {loadRiseSales,addRiseSale,type RiseSale} from './riseRepository';
import {salesProgress} from './sales-progress.mjs';
export function RiseSalesCard({monthlyFixed=0}:{monthlyFixed?:number}){
 const [rows,setRows]=useState<RiseSale[]>([]);
 const [revenue,setRevenue]=useState('');
 const [cost,setCost]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState(false);
 useEffect(()=>{loadRiseSales().then(setRows).catch(()=>setError(true))},[]);
 const totals=rows.reduce((a,r)=>({revenue:a.revenue+r.revenue,cost:a.cost+r.cost}),{revenue:0,cost:0});
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
  <Text style={{color:'#fff'}}>Записей: {rows.length} · Выручка: {totals.revenue} · Переменные затраты: {totals.cost}</Text>
  <Text style={{color:'#fff'}}>Вклад в покрытие расходов: {progress.contribution} · Осталось покрыть: {progress.remaining}</Text>
  <Text style={{color:'#abc7bc',fontSize:12}}>Расчёт по последним 500 сохранённым записям, без разделения по месяцам. Не является бухгалтерской отчётностью.</Text>
  {error?<Text style={{color:'#fff'}}>Ошибка защищённого хранилища</Text>:null}
 </View>;
}
