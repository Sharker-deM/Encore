import {table} from '../_cloud.mjs';
import {verifyBearer,v2Cors,v2Error,validPush} from '../_multi-user.mjs';
import {pushToUser} from '../_push-v2.mjs';
export const config={maxDuration:25};
export default async function handler(req,res){
 if(v2Cors(req,res,['POST','DELETE']))return;
 try{const uid=await verifyBearer(req),sub=req.body?.subscription;
  if(req.method==='DELETE'){
   if(!validPush(sub))return res.status(400).json({error:'Invalid subscription.'});
   await table('encore_user_subscriptions','DELETE','user_id=eq.'+uid+'&endpoint=eq.'+encodeURIComponent(sub.endpoint));return res.status(200).json({ok:true});
  }
  if(req.body?.action==='test'){
   const result=await pushToUser(uid,{title:'ENCORE account notifications ✨',body:'Only your signed-in devices receive your concert reminders.',tag:'encore-test-v2'});return res.status(200).json({ok:true,...result});
  }
  if(!validPush(sub))return res.status(400).json({error:'Invalid subscription.'});
  await table('encore_user_subscriptions','POST','on_conflict=endpoint',[{endpoint:sub.endpoint,user_id:uid,subscription:sub,updated_at:new Date().toISOString()}],{prefer:'resolution=merge-duplicates'});
  return res.status(200).json({ok:true});
 }catch(e){return v2Error(res,e)}
}
