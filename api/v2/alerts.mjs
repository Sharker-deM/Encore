import {table} from '../_cloud.mjs';
import {verifyBearer,v2Cors,v2Error} from '../_multi-user.mjs';
export default async function handler(req,res){if(v2Cors(req,res,['GET','POST']))return;
 try{const uid=await verifyBearer(req);
 if(req.method==='GET'){const rows=await table('encore_user_alerts','GET','user_id=eq.'+uid+'&acknowledged=eq.false&select=concert_id,fingerprint,changes,latest,noticed_at&order=noticed_at.desc');return res.status(200).json({ok:true,alerts:rows});}
 const id=String(req.body?.concertId||'').slice(0,130),fp=String(req.body?.fingerprint||'').slice(0,130);
 if(!id||!fp)return res.status(400).json({error:'Missing concert or alert ID.'});
 await table('encore_user_alerts','PATCH',`user_id=eq.${uid}&concert_id=eq.${encodeURIComponent(id)}&fingerprint=eq.${encodeURIComponent(fp)}`,{acknowledged:true});return res.status(200).json({ok:true});
 }catch(e){return v2Error(res,e)}
}
