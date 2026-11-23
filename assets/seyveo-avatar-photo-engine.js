/* SEYVEO avatar photo studio. All processing remains on this device. */
(function(){
 'use strict';
 const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
 const sizeOf=img=>({w:img.naturalWidth||img.width||0,h:img.naturalHeight||img.height||0});
 const center=()=>({cx:.5,cy:.5,zoom:1});
 function normalized(img,raw){
  const {w,h}=sizeOf(img),min=Math.min(w,h);
  if(!min)return center();
  const zoom=clamp(Number(raw?.zoom)||1,1,3.5);
  const rx=min/(2*w*zoom),ry=min/(2*h*zoom);
  return {cx:clamp(Number.isFinite(raw?.cx)?raw.cx:.5,rx,1-rx),
   cy:clamp(Number.isFinite(raw?.cy)?raw.cy:.5,ry,1-ry),zoom};
 }
 function cropPixels(img,raw){
  const {w,h}=sizeOf(img),c=normalized(img,raw);
  const side=Math.min(w,h)/c.zoom;
  return {x:c.cx*w-side/2,y:c.cy*h-side/2,side,crop:c};
 }
 async function suggest(img){
  const fallback={...center(),detected:false};
  const {w,h}=sizeOf(img);
  if(!w||!h||typeof window.FaceDetector!=='function')return fallback;
  try{
   const detector=new window.FaceDetector({fastMode:true,maxDetectedFaces:5});
   const faces=await detector.detect(img);
   const face=faces?.filter(x=>x.boundingBox?.width>0&&x.boundingBox?.height>0)
    .sort((a,b)=>b.boundingBox.width*b.boundingBox.height-a.boundingBox.width*a.boundingBox.height)[0];
   if(!face)return fallback;
   const box=face.boundingBox;
   const side=Math.min(w,h);
   // Room below the face for hair, neck and shoulders.
   const cropSide=clamp(Math.max(box.width*2.25,box.height*2.45),side*.48,side);
   const raw={cx:(box.x+box.width/2)/w,cy:(box.y+box.height*.67)/h,zoom:side/cropSide};
   return {...normalized(img,raw),detected:true};
  }catch{return fallback}
 }
 function measureLight(img,raw){
  const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)return {brightness:1.04,contrast:1.035};
  try{
   const {x,y,side}=cropPixels(img,raw);
   ctx.drawImage(img,x,y,side,side,0,0,32,32);
   const px=ctx.getImageData(0,0,32,32).data;
   let sum=0,sumsq=0,count=0;
   for(let i=0;i<px.length;i+=16){
    const lum=.2126*px[i]+.7152*px[i+1]+.0722*px[i+2];
    sum+=lum;sumsq+=lum*lum;count++;
   }
   const avg=sum/count,spread=Math.sqrt(Math.max(0,sumsq/count-avg*avg));
   return {
    brightness:clamp(130/Math.max(avg,36),.96,1.14),
    contrast:clamp(52/Math.max(spread,20),.97,1.1)
   };
  }catch{return {brightness:1.04,contrast:1.035}}
 }
 function draw(img,raw,mode,canvas){
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Canvas unavailable');
  const {x,y,side}=cropPixels(img,raw),n=canvas.width;
  const light=mode==='original'?{brightness:1,contrast:1}:measureLight(img,raw);
  let brightness=light.brightness,contrast=light.contrast;
  if(mode==='portrait'){brightness=clamp(brightness*1.01,.97,1.13);contrast=clamp(contrast*.985,.95,1.06)}
  ctx.clearRect(0,0,n,n);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const saturation=mode==='original'?1:mode==='portrait'?1.045:1.085;
  ctx.filter='brightness('+brightness.toFixed(3)+') contrast('+contrast.toFixed(3)+') saturate('+saturation.toFixed(3)+')';
  ctx.drawImage(img,x,y,side,side,0,0,n,n);
  ctx.filter='none';
  if(mode==='portrait'){ctx.fillStyle='rgba(255,221,194,.027)';ctx.fillRect(0,0,n,n)}
  return canvas;
 }
 function exportImage(img,raw,mode){
  const canvas=document.createElement('canvas');
  for(const [size,quality] of [[320,.86],[320,.77],[256,.8],[256,.7]]){
   canvas.width=size;canvas.height=size;draw(img,raw,mode,canvas);
   const data=canvas.toDataURL('image/jpeg',quality);
   // Match existing avatar validation and localStorage limits.
   if(data.length<310000)return data;
  }
  throw new Error('Photo too large to store');
 }
 function bindPan(target,get,set,img){
  let pointer=null;
  function down(e){
   if(e.button!=null&&e.button!==0)return;
   pointer={id:e.pointerId,x:e.clientX,y:e.clientY,crop:{...get()}};
   target.setPointerCapture?.(e.pointerId);
   e.preventDefault();
  }
  function move(e){
   if(!pointer||e.pointerId!==pointer.id)return;
   const rect=target.getBoundingClientRect();
   if(!rect.width)return;
   const {w,h}=sizeOf(img),side=Math.min(w,h)/Math.max(1,pointer.crop.zoom);
   const dx=(e.clientX-pointer.x)/rect.width,dy=(e.clientY-pointer.y)/rect.height;
   set(normalized(img,{...pointer.crop,
    cx:pointer.crop.cx-dx*side/w,
    cy:pointer.crop.cy-dy*side/h}));
   e.preventDefault();
  }
  function up(e){if(pointer&&e.pointerId===pointer.id)pointer=null}
  target.addEventListener('pointerdown',down);
  target.addEventListener('pointermove',move);
  target.addEventListener('pointerup',up);
  target.addEventListener('pointercancel',up);
  return ()=>{target.removeEventListener('pointerdown',down);
   target.removeEventListener('pointermove',move);
   target.removeEventListener('pointerup',up);
   target.removeEventListener('pointercancel',up)};
 }
 window.SEYVEO_AVATAR_STUDIO=Object.freeze({center,normalized,suggest,draw,exportImage,bindPan});
})();