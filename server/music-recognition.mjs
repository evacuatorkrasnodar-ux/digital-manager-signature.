// Explicit, short-clip recognition. Token is server-only; no disk writes.
export const MAX_MUSIC_CLIP=2*1024*1024;
const types={'audio/webm':'webm','audio/ogg':'ogg','audio/mp4':'m4a','audio/wav':'wav','audio/mpeg':'mp3'};
export function clipFormat(type){const mime=String(type||'').split(';')[0].trim().toLowerCase();return types[mime]?{mime,extension:types[mime]}:null}
export function recognitionConfigured(env=process.env){return !!String(env.SEYVEO_AUDD_TOKEN||'').trim()}
const clean=(value,max=240)=>typeof value==='string'?value.trim().slice(0,max):'';
export async function recognizeMusic(bytes,type,{token=process.env.SEYVEO_AUDD_TOKEN,fetchImpl=fetch}={}){
 const format=clipFormat(type);
 if(!format||!bytes?.length||bytes.length>MAX_MUSIC_CLIP)throw Error('invalid-clip');
 if(!String(token||'').trim())throw Error('not-configured');
 const body=new FormData();
 body.append('api_token',token.trim());
 body.append('file',new Blob([bytes],{type:format.mime}),'clip.'+format.extension);
 const response=await fetchImpl('https://api.audd.io/',{method:'POST',body,redirect:'error',signal:AbortSignal.timeout(18000)});
 if(!response.ok)throw Error('provider-unavailable');
 const data=await response.json();
 if(data?.status!=='success')throw Error('provider-unavailable');
 if(data.result===null)return null;
 const title=clean(data.result?.title),artist=clean(data.result?.artist);
 if(!title||!artist)throw Error('provider-unavailable');
 let link='';
 try{const u=new URL(data.result.song_link);if(u.protocol==='https:'&&u.hostname==='song.link')link=u.href}catch{}
 return {title,artist,album:clean(data.result.album),link};
}
