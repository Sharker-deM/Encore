import webpush from 'web-push';
import {table} from './_cloud.mjs';
import {userSubscriptions} from './_multi-user.mjs';
function setup(){const pub=process.env.VAPID_PUBLIC_KEY||'',priv=process.env.VAPID_PRIVATE_KEY||'',subject=process.env.VAPID_SUBJECT||'';if(!pub||!priv||!/^mailto:[^@\s]+@[^@\s]+/.test(subject))throw Error('PUSH_NOT_CONFIGURED');webpush.setVapidDetails(subject,pub,priv)}
export async function pushToUser(uid,payload){setup();let delivered=0,failures=0;
 for(const row of await userSubscriptions(uid)){
  try{await webpush.sendNotification(row.subscription,JSON.stringify(payload),{TTL:86400,urgency:'normal'});delivered++}
  catch(e){failures++;if([404,410].includes(e.statusCode))await table('encore_user_subscriptions','DELETE','endpoint=eq.'+encodeURIComponent(row.endpoint)+'&user_id=eq.'+uid).catch(()=>{})}
 }
 return {delivered,failures};
}
