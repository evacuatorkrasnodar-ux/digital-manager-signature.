import React from 'react';
import {View,Text,StyleSheet} from 'react-native';

/** Native iOS/Android status only. This component never issues access. */
export type WorkAccessState='not-configured'|'checking'|'unavailable'|'verified';
export function NativeWorkAccessStatus({state='not-configured'}:{state?:WorkAccessState}){
 const labels:Record<WorkAccessState,string>={
  'not-configured':'Рабочее пространство пока не подключено',
  checking:'Проверка корпоративного доступа…',
  unavailable:'Рабочий доступ не подтверждён',
  verified:'Корпоративный доступ подтверждён сервером'
 };
 return <View style={styles.container} accessibilityRole="summary">
  <Text style={styles.eyebrow}>SEYVEO · МОЯ РАБОТА</Text>
  <Text style={styles.title}>{labels[state]}</Text>
  <Text style={styles.body}>Личная Сэйви остаётся доступной независимо от работы. Права проверяются сервером, а не кнопкой приложения.</Text>
 </View>;
}
const styles=StyleSheet.create({
 container:{marginTop:18,padding:20,borderRadius:20,borderWidth:1,borderColor:'#31564e',backgroundColor:'#152623'},
 eyebrow:{fontSize:10,letterSpacing:1.5,color:'#95d9bd',marginBottom:10},
 title:{fontSize:15,color:'#f3faf7',marginBottom:8},
 body:{fontSize:12,color:'#abc7bc',lineHeight:19}
});
