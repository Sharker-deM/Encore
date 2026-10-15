import {response,cors,authorized,table,error} from './_cloud.mjs';
import {sendPush} from './_push.mjs';
export const config={maxDuration:30};
function valid(sub){if(typeof sub!=='object'||!sub)return false;try{const url=new URL(sub.endpoint);if(url.protocol!=='https:'||url.username||url.password||url.port)return false;const keys=sub.keys||{};return sub.endpoint.length<1000&&keys.p256dh?.length>30&&keys.auth?.length>6}catch{return false}}
export default async function handler(req,res){if(cors(req,res,['POST','DELETE']))return;if(!authorized(req))return response(res,401,{error:'Invalid cloud access code.'});try{
 const b=req.body||{}, sub=b.subscription;
 if(req.method==='DELETE'){if(!valid(sub))return response(res,400,{error:'Invalid subscription.'});await table('encore_subscriptions','DELETE','endpoint=eq.'+encodeURIComponent(sub.endpoint));return response(res,200,{ok:true});}
 if(b.action==='test'){const outcome=await sendPush({title:'ENCORE notifications are working ✨',body:'Your iPhone can receive ENCORE alerts even while the app is closed.',tag:'encore-test',url:'https://sharker-dem.github.io/Encore/'});return response(res,200,{ok:true,...outcome})}
 if(!valid(sub))return response(res,400,{error:'Invalid browser push subscription.'});
 await table('encore_subscriptions','POST','on_conflict=endpoint',[{endpoint:sub.endpoint,subscription:sub}],{prefer:'resolution=merge-duplicates'});
 return response(res,200,{ok:true});
 }catch(e){return error(res,e)} }
