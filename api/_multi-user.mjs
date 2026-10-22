/* Privileged v2 endpoints must verify the signed-in user with Supabase Auth.
   The public publishable key identifies our project; it is NOT an admin key. */
import {conf,table} from './_cloud.mjs';
export async function verifyBearer(req){
 const auth=String(req.headers.authorization||'');
 if(!/^Bearer [A-Za-z0-9._~+\-/]+=*$/.test(auth)||auth.length>6000)throw Error('AUTH_REQUIRED');
 const jwt=auth.slice(7),{base}=conf();
 const publicKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||'';
 if(!publicKey||publicKey.startsWith('sb_secret_'))throw Error('AUTH_UNCONFIGURED');
 let r;
 try{r=await fetch(`${base}/auth/v1/user`,{headers:{apikey:publicKey,Authorization:`Bearer ${jwt}`},signal:AbortSignal.timeout(9000)});}catch{throw Error('AUTH_UNAVAILABLE')}
 if(!r.ok)throw Error('AUTH_REQUIRED');
 const user=await r.json();
 if(!/^[0-9a-f-]{36}$/i.test(user.id||'')||!user.email_confirmed_at)throw Error('AUTH_REQUIRED');
 return user.id;
}
export function v2Cors(req,res,allowed=['POST']){
 const origin=String(req.headers.origin||'');
 res.setHeader('Vary','Origin');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 // A valid CORS origin DOES NOT authorize the user. Every request needs Auth.
 const allowedOrigins=['https://sharker-dem.github.io',...(process.env.ENCORE_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)];
 if(allowedOrigins.includes(origin))res.setHeader('Access-Control-Allow-Origin',origin);
 res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
 res.setHeader('Access-Control-Allow-Methods',allowed.join(', ')+', OPTIONS');
 if(origin&&!allowedOrigins.includes(origin)){res.status(403).json({error:'Origin not permitted.'});return true}
 if(req.method==='OPTIONS'){res.status(204).end();return true}
 if(!allowed.includes(req.method)){res.status(405).json({error:'Method not allowed.'});return true}
 return false;
}
export function v2Error(res,e){
 if(e.message==='AUTH_REQUIRED')return res.status(401).json({error:'Please sign in again.'});
 if(e.message==='AUTH_UNCONFIGURED')return res.status(503).json({error:'Account backend is not configured.'});
 if(e.message==='AUTH_UNAVAILABLE')return res.status(503).json({error:'Could not validate your session. Try again.'});
 // No internal SQL or tokens in client-facing errors.
 console.error('ENCORE v2 request failed',String(e.message||e).slice(0,180));
 return res.status(503).json({error:'This request could not be completed.'});
}
export function validPush(sub){if(!sub||typeof sub!=='object'||typeof sub.endpoint!=='string')return false;try{const u=new URL(sub.endpoint);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&sub.endpoint.length<1000&&typeof sub.keys?.p256dh==='string'&&sub.keys.p256dh.length>30&&typeof sub.keys?.auth==='string'&&sub.keys.auth.length>6}catch{return false}}
export async function userSubscriptions(uid){const rows=await table('encore_user_subscriptions','GET','user_id=eq.'+encodeURIComponent(uid)+'&select=endpoint,subscription');return rows}
export async function userMarkOnce(uid,key,kind){try{await table('encore_user_notification_log','POST','',[{user_id:uid,notification_key:key,kind}]);return true}catch(e){if(e.message.includes('(409)'))return false;throw e}}
