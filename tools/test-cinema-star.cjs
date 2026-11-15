/* The owner-approved original laser-cross is white, original-sized and centred. */
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');

const css=readFileSync(join(__dirname,'../assets/seyveo-sayvi-handoff-demo.css'),'utf8');
const js=readFileSync(join(__dirname,'../assets/seyveo-sayvi-handoff-demo.js'),'utf8');
const html=readFileSync(join(__dirname,'../index.html'),'utf8');
const begin=css.indexOf('.sv-cinema-dock-spark{');
const end=css.indexOf('/* A single soft afterglow',begin);
assert.ok(begin>=0&&end>begin,'spark style remains scoped to its own element');
const spark=css.slice(begin,end);
assert.match(spark,/width:90px;height:90px/,'original size is preserved');
assert.match(spark,/width:100%;height:3px/,'horizontal laser beam is restored');
assert.match(spark,/height:100%;width:3px/,'vertical laser beam is restored');
assert.match(spark,/#fff 50%/,'the optical core is white');
assert.match(spark,/\.95s/,'the original quick flash returns');
assert.doesNotMatch(spark,/81,155,191|130,193,221|81,153,188/,'old cyan coloration is gone');
assert.match(js,/flash\.style\.left=`\$\{target\.left\+target\.width\/2\}px`/);
assert.match(js,/flash\.style\.top=`\$\{target\.top\+target\.height\/2\}px`/);
assert.match(js,/setTimeout\(\(\)=>flash\.remove\(\),1100\)/,
 'spark stays mounted through its entire CSS animation');
assert.match(html,/seyveo-sayvi-handoff-demo\.css\?v=22/);
assert.match(html,/seyveo-sayvi-handoff-demo\.js\?v=37/);
process.stdout.write('PASS: original laser shape, white/silver, 90px and exactly centred.\n');
