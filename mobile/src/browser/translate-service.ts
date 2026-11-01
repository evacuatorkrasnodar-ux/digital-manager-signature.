/** Translation bridge. No external requests until user opts in.
 * Configure a trusted HTTPS LibreTranslate-compatible backend at build time.
 * Do not put API secrets in public Expo variables. */
export const translateEndpoint=process.env.EXPO_PUBLIC_SEYVEO_TRANSLATE_URL||'';
export function usableTranslationEndpoint(value:string){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname.endsWith('/translate')}catch{return false}
}
export async function translateText(text:string,target='ru'){
 if(!usableTranslationEndpoint(translateEndpoint))throw new Error('not-configured');
 if(!text.trim()||text.length>10000)throw new Error('invalid-text');
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),18000);
 try{
  const response=await fetch(translateEndpoint,{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({q:text,source:'auto',target,format:'text'}),
   signal:controller.signal,redirect:'error'
  });
  if(!response.ok)throw new Error('service-failed');
  const data=await response.json();
  if(typeof data?.translatedText!=='string'||!data.translatedText.trim()||data.translatedText.length>50000)throw new Error('invalid-response');
  return data.translatedText as string;
 }finally{clearTimeout(timeout)}
}
