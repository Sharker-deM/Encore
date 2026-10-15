/** Shared helpers. Files beginning with _ are not deployed as public API routes. */
const ORIGIN = 'https://sharker-dem.github.io';
export function respond(req,res,status,payload){
  res.setHeader('Access-Control-Allow-Origin',ORIGIN);
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(status).json(payload);
}
export function preflight(req,res){
  if(req.method==='OPTIONS'){respond(req,res,200,{ok:true});return true;}
  if(req.method!=='GET'){respond(req,res,405,{error:'Only GET requests are supported.'});return true;}
  return false;
}
export function param(req,k,max=160){
  const v=req.query?.[k];return typeof v==='string'?v.trim().slice(0,max):'';
}
export function fail(req,res,e){
  const status=(Number.isInteger(e.status)&&e.status>=400&&e.status<600)?e.status:502;
  // Never echo secrets or upstream response bodies to the browser.
  return respond(req,res,status,{error:e.publicMessage||'The information provider could not be reached. Try again later.'});
}
export async function getJson(url,headers={}){
  const response=await fetch(url,{headers,signal:AbortSignal.timeout(8500),redirect:'error'});
  if(!response.ok){const err=new Error('Provider error');err.status=[400,404,429].includes(response.status)?response.status:502;err.publicMessage=response.status===429?'Provider rate limit reached. Please try again later.':response.status===404?'Event not found at the provider.':'Provider request failed ('+response.status+').';throw err;}
  return response.json();
}
