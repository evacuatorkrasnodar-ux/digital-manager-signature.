/* SEYVEO Painting · deterministic Canvas 2D brush / airbrush / oil / watercolor strokes.
 * No remote textures, no random per-frame output, no offscreen full-canvas
 * layers. Stroke geometry is saved by the existing Paper engine. */
(function(root){
 'use strict';
 const KINDS=new Set(['brush','spray','oil','watercolor']);
 const stamps=new Map();
 const cap=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
 const colorOf=s=>/^#[0-9a-f]{6}$/i.test(s?.color||'')?s.color:'#171e29';
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const rgba=(hex,alpha)=>{
  const [r,g,b]=rgb(hex);return 'rgba('+r+','+g+','+b+','+cap(alpha,0,1)+')';
 };
 const blend=(hex,target,t)=>{
  const c=rgb(hex);return 'rgb('+c.map(v=>Math.round(v+(target-v)*t)).join(',')+')';
 };
 const alphaOf=s=>cap(Number.isFinite(s?.opacity)?s.opacity:(s.tool==='spray'?.48:s.tool==='oil'?.94:s.tool==='watercolor'?.54:.8),.1,1);
 const widthOf=(s,p)=>{
  const base=cap(Number(s.width)||15,1,90);
  const press=s.pressureSensitive?cap((p?.[2]??50)/100,0,1):.5;
  return base*(s.pressureSensitive?.6+.8*press:1);
 };
 const grad=(ctx,s)=>{
  if(Array.isArray(s.gradient)&&s.gradient.length===2&&s.gradient.every(c=>/^#[0-9a-f]{6}$/i.test(c))){
   const g=ctx.createLinearGradient(0,0,840,0);
   g.addColorStop(0,s.gradient[0]);g.addColorStop(1,s.gradient[1]);return g;
  }
  return colorOf(s);
 };
 function line(ctx,a,b,width,style,alpha){
  ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);
  ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=Math.max(.5,width);
  ctx.globalAlpha=alpha;ctx.strokeStyle=style;ctx.stroke();
 }
 function brush(ctx,s,a,b){
  const width=(widthOf(s,a)+widthOf(s,b))/2,opacity=alphaOf(s);
  const color=grad(ctx,s);
  // Translucent feathered edge around a denser pigment centre.
  line(ctx,a,b,width*1.22,color,opacity*.16);
  line(ctx,a,b,width,color,opacity*.35);
  line(ctx,a,b,width*.76,color,opacity*.58);
  line(ctx,a,b,width*.35,color,opacity*.26);
 }
 function sprayStamp(color){
  if(stamps.has(color))return stamps.get(color);
  const tile=document.createElement('canvas');tile.width=80;tile.height=80;
  const c=tile.getContext('2d');
  if(c){
   const g=c.createRadialGradient(40,40,0,40,40,40);
   g.addColorStop(0,rgba(color,.17));
   g.addColorStop(.27,rgba(color,.13));
   g.addColorStop(.65,rgba(color,.055));
   g.addColorStop(1,rgba(color,0));
   c.fillStyle=g;c.fillRect(0,0,80,80);
  }
  if(stamps.size>=36)stamps.clear();
  stamps.set(color,tile);return tile;
 }
 function spray(ctx,s,a,b,dot=false){
  const width=(widthOf(s,a)+widthOf(s,b))/2,alpha=alphaOf(s);
  const color=colorOf(s),sprite=sprayStamp(color);
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  const spacing=Math.max(3,width*.23),n=dot?0:Math.min(150,Math.max(1,Math.ceil(length/spacing)));
  ctx.globalAlpha=alpha;
  for(let i=0;i<=n;i++){
   const t=n?i/n:0;
   const x=a[0]+dx*t,y=a[1]+dy*t;
   const w=width*(s.pressureSensitive?.85+.3*cap(((a[2]||50)*(1-t)+(b[2]||50)*t)/100,0,1):1);
   ctx.drawImage(sprite,x-w/2,y-w/2,w,w);
  }
 }
 // Smooth continuous paths make oil look like paint, not a string of
 // overlapping round-capped cords. Saved points remain unchanged.
 function traceSmooth(ctx,points){
  if(!points.length)return;
  ctx.moveTo(points[0][0],points[0][1]);
  if(points.length===1)return;
  if(points.length===2){ctx.lineTo(points[1][0],points[1][1]);return;}
  for(let i=1;i<points.length-1;i++){
   const p=points[i],q=points[i+1];
   ctx.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2);
  }
  const end=points[points.length-1];ctx.lineTo(end[0],end[1]);
 }
 function geometry(s,points){
  return points.map((p,i)=>{
   const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)];
   const dx=after[0]-before[0],dy=after[1]-before[1];
   const dist=Math.max(.001,Math.hypot(dx,dy));
   return {x:p[0],y:p[1],nx:-dy/dist,ny:dx/dist,
    radius:Math.max(.6,widthOf(s,p)*.5)};
  });
 }
 function outline(ctx,geo,scale=1,shift=0,x=0,y=0){
  const left=geo.map(p=>[p.x+p.nx*(p.radius*scale+shift)+x,
                         p.y+p.ny*(p.radius*scale+shift)+y]);
  const right=geo.map(p=>[p.x+p.nx*(-p.radius*scale+shift)+x,
                          p.y+p.ny*(-p.radius*scale+shift)+y]).reverse();
  ctx.beginPath();traceSmooth(ctx,left);
  if(right.length){
   ctx.lineTo(right[0][0],right[0][1]);
   for(let i=1;i<right.length-1;i++){
    const p=right[i],q=right[i+1];
    ctx.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2);
   }
   if(right.length>1){const end=right[right.length-1];ctx.lineTo(end[0],end[1]);}
  }
  ctx.closePath();
 }
 function hairline(ctx,geo,fraction,style,alpha){
  const path=geo.map(p=>[p.x+p.nx*p.radius*fraction,
                         p.y+p.ny*p.radius*fraction]);
  ctx.beginPath();traceSmooth(ctx,path);
  ctx.lineWidth=Math.max(.45,Math.min(1.15,geo[0].radius*.09));
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle=style;ctx.globalAlpha=alpha;ctx.stroke();
 }
 function oilStroke(ctx,s){
  const points=s.points;
  if(!points.length)return;
  const base=colorOf(s),opacity=alphaOf(s);
  const radius=widthOf(s,points[0])*.5;
  ctx.save();ctx.globalCompositeOperation='source-over';
  if(points.length===1){
   const x=points[0][0],y=points[0][1];
   ctx.globalAlpha=opacity;
   ctx.beginPath();ctx.arc(x,y,Math.max(.6,radius),0,Math.PI*2);
   ctx.fillStyle=base;ctx.fill();ctx.restore();return;
  }
  const geo=geometry(s,points);
  // Continuous single-body silhouette with restrained reflected light.
  outline(ctx,geo,1.03,0,.65,1);
  ctx.fillStyle=blend(base,0,.18);ctx.globalAlpha=opacity*.62;ctx.fill();
  outline(ctx,geo,.97);
  ctx.fillStyle=grad(ctx,s);ctx.globalAlpha=opacity;ctx.fill();
  // A broad semi-transparent ridge suggests thickness without roping.
  outline(ctx,geo,.38,-geo[0].radius*.33,-.35,-.4);
  ctx.fillStyle=blend(base,255,.18);ctx.globalAlpha=opacity*.24;ctx.fill();
  hairline(ctx,geo,-.35,blend(base,255,.35),opacity*.18);
  hairline(ctx,geo,.44,blend(base,0,.28),opacity*.13);
  ctx.restore();
 }
 function oilLive(ctx,s,a,b,dot=false){
  // While dragging, paint only a clean single stroke. The final textured
  // body is rendered from the whole saved path once the finger is lifted.
  const width=(widthOf(s,a)+widthOf(s,b))/2;
  const color=grad(ctx,s);
  ctx.globalAlpha=alphaOf(s);
  ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.fillStyle=ctx.strokeStyle=color;
  ctx.beginPath();
  if(dot){ctx.arc(a[0],a[1],Math.max(.5,width/2),0,Math.PI*2);ctx.fill();}
  else{ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}
 }
 // Watercolor is a light, translucent 2D wash with pigment pooling at the
 // edges and gentle granulation. It is not a physical wet-fluid simulation.
 // A single saved vector stroke is replayed identically for Undo and PNG.
 function watercolorStroke(ctx,s){
  const points=s.points;
  if(!points?.length)return;
  const opacity=alphaOf(s),pigment=grad(ctx,s),base=colorOf(s);
  ctx.save();ctx.globalCompositeOperation='source-over';
  ctx.lineJoin='round';ctx.lineCap='round';
  if(points.length===1){
   const p=points[0],radius=Math.max(.7,widthOf(s,p)/2);
   for(const [factor,alpha] of [[1.24,.085],[1.05,.16],[.76,.24]]){
    ctx.beginPath();ctx.arc(p[0],p[1],radius*factor,0,Math.PI*2);
    ctx.fillStyle=pigment;ctx.globalAlpha=opacity*alpha;ctx.fill();
   }
   ctx.restore();return;
  }
  // A watercolor wash is a single uninterrupted rounded stroke, not a
  // closed polygonal ribbon: sharp closed-path ends caused the triangular
  // cuts and square paint tails observed on iPhone.
  const average=points.reduce((sum,p)=>sum+widthOf(s,p),0)/points.length;
  const width=cap(average,1,90);
  const washPasses=[[1.32,.09],[1.15,.14],[.98,.22],[.75,.18]];
  for(const [spread,alpha] of washPasses){
   ctx.beginPath();traceSmooth(ctx,points);
   ctx.lineWidth=Math.max(.7,width*spread);
   ctx.strokeStyle=pigment;ctx.globalAlpha=opacity*alpha;ctx.stroke();
  }
  // Fine surface tension at the edges: slight pigment pooling, avoiding
  // a harsh dark outline. Each edge follows the entire smoothed centreline.
  const geo=geometry(s,points);
  for(const side of [-1,1]){
   const edge=geo.map(p=>[
    p.x+p.nx*width*.46*side,p.y+p.ny*width*.46*side
   ]);
   ctx.beginPath();traceSmooth(ctx,edge);
   ctx.strokeStyle=blend(base,0,.15);
   ctx.lineWidth=Math.max(.5,Math.min(1.4,width*.035));
   ctx.globalAlpha=opacity*.075;ctx.stroke();
  }
  // Soft endpoint blooms blend naturally into the rounded wash. Use a
  // radial alpha ramp, never a hard filled circle or a polygon cap.
  for(const p of [points[0],points[points.length-1]]){
   const radius=width*.72;
   const bloom=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],radius);
   bloom.addColorStop(0,rgba(base,.075));
   bloom.addColorStop(.55,rgba(base,.04));
   bloom.addColorStop(1,rgba(base,0));
   ctx.fillStyle=bloom;ctx.globalAlpha=opacity;
   ctx.fillRect(p[0]-radius,p[1]-radius,radius*2,radius*2);
  }
  // A few faint pigment flecks suggest paper grain without frame-to-frame
  // noise, network textures, or large offscreen images on older phones.
  const stride=Math.max(3,Math.ceil(geo.length/38));
  ctx.fillStyle=base;ctx.globalAlpha=opacity*.045;
  for(let i=0;i<geo.length;i+=stride){
   const p=geo[i],side=Math.sin((i+1)*6.173);
   const x=p.x+p.nx*width*.3*side;
   const y=p.y+p.ny*width*.3*side;
   ctx.beginPath();
   ctx.arc(x,y,Math.max(.3,Math.min(.9,width*.025)),0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 function watercolorLive(ctx,s,a,b,dot=false){
  const width=(widthOf(s,a)+widthOf(s,b))/2;
  const opacity=alphaOf(s),paint=grad(ctx,s);
  if(dot){
   ctx.beginPath();ctx.arc(a[0],a[1],Math.max(.6,width/2),0,Math.PI*2);
   ctx.fillStyle=paint;ctx.globalAlpha=opacity*.35;ctx.fill();return;
  }
  // While dragging use softly feathered segments with round caps;
  // release replays a single continuous wash for seamless ends.
  for(const [scale,alpha] of [[1.32,.09],[1.15,.14],[.98,.22],[.75,.18]])
   line(ctx,a,b,width*scale,paint,opacity*alpha);
 }
 function segment(ctx,s,a,b,dot=false){
  if(!KINDS.has(s?.tool)||!a||!b)return false;
  ctx.save();ctx.globalCompositeOperation='source-over';
  if(s.tool==='brush')dot?oilLive(ctx,s,a,a,true):brush(ctx,s,a,b);
  else if(s.tool==='spray')spray(ctx,s,a,b,dot);
  else if(s.tool==='watercolor')watercolorLive(ctx,s,a,b,dot);
  else oilLive(ctx,s,a,b,dot);
  ctx.restore();return true;
 }
 function stroke(ctx,s){
  if(!KINDS.has(s?.tool)||!Array.isArray(s.points)||!s.points.length)return false;
  const pts=s.points;
  if(s.tool==='oil'){oilStroke(ctx,s);return true;}
  if(s.tool==='watercolor'){watercolorStroke(ctx,s);return true;}
  if(pts.length===1){segment(ctx,s,pts[0],pts[0],true);return true;}
  for(let i=1;i<pts.length;i++)segment(ctx,s,pts[i-1],pts[i]);
  return true;
 }
 root.SEYVEO_PAINT_BRUSHES=Object.freeze({supports:kind=>KINDS.has(kind),segment,stroke});
})(window);
