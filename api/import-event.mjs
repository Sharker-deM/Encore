import {param,preflight,respond,fail,getJson} from './_shared.mjs';
import {extractEvent} from './_event-import-parser.mjs';
export const config={maxDuration:30};
const ALLOWED=new Set([
 'qpac.com.au','qtix.com.au','onthebanks.com.au',
 'oztix.com.au','moshtix.com.au','eventbrite.com','eventbrite.com.au',
 'frontiertouring.com','frontiertouring.com.au','livenation.com.au'
]);
function parseOfficialUrl(raw){
 let url;try{url=new URL(raw)}catch{return null}
 if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
 const host=url.hostname.toLowerCase().replace(/^www\./,'');
 if(!ALLOWED.has(host))return null;
 if(raw.length>850||!url.pathname||url.pathname==='/')return null;
 url.hash='';return url;
}
async function fetchHtml(url){
 let response;
 try{response=await fetch(url.toString(),{headers:{Accept:'text/html,application/xhtml+xml', 'User-Agent':'Mozilla/5.0 (compatible; ENCOREEventImporter/1.7; personal use)'},redirect:'error',signal:AbortSignal.timeout(12000)});}catch(e){const error=new Error('Official event page unavailable');error.status=502;error.publicMessage='The event page blocked automated reading or timed out. You can still add the concert manually and keep the official link.';throw error}
 if(!response.ok){const error=new Error('Upstream event page '+response.status);error.status=502;error.publicMessage='The official event page could not be read ('+response.status+'). Enter the concert manually and keep the link.';throw error}
 const type=String(response.headers.get('content-type')||'').toLowerCase();
 if(!type.includes('text/html')&&!type.includes('application/xhtml+xml')){const error=new Error('Not HTML');error.status=422;error.publicMessage='The link did not return a readable event page. Add the concert manually instead.';throw error}
 const html=await response.text();
 if(/<title[^>]*>\s*(?:Access Denied|Just a moment|Verify you are human|Robot Check)/i.test(html)||(/captcha|challenge-platform/i.test(html.slice(0,3000))&&!/application\/ld\+json/i.test(html))){const err=new Error('Automated access blocked');err.status=502;err.publicMessage='The event website blocked automatic reading. You can add the concert manually and keep the official link.';throw err;}
 if(html.length>2_000_000){const error=new Error('Page too large');error.status=422;error.publicMessage='The event page is too large for automatic import.';throw error}
 return html;
}
export default async function handler(req,res){
 if(preflight(req,res))return;
 const link=param(req,'url',900),url=parseOfficialUrl(link);
 if(!url)return respond(req,res,400,{error:'Use an HTTPS event link from QPAC, QTIX, Oztix, Moshtix, Eventbrite, Frontier Touring or Live Nation. Ticketmaster and Ticketek links are supported through their own integrations.'});
 try{
   let html;
   try{html=await fetchHtml(url);}
   catch(error){
     // QPAC and QTIX publish corresponding official event pages; try the sister
     // site when one blocks a backend request. Keep the user-supplied source URL.
     const host=url.hostname.replace(/^www\./,'');
     if(!['qpac.com.au','qtix.com.au'].includes(host))throw error;
     const alternative=new URL(url.href);
     alternative.hostname=host==='qpac.com.au'?'www.qtix.com.au':'www.qpac.com.au';
     try{html=await fetchHtml(alternative);}catch{throw error}
   }
   const event=extractEvent(html,url.href);
   if(!event.title&&!event.date)return respond(req,res,422,{error:'The provider did not expose readable event details. Use manual entry and keep the official URL.'});
   return respond(req,res,200,{provider:event.provider,event,warning:'Review all imported details against your ticket. Some fields may be unavailable, and gates-open time is not the headline performance time.'});
 }catch(error){return fail(req,res,error)}
}
export {parseOfficialUrl};
