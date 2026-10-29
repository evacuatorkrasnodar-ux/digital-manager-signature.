import React from 'react';
import {Pressable,Text,StyleSheet} from 'react-native';

type Props={label:string;onPress:()=>void;disabled?:boolean;kind?:'sayvi'|'human'};
export function SeyveoActionButton({label,onPress,disabled=false,kind='sayvi'}:Props){
 const sayvi=kind==='sayvi';
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}}
  disabled={disabled} onPress={onPress} style={({pressed})=>[
   styles.base,sayvi?styles.sayvi:styles.human,(pressed||disabled)&&styles.dim
  ]}>
  {sayvi?<Text accessibilityElementsHidden style={styles.star}>✧</Text>:null}
  <Text style={sayvi?styles.sayviText:styles.humanText}>{label}</Text>
 </Pressable>;
}
const styles=StyleSheet.create({
 base:{minHeight:44,borderRadius:999,paddingHorizontal:16,paddingVertical:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,borderWidth:1},
 sayvi:{backgroundColor:'#e8fff1',borderColor:'#baf7d5',shadowColor:'#51d89d',shadowOpacity:0.18,shadowRadius:9,shadowOffset:{width:0,height:2},elevation:2},
 human:{backgroundColor:'#10251e',borderColor:'#426457'},
 star:{fontSize:23,lineHeight:25,color:'#123b2a'},
 sayviText:{color:'#10251d',fontSize:14,fontWeight:'700'},
 humanText:{color:'#d5e8de',fontSize:14,fontWeight:'500'},
 dim:{opacity:0.55}
});
