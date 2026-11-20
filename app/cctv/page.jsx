'use client';
import { useEffect, useRef, useState } from 'react';
import SeatVideo from './SeatVideo';
import Navigation from '../components/common/Navigation';
const STATE={'waiting-validation':'Awaiting chair calibration',queued:'Queued',exporting:'Preparing footage','waiting-footage':'Waiting for recording',budget:'Waiting for AI budget','ai-requesting':'Reviewing seat images',complete:'Ready for review','needs-review':'Needs attention',expired:'Evidence expired'};
const OBS={person_visible:'Person visible',no_person_visible:'No person visible',unclear:'Unclear view'};
function pkt(value) {if(!value)return '—';return new Date(typeof value==='number'?value*1000:value).toLocaleString('en-GB',{timeZone:'Asia/Karachi',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}
function monitorLabel(s) {
  if (!s) return 'Status unavailable';
  if (!s.enabled) return 'Monitoring disabled';
  if (s.recorder && !s.recorder.healthy) return 'Recorder offline';
  if (s.refinementMode && s.refinementMode !== 'active') return 'Chair calibration pending';
  if (s.reviewActive === false) return 'Reviews paused';
  return s.refinementMode === 'active' ? 'Automatic review on' : 'Activation pending';
}
function Badge({state}) {return <span className={state==='complete'?'badge-success':['needs-review','waiting-validation'].includes(state)?'badge-warning':'badge-info'}>{STATE[state]||state}</span>;}
export default function CCTVPage() {
  const [status,setStatus]=useState(null),[reviews,setReviews]=useState([]),[selected,setSelected]=useState(''),[detail,setDetail]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(true);
  const sequence=useRef(0),detailSequence=useRef(0);
  async function json(path) {const r=await fetch('/api/cctv/'+path,{cache:'no-store'});if(r.status===401){window.location.href='/login';throw Error('Sign in to view CCTV.');}const b=await r.json();if(!r.ok)throw Error(b.error||'CCTV is temporarily unavailable.');return b;}
  async function load() {
    const n=++sequence.current;
    const results=await Promise.allSettled([json('status'),json('reviews')]);
    if(n!==sequence.current)return;
    if(results[0].status==='fulfilled')setStatus(results[0].value);
    if(results[1].status==='fulfilled')setReviews(results[1].value.reviews||[]);
    setError(results.filter(r=>r.status==='rejected').map(r=>r.reason?.message||'CCTV connection unavailable.').join(' '));
    setBusy(false);
  }
  useEffect(()=>{const id=new URLSearchParams(window.location.search).get('review');if(/^[a-f0-9]{64}$/.test(id||''))setSelected(id);load();const timer=setInterval(load,30000);return()=>{clearInterval(timer);sequence.current++;};},[]);
  useEffect(()=>{
    if(!selected){setDetail(null);return;}
    let active=true;
    async function refresh(){const n=++detailSequence.current;try{const d=await json('reviews/'+selected);if(active&&n===detailSequence.current){setDetail(d);setError('');}}catch(e){if(active)setError(e.message);}}
    setDetail(null);refresh();const timer=setInterval(refresh,30000);return()=>{active=false;detailSequence.current++;clearInterval(timer);};
  },[selected]);
  function choose(id){setSelected(id);window.history.replaceState(null,'','/cctv?review='+id);}
  return <div className="min-h-screen bg-mist"><Navigation/><main className="container mx-auto px-4 py-8">
    <header className="flex flex-wrap justify-between gap-4 mb-6"><div><h1>CCTV Review</h1><p className="text-sm text-slate mt-2">PC idle reviews with private video and target-seat evidence.</p></div><div className="flex items-center gap-3"><span className="badge-info">{monitorLabel(status)}</span><button className="btn-secondary" onClick={load}>Refresh</button></div></header>
    {error&&<p role="alert" className="p-4 mb-5 border border-line bg-paper text-signal">{error}</p>}
    <section className="analytics-panel mb-6"><header><h2>Configured workstation views</h2></header><div className="flex flex-wrap gap-3 mt-4">{(status?.mappings||[]).map(m=><div className="border border-line rounded-lg p-3" key={m.pcId}><strong>{m.pcId} · Seat {m.physicalSeat}</strong><p className="text-sm text-slate mt-1">{m.camera==='operations_1'?'Operations 1':'Operations 2'}</p></div>)}{!status&&<p className="text-sm text-slate">The review service will appear here after the VM installation is verified.</p>}</div><p className="text-sm text-slate mt-4">A fresh on-duty PC signal with at least 30 minutes of no input starts one review per idle episode. Six masked seat images are sampled five minutes apart.</p>{status&&<p className="text-xs text-slate mt-3">Last signal check: {pkt(status.lastPollAt)} PKT · CCTV AI calls today: {status.aiCallsToday}/{status.dailyCctvLimit}. The shared Module4 AI budget also applies.</p>}{Object.keys(status?.bindingIssues||{}).length>0&&<p role="alert" className="text-signal text-sm mt-2">Seat binding needs review: {Object.keys(status.bindingIssues).join(', ')}. Reviews for these PCs are held.</p>}{status?.sourceError&&<p role="alert" className="text-signal text-sm mt-2">{status.sourceError}</p>}</section>
    {status?.refinementMode && status.refinementMode!=='active' && <p role="status" className="p-4 mb-5 border border-line bg-paper text-slate">Automatic AI review notices are paused while target-chair mapping is validated. Configured workstation bindings do not mean camera calibration has passed.</p>}
    {status?.recorder && !status.recorder.healthy && <p role="alert" className="p-4 mb-5 border border-line bg-paper text-signal">The recorder is unavailable. New reviews will wait for complete video footage; missing recordings are not treated as employee absence.</p>}
    <section className="cctv-notice mb-6"><h2>Review observations with their context</h2><p>No PC input does not mean absence. Paperwork, calls and other desk work can happen away from the keyboard. Samples do not prove continuous presence, continuous absence, sleeping or an exact departure time. Camera-clock calibration is pending; displayed times use the server recording timeline.</p></section>
    <section className="analytics-panel mb-6"><header><h2>Camera reviews</h2></header>{busy?<p role="status" className="p-4 text-slate">Loading reviews…</p>:!reviews.length?<div className="camera-empty"><p>No automatic reviews yet. Eligible new idle episodes on mapped PCs will appear here after activation; historical test results are not replayed.</p></div>:<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{['PC / employee','Review window (PKT)','Status','Evidence'].map(h=><th className="text-left py-3 pr-4" key={h}>{h}</th>)}</tr></thead><tbody>{reviews.map(r=><tr key={r.id} className="border-t border-line"><td className="py-4 pr-4"><strong>{r.pcId}</strong><span className="block text-slate">{r.employee}</span></td><td className="py-4 pr-4 whitespace-nowrap">{pkt(r.end-1800)} — {pkt(r.end)}</td><td className="py-4 pr-4"><Badge state={r.state}/></td><td className="py-4"><button className="btn-secondary" onClick={()=>choose(r.id)}>View review</button></td></tr>)}</tbody></table></div>}</section>
    {selected&&!detail&&<p role="status" className="text-slate">Loading selected review…</p>}
    {detail&&<section className="analytics-panel"><header className="flex flex-wrap justify-between gap-3"><div><h2>{detail.pcId} · {detail.employee}</h2><p className="text-sm text-slate mt-1">Physical seat {detail.physicalSeat} · {pkt(detail.end-1800)} — {pkt(detail.end)} PKT</p></div><Badge state={detail.state}/></header>
      {detail.manualValidation?<p role="status" className="p-4 mt-4 border border-line bg-mist">Validation preview — this is a video/AI pipeline check, not an employee idle event. No WhatsApp notice will be sent.</p>:<p className="text-sm text-slate mt-4">PC no-input time at trigger: {Math.floor(detail.idleSeconds/60)} minutes. Employee label comes from the PC assignment, not facial identification.</p>}
      {detail.summary&&<p className="p-4 bg-mist border border-line mt-4">{detail.summary}</p>}
      {detail.issue&&<p className="text-sm text-slate mt-3">Review note: {({'recorder-unavailable':'Waiting for the recorder to recover.','v37-validation-pending':'Target-chair mapping validation is pending.','pre-refinement-signal-not-replayed':'This older signal was not replayed after activation.','v37-recording-not-ready':'Waiting for complete recording coverage.','v37-evidence-preparation-failed':'Target-seat evidence preparation needs attention.','v37-provider-outcome-unknown':'The AI outcome is unknown and is not retried automatically.','v37-invalid-evidence':'Target-chair evidence could not be validated.','ai-budget':'The CCTV daily AI allowance is used.','shared-ai-budget':'Waiting for the shared Module4 AI budget.','recording-incomplete':'Some required footage is missing.','recording-not-ready':'Waiting for recording segments to finish.','ai-provider-error':'AI provider did not return a usable result.','ai-outcome-unknown':'The AI request outcome is unknown; it will not be repeated automatically.','ai-evidence-invalid':'AI evidence needs manual review.','evidence-export-failed':'Video preparation needs attention.','storage-limit':'Evidence storage limit reached.','employee-binding-changed':'Employee assignment changed; seat mapping needs review.','employee-binding-missing':'Employee attribution is missing.','seat-binding-incomplete':'Seat binding is incomplete.','evidence-retention':'Private evidence reached its retention limit.','review-too-old':'This review exceeded its processing window.'})[detail.issue]||'This review needs attention.'}</p>}
      {detail.mediaReady&&<><SeatVideo review={detail}/><div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">{(detail.samples||[]).map(s=>{const observation=detail.observations?.find(r=>r.index===s.index);return <figure className="border border-line rounded-lg overflow-hidden" key={s.index}><a href={s.imageUrl} target="_blank" rel="noreferrer"><img src={s.imageUrl} alt={'Target seat '+detail.physicalSeat+', sample '+s.index} className="w-full object-contain bg-ink" style={{height:280}}/></a><figcaption className="p-3"><strong className="text-sm">Sample {s.index} · {pkt(s.serverRequestedAt)} PKT</strong><p className="text-sm text-slate mt-1">{observation?OBS[observation.state]:'AI review pending'}</p></figcaption></figure>;})}</div></>}
      {detail.notified&&<p className="text-xs text-slate mt-4">A review notice was queued for WhatsApp. Queueing is not delivery confirmation.</p>}
    </section>}
  </main></div>;
}

