/**
 * SEYVEO Business — reusable NATIVE director-only invitation actions.
 * Not mounted in the M1 diagnostic app until a trusted owner backend exists.
 * Both actions use the SAME one-use, recipient-bound invitation link.
 *
 * Never put the invite URL into logs, AsyncStorage, analytics, crash reports,
 * personal space, or uncontrolled background notifications.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  AppState, Modal, Pressable, Share, StyleSheet, Text, View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {
  prepareEmployeeInviteDelivery,
  type EmployeeInvitationResponse
} from './employee-invite-delivery.mjs';

type Props = Readonly<{
  inviteLinkBase: string;
  /** Must come from a trusted owner-authenticated backend response. */
  serverResponse: EmployeeInvitationResponse | null;
  onRequestNewInvite?: () => void;
}>;

const P = {
  ink:'#101b1d',panel:'#142325',border:'#3d6059',
  accent:'#9edcc6',text:'#f4faf7',muted:'#b1cac2'
};

export function EmployeeInvitationActions({
  inviteLinkBase,serverResponse,onRequestNewInvite
}: Props) {
  const [clock,setClock] = useState(()=>Date.now());
  const [showQr,setShowQr] = useState(false);
  const [sharing,setSharing] = useState(false);
  const [hint,setHint] = useState('');

  const offer = useMemo(()=>prepareEmployeeInviteDelivery({
    inviteLinkBase,serverResponse,now:()=>clock
  }),[inviteLinkBase,serverResponse,clock]);
  const ready = offer.status==='ready';
  const link = ready ? offer.url : null;
  const id = ready ? offer.invitationId : null;

  useEffect(()=>{
    const subscription=AppState.addEventListener('change',state=>{
      if(state!=='active')setShowQr(false);
      setClock(Date.now());
    });
    const clockTicker=setInterval(()=>setClock(Date.now()),10_000);
    return ()=>{
      subscription.remove();
      clearInterval(clockTicker);
    };
  },[]);

  // A regenerated invitation must not silently replace an old visible QR.
  useEffect(()=>{
    setShowQr(false);
    setHint('');
  },[id]);

  useEffect(()=>{
    if(!ready)setShowQr(false);
  },[ready]);

  const share = useCallback(async()=>{
    // Recheck at press time; a code can expire between render and interaction.
    const checked=prepareEmployeeInviteDelivery({
      inviteLinkBase,serverResponse
    });
    if(sharing||checked.status!=='ready'){
      setHint('Приглашение недоступно. Создайте новое.');
      return;
    }
    setSharing(true);
    setHint('');
    try{
      // User-selected OS share sheet, not a background/automatic delivery.
      // Share will reveal this short-lived link to the chosen recipient app.
      await Share.share({message:checked.url});
      setHint('Для отправки выберите получателя в системном меню.');
    }catch{
      setHint('Не удалось открыть меню отправки.');
    }finally{
      setSharing(false);
    }
  },[inviteLinkBase,serverResponse,sharing]);

  const openQr=useCallback(()=>{
    const checked=prepareEmployeeInviteDelivery({
      inviteLinkBase,serverResponse
    });
    if(checked.status!=='ready'){
      setHint('Приглашение недоступно. Создайте новое.');
      return;
    }
    setClock(Date.now());
    setHint('');
    setShowQr(true);
  },[inviteLinkBase,serverResponse]);

  return (
    <View style={styles.root} accessibilityLabel="Приглашение сотрудника SEYVEO">
      <Text style={styles.title}>Пригласить сотрудника</Text>
      <Text style={styles.description}>
        Одно личное приглашение — два способа передать его сотруднику.
      </Text>
      {ready?(
        <>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Показать QR-код приглашения"
              onPress={openQr}
              style={({pressed})=>[styles.action,pressed&&styles.pressed]}
            >
              <Text style={styles.actionText}>Показать QR</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Отправить ссылку на приглашение"
              disabled={sharing}
              onPress={()=>{void share();}}
              style={({pressed})=>[styles.action,pressed&&styles.pressed]}
            >
              <Text style={styles.actionText}>
                {sharing?'Открываем…':'Отправить ссылку'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.note}>
            Ссылка одноразовая и действует до истечения приглашения.
            Сотрудник подтвердит вход в своём аккаунте.
          </Text>
        </>
      ):(
        <View style={styles.unavailable}>
          <Text style={styles.note}>Приглашение ещё не создано или срок его действия истёк.</Text>
          {onRequestNewInvite?(
            <Pressable
              accessibilityRole="button"
              onPress={onRequestNewInvite}
              style={({pressed})=>[styles.action,pressed&&styles.pressed]}
            >
              <Text style={styles.actionText}>Создать приглашение</Text>
            </Pressable>
          ):null}
        </View>
      )}
      {hint?<Text style={styles.note} accessibilityLiveRegion="polite">{hint}</Text>:null}
      <Modal
        visible={showQr&&ready&&link!==null}
        transparent
        animationType="fade"
        onRequestClose={()=>setShowQr(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>QR-приглашение</Text>
            <Text style={styles.description}>
              Пусть сотрудник отсканирует код своим телефоном.
            </Text>
            {link!==null&&ready?(
              <View style={styles.qrSurface}
                accessibilityLabel="Одноразовый QR-код приглашения сотрудника"
              >
                <QRCode
                  value={link}
                  size={216}
                  ecl="H"
                  color="#061412"
                  backgroundColor="#ffffff"
                  quietZone={12}
                />
              </View>
            ):null}
            <Text style={styles.note}>
              QR-код содержит только ссылку приглашения, не пароль.
              Не показывайте его посторонним.
            </Text>
            <Pressable accessibilityRole="button"
              onPress={()=>setShowQr(false)}
              style={({pressed})=>[styles.close,pressed&&styles.pressed]}
            >
              <Text style={styles.actionText}>Готово</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles=StyleSheet.create({
  root:{backgroundColor:P.panel,borderWidth:1,borderColor:P.border,borderRadius:22,padding:19,gap:12},
  title:{fontSize:19,fontWeight:'500',color:P.text,letterSpacing:0.2},
  description:{fontSize:13,lineHeight:20,color:P.muted},
  actions:{flexDirection:'row',flexWrap:'wrap',gap:9,marginTop:5},
  action:{minHeight:46,borderRadius:15,borderWidth:1,borderColor:P.border,
    paddingHorizontal:14,justifyContent:'center',alignItems:'center',flexGrow:1},
  pressed:{opacity:0.6},
  actionText:{fontSize:14,color:P.accent,fontWeight:'500'},
  note:{fontSize:12,lineHeight:19,color:P.muted},
  unavailable:{gap:12},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.78)',alignItems:'center',
    justifyContent:'center',paddingHorizontal:20},
  sheet:{width:'100%',maxWidth:370,borderRadius:25,backgroundColor:P.ink,
    borderWidth:1,borderColor:P.border,padding:24,gap:15,alignItems:'center'},
  qrSurface:{backgroundColor:'#fff',borderRadius:18,padding:13,marginVertical:6},
  close:{minHeight:47,borderColor:P.border,borderWidth:1,borderRadius:15,
    justifyContent:'center',alignItems:'center',width:'100%',marginTop:8}
});
