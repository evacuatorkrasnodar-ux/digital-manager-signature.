/* The approved arrival sparkle is a small white-pearl glint, not a laser. */
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
assert.match(spark,/width:52px;height:52px/,'spark is not a giant cross');
assert.match(spark,/clip-path:polygon/,'rays taper instead of being rectangular bars');
assert.match(spark,/rotate\(-17deg\)/);
assert.match(spark,/rotate\(63deg\)/);
assert.match(spark,/1\.65s/,'short, natural twinkle with a second smaller shimmer');
assert.doesNotMatch(spark,/81,155,191|130,193,221|width:90px/,'old cyan laser is gone');
assert.match(js,/flash\.style\.left=`\$\{target\.left\+target\.width\/2-3\}px`/);
assert.match(js,/setTimeout\(\(\)=>flash\.remove\(\),1800\)/,
 'spark stays mounted through its entire CSS animation');
assert.match(html,/seyveo-sayvi-handoff-demo\.css\?v=21/);
assert.match(html,/seyveo-sayvi-handoff-demo\.js\?v=36/);
process.stdout.write('PASS: petite pearl star, tapered asymmetrical rays, no cyan cross.\n');
