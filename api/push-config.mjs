import {response,cors} from './_cloud.mjs';
export default function handler(req,res){if(cors(req,res,['GET']))return;const key=process.env.VAPID_PUBLIC_KEY||'';return response(res,200,{ok:true,enabled:!!key,publicKey:key})}
