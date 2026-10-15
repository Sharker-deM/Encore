import webpush from 'web-push';
import {subscriptions,eraseSubscription} from './_cloud.mjs';
function ready(){const pub=process.env.VAPID_PUBLIC_KEY||'',priv=process.env.VAPID_PRIVATE_KEY||'',subject=process.env.VAPID_SUBJECT||'';if(!pub||!priv||!/^mailto:[^@\s]+@[^@\s]+/.test(subject))throw Error('VAPID push keys are not configured.');webpush.setVapidDetails(subject,pub,priv)}
export async function sendPush(payload){ready();const subs=await subscriptions();let delivered=0,failures=0;
 for(const sub of subs){try{await webpush.sendNotification(sub,JSON.stringify(payload),{TTL:86400,urgency:'normal'});delivered++;}catch(e){failures++;if([404,410].includes(e.statusCode))await eraseSubscription(sub.endpoint).catch(()=>{})}}
 return {delivered,failures};}
