'use client';
import {useEffect,useRef,useState} from 'react';
import {seatViewport} from './seat-viewport.cjs';
export default function SeatVideo({review}){
 const video=useRef(null),[full,setFull]=useState(false),[playing,setPlaying]=useState(false),[time,setTime]=useState(0),[duration,setDuration]=useState(0),[error,setError]=useState('');
 const room=review.reviewKind==='room',viewport=room?null:seatViewport(review.videoViewport),cropped=!!viewport&&!full;
 useEffect(()=>{setFull(false);setPlaying(false);setTime(0);setDuration(0);setError('');},[review.id,review.videoUrl]);
 async function toggle(){const v=video.current;if(!v)return;try{if(v.paused)await v.play();else v.pause();}catch{setError('This browser could not play the saved video. Open the original file in an HEVC-capable player.');}}
 function seek(value){if(!video.current)return;video.current.currentTime=Number(value);setTime(Number(value));}
 const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
 return <div className="mt-5">
  <div className="flex flex-wrap items-center justify-between gap-3 mb-3"><strong>{cropped?'Target-seat video':'Full-room context'}</strong>{viewport&&<button className="btn-secondary" onClick={()=>setFull(v=>!v)}>{full?'Show target seat':'Show full room'}</button>}</div>
  <div className="bg-black rounded-lg overflow-hidden mx-auto" style={cropped?{position:'relative',aspectRatio:viewport.aspectRatio,width:'100%',maxWidth:560}:{width:'100%'}}>
   <video ref={video} playsInline preload="metadata" src={review.videoUrl} aria-label={room?`Room CCTV evidence: ${review.camera}`:`CCTV evidence for ${review.pcId}, physical seat ${review.physicalSeat}`} style={cropped?viewport.videoStyle:{width:'100%',maxHeight:'65vh'}}
    onLoadedMetadata={()=>{const v=video.current;setDuration(Number.isFinite(v.duration)?v.duration:0);}}
    onTimeUpdate={()=>setTime(video.current.currentTime)} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)}
    onError={()=>setError('Playback unavailable in this browser. The original recording may require an HEVC-capable player.')}/>
  </div>
  <div className="flex flex-wrap items-center gap-3 mt-3"><button className="btn-secondary" onClick={toggle} disabled={!!error}>{playing?'Pause':'Play'}</button><label className="flex items-center gap-3 flex-1 min-w-40"><span className="sr-only">Video position</span><input aria-label="Video position" className="w-full" type="range" min="0" max={duration||0} step="1" value={Math.min(time,duration||0)} disabled={!duration} onChange={e=>seek(e.target.value)}/></label><span className="text-xs tabular-nums">{fmt(time)} / {fmt(duration)}</span></div>
  <div className="flex flex-wrap gap-2 mt-3">{(review.samples||[]).map(s=>{const eventStart=review.end-1800;const at=new Date(s.serverRequestedAt).getTime()/1000;const offset=review.videoEventOffsetSeconds;if(!Number.isFinite(offset)||!Number.isFinite(at))return null;return <button key={s.index} className="btn-secondary text-xs" disabled={!duration} onClick={()=>seek(Math.max(0,Math.min(duration,offset+at-eventStart)))}>Sample {s.index}</button>;})}</div>
  {error&&<p role="alert" className="text-signal text-sm mt-3">{error}</p>}
  <p className="text-xs text-slate mt-2">{cropped?'Seat view uses the configured crop; it does not identify the person. ':'Full room shown for context. '}Original recording; no extra video transcoding. Sample jumps are approximate; extracted stills carry their own recording timestamps.</p>
 </div>;
}

