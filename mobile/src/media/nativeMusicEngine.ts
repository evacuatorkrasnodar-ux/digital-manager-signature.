import {createAudioPlayer,setAudioModeAsync,type AudioPlayer} from 'expo-audio';
import {sharedMediaSession} from './sharedMediaSession';

/** Native SEYVEO Music engine. Plays explicitly supplied local or authorized media URLs.
 * Does not extract audio from browser pages. One player is created at a time.
 */
let player:AudioPlayer|null=null;
let statusListener:{remove:()=>void}|null=null;
let trackId:string|null=null;
let removeControls:(()=>void)|null=null;

export async function startNativeTrack(sourceUri:string,title:string){
 if(typeof sourceUri!=='string'||!sourceUri||typeof title!=='string')throw new Error('invalid-media');
 const local=sourceUri.startsWith('file://');
 let secure=false;
 try{const u=new URL(sourceUri);secure=u.protocol==='https:'&&!u.username&&!u.password}catch{}
 if(!local&&!secure)throw new Error('unsupported-media-uri');
 stopNativeTrack();
 await setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:true,interruptionMode:'doNotMix'});
 const next=createAudioPlayer({uri:sourceUri});
 try{
  player=next;
  trackId=sourceUri.slice(0,300);
  sharedMediaSession.report('music',trackId,title,'loading');
  removeControls=sharedMediaSession.registerControls('music',trackId,command=>{
   if(command==='pause')pauseNativeTrack();else resumeNativeTrack();
  });
  statusListener=next.addListener('playbackStatusUpdate',status=>{
   if(player!==next||!trackId)return;
   if(status.didJustFinish){stopNativeTrack();return}
   if(!status.isLoaded&&status.error){sharedMediaSession.report('music',trackId,title,'error');return}
   sharedMediaSession.report('music',trackId,title,status.playing?'playing':status.isLoaded?'paused':'loading');
  });
  next.setActiveForLockScreen(true,{title,artist:'SEYVEO Music'});
  next.play();
 }catch(error){
  stopNativeTrack();
  throw error;
 }
}

export function pauseNativeTrack(){player?.pause()}
export function resumeNativeTrack(){player?.play()}
export function stopNativeTrack(){
 const old=player;const id=trackId;
 player=null;trackId=null;
 statusListener?.remove();statusListener=null;
 removeControls?.();removeControls=null;
 if(old){old.pause();old.setActiveForLockScreen(false);old.release()}
 if(id)sharedMediaSession.clear('music',id);
}
