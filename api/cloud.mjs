import {response,cors,authorized,getState,setState,error} from './_cloud.mjs';
export const config={maxDuration:25};
export default async function handler(req,res){
 if(cors(req,res,['GET','PUT']))return;
 if(!authorized(req))return response(res,401,{error:'Cloud access code is invalid. Check your ENCORE_SYNC_TOKEN.'});
 try{
  if(req.method==='GET'){const payload=await getState();return response(res,200,{ok:true,exists:!!payload,data:payload});}
  const raw=req.body; if(!raw||typeof raw!=='object'||!Array.isArray(raw.concerts)||raw.concerts.length>150||typeof raw.settings!=='object'||JSON.stringify(raw).length>1_500_000)return response(res,400,{error:'Concert backup is not valid or is too large (1.5 MB max).'});
  await setState({concerts:raw.concerts,settings:raw.settings||{}});
  return response(res,200,{ok:true,concerts:raw.concerts.length});
 }catch(e){return error(res,e)}
}
