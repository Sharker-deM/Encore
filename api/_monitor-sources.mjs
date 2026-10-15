import {extractEvent} from './_event-import-parser.mjs';
import {parseOfficialUrl} from './import-event.mjs';
function upstreamError(status){throw new Error(`Provider error (${status})`)}
async function json(url,headers={},timeout=11000){const r=await fetch(url,{headers,redirect:'error',signal:AbortSignal.timeout(timeout)});if(!r.ok)upstreamError(r.status);return r.json()}
function parseTM(t){const v=t._embedded?.venues?.[0]||{},state=String(t.dates?.status?.code||'').toLowerCase(),start=t.dates?.start||{};
 return {date:start.localDate||'',time:start.noSpecificTime?'':(start.localTime||'').slice(0,5),venue:v.name||'',city:v.city?.name||'',status:state.includes('cancel')?'cancelled':state.includes('postpon')?'postponed':state.includes('resched')?'rescheduled':'scheduled',eventNotices:t.info||t.pleaseNote||'',link:t.url||''};}
function parseTK(result){let d=result?.data?.data||result?.data||result||{};
 const performance=Array.isArray(d.performances)?d.performances[0]||{}:{};
 return {date:performance.start_date||d.start_date||'',time:String(performance.start_time||d.start_time||'').slice(0,5),venue:performance.venue||d.venue||'',city:[performance.suburb||d.suburb,performance.state||d.state].filter(Boolean).join(', '),status:/cancel/i.test(d.status||'')?'cancelled':/postpon/i.test(d.status||'')?'postponed':'scheduled',link:d.event_url||''};}
function ticketekLink(c){try{const u=new URL(c.link||'');return u.protocol==='https:'&&u.hostname==='premier.ticketek.com.au'&&(u.pathname.startsWith('/shows/show.aspx')||u.pathname.startsWith('/events/'))?u.href:''}catch{return ''}}
export async function getOfficial(c){
 if(c.eventId&&String(c.provider||'ticketmaster')==='ticketmaster'){
  const key=process.env.TICKETMASTER_API_KEY;if(!key)throw Error('Ticketmaster not configured');const u=new URL(`https://app.ticketmaster.com/discovery/v2/events/${encodeURIComponent(c.eventId)}.json`);u.searchParams.set('apikey',key);return parseTM(await json(u));
 }
 const tk=ticketekLink(c);if(tk){const key=process.env.PARSE_API_KEY,id=(process.env.PARSE_TICKETEK_SCRAPER_ID||'c6104e15-19a4-485c-8572-d57e7b1a187f').trim();if(!key)throw Error('Parse.bot not configured');const u=new URL(`https://api.parse.bot/scraper/${id}/get_event`);u.searchParams.set('url',tk);return parseTK(await json(u,{'X-API-Key':key},25000))}
 const url=parseOfficialUrl(c.link||'');if(!url)throw Error('No supported official page linked');
 const resp=await fetch(url,{redirect:'error',headers:{Accept:'text/html','User-Agent':'Mozilla/5.0 (compatible; ENCOREEventMonitor/1.8; personal use)'},signal:AbortSignal.timeout(11000)});if(!resp.ok)upstreamError(resp.status);const contentType=resp.headers.get('content-type')||'';if(!contentType.includes('text/html'))throw Error('Provider page is not HTML');const html=await resp.text();if(html.length>2_000_000)throw Error('Provider page too large');return extractEvent(html,url.href);
}
export {parseTM,parseTK};
