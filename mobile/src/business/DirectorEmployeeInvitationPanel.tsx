/**
 * SEYVEO Business native director module (NOT the M1 vault home).
 * Mount only after backend-verified ACTIVE owner membership.
 *
 * Personal SEYVEO One data never enters this component. Invitations are
 * issued by the owner-authenticated HTTPS backend, never by the phone.
 */
import React, {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {EmployeeInvitationActions} from './EmployeeInvitationActions';
import {prepareEmployeeInviteDelivery,type EmployeeInvitationResponse}
  from './employee-invite-delivery.mjs';
import type {HttpsOwnerInviteClient} from './https-owner-invite-client.mjs';

type Props=Readonly<{
  /** Provided by trusted owner-role navigation; server still checks every POST. */
  client:HttpsOwnerInviteClient;
  inviteLinkBase:string;
  organizationName:string;
}>;

const C={
  surface:'#142325',line:'#42675e',text:'#f4faf7',
  muted:'#b2ccc3',mint:'#9edcc6'
};

export function DirectorEmployeeInvitationPanel({
  client,inviteLinkBase,organizationName
}:Props){
  const [login,setLogin]=useState('');
  const [issued,setIssued]=useState<EmployeeInvitationResponse|null>(null);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [clock,setClock]=useState(()=>Date.now());
  const generation=useRef(0);
  const inFlight=useRef(false);

  // If organization/session client changes, do not keep the old QR on screen.
  useEffect(()=>{
    generation.current++;
    setLogin('');
    setIssued(null);
    setMessage('');
    setBusy(false);
    inFlight.current=false;
    return ()=>{generation.current++;};
  },[client,inviteLinkBase]);

  useEffect(()=>{
    const ticker=setInterval(()=>setClock(Date.now()),10_000);
    return ()=>clearInterval(ticker);
  },[]);

  const ready=useMemo(()=>prepareEmployeeInviteDelivery({
    inviteLinkBase,serverResponse:issued,now:()=>clock
  }),[inviteLinkBase,issued,clock]);
  const hasInvite=ready.status==='ready';
  const eligible=/^[a-z][a-z0-9_-]{2,31}$/.test(login);

  const create=useCallback(async()=>{
    if(inFlight.current||!eligible||hasInvite)return;
    inFlight.current=true;
    const requestId=++generation.current;
    setBusy(true);setMessage('');
    try{
      const response=await client.create({employeeLogin:login});
      if(generation.current!==requestId)return;
      if(response.status==='issued'){
        const offer=prepareEmployeeInviteDelivery({
          inviteLinkBase,serverResponse:response.serverResponse
        });
        if(offer.status!=='ready'){
          setMessage('Приглашение недоступно. Попробуйте ещё раз.');
          return;
        }
        setIssued(response.serverResponse);
        setClock(Date.now());
        setMessage('Приглашение готово. Передайте его только сотруднику.');
      }else if(response.status==='not-authorized'){
        setIssued(null);
        setMessage('Права руководителя не подтверждены. Войдите снова.');
      }else if(response.status==='conflict'){
        setMessage('Для сотрудника уже есть приглашение или доступ.');
      }else{
        setMessage('Не удалось создать приглашение. Попробуйте ещё раз.');
      }
    }catch{
      if(generation.current===requestId)
        setMessage('Приглашение недоступно.');
    }finally{
      if(generation.current===requestId){
        inFlight.current=false;
        setBusy(false);
      }
    }
  },[client,eligible,hasInvite,inviteLinkBase,login]);

  const cancel=useCallback(async()=>{
    if(inFlight.current||!hasInvite)return;
    inFlight.current=true;
    const requestId=++generation.current;
    setBusy(true);
    setIssued(null); // Hide sensitive link immediately, including when offline.
    setMessage('');
    try{
      const result=await client.cancel({invitationId:ready.invitationId});
      if(generation.current!==requestId)return;
      if(result.status==='cancelled')
        setMessage('Приглашение отменено.');
      else setMessage('Ссылка скрыта. Отзыв на сервере не подтверждён.');
    }catch{
      if(generation.current===requestId)
        setMessage('Ссылка скрыта. Отзыв на сервере не подтверждён.');
    }finally{
      if(generation.current===requestId){
        inFlight.current=false;
        setBusy(false);
      }
    }
  },[client,hasInvite,ready]);

  return (
    <View style={styles.root} accessibilityLabel="Приглашение сотрудника руководителем">
      <Text style={styles.eyebrow}>SEYVEO BUSINESS · КОМАНДА</Text>
      <Text style={styles.title}>Пригласить в команду</Text>
      <Text style={styles.note} numberOfLines={2}>
        {organizationName}
      </Text>
      {!hasInvite?(
        <View style={styles.form}>
          <Text style={styles.label}>Логин приглашённого сотрудника</Text>
          <TextInput
            accessibilityLabel="Логин сотрудника"
            placeholder="например, elena"
            placeholderTextColor={C.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
            maxLength={32}
            editable={!busy}
            value={login}
            onChangeText={setLogin}
            onSubmitEditing={()=>{void create();}}
            style={styles.input}
          />
          <Text style={styles.note}>
            Приглашение персональное и одноразовое. Рабочие права
            выдаёт только сервер после подтверждения личности.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Создать приглашение сотруднику"
            disabled={!eligible||busy}
            style={({pressed})=>[
              styles.action,(!eligible||busy)&&styles.dim,
              pressed&&styles.pressed
            ]}
            onPress={()=>{void create();}}
          >
            <Text style={styles.actionText}>
              {busy?'Создаём…':'Создать приглашение'}
            </Text>
          </Pressable>
        </View>
      ):(
        <>
          <EmployeeInvitationActions
            inviteLinkBase={inviteLinkBase}
            serverResponse={issued}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Отменить приглашение сотрудника"
            disabled={busy}
            style={({pressed})=>[styles.cancel,pressed&&styles.pressed]}
            onPress={()=>{void cancel();}}
          >
            <Text style={styles.cancelText}>Отменить приглашение</Text>
          </Pressable>
        </>
      )}
      {busy?<ActivityIndicator color={C.mint}/>:null}
      {message?<Text style={styles.message} accessibilityLiveRegion="polite">
        {message}
      </Text>:null}
    </View>
  );
}
const styles=StyleSheet.create({
  root:{backgroundColor:C.surface,borderWidth:1,borderColor:C.line,
    borderRadius:23,padding:20,gap:13},
  eyebrow:{fontSize:10,letterSpacing:2.1,color:C.muted},
  title:{fontSize:24,fontWeight:'400',color:C.text},
  label:{fontSize:13,color:C.muted},
  note:{fontSize:13,lineHeight:21,color:C.muted},
  form:{gap:12},
  input:{minHeight:49,borderWidth:1,borderColor:C.line,
    borderRadius:14,paddingHorizontal:15,color:C.text,fontSize:15},
  action:{minHeight:49,borderRadius:15,borderWidth:1,
    borderColor:C.line,alignItems:'center',justifyContent:'center'},
  actionText:{fontSize:15,color:C.mint,fontWeight:'500'},
  cancel:{alignItems:'center',padding:10},
  cancelText:{color:C.muted,fontSize:13},
  dim:{opacity:0.5},pressed:{opacity:0.65},
  message:{color:C.text,fontSize:13,lineHeight:21}
});
