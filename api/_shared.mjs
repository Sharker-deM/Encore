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
export async function getJson(url,headers={},timeoutMs=8500){
  let response;
  try {
    response=await fetch(url,{headers,signal:AbortSignal.timeout(timeoutMs),redirect:'error'});
  } catch (cause) {
    const timedOut=cause?.name==='TimeoutError'||cause?.name==='AbortError';
    const err=new Error(timedOut?'Provider timed out':'Provider network failure');
    err.status=timedOut?504:502;
    err.publicMessage=timedOut?'The event provider took too long to respond. Please try again.':'Could not establish a connection to the event provider. Please try again.';
    throw err;
  }
  if(!response.ok){
    const err=new Error('Provider HTTP error');
    err.status=[400,404,422,429].includes(response.status)?response.status:502;
    err.publicMessage=response.status===429?'Provider rate limit reached. Please wait before trying again.':response.status===401?'Provider request failed (401): the API key was rejected.':response.status===404?'Event not found at the provider.':response.status===422?'The event provider could not process that search. Try a different artist or link.':'Provider request failed ('+response.status+').';
    throw err;
  }
  try { return await response.json(); }
  catch {
    const err=new Error('Provider returned non-JSON');
    err.status=502;
    err.publicMessage='The event provider returned an unreadable response. Please try again later.';
    throw err;
  }
}

