const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};

// Opt-in integration test: many CI sandboxes block Chromium's process socket.
const browserTest=process.env.SEYVEO_BROWSER_TEST==='1'?test:test.skip;
browserTest('a voice clip is inserted directly, can be undone and cannot duplicate',async()=>{
 const {chromium}=require('playwright');
 const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent((request.url||'/').split('?')[0]);
  const filename=path.resolve(root,'.'+pathname);
  if(filename!==root&&!filename.startsWith(root+path.sep)){response.writeHead(403).end();return;}
  fs.readFile(filename,(error,data)=>{
   if(error){response.writeHead(404).end();return;}
   response.writeHead(200,{'content-type':mime[path.extname(filename)]||'application/octet-stream'}).end(data);
  });
 });
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{
    getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})
   }});
   window.MediaRecorder=class FakeRecorder{
    static isTypeSupported(){return true;}
    constructor(stream,options){this.state='inactive';this.mimeType=options?.mimeType||'audio/webm';}
    start(){this.state='recording';}
    pause(){this.state='paused';}
    resume(){this.state='recording';}
    stop(){this.state='inactive';this.ondataavailable?.({data:new Blob([new Uint8Array(256)],{type:this.mimeType})});this.onstop?.();}
   };
   window.SpeechRecognition=class FakeRecognition{
    start(){setTimeout(()=>{
     const final=Object.assign([{transcript:'Заметка о встрече в четверг'}],{isFinal:true});
     this.onresult?.({resultIndex:0,results:[final]});
    },15);}
    stop(){this.onend?.();}
   };
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html#tasks`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.SEYVEO_NOTE_VOICE&&window.SEYVEO_NOTE_ATTACHMENTS));
  await page.evaluate(()=>window.openNoteReview(''));
  await page.evaluate(()=>document.querySelector('[data-note-attachment="record"]').click());
  await page.locator('#svNoteVoiceCapture:not([hidden]) [data-voice-stop]').waitFor({state:'visible'});
  await page.locator('[data-voice-recognize]').check();
  await page.waitForFunction(()=>document.querySelector('[data-voice-hint]')?.textContent.includes('Заметка о встрече'));
  await page.locator('[data-voice-stop]').click();
  await page.locator('.sv-note-audio').waitFor({state:'visible',timeout:12000});
  assert.equal(await page.locator('.sv-note-audio').count(),1);
  await page.locator('.sv-note-audio-text').click();
  await page.waitForFunction(()=>document.getElementById('noteReviewText').value.includes('Заметка о встрече в четверг'));
  assert.equal(await page.locator('#svNoteVoiceTranscript').count(),0,'no bulky transcript editor');
  assert.equal(await page.locator('.sv-note-audio-text').textContent(),'Отменить');
  await page.locator('.sv-note-audio-text').click();
  await page.waitForFunction(()=>!document.getElementById('noteReviewText').value.includes('Заметка о встрече'));
  await page.locator('.sv-note-audio-text').click();
  await page.waitForFunction(()=>document.getElementById('noteReviewText').value.includes('Заметка о встрече'));
  const noteText=await page.locator('#noteReviewText').inputValue();
  assert.equal((noteText.match(/Заметка о встрече/g)||[]).length,1);
  assert.equal(await page.locator('.sv-note-audio').count(),1,'the original audio remains saved after inserting text');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
},{timeout:30000});
