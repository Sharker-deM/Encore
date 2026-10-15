import {param,preflight,respond,fail,getJson} from './_shared.mjs';
export default async function handler(req,res){
 if(preflight(req,res))return;
 const key=process.env.TICKETMASTER_API_KEY;
 if(!key)return respond(req,res,503,{error:'Ticketmaster is not configured in Vercel yet.'});
 try{
   const id=param(req,'eventId',100), artist=param(req,'artist',110),city=param(req,'city',100);
   let url;
   if(id){if(!/^[a-zA-Z0-9_-]{3,100}$/.test(id))return respond(req,res,400,{error:'Invalid event ID.'});url=new URL('https://app.ticketmaster.com/discovery/v2/events/'+encodeURIComponent(id)+'.json');}
   else{if(artist.length<2)return respond(req,res,400,{error:'Enter at least two letters of the artist name.'});url=new URL('https://app.ticketmaster.com/discovery/v2/events.json');url.searchParams.set('keyword',artist);if(city)url.searchParams.set('city',city);url.searchParams.set('size','20');url.searchParams.set('sort','date,asc');}
   url.searchParams.set('apikey',key);
   const data=await getJson(url);
   return respond(req,res,200,data);
 }catch(e){return fail(req,res,e);}
}
