const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');

const root=join(__dirname,'..');
const html=readFileSync(join(root,'index.html'),'utf8');
const css=readFileSync(join(root,'assets/notebook-scan.css'),'utf8');
const scan=readFileSync(join(root,'assets/notebook-scan.js'),'utf8');

test('photo OCR remains a full-screen, plain-white Apple workspace',()=>{
 assert.match(css,/dialog#noteScanDialog\.paper-scan-dialog\[open\]\{[\s\S]*?display:flex!important;flex-direction:column!important/);
 assert.match(css,/background-color:#fff!important;\s*background-image:none!important/);
 assert.match(css,/calc\(24px \+ env\(safe-area-inset-bottom,0px\)\)/);
 assert.match(css,/#noteScanTitle\{[\s\S]*?justify-content:center!important/);
 assert.match(css,/#noteScanBack\{[\s\S]*?background:#fff!important/);
});

test('camera and gallery are still native file inputs inside icon actions',()=>{
 assert.match(html,/<label for="noteScanCamera"><svg[\s\S]*?<input id="noteScanCamera" type="file" accept="image\/\*" capture="environment">/);
 assert.match(html,/<label for="noteScanGallery"><svg[\s\S]*?<input id="noteScanGallery" type="file" accept="image\/\*">/);
 assert.match(css,/\.paper-scan-inputs label\{[\s\S]*?background:#f5f5f7!important/);
 assert.match(scan,/for\(const id of \['noteScanCamera','noteScanGallery'\]\)/);
});

test('OCR and editable result form remain functional without extra borders or resize handles',()=>{
 assert.match(css,/#noteScanRecognize:disabled\{\s*background:#f1f1f3!important/);
 assert.match(css,/#noteScanText\{[\s\S]*?flex:1 1 auto!important/);
 assert.match(css,/#noteScanText\{[\s\S]*?resize:none!important/);
 assert.match(css,/#noteScanText\{[\s\S]*?border-bottom:0!important/);
 assert.match(css,/\.paper-scan-actions\{[\s\S]*?margin:0!important/);
 assert.match(scan,/text\.value='';text\.wrap='soft'/);
 assert.match(scan,/keepLines\?\.addEventListener\('change',\(\)=>\{text\.wrap='soft'\}\)/);
 assert.match(scan,/const raw=retainLines\?textInOriginalLines\(result\?\.data\)/);
 assert.match(scan,/window\.SEYVEO_NOTES_API\?\.reviewText\(value\.slice\(0,8000\),\{preserveLines:/);
 assert.match(scan,/window\.SEYVEO_PAPER\?\.importPhoto\(file\)/);
});

test('OCR online engine still requires explicit consent and supports black theme',()=>{
 assert.match(scan,/if\(!consented\)\{[\s\S]*?consentBox\.hidden=false/);
 assert.match(css,/\.paper-scan-consent\{[\s\S]*?background:#f5f5f7/);
 assert.match(css,/html\[data-theme="dark"\] body dialog#noteScanDialog/);
});
