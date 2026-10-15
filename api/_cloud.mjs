import crypto from 'node:crypto';
const FRONTEND='https://sharker-dem.github.io';
function response(res,code,payload){res.setHeader('Access-Control-Allow-Origin',FRONTEND);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');return res.status(code).json(payload)}
export {response};
export function cors(req,res,methods=['GET']){if(req.method==='OPTIONS'){response(res,200,{ok:true});return true}if(!methods.includes(req.method)){response(res,405,{error:'Method not allowed.'});return true}return false}
function equal(a,b){const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&crypto.timingSafeEqual(x,y)}
export function authorized(req){const expected=process.env.ENCORE_SYNC_TOKEN||'';return expected.length>=32&&equal(req.headers.authorization,`Bearer ${expected}`)}
export function cronAuthorized(req){const expected=process.env.CRON_SECRET||'';return expected.length>=16&&equal(req.headers.authorization,`Bearer ${expected}`)}
export function conf(){const url=process.env.SUPABASE_URL||'',key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';if(!url.startsWith('https://')||key.length<24)throw Error('Cloud database not configured.');return {base:url.replace(/\/+$/,''),key}}
export async function table(table,method='GET',query='',body,extra={}){
 const {base,key}=conf();const url=base+'/rest/v1/'+table+(query?'?'+query:'');let resp;
 try{resp=await fetch(url,{method,headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${key}`}), 'Content-Type':'application/json',Accept:'application/json',Prefer:'return=representation'+(extra.prefer?','+extra.prefer:''),...extra.headers},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(13000)});}catch{throw Error('Cloud database could not be reached.')}
 if(!resp.ok){throw Error(`Cloud database request failed (${resp.status}).`)}
 const text=await resp.text();try{return text?JSON.parse(text):[]}catch{throw Error('Cloud database returned unreadable data.')}
}
export async function getState(){const rows=await table('encore_state','GET','id=eq.primary&select=payload');return rows[0]?.payload||null}
export async function setState(payload){await table('encore_state','POST','on_conflict=id',[{id:'primary',payload,updated_at:new Date().toISOString()}],{prefer:'resolution=merge-duplicates'});}
export async function subscriptions(){const rows=await table('encore_subscriptions','GET','select=subscription');return rows.map(x=>x.subscription)}
export async function markOnce(key,kind){try{await table('encore_notification_log','POST','',[{notification_key:key,kind}]);return true}catch(e){ // Unique key conflict means this alert has already been processed.
 if(e.message.includes('(409)'))return false;throw e;
}}
export async function eraseSubscription(endpoint){await table('encore_subscriptions','DELETE','endpoint=eq.'+encodeURIComponent(endpoint))}
export function error(res,e){return response(res,503,{error:e.message?.startsWith('Cloud database')?e.message:'The cloud service could not complete this request.'})}
