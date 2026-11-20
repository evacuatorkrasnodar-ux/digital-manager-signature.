const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};

// Opt-in integration test: many CI sandboxes block Chromium's process socket.
const browserTest=process.env.SEYVEO_BROWSER_TEST==='1'?test:test.skip;
browserTest('a voice clip can be recorded, saved and manually transcribed in one note',async()=>{
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
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html#tasks`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.SEYVEO_NOTE_VOICE&&window.SEYVEO_NOTE_ATTACHMENTS));
  await page.evaluate(()=>window.openNoteReview(''));
  await page.evaluate(()=>document.querySelector('[data-note-attachment="record"]').click());
  await page.locator('#svNoteVoiceCapture:not([hidden]) [data-voice-stop]').waitFor({state:'visible'});
  await page.locator('[data-voice-stop]').click();
  await page.locator('.sv-note-audio').waitFor({state:'visible',timeout:12000});
  assert.equal(await page.locator('.sv-note-audio').count(),1);
  await page.locator('.sv-note-audio-text').click();
  await page.locator('[data-transcript-text]').fill('Заметка о встрече в четверг');
  await page.locator('[data-transcript-add]').click();
  await page.waitForFunction(()=>document.getElementById('noteReviewText').value.includes('Заметка о встрече в четверг'));
  assert.equal(await page.locator('.sv-note-audio').count(),1,'the original audio remains saved after inserting text');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
},{timeout:30000});
