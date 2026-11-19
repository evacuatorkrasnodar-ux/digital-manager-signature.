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

 // Shape-independent cleanup for angular sketches: recognize *corners*, not
 // named objects. The same routine handles roofs, arrows, stars, diagrams,
 // folded lines and future drawings without adding a template for each one.
 // Only confidently angular ink qualifies; natural curves stay with the
 // lighter smoother. Pen pressure and tilt remain attached to every sample.
 function fitAngularContour(points){
  const n=points?.length;if(n<12)return null;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const p of points){
   minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);
   minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);
  }
  const diagonal=Math.hypot(maxX-minX,maxY-minY),tolerance=clamp(diagonal*.032,4,10);
  if(diagonal<65||Math.min(maxX-minX,maxY-minY)<24)return null;
  const anchors=[0,n-1],pending=[[0,n-1]];
  while(pending.length){
   const [begin,end]=pending.pop();if(end-begin<3)continue;
   const a=points[begin],b=points[end],dx=b[0]-a[0],dy=b[1]-a[1];
   const len2=Math.max(.0001,dx*dx+dy*dy);
   let largest=0,chosen=-1;
   for(let i=begin+1;i<end;i++){
    const projection=clamp(((points[i][0]-a[0])*dx+(points[i][1]-a[1])*dy)/len2,0,1);
    const distance=Math.hypot(points[i][0]-a[0]-projection*dx,points[i][1]-a[1]-projection*dy);
    if(distance>largest){largest=distance;chosen=i}
   }
   if(largest>tolerance&&chosen>begin&&chosen<end){
    anchors.push(chosen);
    if(anchors.length>12)return null;
    pending.push([begin,chosen],[chosen,end]);
   }
  }
  anchors.sort((a,b)=>a-b);
  if(anchors.length<3)return null;
  let longEdges=0,sharpCorners=0;
  for(let i=1;i<anchors.length;i++){
   const a=points[anchors[i-1]],b=points[anchors[i]];
   const chord=Math.hypot(b[0]-a[0],b[1]-a[1]);
   if(chord<tolerance*2.1)return null;
   if(chord>diagonal*.18)longEdges++;
   let length=0;
   for(let k=anchors[i-1]+1;k<=anchors[i];k++)
    length+=Math.hypot(points[k][0]-points[k-1][0],points[k][1]-points[k-1][1]);
   if(length>chord*1.45)return null;
  }
  if(longEdges<2)return null;
  for(let i=1;i<anchors.length-1;i++){
   const a=points[anchors[i-1]],b=points[anchors[i]],c=points[anchors[i+1]];
   const ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-b[0],vy=c[1]-b[1];
   const cosine=clamp((ux*vx+uy*vy)/(Math.hypot(ux,uy)*Math.hypot(vx,vy)),-1,1);
   if(cosine<.42)sharpCorners++; // deliberate turn > ~65 degrees
  }
  const closed=Math.hypot(points[0][0]-points.at(-1)[0],points[0][1]-points.at(-1)[1])<tolerance*2;
  if(sharpCorners<(closed?2:1))return null;
  const corrected=points.map(p=>p.slice());
  let moved=0;
  for(let i=1;i<anchors.length;i++){
   const begin=anchors[i-1],end=anchors[i],a=points[begin],b=points[end];
   const distances=[0];
   for(let k=begin+1;k<=end;k++)distances.push(distances.at(-1)
    +Math.hypot(points[k][0]-points[k-1][0],points[k][1]-points[k-1][1]));
   const total=Math.max(.001,distances.at(-1));
   for(let k=begin+1;k<end;k++){
    const t=distances[k-begin]/total,x=round(a[0]+(b[0]-a[0])*t),y=round(a[1]+(b[1]-a[1])*t);
    moved=Math.max(moved,Math.hypot(points[k][0]-x,points[k][1]-y));
    corrected[k][0]=x;corrected[k][1]=y;
   }
  }
  return moved>.6?corrected:null;
 }

 // When a scribble is too ambiguous to recognise, its author can tell Sayvi
 // what they intended. Redraw only that last ink stroke, with the same ink and
 // pressure samples; the whole operation is still previewed and Undo-able.
 function redrawAs(points,shape){
  if(!Array.isArray(points)||points.length<5||!['c','o','heart'].includes(shape))return null;
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const width=maxX-minX,height=maxY-minY,extent=Math.max(width,height);
  if(extent<28)return null;
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  const rx=Math.max(17,width/2),ry=Math.max(17,height/2);
  const count=Math.min(350,Math.max(65,points.length));
  return Array.from({length:count},(_,i)=>{
   const fraction=i/(count-1),t=Math.PI*2*fraction;
   let x,y;
   if(shape==='c'){
    const arc=-.72-(Math.PI*2-1.44)*fraction;
    const r=Math.max(20,width/1.77);
    x=minX+r+r*Math.cos(arc);y=cy+ry*Math.sin(arc);
   }else if(shape==='o'){
    x=cx+rx*Math.cos(t);y=cy+ry*Math.sin(t);
   }else{
    const hx=16*Math.sin(t)**3;
    const hy=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));
    x=cx+hx*Math.max(1,width/32);
    y=cy+(hy-2.5)*Math.max(1,height/30);
   }
   const pressure=points[Math.round(fraction*(points.length-1))].slice(2);
   return [round(x),round(y),...pressure];
  });
 }

 // A suggestion, never an automatic replacement. Loose geometry here can
 // recognise a shaky open С or a hand-drawn О that the strict fitters rightly
 // refuse to reshape without the author's confirmation.
 function guessIntent(points,heartChecked=false){
  if(!Array.isArray(points)||points.length<18)return null;
  if(!heartChecked&&fitHeart(points))return 'heart';
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const width=maxX-minX,height=maxY-minY,size=Math.min(width,height);
  if(size<36||Math.max(width,height)>size*2.35)return null;
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2,rx=width/2,ry=height/2;
  const first=points[0],last=points.at(-1);
  const gap=Math.hypot(first[0]-last[0],first[1]-last[1]);
  const polar=points.map(p=>{
   const u=(p[0]-cx)/rx,v=(p[1]-cy)/ry;
   return {angle:Math.atan2(v,u),radius:Math.hypot(u,v)};
  });
  let sweep=0,backwards=0;
  const deltas=[];
  for(let i=1;i<polar.length;i++){
   let delta=polar[i].angle-polar[i-1].angle;
   if(delta>Math.PI)delta-=Math.PI*2;
   if(delta< -Math.PI)delta+=Math.PI*2;
   deltas.push(delta);sweep+=delta;
  }
  const direction=Math.sign(sweep);
  for(const delta of deltas)backwards+=Math.max(0,-direction*delta);
  const radiusError=polar.reduce((sum,p)=>sum+Math.abs(p.radius-1),0)/polar.length;
  // Require a nearly complete, consistently traversed loop. A straight line,
  // a U, overlapping scribbles or disconnected fragments have no suggestion.
  if(gap<=Math.max(12,size*.27)&&Math.abs(sweep)>Math.PI*1.66
   &&Math.abs(sweep)<Math.PI*2.34&&backwards<Math.PI*.51&&radiusError<.32){
   // The pointed bottom and indented top of a heart are intentional, not О.
   const nearTop=points.filter(p=>p[1]<minY+height*.15);
   const topSpread=nearTop.length>1?(Math.max(...nearTop.map(p=>p[0]))-Math.min(...nearTop.map(p=>p[0])))/width:0;
   // Hearts and rectangular frames occupy much more of their top edge than
   // the narrow rounded crown of an О. Withhold the guess for those shapes.
   if(topSpread<.72)return 'o';
  }
  const endsRight=Math.min(first[0],last[0])>minX+width*.48;
  const endsOpposite=(first[1]<cy-height*.10&&last[1]>cy+height*.10)
   ||(last[1]<cy-height*.10&&first[1]>cy+height*.10);
  if(gap>size*.24&&gap<size*1.6&&endsRight&&endsOpposite
   &&Math.abs(sweep)>Math.PI*1.13&&Math.abs(sweep)<Math.PI*2.15
   &&backwards<Math.PI*.63&&radiusError<.43)return 'c';
  return null;
 }

 // A small complete sketch, not a single glyph: recognise a house outlined
 // with five separate strokes (two roof edges, two walls and the floor).
 // Match shared endpoints before guessing the meaning; this deliberately
 // refuses incomplete roofs, random lines, letters and open polygons.
 function fitHouse(strokes){
  if(!Array.isArray(strokes)||strokes.length!==5||strokes.some(s=>
   !['pen','pencil'].includes(s?.tool)||s.points?.length<5))return null;
  const ends=[],lengths=[];
  for(let index=0;index<strokes.length;index++){
   const points=strokes[index].points;
   const first=points[0],last=points.at(-1);
   const direct=Math.hypot(last[0]-first[0],last[1]-first[1]);
   let travelled=0;
   for(let i=1;i<points.length;i++)travelled+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
   if(direct<32||travelled>direct*1.55)return null;
   lengths.push(direct);
   ends.push({index,side:0,point:first},{index,side:1,point:last});
  }
  const xx=ends.map(p=>p.point[0]),yy=ends.map(p=>p.point[1]);
  const width=Math.max(...xx)-Math.min(...xx),height=Math.max(...yy)-Math.min(...yy);
  if(width<75||height<75||width/height<.55||width/height>2.1)return null;
  const tolerance=Math.min(23,Math.max(9,Math.min(width,height)*.13));
  const pairs=[],used=new Set(),matches=[];
  for(let i=0;i<ends.length;i++)for(let j=i+1;j<ends.length;j++){
   if(ends[i].index===ends[j].index)continue;
   const distance=Math.hypot(ends[i].point[0]-ends[j].point[0],ends[i].point[1]-ends[j].point[1]);
   if(distance<=tolerance)matches.push({i,j,distance});
  }
  matches.sort((a,b)=>a.distance-b.distance);
  for(const pair of matches){
   if(used.has(pair.i)||used.has(pair.j))continue;
   used.add(pair.i);used.add(pair.j);pairs.push(pair);
  }
  if(pairs.length!==5||used.size!==10)return null;
  const vertices=pairs.map(pair=>({
   x:(ends[pair.i].point[0]+ends[pair.j].point[0])/2,
   y:(ends[pair.i].point[1]+ends[pair.j].point[1])/2
  }));
  const vertexOf=new Map();
  pairs.forEach((pair,i)=>{vertexOf.set(pair.i,i);vertexOf.set(pair.j,i)});
  const edges=strokes.map((_,index)=>{
   const first=vertexOf.get(index*2),last=vertexOf.get(index*2+1);
   return first===last?null:[first,last];
  });
  if(edges.some(edge=>!edge))return null;
  const sorted=vertices.map((v,i)=>({...v,i})).sort((a,b)=>a.y-b.y);
  const apex=sorted[0],eaves=sorted.slice(1,3).sort((a,b)=>a.x-b.x),
   bases=sorted.slice(3).sort((a,b)=>a.x-b.x);
  const [leftEave,rightEave]=eaves,[leftBase,rightBase]=bases;
  const roofY=(leftEave.y+rightEave.y)/2,baseY=(leftBase.y+rightBase.y)/2;
  const leftX=(leftEave.x+leftBase.x)/2,rightX=(rightEave.x+rightBase.x)/2;
  const breadth=rightX-leftX;
  if(breadth<width*.64||Math.abs(apex.x-(leftX+rightX)/2)>breadth*.28
   ||roofY-apex.y<height*.19||baseY-roofY<height*.34
   ||Math.abs(leftEave.y-rightEave.y)>height*.17
   ||Math.abs(leftBase.y-rightBase.y)>height*.17
   ||Math.abs(leftEave.x-leftBase.x)>width*.19
   ||Math.abs(rightEave.x-rightBase.x)>width*.19)return null;
  const expected=[[apex.i,leftEave.i],[apex.i,rightEave.i],
   [leftEave.i,leftBase.i],[rightEave.i,rightBase.i],[leftBase.i,rightBase.i]];
  if(!expected.every(([a,b])=>edges.some(edge=>(edge[0]===a&&edge[1]===b)||(edge[0]===b&&edge[1]===a))))return null;
  const verticesNew=new Map([
   [apex.i,[(leftX+rightX)/2,apex.y]],
   [leftEave.i,[leftX,roofY]],[rightEave.i,[rightX,roofY]],
   [leftBase.i,[leftX,baseY]],[rightBase.i,[rightX,baseY]]
  ]);
  const corrected=strokes.map((stroke,index)=>{
   const [from,to]=edges[index],start=verticesNew.get(from),end=verticesNew.get(to);
   const points=stroke.points,total=points.reduce((sum,p,i)=>i
    ?sum+Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1]):sum,0);
   let travelled=0;
   return {...stroke,points:points.map((p,i)=>{
    if(i)travelled+=Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1]);
    const t=clamp(travelled/Math.max(1,total),0,1);
    return [round(start[0]+(end[0]-start[0])*t),round(start[1]+(end[1]-start[1])*t),...p.slice(2)];
   })};
  });
  return corrected;
 }

 // The roof is commonly a single zigzag, drawn without lifting the pen.
 // The other three strokes are the two walls and the floor. Require a clear
 // central peak and matching corners so ordinary handwriting stays untouched.
 function fitHouseRoofV(strokes){
  if(!Array.isArray(strokes)||strokes.length!==4||strokes.some(s=>
   !['pen','pencil'].includes(s?.tool)||s.points?.length<5))return null;
  const endpoints=strokes.map(stroke=>{
   const a=stroke.points[0],b=stroke.points.at(-1);
   return {a,b,dx:b[0]-a[0],dy:b[1]-a[1]};
  });
  const roofs=[];
  for(let i=0;i<4;i++){
   const stroke=strokes[i],ends=endpoints[i],points=stroke.points;
   const width=Math.abs(ends.dx);
   if(width<75||points.length<11||Math.abs(ends.dy)>width*.22)continue;
   const apexIndex=points.reduce((best,p,index)=>p[1]<points[best][1]?index:best,0);
   if(apexIndex<5||apexIndex>points.length-6)continue;
   const apex=points[apexIndex];
   if(Math.min(ends.a[1],ends.b[1])-apex[1]<width*.23)continue;
   const side=Math.min(ends.a[0],ends.b[0]);
   if(apex[0]<side+width*.30||apex[0]>side+width*.70)continue;
   const nearLeft=points[Math.max(0,apexIndex-Math.max(3,Math.round(apexIndex*.28)))];
   const nearRight=points[Math.min(points.length-1,apexIndex+Math.max(3,Math.round((points.length-1-apexIndex)*.28)))];
   const cornered=[{near:nearLeft,far:ends.a},{near:nearRight,far:ends.b}].every(({near,far})=>{
    const expected=Math.abs(far[1]-apex[1])*Math.abs(near[0]-apex[0])
     /Math.max(1,Math.abs(far[0]-apex[0]));
    return Math.abs(near[1]-apex[1])>=expected*.49;
   });
   if(!cornered)continue;
   let error=0,largest=0,backwards=0;
   const direction=Math.sign(ends.dx);
   for(let j=0;j<points.length;j++){
    const first=j<=apexIndex?ends.a:apex,last=j<=apexIndex?apex:ends.b;
    const d=Math.hypot(last[0]-first[0],last[1]-first[1]);
    const offset=Math.abs((points[j][0]-first[0])*(last[1]-first[1])
     -(points[j][1]-first[1])*(last[0]-first[0]))/Math.max(1,d);
    error+=offset;largest=Math.max(largest,offset);
    if(j)backwards+=Math.max(0,-direction*(points[j][0]-points[j-1][0]));
   }
   if(error/points.length>Math.max(8,width*.07)
    ||largest>Math.max(17,width*.14)||backwards>width*.13)continue;
   roofs.push({index:i,apexIndex,apex});
  }
  if(roofs.length!==1)return null;
  const roof=roofs[0],roofEnds=endpoints[roof.index];
  const eaves=[roofEnds.a,roofEnds.b].sort((a,b)=>a[0]-b[0]);
  const walls=[],floors=[];
  for(let i=0;i<4;i++){
   if(i===roof.index)continue;
   const edge=endpoints[i],dx=Math.abs(edge.dx),dy=Math.abs(edge.dy);
   if(dx>dy*1.8)floors.push(i);
   else if(dy>dx*2)walls.push(i);
  }
  if(floors.length!==1||walls.length!==2)return null;
  walls.sort((a,b)=>Math.min(endpoints[a].a[0],endpoints[a].b[0])
   -Math.min(endpoints[b].a[0],endpoints[b].b[0]));
  const top=walls.map(index=>[endpoints[index].a,endpoints[index].b].sort((a,b)=>a[1]-b[1])[0]);
  const bottom=walls.map(index=>[endpoints[index].a,endpoints[index].b].sort((a,b)=>b[1]-a[1])[0]);
  const floorEnds=[endpoints[floors[0]].a,endpoints[floors[0]].b].sort((a,b)=>a[0]-b[0]);
  const width=eaves[1][0]-eaves[0][0];
  const roofY=(eaves[0][1]+eaves[1][1]+top[0][1]+top[1][1])/4;
  const baseY=(bottom[0][1]+bottom[1][1]+floorEnds[0][1]+floorEnds[1][1])/4;
  const apexY=roof.apex[1],height=baseY-apexY;
  const tolerance=Math.min(25,Math.max(12,width*.12));
  if(height<75||width/height<.55||width/height>2.1
   ||roofY-apexY<height*.19||baseY-roofY<height*.34
   ||Math.abs(top[0][1]-top[1][1])>height*.17
   ||Math.abs(bottom[0][1]-bottom[1][1])>height*.17)return null;
  for(let j=0;j<2;j++){
   if(Math.hypot(eaves[j][0]-top[j][0],eaves[j][1]-top[j][1])>tolerance
    ||Math.hypot(bottom[j][0]-floorEnds[j][0],bottom[j][1]-floorEnds[j][1])>tolerance)return null;
  }
  const leftX=(eaves[0][0]+top[0][0]+bottom[0][0]+floorEnds[0][0])/4;
  const rightX=(eaves[1][0]+top[1][0]+bottom[1][0]+floorEnds[1][0])/4;
  const target=[[[leftX,roofY],[leftX,baseY]],[[rightX,roofY],[rightX,baseY]]];
  const corrected=strokes.map(stroke=>({...stroke,points:stroke.points.map(p=>p.slice())}));
  function straighten(index,start,end){
   const points=strokes[index].points,distances=[0];
   for(let j=1;j<points.length;j++)distances.push(distances.at(-1)
    +Math.hypot(points[j][0]-points[j-1][0],points[j][1]-points[j-1][1]));
   const total=Math.max(1,distances.at(-1));
   corrected[index].points=points.map((p,j)=>{
    const t=distances[j]/total;
    return [round(start[0]+(end[0]-start[0])*t),round(start[1]+(end[1]-start[1])*t),...p.slice(2)];
   });
  }
  walls.forEach((index,j)=>{
   const ends=endpoints[index],start=ends.a[1]<ends.b[1]?target[j][0]:target[j][1],
    end=ends.a[1]<ends.b[1]?target[j][1]:target[j][0];
   straighten(index,start,end);
  });
  const floor=endpoints[floors[0]],left=[leftX,baseY],right=[rightX,baseY];
  straighten(floors[0],floor.a[0]<floor.b[0]?left:right,floor.a[0]<floor.b[0]?right:left);
  const roofPoints=strokes[roof.index].points;
  const leftEave=[leftX,roofY],rightEave=[rightX,roofY],apex=[(leftX+rightX)/2,apexY];
  const first=roofEnds.a[0]<roofEnds.b[0]?leftEave:rightEave;
  const last=roofEnds.a[0]<roofEnds.b[0]?rightEave:leftEave;
  let running=0;const distances=[0];
  for(let j=1;j<roofPoints.length;j++){
   running+=Math.hypot(roofPoints[j][0]-roofPoints[j-1][0],roofPoints[j][1]-roofPoints[j-1][1]);
   distances.push(running);
  }
  const split=Math.max(.001,distances[roof.apexIndex]),tail=Math.max(.001,running-split);
  corrected[roof.index].points=roofPoints.map((p,j)=>{
   const from=j<=roof.apexIndex?first:apex,to=j<=roof.apexIndex?apex:last;
   const t=j<=roof.apexIndex?distances[j]/split:(distances[j]-split)/tail;
   return [round(from[0]+(to[0]-from[0])*t),round(from[1]+(to[1]-from[1])*t),...p.slice(2)];
  });
  return corrected;
 }
 const fitHouseAny=strokes=>strokes.length===5?fitHouse(strokes)
  :strokes.length===4?fitHouseRoofV(strokes):null;

 // A window or a door is normally drawn after the five outline strokes.
 // Search only the most recent ink, and only accept extra strokes that lie
 // inside the walls. That prevents an older house elsewhere on the page from
 // stealing the suggestion for a new, unrelated sketch.
 function findHouseOutline(strokes,indices){
  if(indices.length<4)return null;
  for(const size of [5,4]){
   if(indices.length<size)continue;
   const last=indices.slice(-size);
   if(fitHouseAny(last.map(index=>strokes[index])))return last;
  }
  const allRecent=indices.slice(-9);
  for(let length=5;length<=allRecent.length;length++){
   const recent=allRecent.slice(-length);
   for(const size of [5,4]){
    if(length<=size)continue;
    const result=searchWithin(recent,size);
    if(result)return result;
   }
  }
  return null;
  function searchWithin(recent,size){
  const choose=[];
  function search(start){
   if(choose.length===size){
    const corrected=fitHouseAny(choose.map(index=>strokes[index]));
    if(!corrected)return null;
    const endpoints=corrected.flatMap(stroke=>[stroke.points[0],stroke.points.at(-1)]);
    const left=Math.min(...endpoints.map(p=>p[0])),right=Math.max(...endpoints.map(p=>p[0]));
    const ys=endpoints.map(p=>p[1]).sort((a,b)=>a-b);
    const skip=size===5?2:0;
    const roofY=(ys[skip]+ys[skip+1]+ys[skip+2]+ys[skip+3])/4,
     baseY=(ys[ys.length-4]+ys[ys.length-3]+ys[ys.length-2]+ys[ys.length-1])/4;
    const margin=Math.max(8,Math.min(15,(right-left)*.06));
    const selected=new Set(choose);
    for(const index of recent){
     if(selected.has(index))continue;
     for(const p of strokes[index].points){
      if(p[0]<left-margin||p[0]>right+margin||p[1]<roofY-margin||p[1]>baseY+margin)return null;
     }
    }
    return choose.slice();
   }
   for(let i=start;i<=recent.length-(size-choose.length);i++){
    choose.push(recent[i]);
    const result=search(i+1);
    choose.pop();
    if(result)return result;
   }
   return null;
  }
   return search(0);
  }
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
 const scope=document.createElement('button');scope.type='button';scope.textContent='Штрих';
 scope.setAttribute('aria-label','Исправлять только последний штрих или весь рисунок');
 scope.setAttribute('aria-pressed','false');
 const hint=document.createElement('button');hint.type='button';hint.textContent='Это…';
 hint.setAttribute('aria-label','Подсказать Сэйви, что ты хотел нарисовать');
 hint.setAttribute('aria-expanded','false');
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Отмена';
 cancel.setAttribute('aria-label','Не менять исходный почерк');
 const apply=document.createElement('button');apply.type='button';apply.textContent='Применить';
 apply.className='sv-paper-smooth-apply';
 apply.setAttribute('aria-label','Применить аккуратный почерк с возможностью отмены');
 const choices=document.createElement('div');choices.className='sv-paper-smooth-choices';choices.hidden=true;
 choices.setAttribute('role','group');choices.setAttribute('aria-label','Это буква или фигура');
 const choiceButtons=[['c','С','Это буква С'],['o','О','Это буква О'],['heart','♥','Это сердечко'],['house','⌂','Это домик']];
 for(const [shape,label,description] of choiceButtons){
  const button=document.createElement('button');button.type='button';button.textContent=label;
  button.setAttribute('aria-label',description);button.dataset.svShape=shape;
  choices.append(button);
 }
 bar.append(before,after,hint,cancel,apply,choices,scope);layer.append(bar);sheet.append(layer);
 let active=false,original=null,proposal=null,showAfter=true,hasChanges=false,suggested=null;
 let houseIndices=null,wholeSheet=false;
 function labelSuggestion(shape){
  suggested=shape;
  const label=shape==='c'?'С':shape==='o'?'О':shape==='heart'?'♥':shape==='house'?'Дом':null;
  hint.textContent=label?label+'?':'Это…';
  hint.setAttribute('aria-label',label
   ?`Сэйви предполагает ${shape==='house'?'домик':shape==='heart'?'сердечко':'букву '+label}. Посмотреть её аккуратный вариант`
   :'Подсказать Сэйви, что ты хотел нарисовать');
 }
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
  choices.hidden=true;hint.setAttribute('aria-expanded','false');
  labelSuggestion(null);
  if(commit){
   if(hasChanges){if(!paper.applyStrokeEdit(proposal)&&restore)paper.previewStrokeEdit(original)}
   else if(restore)paper.previewStrokeEdit(original);
  }else if(restore)paper.previewStrokeEdit(original);
  original=null;proposal=null;hasChanges=false;houseIndices=null;
 }
 function start(){
  if(active){stop();return}
  if(dialog.classList.contains('sv-paper-text-mode'))document.getElementById('notePaperTextAction')?.click();
  if(dialog.classList.contains('sv-paper-photo-mode'))document.getElementById('notePaperEditPhoto')?.click();
  paper.cancelActiveStroke?.();
  original=paper.getEditableStrokes([]);
  const eligibleIndices=original.flatMap((stroke,index)=>eligible(stroke)?[index]:[]);
  const indices=wholeSheet?eligibleIndices:eligibleIndices.slice(-1);
  if(!indices.length){original=null;paper.announce?.('Сначала напиши или нарисуй что-нибудь ручкой.');return}
  proposal=paper.getEditableStrokes(indices);
  let changed=0,guess=null;
  houseIndices=null;
  if(wholeSheet&&indices.length>=4)houseIndices=findHouseOutline(original,indices);
  const lastIndex=indices.at(-1);
  for(const index of indices){
   const stroke=proposal[index];
   const heart=fitHeart(stroke.points);
   const oval=heart?null:fitOval(stroke.points);
   const letterC=heart||oval?null:fitLetterC(stroke.points);
   const next=heart||oval||letterC||fitStraight(stroke.points)||fitAngularContour(stroke.points)||smoothPoints(stroke.points);
   if(index===lastIndex)guess=heart?'heart':oval?'o':letterC?'c':guessIntent(stroke.points,true);
   for(let i=0;i<next.length;i++)if(Math.hypot(next[i][0]-stroke.points[i][0],next[i][1]-stroke.points[i][1])>.1)changed++;
   stroke.points=next;
  }
  hasChanges=changed>0;
  if(!changed&&!houseIndices)paper.announce?.('Штрихи уже ровные — исправлять нечего. Можно подсказать Сэйви через «Это…».');
  active=true;layer.hidden=false;
  dialog.classList.add('sv-paper-smooth-mode');action.setAttribute('aria-pressed','true');
  scope.textContent=wholeSheet?'Лист':'Штрих';scope.setAttribute('aria-pressed',String(wholeSheet));
  scope.setAttribute('aria-label',wholeSheet?'Сейчас исправляется весь рисунок. Нажми для последнего штриха':'Сейчас исправляется последний штрих. Нажми для всего рисунка');
  labelSuggestion(houseIndices?'house':guess);
  positionBar();compare(true);
 }
 action.addEventListener('click',()=>{
  menu.hidden=true;document.getElementById('notePaperSettings')?.setAttribute('aria-expanded','false');
  start();
 });
 before.addEventListener('click',()=>compare(false));
 after.addEventListener('click',()=>compare(true));
 scope.addEventListener('click',()=>{
  if(!active)return;
  stop(false);wholeSheet=!wholeSheet;start();
 });
 function chooseShape(shape){
  if(!active||!shape)return;
  if(shape==='house'){
   const indices=houseIndices;
   if(!indices){paper.announce?.('Нарисуй крышу одним или двумя штрихами, две стены и нижнюю линию.');return}
   const corrected=fitHouseAny(indices.map(index=>original[index]));
   if(!corrected)return;
   proposal=paper.getEditableStrokes(indices);
   indices.forEach((index,i)=>{proposal[index]=corrected[i]});
   hasChanges=true;choices.hidden=true;hint.setAttribute('aria-expanded','false');
   labelSuggestion(null);compare(true);return;
  }
  let index=-1;
  for(let i=original.length-1;i>=0;i--)if(eligible(original[i])){index=i;break}
  if(index<0)return;
  const points=redrawAs(original[index].points,shape);
  if(!points){paper.announce?.('Нарисуй букву немного крупнее, чтобы Сэйви поняла размер.');return}
  proposal=paper.getEditableStrokes([index]);
  proposal[index].points=points;
  hasChanges=true;choices.hidden=true;hint.setAttribute('aria-expanded','false');
  labelSuggestion(null);
  compare(true);
 }
 hint.addEventListener('click',()=>{
  if(!active)return;
  if(suggested){chooseShape(suggested);return}
  choices.hidden=!choices.hidden;
  hint.setAttribute('aria-expanded',String(!choices.hidden));
 });
 choices.addEventListener('click',event=>{
  const shape=event.target.closest('[data-sv-shape]')?.dataset.svShape;
  chooseShape(shape);
 });
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
