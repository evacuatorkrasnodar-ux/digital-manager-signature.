import {sharedMediaSession,type MediaPhase} from './sharedMediaSession';

/** Bridge for the future native SEYVEO Music engine.
 * Does not start audio itself. Call only on real player events.
 */
export function connectSeyveoMusic(player:{
 onStatus:(listener:(event:{trackId:string;title:string;phase:MediaPhase})=>void)=>()=>void;
 play:()=>void|Promise<void>;
 pause:()=>void|Promise<void>;
}){
 let currentId:string|null=null;
 let unsubscribeControls=()=>{};
 const unsubscribeStatus=player.onStatus(event=>{
  if(!event||typeof event.trackId!=='string'||!event.trackId)return;
  if(event.phase==='idle'){if(currentId)sharedMediaSession.clear('music',currentId);currentId=null;unsubscribeControls();unsubscribeControls=()=>{};return}
  if(sharedMediaSession.report('music',event.trackId,event.title,event.phase)){
   if(currentId!==event.trackId){unsubscribeControls();unsubscribeControls=sharedMediaSession.registerControls('music',event.trackId,command=>{void (command==='play'?player.play():player.pause())})}
   currentId=event.trackId;
  }
 });
 return ()=>{unsubscribeControls();unsubscribeStatus();if(currentId)sharedMediaSession.clear('music',currentId)};
}
