import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBrowserWebViewUrl,shouldLoadBrowserWebViewUrl}
  from '../src/browser/native-webview-policy.mjs';

test('normal public HTTPS websites can be opened in native browser',()=>{
  for(const url of [
    'https://wikipedia.org',
    'https://www.wikipedia.org/wiki/Example',
    'https://www.habr.com/ru/article/42?ref=home',
    'https://ya.ru',
    'https://example.org',
    'https://xn--e1afmkfd.xn--p1ai/'
  ]){
    assert.equal(shouldLoadBrowserWebViewUrl(url),true,url);
    assert.equal(new URL(validateBrowserWebViewUrl(url)).protocol,'https:');
  }
});

test('local, non-HTTPS and malicious schemes are denied',()=>{
  for(const url of [
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'blob:https://example.org/id',
    'file:///etc/passwd',
    'about:blank',
    'http://example.org',
    'http://127.0.0.1:8790',
    'https://localhost',
    'https://127.0.0.1',
    'https://192.168.1.4',
    'https://10.0.0.1',
    'https://[::1]',
    'https://foo.local',
    'https://foo.internal',
    'https://foo.test',
    'https://foo.invalid',
    'https://user:password@example.org',
    'https://example.org:8443',
    '',
    'not a valid URL'
  ]){
    assert.equal(shouldLoadBrowserWebViewUrl(url),false,url);
    assert.throws(()=>validateBrowserWebViewUrl(url),url);
  }
});

test('no user info is stripped from allowed query or fragment',()=>{
  const url='https://example.org/post?topic=abc#section-2';
  assert.equal(validateBrowserWebViewUrl(url),url);
});
