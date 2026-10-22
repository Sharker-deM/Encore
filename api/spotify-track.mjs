import {param,preflight,providerGuard,respond,fail,getJson} from './_shared.mjs';
export default async function handler(req,res){
 if(preflight(req,res))return;
 if(await providerGuard(req,res,'spotify-track'))return;
 const id=process.env.SPOTIFY_CLIENT_ID,secret=process.env.SPOTIFY_CLIENT_SECRET;
 if(!id||!secret)return respond(req,res,503,{error:'Spotify Web API is not configured yet. Spotify search links are still available.'});
 const song=param(req,'song',120),artist=param(req,'artist',110);
 if(!song||!artist)return respond(req,res,400,{error:'Artist and song are required.'});
 try{
   const tokenRes=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(id+':'+secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(8500)});
   if(!tokenRes.ok)return respond(req,res,502,{error:'Spotify authentication failed. Check the client ID, secret and account eligibility.'});
   const token=(await tokenRes.json()).access_token;
   const url=new URL('https://api.spotify.com/v1/search');url.searchParams.set('q',`track:${song} artist:${artist}`);url.searchParams.set('type','track');url.searchParams.set('limit','3');
   const data=await getJson(url,{Authorization:'Bearer '+token});
   const tracks=(data.tracks?.items||[]).map(t=>({id:t.id,title:t.name,artist:t.artists?.map(a=>a.name).join(', ')||'',url:t.external_urls?.spotify||'',image:t.album?.images?.[0]?.url||''}));
   return respond(req,res,200,{tracks});
 }catch(e){return fail(req,res,e);}
}
