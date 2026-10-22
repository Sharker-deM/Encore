/* Per-user monitoring: no message is ever fanned out to all subscriptions.
   Bounded daily batch for small private beta (15 users, 2 lookups each),
   NOT a production scheduler for an unlimited public audience. */
import crypto from 'node:crypto';
import {table} from './_cloud.mjs';
import {userMarkOnce,userSubscriptions} from './_multi-user.mjs';
import {pushToUser} from './_push-v2.mjs';
import {getOfficial} from './_monitor-sources.mjs';
import {LOCAL_ZONE,dayInZone,daysUntil,providerCheckDue,reminderDue,savingsDue,differences,summary,reminderMessage,savingsMessage} from './_monitor-logic.mjs';
const APP_URL=process.env.ENCORE_APP_URL||'https://sharker-dem.github.io/Encore/';
async function notify(uid,key,kind,payload){if(!(await userSubscriptions(uid)).length)return 0;
 if(!(await userMarkOnce(uid,key,kind)))return 0;
 const sent=await pushToUser(uid,{...payload,url:APP_URL});return sent.delivered;
}
export async function monitorUser(uid,payload,maxProviderLookups=2){
 const today=dayInZone(new Date(),LOCAL_ZONE);
 const concerts=(payload?.concerts||[]).filter(c=>c&&typeof c.id==='string'&&typeof c.date==='string').slice(0,150);
 let notifications=0,checked=0,foundChanges=0,providerFailures=0;
 for(const c of concerts){
  if(reminderDue(c,today))notifications+=await notify(uid,`countdown:${c.id}:${today}`,'countdown',reminderMessage(c,daysUntil(c.date,today)));
  if(savingsDue(c,today))notifications+=await notify(uid,`savings:${c.id}:${today}`,'savings',savingsMessage(c));
 }
 const due=concerts.filter(c=>!c.archived&&c.status!=='cancelled'&&
 Number.isFinite(daysUntil(c.date,today))&&daysUntil(c.date,today)>=-3&&daysUntil(c.date,today)<370&&
 (c.eventId||c.link)&&providerCheckDue(c,today));
 const dayIndex=Math.floor(Date.parse(today+'T00:00:00Z')/86400000);
 const offset=due.length?(dayIndex*2)%due.length:0;
 for(const c of due.slice(offset).concat(due.slice(0,offset)).slice(0,maxProviderLookups)){
  try{const latest=await getOfficial(c);checked++;
   const changes=differences(c,latest);if(!changes.length)continue;
   const fingerprint=crypto.createHash('sha256').update(JSON.stringify(changes.map(x=>[x.field,x.after]))).digest('hex');
   const query=`user_id=eq.${uid}&concert_id=eq.${encodeURIComponent(c.id)}&select=fingerprint`;
   const rows=await table('encore_user_alerts','GET',query);
   if(rows[0]?.fingerprint===fingerprint)continue;
   await table('encore_user_alerts','POST','on_conflict=user_id,concert_id',[{user_id:uid,concert_id:c.id,fingerprint,changes,latest,acknowledged:false,noticed_at:new Date().toISOString()}],{prefer:'resolution=merge-duplicates'});
   foundChanges++;
   if(c.eventAlerts!==false)notifications+=await notify(uid,`change:${c.id}:${fingerprint}`,'change',{title:`Update for ${c.artist} ⚠️`,body:summary(changes),tag:`encore-change-${c.id}`});
  }catch{providerFailures++}
 }
 return {checked,foundChanges,providerFailures,notifications,concerts:concerts.length};
}
export async function monitorAllUsers(){const rows=await table('encore_user_state','GET','select=user_id,payload&order=user_id.asc&limit=15');
 const result={ok:true,date:dayInZone(new Date(),LOCAL_ZONE),timezone:LOCAL_ZONE,users:0,checked:0,foundChanges:0,providerFailures:0,notifications:0,limitedToFirst15Users:true};
 for(const item of rows){try{const r=await monitorUser(item.user_id,item.payload,2);result.users++;for(const k of ['checked','foundChanges','providerFailures','notifications'])result[k]+=r[k];}catch{result.providerFailures++}}
 return result;
}
