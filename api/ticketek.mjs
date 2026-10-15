import {param,preflight,respond,fail,getJson} from './_shared.mjs';
// Ticketek parsing can take longer than direct Ticketmaster API requests.
export const config = { maxDuration: 40 };
export default async function handler(req,res){
 if(preflight(req,res))return;
 const key=process.env.PARSE_API_KEY;
 if(!key)return respond(req,res,503,{error:'Ticketek is not configured in Vercel yet.'});
 const mode=param(req,'mode',12)||'event';
 // Your repaired Ticketek Parse.bot scraper. Optionally override in Vercel settings.
 const fallbackScraperId='c6104e15-19a4-485c-8572-d57e7b1a187f';
 const scraperId=(process.env.PARSE_TICKETEK_SCRAPER_ID||fallbackScraperId).trim();
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scraperId)){
   return respond(req,res,503,{error:'Ticketek scraper ID is invalid. Check PARSE_TICKETEK_SCRAPER_ID in Vercel.'});
 }
 const base=`https://api.parse.bot/scraper/${scraperId}/`; 
 let api;
 if(mode==='search'){
   const query=param(req,'query',120);
   if(query.length<2)return respond(req,res,400,{error:'Enter at least two letters to search Ticketek.'});
   api=new URL(base+'search_events');api.searchParams.set('query',query);api.searchParams.set('page','1');
 }else if(mode==='event'){
   let link;
   try{link=new URL(param(req,'url',600));}catch{return respond(req,res,400,{error:'Paste a valid Ticketek event URL.'});}
   if(link.protocol!=='https:'||link.hostname!=='premier.ticketek.com.au'||(!link.pathname.startsWith('/shows/show.aspx')&&!/^\/events\//.test(link.pathname)))return respond(req,res,400,{error:'Only official premier.ticketek.com.au show or ticket URLs are supported.'});
   api=new URL(base+'get_event');api.searchParams.set('url',link.href);
 }else return respond(req,res,400,{error:'Unknown Ticketek operation.'});
 try{
   const data=await getJson(api,{'X-API-Key':key},25000);
   return respond(req,res,200,{provider:'ticketek',mode,data});
 }catch(e){return fail(req,res,e);}
}
