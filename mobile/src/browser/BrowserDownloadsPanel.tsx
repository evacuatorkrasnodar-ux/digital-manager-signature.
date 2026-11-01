/* SEYVEO Browser · native downloads surface.
 * Render inside the existing Browser manager in the future native shell.
 * Parent supplies theme colors (all five SEYVEO palettes), no duplicate theme CSS.
 * Direct HTTPS links only until WebView's native download events are connected.
 */
import React, {useEffect, useState} from 'react';
import {Alert,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {createBrowserDownloadController, type BrowserDownloadSnapshot}
  from './browser-download-core.mjs';
import {createExpoBrowserDownloadStorage} from './expo-browser-download-storage.mjs';

export type BrowserDownloadsColors = {
  surface:string;
  text:string;
  muted:string;
  line:string;
  accent:string;
};
type Props={colors:BrowserDownloadsColors};

const labelForCategory:Record<string,string>={
  document:'Документ',image:'Изображение',audio:'Аудио',
  video:'Видео',archive:'Архив',other:'Файл'
};
function sizeLabel(bytes:number){
  if(bytes>=1024*1024)return (bytes/(1024*1024)).toFixed(1)+' МБ';
  return Math.max(1,Math.ceil(bytes/1024))+' КБ';
}

export function BrowserDownloadsPanel({colors}:Props){
  const [source,setSource]=useState('');
  const [message,setMessage]=useState('');
  const [snapshot,setSnapshot]=useState<BrowserDownloadSnapshot>({
    items:[],busy:false,loading:false,operation:null
  });
  const [storage]=useState(()=>createExpoBrowserDownloadStorage());
  const [downloads]=useState(()=>createBrowserDownloadController(storage,setSnapshot));

  useEffect(()=>{
    void downloads.refresh().catch(()=>{
      setMessage('Не удалось прочитать загрузки. Попробуй снова.');
    });
  },[downloads]);

  async function saveFile(){
    if(snapshot.busy||snapshot.loading)return;
    setMessage('');
    try{
      await downloads.start(source);
      setSource('');
      setMessage('Файл сохранён на этом устройстве.');
    }catch(e){
      const code=e instanceof Error?e.message:'';
      setMessage(code==='download-size-not-allowed'
        ? 'Файл слишком большой для этой версии загрузчика.'
        :code==='invalid-download-url'||code==='unsupported-download-address'
          ?'Нужна прямая ссылка HTTPS на файл.'
          :'Не удалось скачать файл. Проверь ссылку и соединение.');
    }
  }

  async function previewFile(id:string){
    try{await storage.preview(id);}
    catch{setMessage('На этом устройстве нет доступного просмотра этого файла.');}
  }

  function confirmRemove(id:string,name:string){
    Alert.alert('Удалить файл?',name,[
      {text:'Отмена',style:'cancel'},
      {text:'Удалить',style:'destructive',onPress:()=>{
        void downloads.remove(id).catch(()=>setMessage('Не удалось удалить файл.'));
      }}
    ]);
  }

  const op=snapshot.operation;
  const progress=op?.status==='downloading'&&op.totalBytes&&op.receivedBytes!==undefined
    ?Math.min(100,Math.floor(op.receivedBytes/op.totalBytes*100)):null;

  return (
    <View style={[styles.root,{backgroundColor:colors.surface,borderColor:colors.line}]}>
      <Text style={[styles.heading,{color:colors.text}]}>Загрузки</Text>
      <Text style={[styles.help,{color:colors.muted}]}>
        Файлы остаются на устройстве. Для этой версии нужна прямая HTTPS-ссылка.
      </Text>
      <View style={[styles.inputRow,{borderColor:colors.line}]}>
        <TextInput
          value={source} onChangeText={setSource}
          placeholder="Ссылка на файл" placeholderTextColor={colors.muted}
          accessibilityLabel="Ссылка на файл"
          autoCorrect={false} autoCapitalize="none" keyboardType="url"
          style={[styles.input,{color:colors.text}]}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Скачать файл"
          disabled={snapshot.busy||snapshot.loading||!source.trim()}
          onPress={()=>{void saveFile();}}
          style={[styles.save,{borderColor:colors.line,opacity:snapshot.busy?0.5:1}]}>
          <Text style={[styles.saveText,{color:colors.accent}]}>Скачать</Text>
        </Pressable>
      </View>
      {op?.status==='downloading'?(
        <Text accessibilityRole="text" style={[styles.status,{color:colors.muted}]}>
          {'Скачивается: '+op.name+(progress===null?'':' · '+progress+'%')}
        </Text>
      ):null}
      {message?(
        <Text accessibilityRole="text" style={[styles.status,{color:colors.muted}]}>{message}</Text>
      ):null}
      <Text style={[styles.subheading,{color:colors.text}]}>На этом устройстве</Text>
      {snapshot.loading?(
        <Text style={[styles.help,{color:colors.muted}]}>Открываем список…</Text>
      ):snapshot.items.length===0?(
        <Text style={[styles.help,{color:colors.muted}]}>Загрузок пока нет.</Text>
      ):snapshot.items.map(item=>(
        <View key={item.id} style={[styles.item,{borderTopColor:colors.line}]}>
          <View style={styles.info}>
            <Text numberOfLines={1} style={[styles.name,{color:colors.text}]}>{item.name}</Text>
            <Text style={[styles.detail,{color:colors.muted}]}>
              {(labelForCategory[item.category]||'Файл')+' · '+sizeLabel(item.bytes)}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={'Открыть '+item.name}
            onPress={()=>{void previewFile(item.id);}}
            style={styles.action}>
            <Text style={[styles.actionText,{color:colors.accent}]}>Открыть</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'Удалить '+item.name}
            disabled={snapshot.busy} onPress={()=>confirmRemove(item.id,item.name)}
            style={styles.action}>
            <Text style={[styles.actionText,{color:colors.muted}]}>×</Text>
          </Pressable>
        </View>
      ))}
      <Text style={[styles.foot,{color:colors.muted}]}>
        Просмотр доступен для поддерживаемых форматов. Сэйви не читает файлы без разрешения.
      </Text>
    </View>
  );
}

const styles=StyleSheet.create({
  root:{borderWidth:1,borderRadius:19,padding:15,gap:11},
  heading:{fontSize:20,fontWeight:'600'},
  subheading:{fontSize:15,fontWeight:'600',marginTop:8},
  help:{fontSize:12,lineHeight:18},
  inputRow:{flexDirection:'row',alignItems:'center',gap:6,borderWidth:1,borderRadius:12,minHeight:46,paddingLeft:10},
  input:{flex:1,minWidth:0,fontSize:14,paddingVertical:10},
  save:{minHeight:42,justifyContent:'center',paddingHorizontal:10},
  saveText:{fontSize:13,fontWeight:'600'},
  status:{fontSize:12,lineHeight:18},
  item:{flexDirection:'row',alignItems:'center',gap:9,paddingVertical:10,borderTopWidth:1},
  info:{flex:1,minWidth:0,gap:5},
  name:{fontSize:13,fontWeight:'500'},
  detail:{fontSize:11},
  action:{minHeight:40,justifyContent:'center',paddingHorizontal:2},
  actionText:{fontSize:12},
  foot:{fontSize:10,lineHeight:15,marginTop:5}
});
