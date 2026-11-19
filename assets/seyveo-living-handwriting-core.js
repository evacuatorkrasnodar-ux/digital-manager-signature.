/* SEYVEO Living Handwriting · local, sampled vector letters (no font impersonation).
 * Pure geometry for the browser and Node tests. Never reads storage or edits Paper.
 */
((root,build)=>{
 const api=build();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SEYVEO_LIVING_HANDWRITING_CORE=api;
})(globalThis,()=>{
 'use strict';
 const WIDTH=320,HEIGHT=170,BASELINE=126,MAX_GLYPHS=100;
 const LETTER=/^[а-яёa-z0-9.,!?:;+\-]$/i;
 const round=n=>Math.round(n*1000)/1000;
 const bounded=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
 const supported=character=>typeof character==='string'&&[...character].length===1&&LETTER.test(character);

 function makeGlyph(raw){
  if(!Array.isArray(raw)||!raw.length||raw.length>12)return null;
  let total=0,x0=WIDTH,y0=HEIGHT,x1=0,y1=0;
  const strokes=[];
  for(const stroke of raw){
   if(!Array.isArray(stroke)||!stroke.length||stroke.length>320)return null;
   total+=stroke.length;if(total>1500)return null;
   const points=[];
   for(const p of stroke){
    if(!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1])
     ||p[0]<0||p[0]>WIDTH||p[1]<0||p[1]>HEIGHT)return null;
    x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);
    y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);
    points.push([p[0],p[1],bounded(Number.isFinite(p[2])?p[2]:50,0,100)]);
   }
   strokes.push(points);
  }
  // One common sample baseline keeps dots, ascenders and descenders distinct.
  const span=Math.max(64,(x1-x0)/1.7,(y1-y0)/1.55);
  return {
   advance:round(bounded((x1-x0+16)/span,.3,1.95)),
   strokes:strokes.map(stroke=>stroke.map(p=>[
    round((p[0]-x0)/span),round((p[1]-BASELINE)/span),Math.round(p[2])
   ]))
  };
 }

 function validGlyph(g){
  if(!g||typeof g!=='object'||!Number.isFinite(g.advance)
   ||g.advance<.3||g.advance>1.95||!Array.isArray(g.strokes)
   ||!g.strokes.length||g.strokes.length>12)return null;
  let total=0;
  const strokes=[];
  for(const stroke of g.strokes){
   if(!Array.isArray(stroke)||!stroke.length||stroke.length>320)return null;
   total+=stroke.length;if(total>1500)return null;
   const clean=[];
   for(const p of stroke){
    if(!Array.isArray(p)||p.length!==3
     ||!p.every(Number.isFinite)||p[0]<0||p[0]>1.75
     ||p[1]<-2||p[1]>.7||p[2]<0||p[2]>100)return null;
    clean.push(p.slice());
   }
   strokes.push(clean);
  }
  return {advance:g.advance,strokes};
 }

 function cleanAlphabet(source){
  let input=source;
  if(typeof source==='string'){
   if(source.length>900000)return {};
   try{input=JSON.parse(source)}catch{return {}}
  }
  if(!input||input.version!==1||!input.glyphs||typeof input.glyphs!=='object'
   ||Array.isArray(input.glyphs))return {};
  const out={};
  for(const [key,glyph] of Object.entries(input.glyphs).slice(0,MAX_GLYPHS)){
   if(!supported(key))continue;
   const clean=validGlyph(glyph);
   if(clean)out[key]=clean;
  }
  return out;
 }

 function composeText(value,glyphs={}, {width=840,height=1188,left=70,baseline=175,
  size=53,color='#171e29',maxStrokes=200,maxPoints=5500}={}){
  const text=String(value||'').slice(0,240);
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<240||width>2000
   ||height<200||height>4000||!Number.isFinite(size)||size<18||size>90
   ||!Number.isFinite(left)||left<0||!Number.isFinite(baseline)||baseline<0
   ||!/^#[0-9a-f]{6}$/i.test(color)||!Number.isInteger(maxStrokes)||maxStrokes<1||maxStrokes>250
   ||!Number.isInteger(maxPoints)||maxPoints<1||maxPoints>11000)
   throw Error('invalid-composition-options');
  const missing=new Set(),strokes=[];
  const end=width-40,initial=left,lineStep=size*1.6;
  let cursor=left,base=baseline,lines=1,overflow=false,top=height,bottom=0,totalPoints=0;
  const advanceOf=c=>glyphs[c]?.advance??.66;
  const line=()=>{cursor=initial;base+=lineStep;lines++};
  const characters=[...text];
  for(let i=0;i<characters.length;i++){
   const char=characters[i];
   if(char==='\n'){line();continue}
   if(char===' '||char==='\t'){
    cursor+=size*(char===' '?0.45:1.8);
    continue;
   }
   // Wrap before a word where possible. Very long words wrap by letter.
   if(i===0||/[\s]/.test(characters[i-1])){
    let wordWidth=0;
    for(let j=i;j<characters.length&&!/\s/.test(characters[j]);j++)
     wordWidth+=(advanceOf(characters[j])+.08)*size;
    if(cursor>initial&&cursor+wordWidth>end&&wordWidth<end-initial)line();
   }
   const glyph=validGlyph(glyphs[char]);
   const advance=(glyph?.advance??.66)*size+size*.08;
   if(cursor>initial&&cursor+advance>end)line();
   if(!glyph){missing.add(char);cursor+=advance;continue}
   for(const segment of glyph.strokes){
    if(strokes.length>=maxStrokes||totalPoints+segment.length>maxPoints){overflow=true;break}
    const points=segment.map(([x,y,pressure])=>[
     Math.round((cursor+x*size)*10)/10,
     Math.round((base+y*size)*10)/10,
     pressure
    ]);
    for(const p of points){top=Math.min(top,p[1]);bottom=Math.max(bottom,p[1]);
     if(p[0]<0||p[0]>width||p[1]<0||p[1]>height)overflow=true;
    }
    strokes.push({tool:'pen',pressureSensitive:true,color,width:Math.max(2,round(size*.065)),points});
    totalPoints+=segment.length;
   }
   if(overflow)break;
   cursor+=advance;
  }
  if(base+size*.35>height||strokes.length>maxStrokes)overflow=true;
  return {strokes,missing:[...missing],overflow,lines,top,bottom};
 }

 return Object.freeze({WIDTH,HEIGHT,BASELINE,MAX_GLYPHS,supported,makeGlyph,validGlyph,
  cleanAlphabet,composeText});
});
