/* SEYVEO Paper — trusted boundary for future multimodal drawing.
 * A model returns DATA, never JavaScript, SVG markup, commands, or direct edits.
 * This module neither calls a provider nor saves/overwrites a user's drawing.
 */
const MAX_STROKES=60,MAX_POINTS=700,MAX_TOTAL_POINTS=5000,MAX_JSON_SIZE=280000;
const COLORS=/^#[0-9a-fA-F]{6}$/;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function paperSketchInstruction({mode='draw',request=''}={}){
 if(!['draw','improve'].includes(mode))throw Error('invalid-mode');
 const prompt=String(request||'').trim();
 if(!prompt||prompt.length>500)throw Error('invalid-request');
 return [
  'Ты — Сэйви, визуальная помощница SEYVEO Paper.',
  mode==='draw'?'Предложи рисунок по просьбе автора.':'Проанализируй приложенный рисунок и предложи аккуратный вариант, сохраняя его смысл.',
  'Не заявляй, что распознала предмет, если сомневаешься. Не рисуй подписи, печати или юридически значимые рукописные элементы.',
  'Отвечай только JSON-объектом вида {"version":1,"title":"...","strokes":[{"color":"#171e29","width":4,"points":[[0.1,0.2],[0.2,0.3]]}]} без Markdown.',
  'Каждая точка задана долей ширины/высоты от 0 до 1. Не более 60 штрихов, 700 точек на штрих, 5000 точек всего.',
  'Это только предложение для предпросмотра. Ничего не сохраняй, не применяй и не выполняй внешние действия.',
  'Пожелание автора: '+prompt
 ].join('\n');
}

export function validatePaperSketchDraft(raw,{width=840,height=1188}={}){
 if(!Number.isInteger(width)||width<100||width>2000||!Number.isInteger(height)||height<100||height>4000)
  throw Error('invalid-paper-size');
 if(typeof raw==='string'&&raw.length>MAX_JSON_SIZE)throw Error('draft-too-large');
 let draft;
 try{draft=typeof raw==='string'?JSON.parse(raw):raw}
 catch{throw Error('invalid-draft-json')}
 if(!draft||typeof draft!=='object'||Array.isArray(draft)||draft.version!==1
  ||!Array.isArray(draft.strokes)||draft.strokes.length===0||draft.strokes.length>MAX_STROKES)
  throw Error('invalid-draft');
 // A future UI must still render this as textContent, never innerHTML.
 const title=typeof draft.title==='string'
  ?draft.title.replace(/[\u0000-\u001F\u007F<>]/g,' ').trim().slice(0,100):'Рисунок Сэйви';
 let total=0;
 const strokes=draft.strokes.map(stroke=>{
  if(!stroke||typeof stroke!=='object'||!Array.isArray(stroke.points)
   ||stroke.points.length<2||stroke.points.length>MAX_POINTS)throw Error('invalid-stroke');
  total+=stroke.points.length;if(total>MAX_TOTAL_POINTS)throw Error('too-many-points');
  if(stroke.color!==undefined&&(typeof stroke.color!=='string'||!COLORS.test(stroke.color)))
   throw Error('invalid-color');
  if(stroke.width!==undefined&&(!Number.isFinite(stroke.width)||stroke.width<1||stroke.width>20))
   throw Error('invalid-width');
  const points=stroke.points.map(point=>{
   if(!Array.isArray(point)||point.length!==2||point.some(v=>!Number.isFinite(v)||v<0||v>1))
    throw Error('invalid-point');
   return [Math.round(point[0]*width*10)/10,Math.round(point[1]*height*10)/10,50];
  });
  return {tool:'pen',color:stroke.color?.toLowerCase()||'#171e29',width:clamp(stroke.width??4,1,20),points};
 });
 return Object.freeze({kind:'paper-preview',title:title||'Рисунок Сэйви',strokes,
  requiresConfirmation:true,originalUntouched:true});
}
