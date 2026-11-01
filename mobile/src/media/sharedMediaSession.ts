/** Single media session model for SEYVEO Music and Browser.
 * This is a state coordinator, NOT a background audio engine.
 * Playback status must be reported by the real player, never assumed after a button tap.
 */
export type MediaOrigin='browser'|'music';
export type MediaPhase='idle'|'loading'|'playing'|'paused'|'error';
export type MediaSnapshot=Readonly<{
 origin:MediaOrigin|null;id:string|null;title:string;phase:MediaPhase;
}>;
export type MediaListener=(snapshot:MediaSnapshot)=>void;
const empty:MediaSnapshot=Object.freeze({origin:null,id:null,title:'',phase:'idle'});
let current:MediaSnapshot=empty;
const listeners=new Set<MediaListener>();
type MediaCommand='play'|'pause';
type CommandHandler=(command:MediaCommand)=>void;
let commandTarget:{origin:MediaOrigin;id:string;handler:CommandHandler}|null=null;
function emit(){for(const listener of listeners){try{listener(current)}catch{/* one subscriber cannot break the bus */}}}
function validOrigin(v:unknown):v is MediaOrigin{return v==='browser'||v==='music'}
export const sharedMediaSession={
 getSnapshot:():MediaSnapshot=>current,
 registerControls(origin:MediaOrigin,id:string,handler:CommandHandler){
  if(!validOrigin(origin)||!id)return()=>{};
  const target={origin,id,handler};commandTarget=target;
  return()=>{if(commandTarget===target)commandTarget=null};
 },
 sendCommand(command:MediaCommand){
  if(command!=='play'&&command!=='pause')return false;
  if(!commandTarget||current.origin!==commandTarget.origin||current.id!==commandTarget.id)return false;
  try{commandTarget.handler(command);return true}catch{return false}
 },
 subscribe(listener:MediaListener){listeners.add(listener);listener(current);return()=>{listeners.delete(listener)}},
 report(source:MediaOrigin,id:string,title:string,phase:MediaPhase){
  if(!validOrigin(source)||typeof id!=='string'||!id||id.length>300||typeof title!=='string')return false;
  if(!['loading','playing','paused','error'].includes(phase))return false;
  // Another engine cannot replace an actively playing session without explicit handoff.
  if(current.phase==='playing'&&current.origin!==source)return false;
  current=Object.freeze({origin:source,id,title:title.slice(0,140),phase});emit();return true;
 },
 clear(source:MediaOrigin,id?:string){
  if(current.origin!==source||(id&&current.id!==id))return false;
  current=empty;emit();return true;
 }
};
