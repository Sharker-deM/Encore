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
test('home and settings render with unchanged navigation and new cloud controls',()=>{
 const {context,app}=simulatedApp();
 assert.match(app.innerHTML,/YOUR LIVE MUSIC ERA/);
 vm.runInContext("route='settings';render()",context);
 assert.match(app.innerHTML,/Private cloud backup/);
 assert.match(app.innerHTML,/Enable notifications/);
 assert.match(app.innerHTML,/ENCORE v1.8/);
 assert.match(app.innerHTML,/Test connection/);
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
