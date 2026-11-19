/**
 * SEYVEO Paper — inline native consent and review, intentionally not mounted
 * in the M1 diagnostic shell. Mount inside the future notebook's existing
 * "Попросить Сэйви" action only after real verified native login and HTTPS
 * gateway are configured. Never add another top-level dock/circular button.
 */
import React,{useEffect,useRef,useState} from 'react';
import {
  ActivityIndicator,Pressable,StyleSheet,Text,TextInput,
  useWindowDimensions,View
} from 'react-native';
import Svg,{Polyline} from 'react-native-svg';
import type {
  PaperPreview,RemotePaperDraftClient
} from './remote-draft-client.mjs';

type ConsentDetails=Readonly<{
  request:string;recipient:string;purpose:'paper-preview';
}>;
type Stage='compose'|'consent'|'generating'|'preview'|'applying';
type Props=Readonly<{
  client:RemotePaperDraftClient;
  width:number;
  height:number;
  /** Must atomically insert through the notebook's existing Undo transaction.
   * Return true ONLY after the change and its Undo entry are committed.
   * If absent, this screen is review-only and cannot mutate a page.
   */
  applyWithUndo?:(proposal:PaperPreview)=>Promise<boolean>;
}>;

const C={
  white:'#ffffff',ink:'#111113',muted:'#66676c',border:'#e2e2e5',
  subtle:'#f5f5f7'
};

