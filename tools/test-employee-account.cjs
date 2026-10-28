/* Guard original single-instance employee shift, time and gratitude in profile. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/seyveo-business-command.css','utf8');
const js=fs.readFileSync('assets/seyveo-unified-tasks.js','utf8');
for(const id of ['unifiedEmployeeTasksView','svcpEmployeeProfileToggle','svcpEmployeeAccountView',
 'svcpEmployeeAccountBack','svcpEmployeeShiftCard','svcpEmployeeClock','svcpEmployeeHoursDetails',
 'svcpEmployeeThanksCount','unifiedEmployeeAssignments','unifiedEmployeeChatHost',
 'svcpEmployeeDutyBadge','svcpEmployeeHeaderShift']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'One node '+id);
}
const cab=html.slice(html.indexOf('id="svcpEmployeeAccountView"'),html.indexOf('id="unifiedEmployeeAssignments"'));
for(const id of ['svcpEmployeeShiftCard','svcpEmployeeHoursDetails','svcpEmployeeThanksCount'])
 assert.ok(cab.includes('id="'+id+'"'),'Personal cabinet contains '+id);
assert.match(html,/aria-controls="svcpEmployeeAccountView"/);
assert.match(js,/function setEmployeeAccountOpen\(open\)/);
assert.match(js,/employeeAccount\.hidden=!shown/);
assert.match(js,/profileShift\.textContent=active/);
assert.match(css,/data-account-open="true"/);
assert.match(html,/assets\/seyveo-business-command\.css\?v=49/);
assert.match(html,/id="svcpEmployeeChatSearch"/,'One top-right employee chat search trigger');
assert.match(css,/#tasksPage #svcpEmployeeChats #svcpChatDirectory>\.svcp-directory-head\{display:none!important\}/,'Duplicate inner chat heading hidden in employee workspace');
assert.match(js,/function setEmployeeChatSearch\(open\)/,'Search button toggles existing search input');
assert.match(js,/event\.stopPropagation\(\)/,'Search button does not collapse its parent details');
assert.doesNotMatch(html,/class="svcp-employee-profile-caption"/,'No extra visible caption below the avatar');
assert.match(css,/#tasksPage \.svcp-employee-profile-toggle\{\s*position:absolute;right:0;top:0/,'Profile button is in top-right corner');
assert.match(html,/id="svcpEmployeeDutyBadge"/,'Live shift status stays beneath employee name');
assert.match(html,/assets\/seyveo-unified-tasks\.js\?v=16/);
console.log('PASS employee cabinet: original shift, hours and gratitude under avatar; work tasks/chat preserved.');
