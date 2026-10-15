/** Static, dependency-free parser for structured Event information from public event pages. */
const MONTHS={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const decode=t=>String(t||'').replace(/&#(x[0-9a-f]+|\d+);?/gi,(m,n)=>{let code=n[0]?.toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return code>0&&code<=0x10ffff?String.fromCodePoint(code):m}).replace(/&(?:amp|quot|apos|lt|gt|nbsp|ndash|mdash|rsquo|lsquo);/gi,m=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' ','&ndash;':'–','&mdash;':'—','&rsquo;':'’','&lsquo;':'‘'}[m]));
const flatten=html=>decode(String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,' ').replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/gi,' ').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim());
const clean=t=>decode(String(t||'')).replace(/\s+/g,' ').trim();
const isoDay=t=>{const v=String(t||'');const match=/\b(20\d\d)-(0[1-9]|1[012])-([012]\d|3[01])(?=T|\b)/.exec(v);return match?match[0]:''};
const clock=t=>{const s=String(t||'').trim();let m=/\b(\d{1,2}):(\d\d)\s*([ap]m)?\b/i.exec(s);if(m){let hour=Number(m[1]);const p=m[3]?.toLowerCase();if(p)hour=(hour%12)+(p==='pm'?12:0);if(hour>23)return '';return String(hour).padStart(2,'0')+':'+m[2]}m=/\b(1[0-2]|0?[1-9])\s*([ap]m)\b/i.exec(s);if(!m)return '';return String(Number(m[1])%12+(m[2].toLowerCase()==='pm'?12:0)).padStart(2,'0')+':00'};
function parseDateFromText(s){const m=/\b(?:Mon|Tue|Tues|Wed|Thu|Thur|Thurs|Fri|Sat|Sun)?[a-z]*[, ]*([0-3]?\d)(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2})\b/i.exec(s);if(!m)return '';const month=MONTHS[m[2].slice(0,3).toLowerCase()];const iso=`${m[3]}-${String(month).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`;return new Date(iso+'T12:00:00Z').toISOString().slice(0,10)===iso?iso:''}
function metas(html){const found={};for(const m of html.matchAll(/<meta\b[^>]*>/gi)){const tag=m[0],attrs={};for(const a of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))attrs[a[1].toLowerCase()]=a[2]??a[3];const name=attrs.property||attrs.name||attrs.itemprop;if(name&&attrs.content)found[name.toLowerCase()]=clean(attrs.content)}return found}
function ldEvents(html){const events=[];for(const tag of html.matchAll(/<script\b[^>]*type\s*=\s*['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi)){
  let parsed;try{parsed=JSON.parse(tag[1].replace(/&quot;/g,'"'))}catch{continue}
  const walk=(obj,depth=0)=>{if(!obj||depth>8)return;if(Array.isArray(obj)){obj.forEach(x=>walk(x,depth+1));return}if(typeof obj!=='object')return;const types=[obj['@type']].flat().map(x=>String(x).toLowerCase());if(types.some(x=>x==='event'||x.endsWith('event')))events.push(obj);if(obj['@graph'])walk(obj['@graph'],depth+1);if(obj.mainEntity)walk(obj.mainEntity,depth+1);if(obj.itemListElement)walk(obj.itemListElement,depth+1)};walk(parsed)}return events}
function pickUrl(input){let v=Array.isArray(input)?input[0]:input;if(v&&typeof v==='object')v=v.url||v.contentUrl||v['@id'];return typeof v==='string'&&/^https:\/\//i.test(v)?v:''}
function nameOf(v){if(Array.isArray(v))v=v[0];return typeof v==='string'?v:typeof v==='object'&&v?String(v.name||''):''}
function isCancelled(status){return String(status||'').toLowerCase().includes('cancel')}
function isPostponed(status){return String(status||'').toLowerCase().includes('postpon')}
function extractEvent(html,sourceUrl){
 const meta=metas(html),ld=ldEvents(html)[0]||{},text=flatten(html);
 const domain=new URL(sourceUrl).hostname.replace(/^www\./,'');
 const isQpac=['qpac.com.au','qtix.com.au'].includes(domain);
 const title=clean(nameOf(ld.name)||meta['og:title']||meta['twitter:title']||(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)||[])[1]).replace(/\s*[|–-]\s*(Queensland Performing Arts Centre(?: \(QPAC\))?|QTIX|QPAC)\s*$/i,'');
 const loc=Array.isArray(ld.location)?ld.location[0]:ld.location||{};
 const venue=clean(nameOf(loc)||meta['event:location']||'');
 let city=clean(loc?.address?.addressLocality||'');
 const image=pickUrl(ld.image)||pickUrl(meta['og:image'])||pickUrl(meta['twitter:image']);
 const start=String(ld.startDate||meta['event:start_time']||'');
 let date=isoDay(start),time=/T(\d\d:\d\d)/.test(start)?RegExp.$1:clock(start);
 let supportActs='';
 if(isQpac){
   // On the Banks pages publish "28 Feb 2027, From 6pm" near the headline;
   // "From 6pm" refers to gates, not necessarily when the main act begins.
   const match=/(\b[0-3]?\d\s+[A-Za-z]+\s+20\d{2}\b)\s*,?\s*From\s+(\d{1,2}(?::\d{2})?\s*[ap]m)/i.exec(text.slice(0,12000));
   if(match){date=date||parseDateFromText(match[1]);time=''}
   if(!date){const m=/(\b[0-3]?\d\s+[A-Za-z]+\s+20\d{2}\b)/i.exec(text.slice(0,7000));if(m)date=parseDateFromText(m[1])}
   if(!city)city='Brisbane';
   const support=/(?:Special Guest|Special Guests|Support Act|Support Acts)\s+([^.!?]{2,90})/i.exec(text);
   if(support)supportActs=clean(support[1]).split(/\s+(?:About On the Banks|Important Information)\b/i)[0].slice(0,90);
 }
 if(!date)date=parseDateFromText(text.slice(0,4500));
 const gatesMatch=/(?:Gates open at|Gates open|Doors open at|Doors open)\s*(\d{1,2}(?::\d{2})?\s*[ap]m)/i.exec(text);
 const from=/(?:\bFrom)\s*(\d{1,2}(?::\d{2})?\s*[ap]m)/i.exec(text.slice(0,6000));
 const doorsTime=clock(gatesMatch?.[1]||(isQpac?from?.[1]:'')||'');
 const ga=/\b(?:standing general admission|standing GA only|all[- ]standing)\b/i.test(text)?'ga':'unknown';
 const status=isCancelled(ld.eventStatus)?'cancelled':isPostponed(ld.eventStatus)?'postponed':'scheduled';
 const heading=clean((/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)||[])[1]?.replace(/<[^>]*>/g,'')||'');
 const artist=clean(nameOf(ld.performer)||(isQpac&&heading&&!/^(?:What.s on|Events|QPAC|On the Banks)$/i.test(heading)?heading:title.replace(/^(?:On the Banks\s*[:–-]\s*)/i,'').split(/\s*[|—]\s*/)[0])).replace(/\s*(?:Tickets|Live in .*)$/i,'');
 const richVenue=venue||(isQpac&&/Cultural Forecourt/i.test(text)?'Cultural Forecourt, South Bank':'');
 const notices=isQpac?/Set times (?:to be announced|will be announced)/i.test(text)?'Set times to be announced (official organiser page).':'':' '; 
 return {artist:artist||title,title,venue:richVenue,city,date,time:isQpac?'':time,doorsTime,posterUrl:image,seatmapUrl:'',ticketType:ga,status,supportActs,eventNotices:notices.trim(),link:sourceUrl,provider:isQpac?'qpac':'official',sourceHost:domain,needsReview:true,extraction:{title:!!title,date:!!date,venue:!!richVenue,image:!!image,doors:!!doorsTime,ga:ga==='ga'},isOfficialEvent:isQpac||ldEvents(html).length>0};
}
export {extractEvent,parseDateFromText,clock,isoDay,ldEvents};
