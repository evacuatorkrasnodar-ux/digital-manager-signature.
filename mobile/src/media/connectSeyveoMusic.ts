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
 const unsubscribeStatus=player.onStatus(event=>{
  if(!event||typeof event.trackId!=='string'||!event.trackId)return;
  if(event.phase==='idle'){if(currentId)sharedMediaSession.clear('music',currentId);currentId=null;return}
  if(sharedMediaSession.report('music',event.trackId,event.title,event.phase))currentId=event.trackId;
 });
 const unsubscribeControls=sharedMediaSession.registerControls('music',currentId||'unassigned',command=>{
  void (command==='play'?player.play():player.pause());
 });
 return ()=>{unsubscribeControls();unsubscribeStatus();if(currentId)sharedMediaSession.clear('music',currentId)};
}