export function RemotePaperDraftPanel({
  client,width,height,applyWithUndo
}:Props){
  const [request,setRequest]=useState('');
  const [stage,setStage]=useState<Stage>('compose');
  const [consent,setConsent]=useState<ConsentDetails|null>(null);
  const [preview,setPreview]=useState<PaperPreview|null>(null);
  const [message,setMessage]=useState('');
  const {width:windowWidth}=useWindowDimensions();
  const displayWidth=Math.max(160,Math.min(windowWidth-48,420));
  const displayHeight=Math.max(180,Math.min(340,
    displayWidth*(height/Math.max(1,width))));
  const generation=useRef(0);
  const inFlight=useRef(false);
  const controller=useRef<AbortController|null>(null);
  const answerConsent=useRef<((allowed:boolean)=>void)|null>(null);

  // A changed session/client, changed canvas or leaving the page invalidates
  // the proposal and cancels any in-progress model request.
  useEffect(()=>{
    setConsent(null);setPreview(null);setStage('compose');setMessage('');
    return ()=>{
      generation.current++;
      controller.current?.abort();
      controller.current=null;
      answerConsent.current?.(false);
      answerConsent.current=null;
      inFlight.current=false;
    };
  },[client,width,height]);

  const cancel=()=>{
    generation.current++;
    controller.current?.abort();
    controller.current=null;
    answerConsent.current?.(false);
    answerConsent.current=null;
    inFlight.current=false;
    setConsent(null);setPreview(null);setStage('compose');setMessage('');
  };

  const start=async()=>{
    if(inFlight.current||!request.trim()||stage!=='compose')return;
    const action=++generation.current;
    const pending=new AbortController();
    controller.current=pending;
    inFlight.current=true;
    setMessage('');
    try{
      const result=await client.requestDraft({
        request:request.trim(),width,height,signal:pending.signal,
        confirmTextSend:details=>new Promise<boolean>(resolve=>{
          if(pending.signal.aborted||action!==generation.current){
            resolve(false);return;
          }
          answerConsent.current=resolve;
          setConsent(details);
          setStage('consent');
        })
      });
      if(action!==generation.current)return;
      setConsent(null);
      if(result.status==='ready'){
        setPreview(result.preview);
        setStage('preview');
        return;
      }
      setStage('compose');
      if(result.status==='consent-required'||result.status==='cancelled')return;
      if(result.status==='sign-in-required')
        setMessage('Нужен подтверждённый вход в SEYVEO ONE.');
      else if(result.status==='invalid-request')
        setMessage('Уточните просьбу: до 500 символов и доступный размер листа.');
      else if(result.status==='busy')
        setMessage('Сэйви уже готовит другой эскиз.');
      else if(result.status==='invalid-preview')
        setMessage('Этот эскиз не прошёл проверку. Оригинал не изменён.');
      else setMessage('Пока не удалось связаться с Сэйви. Лист не изменён.');
    }catch{
      if(action===generation.current){
        setStage('compose');
        setMessage('Эскиз недоступен. Лист не изменён.');
      }
    }finally{
      if(action===generation.current){
        inFlight.current=false;
        controller.current=null;
        answerConsent.current=null;
      }
    }
  };

  const approve=()=>{
    if(stage!=='consent'||!answerConsent.current)return;
    const answer=answerConsent.current;
    answerConsent.current=null;
    setStage('generating');
    answer(true);
  };

  const apply=async()=>{
    if(stage!=='preview'||!preview||!applyWithUndo||inFlight.current)return;
    const action=++generation.current;
    inFlight.current=true;
    setMessage('');setStage('applying');
    try{
      const committed=(await applyWithUndo(preview))===true;
      if(action!==generation.current)return;
      if(committed){
        setPreview(null);setRequest('');setStage('compose');
        setMessage('Эскиз добавлен. Его можно отменить в Блокноте.');
      }else{
        setStage('preview');
        setMessage('Добавить не удалось. Исходный лист сохранён.');
      }
    }catch{
      if(action===generation.current){
        setStage('preview');
        setMessage('Добавить не удалось. Проверьте лист.');
      }
    }finally{
      if(action===generation.current)inFlight.current=false;
    }
  };

  return <View style={styles.root} accessibilityLabel="Сэйви — помощник по рисованию">
    <Text style={styles.title}>Попросить Сэйви</Text>
    {stage==='compose'?<>
      <Text style={styles.label}>Что нарисовать?</Text>
      <TextInput
        accessibilityLabel="Просьба Сэйви нарисовать"
        multiline maxLength={500} editable={!inFlight.current}
        placeholder="Например, дерево у озера и горы вдали"
        placeholderTextColor={C.muted}
        value={request} onChangeText={setRequest}
        style={styles.input}
      />
      <Text style={styles.note}>
        Текст отправится только с вашего разрешения. Сам лист и ваш почерк не отправляются.
      </Text>
      <Pressable accessibilityRole="button" disabled={!request.trim()}
        style={({pressed})=>[styles.primary,(!request.trim())&&styles.dim,pressed&&styles.pressed]}
        onPress={()=>{void start();}}>
        <Text style={styles.primaryText}>Создать эскиз</Text>
      </Pressable>
    </>:null}

    {stage==='consent'&&consent?<>
      <Text style={styles.label}>Разрешить отправить только текст?</Text>
      <Text style={styles.quote} selectable>{consent.request}</Text>
      <Text style={styles.note}>Сервис: {consent.recipient}</Text>
      <Text style={styles.note}>Фото, штрихи, почерк и содержимое листа останутся на телефоне.</Text>
      <Pressable accessibilityRole="button" style={styles.primary}
        onPress={approve}>
        <Text style={styles.primaryText}>Отправить текст</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.secondary} onPress={cancel}>
        <Text style={styles.secondaryText}>Не отправлять</Text>
      </Pressable>
    </>:null}

    {stage==='generating'||stage==='applying'?<View style={styles.wait}>
      <ActivityIndicator color={C.ink}/>
      <Text style={styles.note}>{stage==='generating'?'Сэйви готовит эскиз…':'Добавляем на лист…'}</Text>
      {stage==='generating'?<Pressable accessibilityRole="button"
        style={styles.secondary} onPress={cancel}>
        <Text style={styles.secondaryText}>Отмена</Text>
      </Pressable>:null}
    </View>:null}

    {stage==='preview'&&preview?<>
      <Text style={styles.label}>Предпросмотр · {preview.title}</Text>
      <View style={styles.canvas}>
        <Svg width={displayWidth} height={displayHeight}
          viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet"
          accessibilityLabel="Эскиз рисунка Сэйви, не добавлен на лист">
          {preview.strokes.map((stroke,i)=><Polyline key={i}
            points={stroke.points.map(p=>`${p[0]},${p[1]}`).join(' ')}
            stroke={stroke.color} strokeWidth={stroke.width}
            strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
        </Svg>
      </View>
      <Text style={styles.note}>Это предложение. Ваш рисунок пока не изменился.</Text>
      {applyWithUndo?<Pressable accessibilityRole="button" style={styles.primary}
        onPress={()=>{void apply();}}>
        <Text style={styles.primaryText}>На лист</Text>
      </Pressable>:<Text style={styles.note}>
        Вставка появится после подключения редактора с отменой действий.
      </Text>}
      <Pressable accessibilityRole="button" style={styles.secondary} onPress={cancel}>
        <Text style={styles.secondaryText}>Отмена</Text>
      </Pressable>
    </>:null}

    {message?<Text style={styles.message} accessibilityLiveRegion="polite">{message}</Text>:null}
  </View>;
}

const styles=StyleSheet.create({
  root:{backgroundColor:C.white,gap:12,padding:18},
  title:{fontSize:22,fontWeight:'400',letterSpacing:-0.3,color:C.ink},
  label:{fontSize:15,fontWeight:'400',color:C.ink},
  input:{minHeight:102,borderColor:C.border,borderWidth:1,borderRadius:15,
    padding:14,textAlignVertical:'top',fontSize:16,lineHeight:24,color:C.ink},
  note:{fontSize:13,lineHeight:20,color:C.muted},
  quote:{padding:14,borderRadius:14,backgroundColor:C.subtle,
    color:C.ink,fontSize:15,lineHeight:23},
  primary:{minHeight:44,borderRadius:14,alignItems:'center',
    justifyContent:'center',backgroundColor:C.ink,paddingHorizontal:15},
  primaryText:{fontSize:15,fontWeight:'500',color:C.white},
  secondary:{minHeight:44,borderRadius:14,alignItems:'center',
    justifyContent:'center',backgroundColor:C.subtle,paddingHorizontal:15},
  secondaryText:{fontSize:15,fontWeight:'400',color:C.ink},
  canvas:{alignSelf:'center',borderColor:C.border,borderWidth:1,
    borderRadius:14,overflow:'hidden',backgroundColor:C.white},
  wait:{gap:12,alignItems:'center',paddingVertical:24},
  message:{fontSize:13,lineHeight:21,color:C.muted},
  pressed:{opacity:0.72},dim:{opacity:0.45}
});
