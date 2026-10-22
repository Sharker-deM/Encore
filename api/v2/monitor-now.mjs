import {table} from '../_cloud.mjs';
import {verifyBearer,v2Cors,v2Error,userMarkOnce} from '../_multi-user.mjs';
import {monitorUser} from '../_monitor-v2.mjs';
export const config={maxDuration:60};
export default async function handler(req,res){if(v2Cors(req,res,['POST']))return;
 try{const uid=await verifyBearer(req),bucket=Math.floor(Date.now()/(6*3600000));
 if(!(await userMarkOnce(uid,'manual:'+bucket,'manual-monitor')))return res.status(429).json({error:'Manual monitoring is limited to once every six hours per account.'});
 const rows=await table('encore_user_state','GET','user_id=eq.'+uid+'&select=payload');
 const outcome=await monitorUser(uid,rows[0]?.payload,2);return res.status(200).json({ok:true,...outcome});
 }catch(e){return v2Error(res,e)}
}
