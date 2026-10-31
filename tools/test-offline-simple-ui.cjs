const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'assets/seyveo-offline-manager.js'),'utf8');

test('offline UI has one bundle summary, not old package checkboxes',()=>{
 assert.match(html,/Полный офлайн-комплект/);
 assert.match(html,/Сэйви рядом, даже когда нет интернета/);
 assert.doesNotMatch(js,/createElement\('input'\)/);
 assert.doesNotMatch(js,/localStorage/);
 assert.match(js,/button\.textContent='Понятно'/);
});
test('offline UI does not pretend to download packs',()=>{
 assert.match(js,/Комплект пока не опубликован/);
 assert.doesNotMatch(js,/fetch\(|downloadFileAsync|Сохранить выбор/);
});
