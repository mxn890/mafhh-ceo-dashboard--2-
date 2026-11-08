import { NextResponse } from 'next/server';
import { getSession } from '@/app/lib/auth/jwt';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
function validPath(parts) {
  if (!Array.isArray(parts)) return false;
  return /^(?:status|reviews(?:\/[a-f0-9]{64})?|media\/[a-f0-9]{64}\/(?:video\.mp4|sample-[1-6]\.jpg))$/.test(parts.join('/'));
}
async function proxy(request,{params}) {
  // Explicit auth also covers .mp4/.jpg paths excluded by the general middleware matcher.
  if (!await getSession()) return NextResponse.json({error:'Sign in to view CCTV evidence.'},{status:401});
  if (!validPath(params.path)) return NextResponse.json({error:'Not found.'},{status:404});
  const base=process.env.MODULE4_API_URL,key=process.env.MODULE4_API_KEY?.trim();
  if (!base || !key) return NextResponse.json({error:'CCTV connection is not configured.'},{status:503});
  try {
    const headers={'x-api-key':key};
    if (request.headers.get('range')) headers.Range=request.headers.get('range');
    const r=await fetch(base.replace(/\/$/,'')+'/api/module4/cctv/'+params.path.map(encodeURIComponent).join('/'),{method:request.method,headers,cache:'no-store',signal:AbortSignal.timeout(25000)});
    if (!r.ok && r.status!==416) return NextResponse.json({error:r.status===404?'CCTV setup or evidence is not available yet.':'CCTV evidence is temporarily unavailable.'},{status:r.status===404?404:503});
    const out=new Headers({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
    for(const name of ['content-type','content-length','content-range','accept-ranges'])if(r.headers.get(name))out.set(name,r.headers.get(name));
    return new Response(request.method==='HEAD'?null:r.body,{status:r.status,headers:out});
  } catch { return NextResponse.json({error:'CCTV evidence is temporarily unavailable.'},{status:503}); }
}
export const GET=proxy;
export const HEAD=proxy;
