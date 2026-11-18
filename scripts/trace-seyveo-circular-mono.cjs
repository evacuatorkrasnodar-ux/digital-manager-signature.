/* Trace ONLY the opaque material in the user's approved SEYVEO emblem.
 * The source has transparent alpha ~= 0 outside the real ribbon surfaces
 * and alpha ~= 253 within them, so its contours are unambiguous.
 * No generic circle, substitute petals, gradients or hand-drawn geometry. */
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');

const assets=path.resolve(__dirname,'..','assets');
const source=path.join(assets,'seyveo-circular-interlace-approved-color.png');
const output=path.join(assets,'seyveo-circular-interlace-mono.svg');
const alphaCutoff=225;
const minArea=120;

function perpendicularDistanceSq(p,a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1];
  const t=dx||dy?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))):0;
  const ex=p[0]-(a[0]+t*dx),ey=p[1]-(a[1]+t*dy);
  return ex*ex+ey*ey;
}

function simplifyLine(points,tolerance=1.35){
  if(points.length<3)return points;
  const sq=tolerance*tolerance;
  const keep=new Uint8Array(points.length);
  keep[0]=keep[points.length-1]=1;
  const stack=[[0,points.length-1]];
  while(stack.length){
    const [first,last]=stack.pop();
    let max=-1,at=-1;
    for(let i=first+1;i<last;i++){
      const d=perpendicularDistanceSq(points[i],points[first],points[last]);
      if(d>max){max=d;at=i}
    }
    if(max>sq){keep[at]=1;stack.push([first,at],[at,last])}
  }
  return points.filter((_,i)=>keep[i]);
}

function simplifyLoop(points){
  const mid=Math.floor(points.length/2);
  const first=simplifyLine(points.slice(0,mid+1));
  const second=simplifyLine([...points.slice(mid),points[0]]);
  return [...first.slice(0,-1),...second.slice(0,-1)];
}

function polygonArea(points){
  let sum=0;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];
    sum+=a[0]*b[1]-a[1]*b[0];
  }
  return sum/2;
}

async function main(){
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width:w,height:h}=info;
  if(w!==h)throw Error('Approved SEYVEO mark must be square');
  const isInk=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&data[(y*w+x)*4+3]>=alphaCutoff;
  const gridWidth=w+1;
  const adjacency=new Map();
  let edges=0;
  const edge=(x1,y1,x2,y2)=>{
    const from=y1*gridWidth+x1,to=y2*gridWidth+x2;
    const list=adjacency.get(from)||[];
    list.push(to);adjacency.set(from,list);edges++;
  };

  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(!isInk(x,y))continue;
    if(!isInk(x,y-1))edge(x,y,x+1,y);
    if(!isInk(x+1,y))edge(x+1,y,x+1,y+1);
    if(!isInk(x,y+1))edge(x+1,y+1,x,y+1);
    if(!isInk(x-1,y))edge(x,y+1,x,y);
  }

  const point=id=>[id%gridWidth,Math.floor(id/gridWidth)];
  const contours=[];
  let used=0;
  for(const [start] of adjacency){
    let list=adjacency.get(start);
    while(list?.length){
      const poly=[];
      let current=start;
      for(let guard=0;guard<=edges;guard++){
        poly.push(point(current));
        const options=adjacency.get(current);
        if(!options?.length)throw Error('Broken contour in approved bitmap');
        const next=options.pop();used++;
        if(next===start)break;
        current=next;
        if(guard===edges)throw Error('Contour failed to close');
      }
      if(Math.abs(polygonArea(poly))>=minArea){
        const simplified=simplifyLoop(poly);
        contours.push({area:polygonArea(poly),vertices:simplified});
      }
      list=adjacency.get(start);
    }
  }
  if(used!==edges||contours.length<2||contours.length>12){
    throw Error(`Unexpected vector trace: ${used}/${edges} edges, ${contours.length} contours`);
  }
  const format=points=>'M'+points.map(([x,y])=>`${x} ${y}`).join('L')+'Z';
  const paths=contours.map(({vertices})=>`    <path d="${format(vertices)}"/>`).join('\n');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="SEYVEO — переплетённые лепестки">
  <title>SEYVEO</title>
  <!-- Exact approved silhouette, traced from opaque jade/platinum surfaces.
       Intentional negative-space slits are true cutouts, not painted lines. -->
  <g fill="#111718" fill-rule="evenodd">
${paths}
  </g>
</svg>\n`;
  fs.writeFileSync(output,svg);
  console.log(`Traced ${contours.length} original contours, ${contours.reduce((n,c)=>n+c.vertices.length,0)} vertices`);
}

main().catch(error=>{console.error(error);process.exitCode=1});
