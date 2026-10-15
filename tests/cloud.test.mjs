import test from 'node:test';
import assert from 'node:assert/strict';
import cloudHandler from '../api/cloud.mjs';
import alertHandler from '../api/alerts.mjs';
import pushConfigHandler from '../api/push-config.mjs';

function makeRes(){return {headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v},status(code){this.statusCode=code;return this},json(data){this.jsonBody=data;return this}}}
const saved={getItem:k=>process.env[k]};
test('private cloud rejects uncredentialed fetches',async()=>{
 process.env.ENCORE_SYNC_TOKEN='a'.repeat(64);const req={method:'GET',headers:{},body:null};const res=makeRes();await cloudHandler(req,res);assert.equal(res.statusCode,401);assert.match(res.jsonBody.error,/access code/i);
});
test('cloud backup GET and PUT roundtrip through mocked Supabase REST',async()=>{
 process.env.ENCORE_SYNC_TOKEN='a'.repeat(64);process.env.SUPABASE_SECRET_KEY='sb_secret_'+'b'.repeat(50);process.env.SUPABASE_URL='https://example.supabase.co';
 const fetchOrig=globalThis.fetch;let stored=null,hadAuth=false;
 globalThis.fetch=async(url,opts)=>{
  assert.match(String(url),/https:\/\/example.supabase.co\/rest\/v1\/encore_state/);
  assert.equal(opts.headers.apikey,process.env.SUPABASE_SECRET_KEY);
  assert.equal(opts.headers.Authorization,undefined,'2026 sb_secret keys must not be used as Bearer JWTs');
  hadAuth=true;
  if(opts.method==='POST'){stored=JSON.parse(opts.body)[0].payload;return new Response(JSON.stringify([{payload:stored}]),{status:201})}
  return new Response(JSON.stringify(stored?[{payload:stored}]:[]),{status:200});
 };
 try{
  const headers={authorization:'Bearer '+'a'.repeat(64)};
  const write=makeRes();await cloudHandler({method:'PUT',headers,body:{concerts:[{id:'1',artist:'Test',date:'2026-11-27'}],settings:{}}},write);
  assert.equal(write.statusCode,200);assert.equal(write.jsonBody.concerts,1);
  const read=makeRes();await cloudHandler({method:'GET',headers},read);
  assert.equal(read.statusCode,200);assert.equal(read.jsonBody.data.concerts[0].artist,'Test');assert.ok(hadAuth);
 }finally{globalThis.fetch=fetchOrig}
});
test('alerts require personal code and push config returns only public VAPID key',async()=>{
 process.env.ENCORE_SYNC_TOKEN='a'.repeat(64);process.env.VAPID_PUBLIC_KEY='public-safe';process.env.VAPID_PRIVATE_KEY='private-never-return';
 const denied=makeRes();await alertHandler({method:'GET',headers:{}},denied);assert.equal(denied.statusCode,401);
 const config=makeRes();await pushConfigHandler({method:'GET'},config);assert.equal(config.statusCode,200);assert.equal(config.jsonBody.publicKey,'public-safe');assert.ok(!JSON.stringify(config.jsonBody).includes('private-never-return'));
});
