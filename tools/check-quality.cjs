/* SEYVEO project quality gate. Read-only; no third-party packages.
 * Run from repository root: node tools/check-quality.cjs
 * Static checks complement, but do not replace, real iPhone/browser tests.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const failures=[];
const results=[];
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const exists=name=>fs.existsSync(path.join(root,name));
function check(condition,message){
 if(condition)results.push(message);
 else failures.push(message);
}
function findFiles(dir,extension){
 const abs=path.join(root,dir);
 return fs.readdirSync(abs,{withFileTypes:true}).flatMap(item=>{
  const rel=path.posix.join(dir,item.name);
  return item.isDirectory()?findFiles(rel,extension):
   item.isFile()&&item.name.endsWith(extension)?[rel]:[];
 });
}
const html=read('index.html');
const markupIds=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
const ids=new Set(markupIds);
check(ids.size===markupIds.length,'Unique HTML element IDs');
const references=[...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)]
 .map(m=>m[1].split(/[?#]/)[0]).filter(ref=>
  ref&& !/^(https?:|data:|mailto:|tel:|blob:|\/|#)/i.test(ref)
 ).map(ref=>ref.replace(/^\.\//,''));
const missing=[...new Set(references)].filter(ref=>!exists(ref));
check(missing.length===0,'No missing HTML asset references'+(missing.length?': '+missing.join(', '):''));
let manifest;
try{manifest=JSON.parse(read('manifest.webmanifest'));}
catch(error){failures.push('Invalid manifest.webmanifest: '+error.message);}
if(manifest){
 const missingIcons=(manifest.icons||[]).map(icon=>String(icon.src||'').split('?')[0])
  .filter(name=>!exists(name));
 check(missingIcons.length===0,'PWA manifest icon files exist'+(missingIcons.length?': '+missingIcons.join(', '):''));
}
const scriptPaths=[...findFiles('assets','.js'),'sw.js'];
for(const name of scriptPaths){
 try{new vm.Script(read(name),{filename:name});}
 catch(error){failures.push('JavaScript syntax in '+name+': '+error.message);}
}
const inlineScripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
for(let i=0;i<inlineScripts.length;i++){
 try{new vm.Script(inlineScripts[i],{filename:'index inline #'+(i+1)});}
 catch(error){failures.push('Inline JavaScript #'+(i+1)+': '+error.message);}
}
check(!failures.some(s=>s.startsWith('JavaScript syntax')||s.startsWith('Inline JavaScript')),
 'JavaScript syntax ('+scriptPaths.length+' files, '+inlineScripts.length+' inline)');
const cssPaths=findFiles('assets','.css');
function balancedCSS(input){
 let level=0,quote='',comment=false;
 for(let i=0;i<input.length;i++){
  const char=input[i],next=input[i+1];
  if(comment){if(char==='*'&&next==='/'){comment=false;i++;}continue;}
  if(char==='/'&&next==='*'){comment=true;i++;continue;}
  if(quote){if(char==='\\'){i++;continue;}if(char===quote)quote='';continue;}
  if(char==='"'||char==="'"){quote=char;continue;}
  if(char==='{')level++;
  else if(char==='}'&&--level<0)return false;
 }
 return level===0&&!quote&&!comment;
}
for(const name of cssPaths){
 if(!balancedCSS(read(name)))failures.push('Unbalanced CSS or unterminated quote/comment: '+name);
}
check(!failures.some(s=>s.startsWith('Unbalanced CSS')),
 'CSS syntax structure ('+cssPaths.length+' files)');
const referencedIds=new Set();
for(const name of scriptPaths.filter(x=>x.startsWith('assets/'))){
 for(const m of read(name).matchAll(/(?:getElementById\(|\$\()\s*['"]([\w-]+)['"]\s*\)/g)){
  if(m[1]!=='page')referencedIds.add(m[1]); // dynamically created print window
 }
}
const missingIds=[...referencedIds].filter(id=>!ids.has(id));
check(missingIds.length===0,'Static JavaScript DOM IDs exist'+(missingIds.length?': '+missingIds.join(', '):''));
check(html.includes("seyveo-notes-v1")&&read('assets/personal-tasks.js').includes('seyveo-personal-tasks-v1'),
 'Persistent notebook and personal-task storage keys preserved');
check(!read('assets/notebook-smart.css').includes('#notesDialog .note-menu')
 && !read('assets/picture.css').includes('.picture-footnote')
 && !read('assets/pulse.css').includes('.pulse-intro'),
 'Known retired CSS components stay removed');

for(const item of results)console.log('PASS  '+item);
for(const item of failures)console.error('FAIL  '+item);
if(failures.length){console.error('\nSEYVEO: '+failures.length+' static check(s) failed.');process.exitCode=1;}
else console.log('\nSEYVEO: static quality checks passed; verify UI behavior on real devices.');
