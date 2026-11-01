/**
 * SEYVEO Browser: first usable native test screen for iOS and Android.
 *
 * This is a native WebView shell, NOT the approved final Black Velvet UI.
 * No iframes; no account/sync/AI access; tabs are intentionally session-only.
 */
import React,{useEffect,useRef,useState} from 'react';
import {
  Pressable,ScrollView,StyleSheet,Text,TextInput,View,
  useColorScheme
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import {NativeBrowserViewport,type NativeBrowserViewportRef} from './NativeBrowserViewport';
import {
  initialBrowserTabs,activeBrowserTab,addBrowserTab,selectBrowserTab,
  closeBrowserTab,setBrowserTabUrl,observeBrowserTab,MAX_BROWSER_TABS,
  type NativeBrowserTabsState
} from './native-browser-tabs.mjs';
import {
  listBrowserThemeChoices,resolveBrowserTheme,type BrowserThemeSelection
} from './browser-themes.mjs';
import {validateBrowserWebViewUrl} from './native-webview-policy.mjs';

type Palette={
  bg:string;surface:string;text:string;muted:string;line:string;accent:string;
};
const PALETTES:Record<'light'|'graphite'|'dark'|'sapphire'|'plum',Palette>={
  light:{bg:'#f9fafb',surface:'#ffffff',text:'#19252c',muted:'#65757d',line:'#cdd8da',accent:'#258b69'},
  graphite:{bg:'#11161b',surface:'#202a30',text:'#f0f5f4',muted:'#abb9bf',line:'#40515a',accent:'#a0c7bb'},
  dark:{bg:'#111917',surface:'#1b2b26',text:'#edf7f3',muted:'#abc2b6',line:'#3c6051',accent:'#79d5aa'},
  sapphire:{bg:'#101724',surface:'#1c2739',text:'#f0f4ff',muted:'#b2bed7',line:'#415470',accent:'#9cbff2'},
  plum:{bg:'#1c1b1a',surface:'#302925',text:'#f7f2eb',muted:'#c4b5a6',line:'#645549',accent:'#e3ad81'}
};
const themeChoices=listBrowserThemeChoices();

function addressToUrl(input:string){
  const value=input.trim();
  if(!value)return null;
  // A search is sent to Yandex only on an explicit Go action by the user.
  const looksLikeAddress=/^(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z\d-]{2,}(?::\d+)?(?:[/?#].*)?$/i.test(value);
  const target=looksLikeAddress ? (/^https?:\/\//i.test(value)?value:'https://'+value)
    :'https://ya.ru/search/?text='+encodeURIComponent(value.slice(0,400));
  return validateBrowserWebViewUrl(target);
}

export function NativeBrowserScreen({onClose,plus=false}:{onClose:()=>void;plus?:boolean}){
  const scheme=useColorScheme();
  const [theme,setTheme]=useState<BrowserThemeSelection>('light');
  const resolved=resolveBrowserTheme(theme,{prefersDark:scheme==='dark'});
  const colors=PALETTES[resolved.effective];
  const [session,setSession]=useState<NativeBrowserTabsState>(initialBrowserTabs);
  const tab=activeBrowserTab(session);
  const ref=useRef<NativeBrowserViewportRef>(null);
  const [address,setAddress]=useState('');
  const [status,setStatus]=useState('');
  const [canBack,setCanBack]=useState(false);
  const [canForward,setCanForward]=useState(false);

  useEffect(()=>{
    setAddress(tab.url||'');
    setCanBack(false);setCanForward(false);setStatus('');
  },[tab.id]);

  function openUrl(raw:string){
    try{
      const url=addressToUrl(raw);
      if(!url)return;
      setSession(previous=>setBrowserTabUrl(previous,previous.activeId,url));
      setAddress(url);setStatus('');
    }catch{
      setStatus('Проверь адрес. Пока разрешены публичные сайты по HTTPS.');
    }
  }
  function newTab(url?:string){
    if(session.tabs.length>=MAX_BROWSER_TABS){
      setStatus('В этой тестовой версии доступно до 8 вкладок.');
      return;
    }
    setSession(previous=>addBrowserTab(previous,url||null));
  }
  function chooseTheme(){
    const index=themeChoices.findIndex(x=>x.id===theme);
    setTheme(themeChoices[(index+1)%themeChoices.length].id);
  }
  const buttonStyle=[styles.smallButton,{borderColor:colors.line}];
  const buttonTextStyle=[styles.smallButtonText,{color:colors.text}];

  return (
    <SafeAreaView style={[styles.root,{backgroundColor:colors.bg}]}>
      <StatusBar style={resolved.contrast==='light'?'dark':'light'}/>
      <View style={styles.brandRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Вернуться к мобильной основе"
          onPress={onClose} style={buttonStyle}>
          <Text style={buttonTextStyle}>‹</Text>
        </Pressable>
        <View style={styles.brand}>
          <Text style={[styles.logo,{color:colors.text}]}>SEYVEO</Text>
          <Text style={[styles.logoSub,{color:colors.muted}]}>
            {'Browser'+(plus?'⁺':'')}
          </Text>
        </View>
        <Pressable accessibilityRole="button"
          accessibilityLabel={'Сменить тему, сейчас '+resolved.label}
          style={buttonStyle} onPress={chooseTheme}>
          <Text style={[styles.themeIcon,{color:colors.accent}]}>◐</Text>
        </Pressable>
      </View>
      <View style={[styles.searchBar,{backgroundColor:colors.surface,borderColor:colors.line}]}>
        <TextInput
          style={[styles.address,{color:colors.text}]}
          accessibilityLabel="Адрес сайта или поиск через Яндекс"
          value={address} onChangeText={setAddress}
          placeholder="Адрес или поиск через Яндекс"
          placeholderTextColor={colors.muted}
          keyboardType="url" autoCapitalize="none" autoCorrect={false}
          returnKeyType="go" onSubmitEditing={()=>openUrl(address)}
          selectTextOnFocus
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Перейти"
          onPress={()=>openUrl(address)} style={[styles.go,{backgroundColor:colors.bg}]}>
          <Text style={[styles.goText,{color:colors.accent}]}>→</Text>
        </Pressable>
      </View>
      <View style={styles.tabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}>
          {session.tabs.map(item=>(
            <View key={item.id} style={[
              styles.tab,{backgroundColor:colors.surface,borderColor:item.id===session.activeId?colors.accent:colors.line}
            ]}>
              <Pressable accessibilityRole="button"
                accessibilityLabel={'Открыть вкладку '+item.title}
                onPress={()=>setSession(previous=>selectBrowserTab(previous,item.id))}
                style={styles.tabSelect}>
                <Text numberOfLines={1} style={[styles.tabLabel,{color:colors.text}]}>{item.title}</Text>
              </Pressable>
              <Pressable accessibilityRole="button"
                accessibilityLabel={'Закрыть вкладку '+item.title}
                onPress={()=>setSession(previous=>closeBrowserTab(previous,item.id))}
                style={styles.tabClose}>
                <Text style={[styles.tabCloseText,{color:colors.muted}]}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel="Новая вкладка"
          disabled={session.tabs.length>=MAX_BROWSER_TABS}
          onPress={()=>newTab()}
          style={[styles.tabAdd,{borderColor:colors.line,backgroundColor:colors.surface}]}>
          <Text style={[styles.addText,{color:colors.text}]}>+</Text>
        </Pressable>
      </View>
      <View style={[styles.strip,{backgroundColor:colors.surface,borderColor:colors.line}]}>
        <Text numberOfLines={1} style={[styles.stripText,{color:colors.muted}]}>
          {tab.url?new URL(tab.url).hostname:'Новая вкладка'}
        </Text>
        <Text style={[styles.stripText,{color:colors.muted}]}>{resolved.label}</Text>
      </View>
      <View style={[styles.content,{backgroundColor:colors.surface}]}>
        {tab.url?(
          <NativeBrowserViewport
            key={tab.id}
            ref={ref}
            url={tab.url}
            colors={colors}
            onNavigate={navigation=>{
              setSession(previous=>observeBrowserTab(previous,tab.id,navigation.url,navigation.title));
              setCanBack(navigation.canGoBack);
              setCanForward(navigation.canGoForward);
              setAddress(navigation.url);
            }}
            onRequestNewTab={url=>newTab(url)}
            onBlockedNavigation={()=>setStatus('Сайт или перенаправление заблокировано правилом HTTPS.')}
          />
        ):(
          <View style={styles.start}>
            <Text style={[styles.startTitle,{color:colors.text}]}>Новая вкладка</Text>
            <Text style={[styles.startCaption,{color:colors.muted}]}>
              Открой сайт или введи поисковый запрос. Данные поиска уйдут в Яндекс только после нажатия «Перейти».
            </Text>
            <View style={styles.quick}>
              {[
                ['Яндекс','https://ya.ru'],
                ['Wikipedia','https://www.wikipedia.org'],
                ['Хабр','https://habr.com']
              ].map(([name,url])=>(
                <Pressable key={name} accessibilityRole="button" onPress={()=>openUrl(url)}
                  style={[styles.quickItem,{borderColor:colors.line,backgroundColor:colors.bg}]}>
                  <Text style={[styles.quickLabel,{color:colors.text}]}>{name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
      {status?(
        <Text accessibilityRole="alert" style={[styles.error,{color:colors.accent}]}>{status}</Text>
      ):null}
      <View style={[styles.dock,{borderTopColor:colors.line,backgroundColor:colors.bg}]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Назад по страницам"
          disabled={!tab.url||!canBack} onPress={()=>ref.current?.back()} style={styles.dockButton}>
          <Text style={[styles.dockIcon,{color:colors.text,opacity:canBack?1:.35}]}>‹</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Вперёд по страницам"
          disabled={!tab.url||!canForward} onPress={()=>ref.current?.forward()} style={styles.dockButton}>
          <Text style={[styles.dockIcon,{color:colors.text,opacity:canForward?1:.35}]}>›</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Обновить страницу"
          disabled={!tab.url} onPress={()=>ref.current?.reload()} style={styles.dockButton}>
          <Text style={[styles.dockIcon,{color:colors.text,opacity:tab.url?1:.35}]}>↻</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Открыть новую вкладку"
          onPress={()=>newTab()} style={styles.dockButton}>
          <Text style={[styles.dockIcon,{color:colors.text}]}>▢</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  root:{flex:1},
  brandRow:{height:77,paddingHorizontal:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  brand:{alignItems:'center',justifyContent:'center',gap:1},
  logo:{fontSize:21,fontWeight:'300',letterSpacing:5,paddingLeft:5},
  logoSub:{fontSize:10,fontWeight:'400',letterSpacing:4,paddingLeft:4},
  smallButton:{width:38,height:38,borderWidth:1,borderRadius:14,alignItems:'center',justifyContent:'center'},
  smallButtonText:{fontSize:30,fontWeight:'300',lineHeight:34},
  themeIcon:{fontSize:19},
  searchBar:{marginHorizontal:12,minHeight:51,borderWidth:1,borderRadius:17,
    flexDirection:'row',alignItems:'center',paddingHorizontal:6,paddingLeft:13},
  address:{flex:1,fontSize:13,minHeight:45},
  go:{height:36,width:38,borderRadius:11,alignItems:'center',justifyContent:'center'},
  goText:{fontSize:22},
  tabsRow:{height:48,marginTop:9,paddingHorizontal:12,gap:6,flexDirection:'row'},
  tabScroll:{gap:5,alignItems:'center'},
  tab:{height:40,width:133,borderWidth:1,borderRadius:11,flexDirection:'row',alignItems:'center'},
  tabSelect:{flex:1,minWidth:0,paddingLeft:10,paddingVertical:10},
  tabLabel:{fontSize:12},
  tabClose:{width:26,height:38,alignItems:'center',justifyContent:'center'},
  tabCloseText:{fontSize:19,fontWeight:'300'},
  tabAdd:{width:35,height:40,borderWidth:1,borderRadius:11,alignItems:'center',justifyContent:'center'},
  addText:{fontSize:22,fontWeight:'300'},
  strip:{minHeight:38,paddingHorizontal:17,borderTopWidth:1,borderBottomWidth:1,
    flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},
  stripText:{fontSize:10,flexShrink:1},
  content:{flex:1},
  start:{flex:1,padding:22,justifyContent:'center'},
  startTitle:{fontSize:23,fontWeight:'300',textAlign:'center'},
  startCaption:{fontSize:12,textAlign:'center',marginTop:15,lineHeight:19},
  quick:{flexDirection:'row',gap:8,marginTop:28},
  quickItem:{flex:1,minHeight:59,borderWidth:1,borderRadius:13,
    alignItems:'center',justifyContent:'center',paddingHorizontal:4},
  quickLabel:{fontSize:11},
  dock:{height:59,borderTopWidth:1,flexDirection:'row',justifyContent:'space-around',
    alignItems:'center'},
  dockButton:{width:60,height:50,alignItems:'center',justifyContent:'center'},
  dockIcon:{fontSize:26,fontWeight:'300'},
  error:{fontSize:11,paddingHorizontal:14,paddingVertical:6}
});
