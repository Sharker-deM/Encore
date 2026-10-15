import {param,preflight,respond,fail,getJson} from './_shared.mjs';

// Ticketmaster often uses the venue suburb (Docklands) instead of the metro city (Melbourne).
// Fallback to countryCode=AU when the exact-city search is sparse; retain multiple tour dates.
function uniqueEvents(groups){
 const found=new Map();
 for(const group of groups) for(const ev of group?._embedded?.events||[]){if(ev?.id&&!found.has(ev.id))found.set(ev.id,ev)}
 return [...found.values()];
}
function cityRelevance(event,city){
 if(!city)return 0;
 const needle=city.toLowerCase().trim();
 const v=event._embedded?.venues?.[0]||{};
 const text=[v.city?.name,v.name,v.address?.line1,v.state?.name,v.state?.stateCode].filter(Boolean).join(' ').toLowerCase();
 if(text.includes(needle))return 3;
 const nearby={melbourne:['docklands','richmond','southbank','east melbourne','st kilda','parkville','south yarra'],brisbane:['boondall','south brisbane','fortitude valley','woolloongabba','bowen hills','milton','herston'],sydney:['olympic park','homebush','darling harbour','moore park','darlinghurst','parramatta'],perth:['burswood','mount lawley','northbridge','subiaco'],adelaide:['hindmarsh','north adelaide'],'gold coast':['broadbeach','surfers paradise','southport']};
 return (nearby[needle]||[]).some(term=>text.includes(term))?2:0;
}
function rankEvents(events,city){
 return events.sort((a,b)=>cityRelevance(b,city)-cityRelevance(a,city)||String(a.dates?.start?.localDate||'').localeCompare(String(b.dates?.start?.localDate||'')));
}
export default async function handler(req,res){
 if(preflight(req,res))return;
 const key=process.env.TICKETMASTER_API_KEY;
 if(!key)return respond(req,res,503,{error:'Ticketmaster is not configured in Vercel yet.'});
 try{
   const id=param(req,'eventId',100),artist=param(req,'artist',110),city=param(req,'city',100);
   if(id){
     if(!/^[a-zA-Z0-9_-]{3,100}$/.test(id))return respond(req,res,400,{error:'Invalid event ID.'});
     const url=new URL('https://app.ticketmaster.com/discovery/v2/events/'+encodeURIComponent(id)+'.json');
     url.searchParams.set('apikey',key);
     return respond(req,res,200,await getJson(url));
   }
   if(artist.length<2)return respond(req,res,400,{error:'Enter at least two letters of the artist name.'});
   const makeUrl=(withCity)=>{
     const u=new URL('https://app.ticketmaster.com/discovery/v2/events.json');
     u.searchParams.set('keyword',artist);
     u.searchParams.set('countryCode','AU');
     if(withCity&&city)u.searchParams.set('city',city);
     u.searchParams.set('size','100');
     u.searchParams.set('sort','date,asc');
     u.searchParams.set('apikey',key);
     return u;
   };
   // For blank city, one Australian search. For a specified city, use a broader
   // fallback if fewer than 6 returned; this catches Melbourne events in Docklands.
   let exact;
   try{exact=await getJson(makeUrl(true));}
   catch(error){if(!city||error.status===401)throw error;exact={};}
   let items=uniqueEvents([exact]);
   let usedBroadSearch=false;
   if(city&&items.length<6){
     const broad=await getJson(makeUrl(false));
     items=uniqueEvents([exact,broad]);
     usedBroadSearch=true;
   }
   const sorted=rankEvents(items,city).slice(0,80);
   return respond(req,res,200,{_embedded:{events:sorted},page:{totalElements:sorted.length},encore:{broadFallback:usedBroadSearch,requestedCity:city||null}});
 }catch(error){return fail(req,res,error)}
}
export {cityRelevance,rankEvents};
