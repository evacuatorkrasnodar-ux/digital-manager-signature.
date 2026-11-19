/* SEYVEO Paper · gentle local handwriting cleanup with an explicit preview.
   Coordinates alone change; strokes, pressure, color, text and photos remain owned
   by the original Notebook engine. The user approves every committed edit. */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 const sheet=document.getElementById('notePaperSheet');
 const menu=document.getElementById('notePaperSettingsMenu');
 const dock=document.getElementById('svPaperNewDock');
 const actions=menu?.querySelector('[data-sv-menu-panel="actions"]');
 const paper=window.SEYVEO_PAPER;
 if(!dialog||!sheet||!actions||!paper?.getEditableStrokes||!paper?.applyStrokeEdit||actions.querySelector('#notePaperSmoothInk'))return;
 const eligible=stroke=>['pen','pencil'].includes(stroke.tool)&&stroke.points?.length>=5;
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const round=n=>Math.round(n*10)/10;
 // A short-range, corner-aware low-pass filter. Preserve both endpoints,
 // pressure, tilt, ink color, gaps between strokes and recognisable corners.
 function smoothPoints(points){
  if(!Array.isArray(points)||points.length<5)return points.map(point=>point.slice());
  let current=points.map(point=>point.slice());
  for(const amount of [.5,.34]){
   const next=current.map(point=>point.slice());
   for(let i=2;i<current.length-2;i++){
    const a=current[i-1],b=current[i],c=current[i+1];
    const ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-b[0],vy=c[1]-b[1];
    const before=Math.hypot(ux,uy),after=Math.hypot(vx,vy);
    if(before<.35||after<.35||Math.max(before,after)>48)continue;
    const cosine=clamp((ux*vx+uy*vy)/(before*after),-1,1);
    // Wide deliberate turns have longer sides; short alternating wiggles
    // are the jitter to suppress, even if their angles look sharp.
    const corner=Math.max(before,after)>10?clamp((cosine+.5)/1.3,.12,1):1;
    const strength=amount*corner;
    const limit=clamp(Math.min(before,after)*.55,.7,4.5);
    const shiftX=clamp(((a[0]+c[0])/2-b[0])*strength,-limit,limit);
    const shiftY=clamp(((a[1]+c[1])/2-b[1])*strength,-limit,limit);
    next[i][0]=round(b[0]+shiftX);next[i][1]=round(b[1]+shiftY);
   }
   current=next;
  }
  return current;
 }

 // Recognise only a confidently closed, rounded loop. Fit its principal axes
 // so a slanted oval stays slanted; leave letters, hearts and sharp corners to
 // the gentle filter above. Never alter point count or pen-pressure samples.
 function fitOval(points){
  if(!Array.isArray(points)||points.length<18)return null;
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
  const size=Math.min(width,height);
  if(size<30||Math.max(width,height)>size*3)return null;
  if(Math.hypot(xs[0]-xs.at(-1),ys[0]-ys.at(-1))>Math.max(8,size*.15))return null;
  const n=points.length;
  const meanX=xs.reduce((sum,x)=>sum+x,0)/n,meanY=ys.reduce((sum,y)=>sum+y,0)/n;
  let xx=0,xy=0,yy=0;
  for(const p of points){
   const x=p[0]-meanX,y=p[1]-meanY;
   xx+=x*x;xy+=x*y;yy+=y*y;
  }
  const angle=Math.abs(xx-yy)+Math.abs(xy)*2<1e-4?0:Math.atan2(xy*2,xx-yy)/2;
  const ca=Math.cos(angle),sa=Math.sin(angle);
  const uv=points.map(p=>[p[0]*ca+p[1]*sa,-p[0]*sa+p[1]*ca]);
  const us=uv.map(p=>p[0]),vs=uv.map(p=>p[1]);
  const minU=Math.min(...us),maxU=Math.max(...us),minV=Math.min(...vs),maxV=Math.max(...vs);
  let ru=(maxU-minU)/2,rv=(maxV-minV)/2;
  if(Math.min(ru,rv)<15||Math.max(ru,rv)>Math.min(ru,rv)*3)return null;
  const cu=(maxU+minU)/2,cv=(maxV+minV)/2;
  // The farthest shaky point should not set the whole ellipse's radius.
  const radiusScale=uv.map(([u,v])=>Math.hypot((u-cu)/ru,(v-cv)/rv)).sort((a,b)=>a-b);
  const scale=clamp(radiusScale[Math.floor(n/2)],.83,1.08);
  ru*=scale;rv*=scale;
  const polar=uv.map(([u,v])=>{
   const a=(u-cu)/ru,b=(v-cv)/rv;
   return {theta:Math.atan2(b,a),radius:Math.hypot(a,b)};
  });
  const errors=polar.map(p=>Math.abs(p.radius-1));
  const meanError=errors.reduce((sum,e)=>sum+e,0)/n;
  const sorted=errors.slice().sort((a,b)=>a-b);
  if(meanError>.16||sorted[Math.floor(n*.9)]>.30||sorted.at(-1)>.45)return null;
  const angles=[polar[0].theta];let backwards=0,length=0;
  for(let i=1;i<n;i++){
   let delta=polar[i].theta-polar[i-1].theta;
   if(delta>Math.PI)delta-=Math.PI*2;
   else if(delta< -Math.PI)delta+=Math.PI*2;
   angles.push(angles.at(-1)+delta);
   length+=Math.hypot(xs[i]-xs[i-1],ys[i]-ys[i-1]);
  }
  const sweep=angles.at(-1)-angles[0],direction=Math.sign(sweep);
  if(Math.abs(sweep)<Math.PI*1.7||Math.abs(sweep)>Math.PI*2.3)return null;
  for(let i=1;i<n;i++)backwards+=Math.max(0,-(angles[i]-angles[i-1])*direction);
  const perimeter=Math.PI*2*Math.sqrt((ru*ru+rv*rv)/2);
  if(backwards>Math.PI*.24||length<perimeter*.75||length>perimeter*1.5)return null;
  // A square, heart cusp or an intentional handwritten corner must never
  // become a circle. Look across several samples to ignore fine hand jitter.
  const stride=Math.max(3,Math.floor(n/16));
  for(let i=stride;i<n-stride;i++){
   const a=points[i-stride],b=points[i],c=points[i+stride];
   const ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-b[0],vy=c[1]-b[1];
   const side=Math.hypot(ux,uy)*Math.hypot(vx,vy);
   if(side>12&&(ux*vx+uy*vy)/side<.30)return null;
  }
  const correction=(direction*Math.PI*2-sweep)/(n-1);
  const corrected=points.map((p,i)=>{
   const t=angles[i]+correction*i;
   const u=cu+ru*Math.cos(t),v=cv+rv*Math.sin(t);
   return [round(u*ca-v*sa),round(u*sa+v*ca),...p.slice(2)];
  });
  // The start and end meet, but retain the original ink's pressure and tilt.
  corrected[n-1][0]=corrected[0][0];corrected[n-1][1]=corrected[0][1];
  return corrected;
 }

 // A first handwritten Cyrillic letter: С. Its open right edge separates it
 // from the closed О. Only confidently rounded, one-stroke С-shapes qualify;
 // other letters keep their own character and use ordinary gentle smoothing.
 function fitLetterC(points){
  if(!Array.isArray(points)||points.length<18)return null;
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const width=maxX-minX,height=maxY-minY,size=Math.min(width,height);
  if(size<38||Math.max(width,height)>size*2.2)return null;
  const first=points[0],last=points.at(-1);
  const gap=Math.hypot(first[0]-last[0],first[1]-last[1]);
  if(gap<size*.24||gap>size*1.48)return null;
  // Both ends live on the right, one above and one below the centre.
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  if(Math.min(first[0],last[0])<minX+width*.54)return null;
  if(!((first[1]<cy-height*.12&&last[1]>cy+height*.12)
   ||(last[1]<cy-height*.12&&first[1]>cy+height*.12)))return null;
  let rx=width/2,ry=height/2;
  const median=points.map(p=>Math.hypot((p[0]-cx)/rx,(p[1]-cy)/ry)).sort((a,b)=>a-b);
  const scale=clamp(median[Math.floor(points.length/2)],.83,1.08);
  rx*=scale;ry*=scale;
  const polar=points.map(p=>{
   const u=(p[0]-cx)/rx,v=(p[1]-cy)/ry;
   return {angle:Math.atan2(v,u),radius:Math.hypot(u,v)};
  });
  const errors=polar.map(p=>Math.abs(p.radius-1)).sort((a,b)=>a-b);
  const meanError=errors.reduce((sum,e)=>sum+e,0)/errors.length;
  if(meanError>.31||errors[Math.floor(errors.length*.9)]>.62||errors.at(-1)>.90)return null;
  const angles=[polar[0].angle];let wrongWay=0;
  for(let i=1;i<points.length;i++){
   let delta=polar[i].angle-polar[i-1].angle;
   if(delta>Math.PI)delta-=Math.PI*2;
   else if(delta< -Math.PI)delta+=Math.PI*2;
   angles.push(angles.at(-1)+delta);
  }
  const sweep=angles.at(-1)-angles[0],direction=Math.sign(sweep);
  if(Math.abs(sweep)<Math.PI*1.12||Math.abs(sweep)>Math.PI*1.96)return null;
  for(let i=1;i<angles.length;i++)wrongWay+=Math.max(0,-(angles[i]-angles[i-1])*direction);
  if(wrongWay>Math.PI*.42)return null;
  const stride=Math.max(3,Math.floor(points.length/16));
  let sharpTurns=0;
  for(let i=stride;i<points.length-stride;i++){
   const a=points[i-stride],b=points[i],c=points[i+stride];
   const ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-b[0],vy=c[1]-b[1];
   const side=Math.hypot(ux,uy)*Math.hypot(vx,vy);
   if(side>12&&(ux*vx+uy*vy)/side<.08)sharpTurns++;
  }
  // Two deliberate corners describe a bracket, not С. Many small turns are
  // shaky handwriting; they can be offered as a reversible correction.
  if(sharpTurns&&sharpTurns<Math.max(5,points.length*.085))return null;
  if(meanError>.14||wrongWay>Math.PI*.20){
   // A severely wobbly С should not inherit a generic typeface or an
   // outlier-sized ellipse. Use a stronger local curve filter that preserves
   // the user's overall C and fixes shaky short-range turns.
   const weights=[1,2,3,4,5,4,3,2,1];
   let current=points.map(p=>p.slice());
   for(let pass=0;pass<2;pass++){
    const next=current.map(p=>p.slice());
    for(let i=4;i<points.length-4;i++){
     let x=0,y=0;
     for(let k=-4;k<=4;k++){
      x+=current[i+k][0]*weights[k+4];y+=current[i+k][1]*weights[k+4];
     }
     const strength=.92*Math.sin(Math.PI*i/(points.length-1))**.55;
     next[i][0]=round(current[i][0]+(x/25-current[i][0])*strength);
     next[i][1]=round(current[i][1]+(y/25-current[i][1])*strength);
    }
    current=next;
   }
   return current;
  }
  // Smooth the radius of a С along the path. This retains an individual's
  // rounded / narrow handwriting style instead of forcing a generic font.
  const weights=[1,2,3,4,3,2,1];
  const corrected=points.map((p,i)=>{
   if(i<3||i>=points.length-3)return p.slice();
   let radius=0;
   for(let k=-3;k<=3;k++)radius+=polar[i+k].radius*weights[k+3];
   radius/=16;
   const weight=.92*Math.sin(Math.PI*i/(points.length-1))**.6;
   const next=polar[i].radius+(radius-polar[i].radius)*weight;
   const t=angles[i];
   return [round(cx+rx*next*Math.cos(t)),round(cy+ry*next*Math.sin(t)),...p.slice(2)];
  });
  return smoothPoints(corrected);
 }

 // Equal-distance samples let a heart be drawn quickly or slowly without
 // changing the recognised outline. This stays entirely on the device.
 const HEART_SAMPLES=96;
 function resampleClosed(points,count){
  const loop=points.map(p=>p.slice(0,2));
  if(Math.hypot(loop[0][0]-loop.at(-1)[0],loop[0][1]-loop.at(-1)[1])>.01)loop.push(loop[0]);
  const lengths=[0];
  for(let i=1;i<loop.length;i++)lengths.push(lengths.at(-1)+Math.hypot(loop[i][0]-loop[i-1][0],loop[i][1]-loop[i-1][1]));
  const total=lengths.at(-1);if(total<1)return null;
  let k=1;
  return Array.from({length:count},(_,i)=>{
   const distance=total*i/count;
   while(k<lengths.length-1&&lengths[k]<distance)k++;
   const part=(distance-lengths[k-1])/Math.max(.0001,lengths[k]-lengths[k-1]);
   return [loop[k-1][0]+(loop[k][0]-loop[k-1][0])*part,loop[k-1][1]+(loop[k][1]-loop[k-1][1])*part];
  });
 }
 const heartDraft=Array.from({length:257},(_,i)=>{
  const t=Math.PI*2*i/256;
  return [16*Math.sin(t)**3,-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))];
 });
 const HEART_TEMPLATE=resampleClosed(heartDraft,HEART_SAMPLES);
 const meanOf=points=>points.reduce((sum,p)=>[sum[0]+p[0],sum[1]+p[1]],[0,0]).map(n=>n/points.length);
 const heartMean=meanOf(HEART_TEMPLATE);
 const heartSize=HEART_TEMPLATE.reduce((sum,p)=>sum+(p[0]-heartMean[0])**2+(p[1]-heartMean[1])**2,0);
 const wrap=(i,count)=>(i%count+count)%count;
 function heartAt(index){
  const whole=Math.floor(index),mix=index-whole;
  const a=HEART_TEMPLATE[wrap(whole,HEART_SAMPLES)],b=HEART_TEMPLATE[wrap(whole+1,HEART_SAMPLES)];
  return [a[0]+(b[0]-a[0])*mix-heartMean[0],a[1]+(b[1]-a[1])*mix-heartMean[1]];
 }
 function fitHeart(points){
  const n=points?.length;if(n<24)return null;
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
  const size=Math.min(width,height);
  if(size<42||Math.max(width,height)>size*1.9)return null;
  if(Math.hypot(xs[0]-xs.at(-1),ys[0]-ys.at(-1))>Math.max(9,size*.17))return null;
  const sampled=resampleClosed(points,HEART_SAMPLES);if(!sampled)return null;
  const [cx,cy]=meanOf(sampled);
  let best=null;
  for(const direction of [1,-1])for(let phase=0;phase<HEART_SAMPLES;phase++){
   let dot=0,cross=0;
   for(let i=0;i<HEART_SAMPLES;i++){
    const t=HEART_TEMPLATE[wrap(phase+direction*i,HEART_SAMPLES)];
    const tx=t[0]-heartMean[0],ty=t[1]-heartMean[1];
    const sx=sampled[i][0]-cx,sy=sampled[i][1]-cy;
    dot+=tx*sx+ty*sy;cross+=tx*sy-ty*sx;
   }
   const a=dot/heartSize,b=cross/heartSize;
   let error=0;
   for(let i=0;i<HEART_SAMPLES;i++){
    const t=HEART_TEMPLATE[wrap(phase+direction*i,HEART_SAMPLES)];
    const tx=t[0]-heartMean[0],ty=t[1]-heartMean[1];
    error+=(a*tx-b*ty-(sampled[i][0]-cx))**2+(b*tx+a*ty-(sampled[i][1]-cy))**2;
   }
   if(!best||error<best.error)best={direction,phase,a,b,error};
  }
  if(!best||Math.sqrt(best.error/HEART_SAMPLES)/size>.078)return null;
  // Project each original point onto the fitted heart, rather than guessing
  // its speed along the line. A shaky finger draws at irregular speed.
  const outline=Array.from({length:HEART_SAMPLES},(_,i)=>{
   const t=heartAt(i);
   return [cx+best.a*t[0]-best.b*t[1],cy+best.b*t[0]+best.a*t[1]];
  });
  const corrected=points.map((p,i)=>{
   let nearest=null,nearDistance=Infinity;
   for(let j=0;j<outline.length;j++){
    const a=outline[j],b=outline[(j+1)%outline.length];
    const dx=b[0]-a[0],dy=b[1]-a[1];
    const t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/Math.max(.001,dx*dx+dy*dy),0,1);
    const x=a[0]+t*dx,y=a[1]+t*dy;
    const d=(p[0]-x)**2+(p[1]-y)**2;
    if(d<nearDistance){nearest=[x,y];nearDistance=d}
   }
   return [round(nearest[0]),round(nearest[1]),...p.slice(2)];
  });
  corrected[n-1][0]=corrected[0][0];corrected[n-1][1]=corrected[0][1];
  return corrected;
 }

 // A nearly straight stroke is often one leg of a handwritten letter.
 // Preserve its endpoints and pressure, and only remove small sideways wobble.
 function fitStraight(points){
  if(!Array.isArray(points)||points.length<8)return null;
  const first=points[0],last=points.at(-1);
  const dx=last[0]-first[0],dy=last[1]-first[1],length=Math.hypot(dx,dy);
  if(length<38)return null;
  let travelled=0,largest=0,deviation=0,backwards=0,prior=0;
  const along=[];
  for(let i=0;i<points.length;i++){
   const p=points[i],x=p[0]-first[0],y=p[1]-first[1];
   const t=(x*dx+y*dy)/(length*length);
   along.push(t);
   const side=Math.abs(x*dy-y*dx)/length;
   largest=Math.max(largest,side);deviation+=side;
   if(i){travelled+=Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1]);backwards+=Math.max(0,(prior-t)*length)}
   prior=t;
  }
  if(travelled>length*1.23||backwards>length*.06||largest>Math.min(9,Math.max(3.5,length*.06))||deviation/points.length<.65)return null;
  return points.map((p,i)=>{
   if(i===0||i===points.length-1)return p.slice();
   const t=clamp(along[i],0,1);
   return [round(first[0]+t*dx),round(first[1]+t*dy),...p.slice(2)];
  });
 }

 const action=document.createElement('button');
 action.type='button';action.id='notePaperSmoothInk';action.className='sv-newdock-menu-action';
 action.setAttribute('aria-label','Сэйви: сделать рисунок и почерк аккуратнее');
 action.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 15.5c3.5-5.6 5.2-5.6 8.1-1.6s5.3 3.9 8.9-2.1"/><path d="M4 20h16M16.5 6.5l1-3 1 3 3 1-3 1-1 3-1-3-3-1z"/></svg><span>Сделать аккуратнее</span>';
 actions.insertBefore(action,actions.querySelector('#notePaperAddPhoto'));

 const layer=document.createElement('div');layer.className='sv-paper-smooth-layer';layer.hidden=true;
 layer.setAttribute('aria-label','Предпросмотр аккуратного почерка');
 const bar=document.createElement('div');bar.className='sv-paper-smooth-bar';
 bar.setAttribute('role','group');bar.setAttribute('aria-label','До и после сглаживания');
 const before=document.createElement('button');before.type='button';before.textContent='До';
 before.setAttribute('aria-label','Посмотреть исходный почерк');
 const after=document.createElement('button');after.type='button';after.textContent='После';
 after.setAttribute('aria-label','Посмотреть аккуратный почерк');
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Отмена';
 cancel.setAttribute('aria-label','Не менять исходный почерк');
 const apply=document.createElement('button');apply.type='button';apply.textContent='Применить';
 apply.className='sv-paper-smooth-apply';
 apply.setAttribute('aria-label','Применить аккуратный почерк с возможностью отмены');
 bar.append(before,after,cancel,apply);layer.append(bar);sheet.append(layer);
 let active=false,original=null,proposal=null,showAfter=true;
 function positionBar(){
  const top=sheet.getBoundingClientRect().top;
  const bottom=dock?.getBoundingClientRect().bottom||top+60;
  bar.style.top=Math.max(74,Math.ceil(bottom-top+14))+'px';
 }
 function compare(next){
  showAfter=next;
  before.setAttribute('aria-pressed',String(!next));
  after.setAttribute('aria-pressed',String(next));
  paper.previewStrokeEdit(next?proposal:original);
 }
 function stop(commit=false,restore=true){
  if(!active)return;
  active=false;layer.hidden=true;
  dialog.classList.remove('sv-paper-smooth-mode');
  action.setAttribute('aria-pressed','false');
  if(commit){
   if(!paper.applyStrokeEdit(proposal)&&restore)paper.previewStrokeEdit(original);
  }else if(restore)paper.previewStrokeEdit(original);
  original=null;proposal=null;
 }
 function start(){
  if(active){stop();return}
  if(dialog.classList.contains('sv-paper-text-mode'))document.getElementById('notePaperTextAction')?.click();
  if(dialog.classList.contains('sv-paper-photo-mode'))document.getElementById('notePaperEditPhoto')?.click();
  paper.cancelActiveStroke?.();
  original=paper.getEditableStrokes([]);
  const indices=original.flatMap((stroke,index)=>eligible(stroke)?[index]:[]);
  if(!indices.length){original=null;paper.announce?.('Сначала напиши или нарисуй что-нибудь ручкой.');return}
  proposal=paper.getEditableStrokes(indices);
  let changed=0;
  for(const index of indices){
   const stroke=proposal[index],next=fitHeart(stroke.points)||fitOval(stroke.points)||fitLetterC(stroke.points)||fitStraight(stroke.points)||smoothPoints(stroke.points);
   for(let i=0;i<next.length;i++)if(Math.hypot(next[i][0]-stroke.points[i][0],next[i][1]-stroke.points[i][1])>.1)changed++;
   stroke.points=next;
  }
  if(!changed){original=null;proposal=null;paper.announce?.('Штрихи уже ровные — исправлять нечего.');return}
  active=true;layer.hidden=false;
  dialog.classList.add('sv-paper-smooth-mode');action.setAttribute('aria-pressed','true');
  positionBar();compare(true);
 }
 action.addEventListener('click',()=>{
  menu.hidden=true;document.getElementById('notePaperSettings')?.setAttribute('aria-expanded','false');
  start();
 });
 before.addEventListener('click',()=>compare(false));
 after.addEventListener('click',()=>compare(true));
 cancel.addEventListener('click',()=>stop(false));
 apply.addEventListener('click',()=>stop(true));
 dialog.addEventListener('click',event=>{
  if(active&&event.target.closest('#svPaperNewDock [data-paper-tool],#notePaperSave,#notePaperBack,#notePaperSayvi'))stop(false);
 },{capture:true});
 dialog.addEventListener('sv-paper-render',()=>{
  // Undo or another external edit wins; never apply a stale proposal.
  if(active)stop(false,false);
 });
 dialog.addEventListener('close',()=>stop(false,false));
 window.addEventListener('resize',()=>{if(active)positionBar()});
 document.addEventListener('keydown',event=>{
  if(active&&event.key==='Escape'){event.preventDefault();stop(false)}
 });
})();
