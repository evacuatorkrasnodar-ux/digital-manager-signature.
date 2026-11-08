import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveWorkspaceNavigation} from '../src/business/workspace-navigation.mjs';

const member=(id,role='employee')=>({
  id:'m-'+id,organizationId:id,kind:'business',
  name:'Компания '+id,role,
  navigation:role==='employee'?'work':'cabinet'
});
const verified=(workspaces=[])=>({
  kind:'verified-workspace-manifest',version:1,
  personal:{id:'personal',kind:'personal'},workspaces,
  activeWorkspaceId:null,issuedAt:Date.parse('2026-11-08T12:00:00Z')
});

test('ONE without verified server account has only personal tasks and calendar',()=>{
  for(const input of [null,undefined,{}, {role:'owner'}, {kind:'preview'}]){
    const nav=deriveWorkspaceNavigation(input,'m-shop');
    assert.deepEqual(nav.tabs,['personal','calendar']);
    assert.equal(nav.activeWorkspaceId,null);
    assert.equal(nav.showWorkSwitch,false);
  }
});
test('verified ONE account can remain personal with multiple jobs attached',()=>{
  const nav=deriveWorkspaceNavigation(verified([
    member('shop-a'),member('shop-b','owner')
  ]));
  assert.equal(nav.mode,'personal');
  assert.deepEqual(nav.tabs,['personal','calendar']);
  assert.equal(nav.workspaces.length,2);
  assert.equal(nav.showWorkSwitch,true);
});
test('same app shows Work after selecting verified employee workspace',()=>{
  const nav=deriveWorkspaceNavigation(verified([member('shop-a')]),'m-shop-a');
  assert.equal(nav.mode,'employee');
  assert.deepEqual(nav.tabs,['personal','calendar','employee']);
  assert.equal(nav.activeWorkspaceId,'m-shop-a');
});
test('same app shows Cabinet only for a verified nonemployee workspace',()=>{
  const nav=deriveWorkspaceNavigation(verified([
    member('shop-a'),member('shop-b','owner')
  ]),'m-shop-b');
  assert.equal(nav.mode,'manager');
  assert.deepEqual(nav.tabs,['personal','calendar','business']);
  assert.equal(nav.activeWorkspaceId,'m-shop-b');
});
test('unknown or revoked context falls back to ONE without pretending access',()=>{
  const nav=deriveWorkspaceNavigation(verified([member('shop-a')]),'m-revoked');
  assert.equal(nav.mode,'personal');
  assert.deepEqual(nav.tabs,['personal','calendar']);
});
test('tampered manifest, duplicate tenant and mismatched role fail closed',()=>{
  const cases=[
    verified([{...member('shop-a'),role:'owner',navigation:'work'}]),
    verified([member('shop-a'),{...member('shop-a'),id:'different'}]),
    verified([{...member('shop-a'),organizationId:'../../other'}]),
    verified([{...member('shop-a'),kind:'family'}]),
    verified([{...member('shop-a'),name:'\nScript'}]),
    {...verified(),version:2},
    {...verified(),personal:{id:'employer'}},
    {...verified(),issuedAt:'yesterday'}
  ];
  for(const m of cases){
    const nav=deriveWorkspaceNavigation(m,'m-shop-a');
    assert.deepEqual(nav.tabs,['personal','calendar']);
    assert.equal(nav.showWorkSwitch,false);
    assert.equal(nav.activeWorkspaceId,null);
  }
});
