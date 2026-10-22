import {param,preflight,providerGuard,respond,fail,getJson} from './_shared.mjs';
export default async function handler(req,res){
 if(preflight(req,res))return;
 if(await providerGuard(req,res,'setlists'))return;
 const key=process.env.SETLISTFM_API_KEY;
 if(!key)return respond(req,res,503,{error:'setlist.fm is not configured in Vercel yet.'});
 const artist=param(req,'artist',110);
 if(artist.length<2)return respond(req,res,400,{error:'Enter an artist name first.'});
 try{
   const url=new URL('https://api.setlist.fm/rest/1.0/search/setlists');
   url.searchParams.set('artistName',artist);url.searchParams.set('p','1');
   const raw=await getJson(url,{'x-api-key':key,'Accept':'application/json'});
   const items=(raw.setlist||[]).slice(0,15).map(s=>({
     id:s.id||'',artist:s.artist?.name||'',date:s.eventDate||'',venue:s.venue?.name||'',city:s.venue?.city?.name||'',url:s.url||'',
     songs:(s.sets?.set||[]).flatMap(set=>(set.song||[]).map(song=>({name:song.name||'',cover:song.cover?.name||'',tape:!!song.tape}))).filter(song=>song.name).slice(0,40)
   }));
   return respond(req,res,200,{provider:'setlist.fm',attribution:'Setlist data from setlist.fm',setlists:items});
 }catch(e){return fail(req,res,e);}
}
