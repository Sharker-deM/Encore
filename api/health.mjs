import {preflight,respond} from './_shared.mjs';
export default function handler(req,res){
 if(preflight(req,res))return;
 return respond(req,res,200,{ok:true,app:'ENCORE',version:'1.9',providers:{ticketmaster:!!process.env.TICKETMASTER_API_KEY,ticketek:!!process.env.PARSE_API_KEY,setlistfm:!!process.env.SETLISTFM_API_KEY,spotify:!!(process.env.SPOTIFY_CLIENT_ID&&process.env.SPOTIFY_CLIENT_SECRET),officialLinks:true,cloud:!!(process.env.SUPABASE_URL&&(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY)),push:!!(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY),dailyMonitoring:true,multiUser:process.env.ENCORE_MULTI_USER_ENABLED==='true'}});
}
