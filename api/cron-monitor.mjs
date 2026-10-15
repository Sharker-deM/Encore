import crypto from 'node:crypto';
import {response,cors,cronAuthorized,getState,table,markOnce,subscriptions,error} from './_cloud.mjs';
import {sendPush} from './_push.mjs';
import {getOfficial} from './_monitor-sources.mjs';
import {LOCAL_ZONE,dayInZone,daysUntil,providerCheckDue,reminderDue,savingsDue,differences,summary,reminderMessage,savingsMessage} from './_monitor-logic.mjs';
export const config={maxDuration:60};
export async function runMonitoring(){
 const data=await getState(),concerts=(data?.concerts||[]).filter(x=>x&&x.id&&x.date).slice(0,100),today=dayInZone(new Date(),LOCAL_ZONE);let checked=0,providerFailures=0,notifications=0,foundChanges=0;
 const subs=await subscriptions();
 async function notify(key,kind,payload){if(!subs.length)return;const newEntry=await markOnce(key,kind);if(!newEntry)return;const sent=await sendPush(payload);notifications+=sent.delivered}
 // A single daily batch: exact user-specified reminder clock times aren't guaranteed on Vercel Hobby.
 for(const c of concerts){if(reminderDue(c,today))await notify(`countdown:${c.id}:${today}`,'countdown',reminderMessage(c,daysUntil(c.date,today)));
 if(savingsDue(c,today))await notify(`savings:${c.id}:${today}`,'savings',savingsMessage(c));}
 const due=concerts.filter(c=>!c.archived&&c.status!=='cancelled'&&Number.isFinite(daysUntil(c.date,today))&&daysUntil(c.date,today)>=-3&&daysUntil(c.date,today)<370&&(c.eventId||c.link)&&providerCheckDue(c,today));
 // Cap each execution for the Hobby function duration; rotate if there are unusually many linked events.
 const offset=due.length?Math.floor(Date.parse(today+'T00:00:00Z')/86400000)*8%due.length:0;
 const active=(due.slice(offset).concat(due.slice(0,offset))).slice(0,8);
 // Use batches of 4 so one unavailable provider cannot stop all monitoring.
 for(let i=0;i<active.length;i+=4){await Promise.all(active.slice(i,i+4).map(async c=>{try{
 const latest=await getOfficial(c);checked++;const changes=differences(c,latest);if(!changes.length)return;
 const fingerprint=crypto.createHash('sha256').update(JSON.stringify(changes.map(x=>[x.field,x.after]))).digest('hex');const existing=await table('encore_alerts','GET','concert_id=eq.'+encodeURIComponent(c.id)+'&select=fingerprint,acknowledged');
 if(existing[0]?.fingerprint===fingerprint)return;
 await table('encore_alerts','POST','on_conflict=concert_id',[{concert_id:c.id,fingerprint,changes,latest,acknowledged:false,noticed_at:new Date().toISOString()}],{prefer:'resolution=merge-duplicates'});
 foundChanges++;
 if(c.eventAlerts!==false)await notify(`change:${c.id}:${fingerprint}`,'change',{title:`Update for ${c.artist} ⚠️`,body:summary(changes),url:'https://sharker-dem.github.io/Encore/',tag:'encore-change-'+c.id});
 }catch(err){providerFailures++;}}));}
 return {ok:true,date:today,timezone:LOCAL_ZONE,concerts:concerts.length,checked,providerFailures,foundChanges,notifications,schedule:'daily'};
}
export default async function handler(req,res){if(cors(req,res,['GET']))return;if(!cronAuthorized(req))return response(res,401,{error:'Unauthorised scheduled job.'});try{return response(res,200,await runMonitoring())}catch(e){return error(res,e)}}
