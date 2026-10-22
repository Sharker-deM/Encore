import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function simulatedApp(){
 const app={innerHTML:''},toast={textContent:'',classList:{add(){},remove(){}}};
 const kv=new Map();
 const localStorage={getItem:k=>kv.get(k)||null,setItem:(k,v)=>kv.set(k,String(v)),removeItem:k=>kv.delete(k)};
 const document={querySelector:s=>s==='#app'?app:s==='#toast'?toast:null,querySelectorAll:()=>[],addEventListener(){},hidden:false};
 const context=vm.createContext({document,localStorage,navigator:{onLine:false},window:{scrollTo(){}},console,Intl,Date,Number,Object,Array,Map,Set,JSON,Math,String,Boolean,URL,URLSearchParams,Blob,crypto:{randomUUID:()=> 'test-uid'},setTimeout:()=>0,clearTimeout(){},confirm:()=>true,fetch:()=>{throw Error('Unexpected fetch')}});
 vm.runInContext(readFileSync(new URL('../app.js',import.meta.url),'utf8'),context);
 return {context,app,kv};
}
test('home and settings render with friends route and account controls',()=>{
 const {context,app}=simulatedApp();
 assert.match(app.innerHTML,/YOUR LIVE MUSIC ERA/);
 vm.runInContext("route='settings';render()",context);
 assert.match(app.innerHTML,/Loading secure account/);
 assert.doesNotMatch(app.innerHTML,/ENCORE_SYNC_TOKEN/);
 assert.match(app.innerHTML,/ENCORE v1.9/);
 assert.match(app.innerHTML,/Friends/);
});
test('date-only concert, seats and budgets still render',()=>{
 const {context,app}=simulatedApp();
 vm.runInContext(`db.concerts.push({id:'abc',artist:'Harry Styles',date:'2026-11-27',time:'',venue:'Marvel Stadium',city:'Docklands',ticketType:'seated',section:'L1',row:'A',seat:'4',target:120,expenses:[],deposits:[]});selected='abc';route='detail';render()`,context);
 assert.match(app.innerHTML,/Harry Styles/);
 assert.match(app.innerHTML,/Marvel Stadium/);
 assert.match(app.innerHTML,/Reserved seat/);
 vm.runInContext("detailTab='budget';render()",context);
 assert.match(app.innerHTML,/Concert savings/);
 vm.runInContext("detailTab='info';render()",context);
 assert.match(app.innerHTML,/Row A/);
});

test('account mode does not load another user’s or legacy browser data',()=>{
 const {context,kv,app}=simulatedApp();
 kv.set('encore-v1',JSON.stringify({concerts:[{id:'private',artist:'Secret concert',date:'2027-01-01'}]}));
 vm.runInContext('db=loadDB();render()',context);
 assert.doesNotMatch(app.innerHTML,/Secret concert/);
 vm.runInContext("window.ENCORE_APPLY_STATE({concerts:[{id:'a',artist:'Account A',date:'2027-01-01'}],settings:{}})",context);
 assert.match(app.innerHTML,/Account A/);
 vm.runInContext("window.ENCORE_APPLY_STATE({concerts:[{id:'b',artist:'Account B',date:'2027-01-02'}],settings:{}})",context);
 assert.match(app.innerHTML,/Account B/);
 assert.doesNotMatch(app.innerHTML,/Account A/);
});
