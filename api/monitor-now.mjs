import {response,cors,authorized,markOnce,error} from './_cloud.mjs';
import {runMonitoring} from './cron-monitor.mjs';
export const config={maxDuration:60};
// Manual authenticated run; limited to once per 6-hour bucket to protect parser credits.
export default async function handler(req,res){if(cors(req,res,['POST']))return;if(!authorized(req))return response(res,401,{error:'Invalid cloud access code.'});
 try{const bucket=Math.floor(Date.now()/(6*3600*1000)),allow=await markOnce('manual-monitor:'+bucket,'manual-monitor');if(!allow)return response(res,429,{error:'A manual monitor check has already run recently. Please try again in about six hours.'});return response(res,200,await runMonitoring())}catch(e){return error(res,e)}
}
