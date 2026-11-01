import {createAudioPlayer,setAudioModeAsync,type AudioPlayer} from 'expo-audio';
import {sharedMediaSession} from './sharedMediaSession';

/** Native SEYVEO Music engine. Plays explicitly supplied local or authorized media URLs.
 * Does not extract audio from browser pages. One player is created at a time.
 */
let player:AudioPlayer|null=null;
let statusListener:{remove:()=>void}|null=null;
let trackId:string|null=null;

export async function startNativeTrack(sourceUri:string,title:string){
 if(typeof sourceUri!=='string'||!sourceUri||typeof title!=='string')throw new Error('invalid-media');
 const allowed=sourceUri.startsWith('file://')||sourceUri.startsWith('https://');
 if(!allowed)throw new Error('unsupported-media-uri');
 stopNativeTrack();
 await setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:true,interruptionMode:'doNotMix'});
 const next=createAudioPlayer({uri:sourceUri});
 player=next;
 trackId=sourceUri.slice(0,300);
 sharedMediaSession.report('music',trackId,title,'loading');
 statusListener=next.addListener('playbackStatusUpdate',status=>{
  if(player!==next||!trackId)return;
  sharedMediaSession.report('music',trackId,title,status.playing?'playing':status.isLoaded?'paused':'loading');
 });
 next.setActiveForLockScreen(true,{title,artist:'SEYVEO Music'});
 next.play();
}

export function pauseNativeTrack(){player?.pause()}
export function resumeNativeTrack(){player?.play()}
export function stopNativeTrack(){
 const old=player;const id=trackId;
 player=null;trackId=null;
 statusListener?.remove();statusListener=null;
 if(old){old.pause();old.setActiveForLockScreen(false);old.release()}
 if(id)sharedMediaSession.clear('music',id);
}
