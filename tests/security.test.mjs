import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyBearer,v2Cors} from '../api/_multi-user.mjs';
const sql=readFileSync(new URL('../SUPABASE_V19_SECURITY.sql',import.meta.url),'utf8');
test('all new personal tables have RLS, and client roles cannot edit push subscriptions',()=>{
 for(const name of ['encore_profiles','encore_user_state','encore_friendships','encore_blocks','encore_user_subscriptions','encore_user_notification_log','encore_user_alerts'])assert.match(sql,new RegExp(`alter table public\\.${name} enable row level security;`));
 assert.match(sql,/revoke all on public\.encore_user_subscriptions,public\.encore_user_notification_log,public\.encore_user_alerts from anon,authenticated;/);
 assert.match(sql,/where user_id=\(select auth\.uid\(\)\) and version=expected_version/);
 assert.match(sql,/private\.encore_can_request/);
});
test('v2 endpoint rejects non-allowlisted Origin, including cross-site scripts',()=>{
 const res={headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(x){this.value=x;return this},end(){}};
 assert.equal(v2Cors({method:'POST',headers:{origin:'https://attacker.example'}},res,['POST']),true);
 assert.equal(res.code,403);
 assert.equal(res.headers['Access-Control-Allow-Origin'],undefined);
});
test('identity is verified with Supabase Auth, not accepted from a posted userId',async()=>{
 process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SECRET_KEY='sb_secret_'+'x'.repeat(44);process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_'+'z'.repeat(44);
 const fn=globalThis.fetch;
 globalThis.fetch=async(url,opts)=>{
  assert.match(url,/\/auth\/v1\/user$/);
  assert.equal(opts.headers.apikey,process.env.SUPABASE_PUBLISHABLE_KEY);
  return new Response(JSON.stringify({id:'12345678-1234-1234-1234-1234567890ab',email_confirmed_at:'2026-10-21T00:00:00Z'}),{status:200});
 };
 try{const uid=await verifyBearer({headers:{authorization:'Bearer valid.jwt.token'},body:{userId:'00000000-0000-0000-0000-000000000000'}});assert.equal(uid,'12345678-1234-1234-1234-1234567890ab');}
 finally{globalThis.fetch=fn}
});
test('missing/invalid token is denied without even consulting the database',async()=>{
 await assert.rejects(()=>verifyBearer({headers:{authorization:'Bearer bad token'}}),/AUTH_REQUIRED/);
});
test('service worker only caches public shell assets and rejects authorized/API requests',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(sw,/const PUBLIC_FILES=new Set\(FILES\.map/);
 assert.match(sw,/r\.headers\.has\('Authorization'\)/);
 assert.match(sw,/u\.pathname\.includes\('\/api\/'\)/);
 assert.match(sw,/!PUBLIC_FILES\.has\(u\.href\)/);
});
test('friend invitation quota audit is preserved even if an invitation is deleted',()=>{
 assert.match(sql,/create table if not exists private\.encore_friend_request_audit/);
 assert.match(sql,/from private\.encore_friend_request_audit where requester=/);
 assert.match(sql,/trigger encore_friend_request_audit_trigger after insert/);
});
