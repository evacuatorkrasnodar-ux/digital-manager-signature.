/* SEYVEO Browser · native downloads surface.
 * Render inside the existing Browser manager in the future native shell.
 * Parent supplies theme colors (all five SEYVEO palettes), no duplicate theme CSS.
 * Direct HTTPS links only until WebView's native download events are connected.
 */
import React, {useEffect, useState} from 'react';
import {Alert,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {createBrowserDownloadController, type BrowserDownloadSnapshot}
  from './browser-download-core.mjs';
import {createExpoBrowserDownloadStorage} from './expo-browser-download-storage.mjs';
import {createExpoBrowserPdfExtractor} from './expo-browser-pdf-extractor';
import {BROWSER_PDF_FILE_LIMIT,inspectBrowserPdf,supportsBrowserPdfExtractor,
  type BrowserPdfExtractor} from './browser-pdf-review.mjs';
import {inspectBrowserDocument,prepareSayviReviewHandoff,
  type BrowserDocumentReviewPreview,type BrowserSayviHandoff}
  from './browser-document-review.mjs';

export type BrowserDownloadsColors = {
  surface:string;
  text:string;
  muted:string;
  line:string;
  accent:string;
};
type Props={colors:BrowserDownloadsColors;pdfExtractor?:BrowserPdfExtractor;
  onSayviReview?:(request:BrowserSayviHandoff)=>Promise<void>};

const labelForCategory:Record<string,string>={
  document:'Документ',image:'Изображение',audio:'Аудио',
  video:'Видео',archive:'Архив',other:'Файл'
};
function sizeLabel(bytes:number){
  if(bytes>=1024*1024)return (bytes/(1024*1024)).toFixed(1)+' МБ';
  return Math.max(1,Math.ceil(bytes/1024))+' КБ';
}

export function BrowserDownloadsPanel({colors,pdfExtractor,onSayviReview}:Props){
  const [source,setSource]=useState('');
  const [message,setMessage]=useState('');
  const [review,setReview]=useState<BrowserDocumentReviewPreview|null>(null);
  const [reading,setReading]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [snapshot,setSnapshot]=useState<BrowserDownloadSnapshot>({
    items:[],busy:false,loading:false,operation:null
  });
  const [storage]=useState(()=>createExpoBrowserDownloadStorage());
  const [nativePdfExtractor]=useState(()=>createExpoBrowserPdfExtractor());
  const activePdfExtractor=pdfExtractor ?? nativePdfExtractor;
  const [downloads]=useState(()=>createBrowserDownloadController(storage,setSnapshot));

  useEffect(()=>{
    void storage.clearStalePdfPreviews().catch(()=>{});
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

  async function readSelectedDocument(id:string) {
    if(reading || submitting) return;
    setReading(true);
    setReview(null);
    setMessage('');
    try{
      // This call never sends document text to a server.
      const preview=await storage.readLocalTextPreview(id);
      setReview(preview);
    }catch{
      setMessage('Не удалось прочитать текст этого файла на устройстве.');
    }finally{setReading(false);}
  }

  async function readSelectedPdf(id:string) {
    if(reading || submitting || !supportsBrowserPdfExtractor(activePdfExtractor)) return;
    setReading(true);
    setReview(null);
    setMessage('');
    try{
      // Extract into local memory only. No automatic cloud or AI calls.
      const preview=await storage.readLocalPdfPreview(id,activePdfExtractor);
      setReview(preview);
    }catch(error){
      const code=error instanceof Error?error.message:'';
      const nativeCode=error && typeof error==='object' && 'code' in error
        ?String(error.code):'';
      setMessage(
        nativeCode==='PASSWORD_REQUIRED'||nativeCode==='INCORRECT_PASSWORD'
          ?'Этот PDF защищён паролем. Пока открой его обычным просмотром.'
          :code==='pdf-text-not-found'
            ?'В PDF нет распознаваемого текста. Для скана позже потребуется OCR.'
            :'Не удалось извлечь текст PDF. Файл можно открыть обычным просмотром.'
      );
    }finally{setReading(false);}
  }

  function startSayviReview(item:BrowserDownloadSnapshot['items'][number]) {
    const eligibility=inspectBrowserDocument(item);
    if(eligibility.kind==='needs-extractor'){
      if(item.name.toLowerCase().endsWith('.pdf')){
        const condition=inspectBrowserPdf(item);
        if(condition.status==='too-large'){
          Alert.alert('Сэйви · PDF','Пока можем читать PDF размером до '+Math.floor(BROWSER_PDF_FILE_LIMIT/1024/1024)+' МБ.');
          return;
        }
        if(supportsBrowserPdfExtractor(activePdfExtractor)){
          Alert.alert('Сэйви, посмотри',
            'Прочитать текст PDF прямо на устройстве? Сэйви ничего не получит без отдельного разрешения.',
            [{text:'Отмена',style:'cancel'},
             {text:'Прочитать',onPress:()=>{void readSelectedPdf(item.id);}}]);
          return;
        }
        Alert.alert('Сэйви · PDF',
          'Чтение PDF требует нативного модуля, которого пока нет в сборке. Можно открыть сам документ.',
          [{text:'Позже',style:'cancel'},{text:'Открыть',onPress:()=>{void previewFile(item.id);}}]);
        return;
      }
      Alert.alert('Сэйви · Документы',
        'Чтение Office-документов ещё не подключено. Можно открыть сам файл.',
        [{text:'Позже',style:'cancel'},
         {text:'Открыть',onPress:()=>{void previewFile(item.id);}}]);
      return;
    }
    if(eligibility.kind==='too-large'){
      Alert.alert('Сэйви · Документы',
        'Пока читаем только небольшие TXT/CSV-файлы (до 128 КБ).',
        [{text:'Понятно'}]);
      return;
    }
    if(!eligibility.canReadText){
      Alert.alert('Сэйви · Документы','Для этого формата локальный разбор пока недоступен.');
      return;
    }
    Alert.alert('Сэйви, посмотри',
      'Показать содержимое этого файла на устройстве? Пока ничего не отправляется в облако.',
      [{text:'Отмена',style:'cancel'},
       {text:'Показать',onPress:()=>{void readSelectedDocument(item.id);}}]);
  }

  function askSayviToExplain() {
    if (!review || submitting) return;
    if (!onSayviReview) {
      Alert.alert('Сэйви · Документы',
        'Просмотр текста работает локально. ИИ-анализ файлов ещё не подключён; ничего не отправлено.');
      return;
    }
    Alert.alert('Передать текст Сэйви?',
      'Будет передан только показанный фрагмент. Подключённый ИИ-сервис может обрабатывать его вне телефона. Продолжить?',
      [{text:'Отмена',style:'cancel'},
       {text:'Разрешить',onPress:()=>{
         if(!review) return;
         let request:BrowserSayviHandoff;
         try{request=prepareSayviReviewHandoff(review,{approved:true});}
         catch{setMessage('Не удалось подготовить файл для Сэйви.');return;}
         setSubmitting(true);
         void onSayviReview(request).then(()=>{
           setReview(null);
           setMessage('Запрос передан подключённой Сэйви.');
         }).catch(()=>{
           setMessage('Не удалось передать текст Сэйви. Файл остаётся на телефоне.');
         }).finally(()=>setSubmitting(false));
       }}]);
  }

  function confirmRemove(id:string,name:string){
    Alert.alert('Удалить файл?',name,[
      {text:'Отмена',style:'cancel'},
      {text:'Удалить',style:'destructive',onPress:()=>{
        if(review?.fileId===id) setReview(null);
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
        <React.Fragment key={item.id}>
        <View style={[styles.item,{borderTopColor:colors.line}]}>
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
        {item.category==='document'?(
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'Сэйви, посмотри '+item.name}
            disabled={reading||submitting||snapshot.busy}
            style={[styles.reviewShortcut,{borderColor:colors.line}]}
            onPress={()=>startSayviReview(item)}>
            <Text style={[styles.reviewShortcutText,{color:colors.accent}]}>✦ Сэйви, посмотри</Text>
          </Pressable>
        ):null}
        </React.Fragment>
      ))}
      {review?(
        <View style={[styles.reviewBox,{borderColor:colors.line}]}>
          <Text style={[styles.subheading,{color:colors.text}]}>✦ Сэйви · Просмотр файла</Text>
          <Text numberOfLines={1} style={[styles.detail,{color:colors.muted}]}>{review.fileName}</Text>
          <Text style={[styles.help,{color:colors.muted}]}>
            Это локальный фрагмент, не ответ ИИ. Содержимое никому не отправлялось.
          </Text>
          <ScrollView nestedScrollEnabled style={[styles.excerpt,{borderColor:colors.line}]}>
            <Text selectable style={[styles.excerptText,{color:colors.text}]}>{review.excerpt}</Text>
          </ScrollView>
          {review.extension==='pdf'?(
            <Text style={[styles.help,{color:colors.muted}]}>
              {'PDF: прочитано '+(review as typeof review & {pagesRead?:number}).pagesRead+
                ' из '+(review as typeof review & {pageCount?:number}).pageCount+
                ' страниц. Это предварительный просмотр, а не анализ всего договора.'}
            </Text>
          ):null}
          {review.truncated?(
            <Text style={[styles.help,{color:colors.muted}]}>Показана только часть текста.</Text>
          ):null}
          {!onSayviReview?(
            <Text style={[styles.help,{color:colors.muted}]}>
              Подключение Сэйви для объяснения документов ещё готовится.
            </Text>
          ):null}
          <View style={styles.reviewActions}>
            <Pressable accessibilityRole="button" disabled={submitting||!onSayviReview}
              onPress={askSayviToExplain}
              style={[styles.reviewAction,{borderColor:colors.line,opacity:onSayviReview?1:0.5}]}>
              <Text style={[styles.actionText,{color:colors.accent}]}>
                {submitting?'Передаём…':'Объяснить с Сэйви'}
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={submitting}
              onPress={()=>setReview(null)}
              style={[styles.reviewAction,{borderColor:colors.line}]}>
              <Text style={[styles.actionText,{color:colors.muted}]}>Закрыть</Text>
            </Pressable>
          </View>
        </View>
      ):null}
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
  foot:{fontSize:10,lineHeight:15,marginTop:5},
  reviewShortcut:{alignSelf:'flex-start',borderWidth:1,borderRadius:10,
    paddingVertical:7,paddingHorizontal:12,marginTop:-5,marginBottom:8,minHeight:35,
    justifyContent:'center'},
  reviewShortcutText:{fontSize:12,fontWeight:'500'},
  reviewBox:{borderWidth:1,borderRadius:14,padding:12,gap:10,marginTop:8},
  excerpt:{borderWidth:1,borderRadius:9,maxHeight:200,minHeight:80,padding:9},
  excerptText:{fontSize:12,lineHeight:19},
  reviewActions:{flexDirection:'row',alignItems:'center',gap:10},
  reviewAction:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:9,minHeight:41,
    justifyContent:'center'}
});
