/* Local, conservative document correction. No network or OCR required. */
(function(root){
'use strict';
const lum=(r,g,b)=>(r*77+g*150+b*29)/256;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const cross=(a,b,c)=>(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);
function detect(data,w,h){
 if(w<40||h<40)return null;
 const N=w*h,mask=new Uint8Array(N),visited=new Uint8Array(N),q=new Int32Array(N);
 for(let k=0;k<N;k++){const p=k*4,r=data[p],g=data[p+1],b=data[p+2];mask[k]=lum(r,g,b)>153&&Math.max(r,g,b)-Math.min(r,g,b)<48?1:0;}
 let best=[];
 for(let k=0;k<N;k++){
  if(!mask[k]||visited[k])continue;
  let head=0,tail=1;q[0]=k;visited[k]=1;
  while(head<tail){
   const j=q[head++],x=j%w,y=(j/w)|0;
   for(const a of [x>0?j-1:-1,x<w-1?j+1:-1,y>0?j-w:-1,y<h-1?j+w:-1]){
    if(a>=0&&mask[a]&&!visited[a]){visited[a]=1;q[tail++]=a;}
   }
  }
  if(tail>best.length)best=Array.from(q.subarray(0,tail));
 }
 if(best.length<N*.20||best.length>N*.90)return null;
 const corners=[null,null,null,null],scores=[Infinity,-Infinity,-Infinity,Infinity];
 for(const k of best){
  const x=k%w,y=(k/w)|0,plus=x+y,minus=x-y;
  if(plus<scores[0]){scores[0]=plus;corners[0]={x,y};}
  if(minus>scores[1]){scores[1]=minus;corners[1]={x,y};}
  if(plus>scores[2]){scores[2]=plus;corners[2]={x,y};}
  if(minus<scores[3]){scores[3]=minus;corners[3]={x,y};}
 }
 const area=Math.abs(corners.reduce((v,p,j)=>{const a=corners[(j+1)%4];return v+p.x*a.y-a.x*p.y;},0))/2;
 if(area<N*.30||area>N*.93||best.length/area<.68||best.length/area>1.10)return null;
 const margin=Math.max(2,Math.round(Math.min(w,h)*.015));
 if(corners.some(p=>p.x<margin||p.y<margin||p.x>w-1-margin||p.y>h-1-margin))return null;
 if(corners.some((p,j)=>cross(p,corners[(j+1)%4],corners[(j+2)%4])<area*.10||dist(p,corners[(j+1)%4])<Math.min(w,h)*.30))return null;
 const at=(x,y)=>{const p=(Math.round(y)*w+Math.round(x))*4;return lum(data[p],data[p+1],data[p+2]);};
 // Each edge must show a real light-paper/darker-background transition.
 for(let j=0;j<4;j++){
  const a=corners[j],b=corners[(j+1)%4],len=dist(a,b),nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;
  let good=0;
  for(let k=1;k<=9;k++){
   const t=k/10,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,d=margin+1;
   const inside={x:x+nx*d,y:y+ny*d},outside={x:x-nx*d,y:y-ny*d};
   if([inside,outside].some(p=>p.x<0||p.y<0||p.x>=w-1||p.y>=h-1))continue;
   if(at(inside.x,inside.y)-at(outside.x,outside.y)>22)good++;
  }
  if(good<6)return null;
 }
 return corners;
}
function mapping(q){
 const [a,b,c,d]=q,dx1=b.x-c.x,dx2=d.x-c.x,dx3=a.x-b.x+c.x-d.x,dy1=b.y-c.y,dy2=d.y-c.y,dy3=a.y-b.y+c.y-d.y;
 const den=dx1*dy2-dx2*dy1;
 if(Math.abs(den)<1e-8)throw Error('Invalid document corners');
 const g=(dx3*dy2-dx2*dy3)/den,h=(dx1*dy3-dx3*dy1)/den;
 const A=b.x-a.x+g*b.x,B=d.x-a.x+h*d.x,C=b.y-a.y+g*b.y,D=d.y-a.y+h*d.y;
 return (u,v)=>{const z=g*u+h*v+1;return {x:(A*u+B*v+a.x)/z,y:(C*u+D*v+a.y)/z};};
}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function correct(source){
 const W=source.width,H=source.height,scale=Math.min(1,360/Math.max(W,H));
 const w=Math.max(1,Math.round(W*scale)),h=Math.max(1,Math.round(H*scale));
 const small=canvas(w,h),ctx=small.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(source,0,0,w,h);
 const found=detect(ctx.getImageData(0,0,w,h).data,w,h);
 if(!found)return null;
 const q=found.map(p=>({x:p.x*(W-1)/(w-1),y:p.y*(H-1)/(h-1)}));
 const width=Math.max(dist(q[0],q[1]),dist(q[3],q[2])),height=Math.max(dist(q[0],q[3]),dist(q[1],q[2]));
 const factor=Math.min(1,2000/Math.max(width,height));
 const ow=Math.max(2,Math.round(width*factor)),oh=Math.max(2,Math.round(height*factor));
 const src=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data;
 const out=canvas(ow,oh),oc=out.getContext('2d'),pixels=oc.createImageData(ow,oh),p=pixels.data,project=mapping(q);
 for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){
  const s=project(x/(ow-1),y/(oh-1)),sx=Math.max(0,Math.min(W-1,s.x)),sy=Math.max(0,Math.min(H-1,s.y));
  const ix=Math.floor(sx),iy=Math.floor(sy),jx=Math.min(W-1,ix+1),jy=Math.min(H-1,iy+1),fx=sx-ix,fy=sy-iy,k=(y*ow+x)*4;
  for(let z=0;z<3;z++){
   const top=src[(iy*W+ix)*4+z]*(1-fx)+src[(iy*W+jx)*4+z]*fx,bot=src[(jy*W+ix)*4+z]*(1-fx)+src[(jy*W+jx)*4+z]*fx;
   p[k+z]=top*(1-fy)+bot*fy;
  }
  p[k+3]=255;
  // Gentle highlight lift; retain colored stamps, signatures and photographs.
  const l=lum(p[k],p[k+1],p[k+2]),ch=Math.max(p[k],p[k+1],p[k+2])-Math.min(p[k],p[k+1],p[k+2]);
  if(l>155&&ch<40){const delta=Math.min(24,(l-155)*.20);for(let z=0;z<3;z++)p[k+z]=Math.min(255,p[k+z]+delta);}
 }
 oc.putImageData(pixels,0,0);return out;
}
async function process(file){
 const url=URL.createObjectURL(file);
 try{
  const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
  const scale=Math.min(1,2000/Math.max(img.naturalWidth,img.naturalHeight)),c=canvas(Math.max(1,Math.round(img.naturalWidth*scale)),Math.max(1,Math.round(img.naturalHeight*scale)));
  const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);
  const result=correct(c);if(!result)return {file,corrected:false};
  const blob=await new Promise(resolve=>result.toBlob(resolve,'image/jpeg',.94));
  return blob?{file:new File([blob],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'}),corrected:true}:{file,corrected:false};
 }catch{return {file,corrected:false};}finally{URL.revokeObjectURL(url);}
}
function capture(onAttach){
 const dialog=document.createElement('dialog');dialog.className='sv-local-scan';dialog.setAttribute('aria-label','Сканировать документ');
 const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 const head=make('header'),back=make('button','‹'),title=make('strong','Сканер'),done=make('button','✓');
 back.type=done.type='button';back.setAttribute('aria-label','Назад');done.setAttribute('aria-label','Прикрепить скан');done.disabled=true;
 head.append(back,title,done);
 const stage=make('div'),img=make('img'),status=make('p','Сделайте фото документа или выберите из галереи.');stage.className='sv-local-scan-stage';img.alt='Предпросмотр документа';img.hidden=true;stage.append(img,status);
 const rail=make('div');rail.className='sv-local-scan-rail';
 const camera=make('input'),gallery=make('input');for(const x of [camera,gallery]){x.type='file';x.accept='image/jpeg,image/png,image/webp';x.hidden=true;}camera.setAttribute('capture','environment');
 const cam=make('button','Камера'),pick=make('button','Галерея'),toggle=make('button','Оригинал');toggle.hidden=true;
 for(const x of [cam,pick,toggle])x.type='button';rail.append(cam,pick,toggle);
 dialog.append(head,stage,rail,camera,gallery);document.body.append(dialog);
 let original=null,processed=null,chosen=null,url='',epoch=0;
 function show(file){chosen=file;if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(file);img.src=url;img.hidden=false;done.disabled=false;}
 async function load(file){if(!file)return;if(!/^image\/(jpeg|png|webp)$/i.test(file.type)||!file.size||file.size>12*1024*1024){status.textContent='Выберите JPEG, PNG или WebP до 12 МБ.';return;}const t=++epoch;done.disabled=true;toggle.hidden=true;original=file;processed=null;status.textContent='Проверяем границы документа…';const result=await process(file);if(!dialog.open||t!==epoch)return;processed=result.corrected?result.file:null;show(result.file);toggle.hidden=!processed;toggle.textContent='Оригинал';status.textContent=result.corrected?'Документ выровнен':'Границы не подтверждены — снимок без обрезки';}
 cam.onclick=()=>camera.click();pick.onclick=()=>gallery.click();
 for(const x of [camera,gallery])x.onchange=()=>{void load(x.files[0]);x.value='';};
 toggle.onclick=()=>{show(chosen===original?processed:original);toggle.textContent=chosen===original?'Авто':'Оригинал';};
 back.onclick=()=>dialog.close();
 done.onclick=()=>{if(!chosen)return;try{if(onAttach(chosen)===false){status.textContent='Не удалось прикрепить документ.';return;}dialog.close();}catch{status.textContent='Не удалось прикрепить документ.';}};
 dialog.addEventListener('close',()=>{epoch++;if(url)URL.revokeObjectURL(url);dialog.remove();},{once:true});
 dialog.showModal();
}
root.SEYVEO_SCAN_AUTO=Object.freeze({detect,mapping,correct,process,capture});
})(typeof window==='object'?window:globalThis);
