import {response,cors,authorized,table,error} from './_cloud.mjs';
export default async function handler(req,res){if(cors(req,res,['GET','POST']))return;if(!authorized(req))return response(res,401,{error:'Invalid cloud access code.'});try{
 if(req.method==='GET'){const rows=await table('encore_alerts','GET','acknowledged=eq.false&select=concert_id,fingerprint,changes,latest,noticed_at&order=noticed_at.desc');return response(res,200,{ok:true,alerts:rows})}
 const id=String(req.body?.concertId||'').slice(0,130),fingerprint=String(req.body?.fingerprint||'').slice(0,130);if(!id||!fingerprint)return response(res,400,{error:'Missing concert or alert ID.'});
 await table('encore_alerts','PATCH',`concert_id=eq.${encodeURIComponent(id)}&fingerprint=eq.${encodeURIComponent(fingerprint)}`,{acknowledged:true});return response(res,200,{ok:true});
 }catch(e){return error(res,e)}}
