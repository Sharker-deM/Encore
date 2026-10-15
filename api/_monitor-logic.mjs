/** Pure daily reminder and difference decisions. All calendar comparisons in Australia/Brisbane. */
export const LOCAL_ZONE='Australia/Brisbane';
export function dayInZone(date=new Date(),zone=LOCAL_ZONE){const bits=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${bits.year}-${bits.month}-${bits.day}`;}
export function daysUntil(iso,today){if(!/^\d{4}-\d\d-\d\d$/.test(iso||''))return NaN;return Math.round((Date.parse(iso+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000)}
export function reminderDue(c,isoToday){const days=daysUntil(c.date,isoToday);if(!Number.isFinite(days)||days<0||c.archived||['cancelled','postponed'].includes(c.status))return false;
 const lead=Math.min(365,Math.max(1,Number(c.reminderDays)||14));if(days>lead)return false;
 const mode=c.reminderMode||'daily';return mode==='off'?false:mode==='once'?days===lead:mode==='weekly'?((lead-days)%7===0||days===0):mode==='daily';}
export function savingsDue(c,isoToday){if(c.savingsAlerts!==true||!Number(c.target)||c.archived||['cancelled','postponed'].includes(c.status)||daysUntil(c.date,isoToday)<0)return false;const saved=(c.deposits||[]).reduce((s,d)=>s+(Number(d.amount)||0),0);if(saved>=Number(c.target)||(c.deposits||[]).some(d=>d.date===isoToday))return false;const days=daysUntil(c.date,isoToday);const freq=c.frequency||'daily';return freq==='daily'||freq==='weekly'&&days%7===0||freq==='fortnightly'&&days%14===0;}
const fields={date:'Date',time:'Start time',venue:'Venue',city:'City',status:'Status',doorsTime:'Doors open',headlineTime:'Headliner time',supportActs:'Support acts'};
export function differences(old,latest){const changes=[];for(const [field,label] of Object.entries(fields)){
 const prev=String(old[field]||'').trim(),next=String(latest[field]||'').trim();
 // Do not remove a known value because the external page omitted it. Never infer a cancellation from a missing listing.
 if(!next||next===prev)continue;
 // Treat unknown -> scheduled as uninteresting status but show cancellations/postponements.
 if(field==='status'&&next==='scheduled'&&(!prev||prev==='scheduled'))continue;
 // A newly published performance time or support act is an update worth notifying about.
 changes.push({field,label,before:prev||'Not announced',after:next});
 }return changes;}
export function summary(changes){return changes.slice(0,2).map(c=>`${c.label}: ${c.after}`).join(' · ')+(changes.length>2?' · More updates':'')}
export function reminderMessage(c,days){return {title:days===0?`It's show day! ${c.artist} ✨`:`${days} days until ${c.artist} 🎶`,body:`${c.venue||c.city||'Your concert'} · ${c.date}`,url:'https://sharker-dem.github.io/Encore/',tag:`encore-countdown-${c.id}-${days}`}}
export function savingsMessage(c){return {title:`Time to save for ${c.artist} 💜`,body:'Open your concert fund to record today’s contribution.',url:'https://sharker-dem.github.io/Encore/',tag:`encore-savings-${c.id}`}}

/** Throttle paid/fragile parser checks while a concert is far away. */
export function providerCheckDue(c,today){const days=daysUntil(c.date,today);if(!Number.isFinite(days)||days<-3||days>370)return false;
 const ticketmaster=!!c.eventId&&(!c.provider||c.provider==='ticketmaster');if(ticketmaster)return true;
 if(days>30)return days%7===0;
 if(days>7)return days%3===0;
 return true;
}
