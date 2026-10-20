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
// Inline application scripts contain mutually exclusive HTML strings. They
// are not elements of the document until a branch renders into a container.
const staticMarkup=html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'');
const markupIds=[...staticMarkup.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
/* Health/Care has one self-contained, static HTML template mounted in the
 * existing personal dialog. Validate its IDs rather than requiring copies in
 * index.html. The six generated card labels use the same reusable factory. */
const wellnessSource=read('assets/personal-wellness.js');
const wellnessTemplate=wellnessSource.match(/host\.innerHTML=`([\s\S]*?)`;/);
const componentIds=wellnessTemplate
 ?[...wellnessTemplate[1].matchAll(/\bid=["']([\w-]+)["']/g)].map(m=>m[1]):[];
const generatedCardIds=[...wellnessSource.matchAll(/btn\('([\w-]+)'/g)].map(m=>'pwCard'+m[1]);
const dynamicIds=[...componentIds,...generatedCardIds];
const ids=new Set([...markupIds,...dynamicIds]);
check(new Set(markupIds).size===markupIds.length,'Unique HTML element IDs');
check(Boolean(wellnessTemplate)&&new Set(dynamicIds).size===dynamicIds.length&&
 dynamicIds.every(id=>!markupIds.includes(id)),
 'Unique mounted Health and Care component IDs');
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
 if(/,\s*\}/.test(read(name)))failures.push('Malformed trailing selector comma: '+name);
}
const inlineStyles=[...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)]
 .map(m=>m[1]).filter(x=>x.trim());
for(let i=0;i<inlineStyles.length;i++){
 if(!balancedCSS(inlineStyles[i]))failures.push('Unbalanced CSS in index.html style block #'+(i+1));
}
check(!failures.some(s=>s.startsWith('Unbalanced CSS')||s.startsWith('Malformed trailing selector comma')),
 'CSS syntax structure ('+cssPaths.length+' files, '+inlineStyles.length+' inline)');
// DOM nodes mounted by feature modules (tour, conversation, notifications)
// do not appear in index.html. Recognize their literal declarations without
// exempting references to removed controls.
const declaredModuleIds=new Set();
for(const name of scriptPaths.filter(x=>x.startsWith('assets/'))){
 const source=read(name);
 for(const match of source.matchAll(/\bid=["']([\w-]+)["']/g))declaredModuleIds.add(match[1]);
 for(const match of source.matchAll(/\.id\s*=\s*["']([\w-]+)["']/g))declaredModuleIds.add(match[1]);
}
const referencedIds=new Set();
for(const name of scriptPaths.filter(x=>x.startsWith('assets/'))){
 for(const m of read(name).matchAll(/(?:getElementById\(|\$\()\s*['"]([\w-]+)['"]\s*\)/g)){
  if(m[1]!=='page')referencedIds.add(m[1]); // dynamically created print window
 }
}
const missingIds=[...referencedIds].filter(id=>!ids.has(id)&&!declaredModuleIds.has(id));
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
