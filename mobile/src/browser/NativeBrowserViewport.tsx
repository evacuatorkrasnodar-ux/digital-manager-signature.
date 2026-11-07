/**
 * Native SEYVEO Browser content viewport.
 *
 * This is NOT an iframe: iOS uses WKWebView, Android Android WebView.
 * The parent owns the approved Black Velvet chrome, all five themes,
 * tab lifecycle, bookmarks and explicit user-initiated downloads.
 *
 * Only the actual visited site is loaded; page scripts are NOT allowed to
 * send arbitrary commands to the SEYVEO app. No DOM/cookie scraping.
 */
import React,{forwardRef,useImperativeHandle,useMemo,useRef} from 'react';
import {Text,View} from 'react-native';
import WebView from 'react-native-webview';
import {validateBrowserWebViewUrl,shouldLoadBrowserWebViewUrl} from './native-webview-policy.mjs';

export type NativeBrowserViewportRef = {
  back():void;
  forward():void;
  reload():void;
  stop():void;
};
export type NativeBrowserViewportProps = {
  url:string;
  privateMode?:boolean;
  colors:{surface:string;text:string;muted:string};
  onNavigate?:(state:{url:string;title:string;canGoBack:boolean;canGoForward:boolean})=>void;
  onBlockedNavigation?:(hostOrScheme:string)=>void;
  onRequestNewTab?:(url:string)=>void;
  onScrollMessage?:(event:{nativeEvent:{data:string}})=>void;
  scrollBridgeJavaScript?:string;
};

export const NativeBrowserViewport=forwardRef<NativeBrowserViewportRef,NativeBrowserViewportProps>(
 function NativeBrowserViewport({
   url,privateMode=false,colors,onNavigate,onBlockedNavigation,
   onRequestNewTab,onScrollMessage,scrollBridgeJavaScript
 },ref){
  // react-native-webview 14.0.1 defaults P to undefined (upstream TS regression).
  // Explicit empty props type avoids JSX props collapsing to never.
  const webRef=useRef<WebView<{}>>(null);
  const safeUrl=useMemo(()=>{
    try{return validateBrowserWebViewUrl(url);}
    catch{return null;}
  },[url]);

  useImperativeHandle(ref,()=>({
    back:()=>webRef.current?.goBack(),
    forward:()=>webRef.current?.goForward(),
    reload:()=>webRef.current?.reload(),
    stop:()=>webRef.current?.stopLoading()
  }),[]);

  const notifyBlocked=(target:string)=>{
    // Send only the host/scheme; never expose path/query strings with tokens.
    let hostOrScheme='недопустимый адрес';
    try{const u=new URL(target);hostOrScheme=u.hostname||u.protocol;}
    catch{}
    onBlockedNavigation?.(hostOrScheme);
  };
  if(!safeUrl){
    return (
      <View style={{flex:1,backgroundColor:colors.surface,alignItems:'center',
        justifyContent:'center',padding:18}}>
        <Text style={{color:colors.text,textAlign:'center'}}>
          Этот адрес нельзя открыть в безопасном режиме браузера.
        </Text>
      </View>
    );
  }

  return (
    <WebView<{}>
      ref={webRef}
      key={privateMode?'private':'regular'}
      style={{flex:1,backgroundColor:colors.surface}}
      source={{uri:safeUrl}}
      originWhitelist={['https://*']}
      javaScriptEnabled={true}
      javaScriptCanOpenWindowsAutomatically={false}
      mixedContentMode="never"
      allowFileAccess={false}
      allowFileAccessFromFileURLs={false}
      allowUniversalAccessFromFileURLs={false}
      thirdPartyCookiesEnabled={false}
      sharedCookiesEnabled={false}
      incognito={privateMode}
      cacheEnabled={!privateMode}
      setSupportMultipleWindows={true}
      allowsBackForwardNavigationGestures={true}
      mediaPlaybackRequiresUserAction={true}
      onShouldStartLoadWithRequest={request=>{
        const allowed=shouldLoadBrowserWebViewUrl(request.url);
        if(!allowed)notifyBlocked(request.url);
        return allowed;
      }}
      onOpenWindow={event=>{
        const target=event.nativeEvent.targetUrl;
        if(shouldLoadBrowserWebViewUrl(target)&&onRequestNewTab)onRequestNewTab(target);
        else notifyBlocked(target);
      }}
      onNavigationStateChange={state=>{
        // Android may not call the policy callback for the initial URL.
        if(!shouldLoadBrowserWebViewUrl(state.url)){
          webRef.current?.stopLoading();
          notifyBlocked(state.url);
          return;
        }
        onNavigate?.({
          url:state.url,
          title:state.title||new URL(state.url).hostname,
          canGoBack:state.canGoBack,
          canGoForward:state.canGoForward
        });
      }}
      onMessage={onScrollMessage}
      injectedJavaScript={onScrollMessage?scrollBridgeJavaScript:undefined}
      onError={()=>{onBlockedNavigation?.('Сайт не удалось загрузить');}}
      renderError={()=>(
        <View style={{flex:1,alignItems:'center',justifyContent:'center',
          backgroundColor:colors.surface,padding:18}}>
          <Text style={{color:colors.muted,textAlign:'center'}}>
            Страница недоступна. Проверь адрес или соединение.
          </Text>
        </View>
      )}
    />
  );
 });
