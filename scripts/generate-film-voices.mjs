import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
// Run only after an explicit choice: uses paid speech API and a private key.
const base=resolve(import.meta.dirname,'..');
const key=process.env.OPENAI_API_KEY?.trim();
const full=process.argv.includes('--full'),sample=process.argv.includes('--sample');
const opt=process.argv.indexOf('--voice');
const selection=opt>=0?process.argv[opt+1]:'both';
if(full===sample||!['both','felix','milissa'].includes(selection)){
 console.error('Usage: node scripts/generate-film-voices.mjs --sample|--full [--voice both|felix|milissa]');
 process.exit(2);
}
if(!key){console.error('Missing private OPENAI_API_KEY (do not add it to the repo).');process.exit(2)}
const source=await readFile(resolve(base,'assets/welcome-tour.js'),'utf8');
const a=source.indexOf('const scenesCopy=['),b=source.indexOf('const worldText=',a);
if(a<0||b<0)throw Error('Film narration scripts not found');
const literal=source.slice(a+'const scenesCopy='.length,b).trim().replace(/;\s*$/,'');
const scenes=Function('"use strict";return ('+literal+')')();
if(scenes.length!==14||scenes.some(row=>typeof row?.[3]!=='string'))throw Error('Expected 14 narrated chapters');
const cast={
 felix:{name:'Феликс',voice:process.env.SEYVEO_FELIX_VOICE||'cedar',
  instructions:'Говори на русском естественно, тепло, уверенно, мужским голосом. Живая русская интонация, мягкие смысловые паузы, спокойная кинематографичная подача, без роботической монотонности и переигрывания.'},
 milissa:{name:'Милисса',voice:process.env.SEYVEO_MILISSA_VOICE||'coral',
  instructions:'Говори на русском естественно, тепло, уверенно, женским голосом. Живая русская интонация, мягкие смысловые паузы, кинематографичная подача, без роботической монотонности и переигрывания.'}
};
const names=selection==='both'?Object.keys(cast):[selection];
let generated=0,skipped=0;
for(const name of names){
 for(const index of (full?scenes.map((_,i)=>i):[0])){
  const n=String(index+1).padStart(2,'0');
  const target=resolve(base,'assets/film-voices',name,n+'.mp3');
  try{if((await stat(target)).size>2000&&!process.env.SEYVEO_REGENERATE){skipped++;continue}}catch{}
  const actor=cast[name];
  const response=await fetch('https://api.openai.com/v1/audio/speech',{
   method:'POST',
   headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
   body:JSON.stringify({model:'gpt-4o-mini-tts',voice:actor.voice,
    input:scenes[index][3].replace(/Феликс/g,actor.name),
    instructions:actor.instructions,response_format:'mp3',speed:1}),
   signal:AbortSignal.timeout(120000)
  });
  if(!response.ok)throw Error('Speech API chapter '+n+' for '+name+': HTTP '+response.status);
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length<2000)throw Error('Audio file too small: '+name+' '+n);
  await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes);
  generated++;console.log('Prepared '+name+'/'+n+'.mp3 ('+bytes.length+' bytes)');
 }
}
console.log('Generated '+generated+' tracks; skipped '+skipped+' already present.');

// Publish an explicit list of MP3 files that exist on disk.
// The PWA checks this before playback so nonexistent files never produce 404s.
const present={felix:[],milissa:[]};
for(const voice of Object.keys(present)){
 for(let index=0;index<scenes.length;index++){
  const filename=resolve(base,'assets/film-voices',voice,String(index+1).padStart(2,'0')+'.mp3');
  try{if((await stat(filename)).size>2000)present[voice].push(index+1)}catch{}
 }
}
const manifestPath=resolve(base,'assets/film-voices/availability.js');
await writeFile(manifestPath,
 '// SEYVEO generated narration availability; updated with published MP3 tracks.\n'+
 'window.SEYVEO_FILM_VOICES=Object.freeze('+JSON.stringify(present)+');\n');
console.log('Voice manifest updated:',JSON.stringify(present));
// Bust the browser cache for the updated availability list when manually
// publishing new tracks. This also updates the installed PWA's HTML.
const indexPath=resolve(base,'index.html');
let html=await readFile(indexPath,'utf8');
const latest=String(Date.now());
const re=/assets\/film-voices\/availability\.js\?v=\d+/;
if(!re.test(html))throw Error('Availability script tag missing in index.html');
html=html.replace(re,'assets/film-voices/availability.js?v='+latest);
await writeFile(indexPath,html);
console.log('Updated availability cache revision '+latest);
