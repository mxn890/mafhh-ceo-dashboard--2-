'use client';
import Link from 'next/link';
import {relativeTime as seen,formatPCEmployee} from '../../lib/display-format';
import {mins} from '../common/Analytics';
const LABEL={ONLINE:'Working',IDLE:'Idle',OFFLINE:'No signal'};
export default function PCCard({pc}){
 const tone=pc.alertsToday>0?'has-alerts':pc.status==='IDLE'?'is-idle':pc.status==='OFFLINE'?'is-offline':'';
 return <Link href={`/employees/${pc.seatId||pc.pcId}`} className={`pc-bento ${tone}`}><div className="pc-card-top"><span>{pc.pcId}{pc.shiftKind?` · ${pc.shiftKind}`:''}</span><span className="pc-status">{LABEL[pc.status]||pc.status}</span></div><div className="pc-person"><h3>{formatPCEmployee(pc.employee,pc.pcId)}</h3><p>{pc.department||'Unassigned'} · {pc.location||'Location not set'}</p><p className="pc-current-title" title={pc.currentTitle||''}>{pc.currentTitle||'Nothing reported yet'}</p>{pc.alertsToday>0&&<span className="badge-danger">{pc.alertsToday} alerts{pc.highAlertsToday>0?` · ${pc.highAlertsToday} high`:''}</span>}</div><div className="pc-active-label">Active</div><div className="pc-time-track"><div style={{width:`${Math.min(100,Math.max(0,Number(pc.todayActiveMins)||0)/480*100)}%`}}/></div><div className="pc-active-total">{mins(pc.todayActiveMins)}</div>{pc.topSite?.mins>0&&<p className="pc-top-site" title={pc.topSite.name}>Top: {pc.topSite.name} · {mins(pc.topSite.mins)}</p>}<footer>Seen {seen(pc.lastSeenAt)}</footer></Link>;
}
