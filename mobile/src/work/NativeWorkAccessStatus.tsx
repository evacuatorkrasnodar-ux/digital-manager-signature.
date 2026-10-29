import React from 'react';
import {View,Text,StyleSheet,Pressable,ActivityIndicator} from 'react-native';

export type WorkAccessState='not-configured'|'checking'|'unavailable'|'verified';
type Props={state?:WorkAccessState;organizationId?:string;role?:string;onRefresh?:()=>void;onLock?:()=>void};
export function NativeWorkAccessStatus({state='not-configured',organizationId,role,onRefresh,onLock}:Props){
 const verified=state==='verified'&&!!organizationId&&!!role;
 const title=verified?'Рабочее пространство подтверждено':
  state==='checking'?'Проверяем рабочий доступ…':
  state==='unavailable'?'Рабочий доступ не подтверждён':'Подключение к компании пока не настроено';
 return <View style={styles.container} accessibilityLabel="SEYVEO · Моя работа">
  <Text style={styles.eyebrow}>SEYVEO · МОЯ РАБОТА</Text>
  <Text style={styles.title}>{title}</Text>
  {state==='checking'?<ActivityIndicator color="#95d9bd" />:null}
  {verified?<><Text style={styles.body}>Компания: {organizationId}</Text><Text style={styles.body}>Роль: {role}</Text></>:null}
  <Text style={styles.body}>Личный мир остаётся отдельным. Доступ к рабочим данным проверяется сервером.</Text>
  {onRefresh&&state!=='checking'?<Pressable accessibilityRole="button" onPress={onRefresh} style={styles.action}><Text style={styles.actionText}>Проверить доступ</Text></Pressable>:null}
  {verified&&onLock?<Pressable accessibilityRole="button" onPress={onLock} style={styles.action}><Text style={styles.actionText}>Закрыть рабочее пространство</Text></Pressable>:null}
 </View>;
}
const styles=StyleSheet.create({
 container:{marginTop:18,padding:20,borderRadius:20,borderWidth:1,borderColor:'#31564e',backgroundColor:'#152623'},
 eyebrow:{fontSize:10,letterSpacing:1.5,color:'#95d9bd',marginBottom:10},
 title:{fontSize:15,color:'#f3faf7',marginBottom:8},
 body:{fontSize:12,color:'#abc7bc',lineHeight:19,marginTop:7},
 action:{padding:12,borderWidth:1,borderColor:'#31564e',borderRadius:12,marginTop:14},
 actionText:{color:'#f3faf7',textAlign:'center'}
});
