import React,{useState} from 'react';
import {View,Text,Pressable,StyleSheet} from 'react-native';

type Props={onExecute:()=>void;onLater:()=>void};
export function HomeInsightCard({onExecute,onLater}:Props){
 const [expanded,setExpanded]=useState(false);
 return <View style={s.card}>
  <Text style={s.eyebrow}>✦ СЭЙВИ ЗАМЕТИЛА</Text>
  <Text style={s.title}>Пора проверить первые продажи</Text>
  <Text style={s.body}>В RISE можно записать заказ и увидеть, сколько ежемесячных расходов уже покрыто.</Text>
  {expanded?<Text style={s.detail}>Открой «Мой путь» и внеси выручку и затраты по заказу. Сэйви рассчитает вклад продажи в покрытие расходов. Данные берутся из твоих записей, без подключения кассы.</Text>:null}
  <View style={s.actions}>
   <Pressable accessibilityRole="button" onPress={onExecute} style={s.primary}><Text style={s.primaryText}>Исполнить</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>setExpanded(x=>!x)} style={s.action}><Text style={s.link}>{expanded?'Свернуть':'Подробнее'}</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={onLater} style={s.action}><Text style={s.link}>Позже</Text></Pressable>
  </View>
 </View>;
}
const s=StyleSheet.create({
 card:{backgroundColor:'#132922',borderColor:'#315a48',borderWidth:1,borderRadius:22,padding:18,marginTop:18},
 eyebrow:{fontSize:11,color:'#8be3b2',letterSpacing:1.4},
 title:{color:'#f4fff8',fontSize:19,fontWeight:'500',marginTop:12},
 body:{color:'#c4d9cb',fontSize:14,lineHeight:21,marginTop:9},
 detail:{color:'#b4ccbb',fontSize:13,lineHeight:20,marginTop:12},
 actions:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:10,marginTop:18},
 primary:{backgroundColor:'#256b4d',borderRadius:20,paddingHorizontal:14,paddingVertical:10},
 primaryText:{color:'#fff',fontWeight:'600'},
 action:{padding:9},link:{color:'#a0dfbc',fontSize:13}
});
