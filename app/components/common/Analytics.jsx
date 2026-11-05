'use client';
import Link from 'next/link';
import {formatCount,formatMinutes,formatShift} from '../../lib/display-format';
import { countBy, finite, pcStatusRows, severityRows, shipmentRows } from '../../lib/dashboard-analytics';

export function Panel({title,subtitle,children,className=''}) {
  return <section className={`analytics-panel ${className}`}><header><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</header>{children}</section>;
}
export function StatGrid({items}) {
  return <div className="stat-grid" style={{'--stat-columns':items.length}}>{items.map(({label,value,of,tone,href,onClick},i)=>{
    const content=<><span className="stat-label">{label}</span><strong>{typeof value==='number'?formatCount(value):(value??'—')}{of!=null&&<small>/{formatCount(of)}</small>}</strong><span className="stat-symbol" aria-hidden="true">{tone==='danger'?'!':tone==='dark'?'◔':'↗'}</span></>;
    const props={className:`stat-tile ${tone||''}`};
    return href?<Link key={label} {...props} href={href}>{content}</Link>:onClick?<button key={label} {...props} type="button" onClick={onClick}>{content}</button>:<div key={label} {...props}>{content}</div>;
  })}</div>;
}
export function Donut({rows,unit='records',format=formatCount}) {
  const total=rows.reduce((n,r)=>n+finite(r.value),0);let offset=0;
  return <div className="donut-wrap"><div className="donut-visual"><svg viewBox="0 0 160 160" role="img" aria-label={rows.map(r=>`${r.label}: ${format(r.value)}`).join(', ')}><circle cx="80" cy="80" r="58" fill="none" stroke="#e7e5e0" strokeWidth="18"/>{rows.filter(r=>finite(r.value)>0).map((r,i)=>{const length=r.value/total*100;const start=offset;offset+=length;return <circle key={r.label} cx="80" cy="80" r="58" pathLength="100" fill="none" stroke={r.color||'#111'} strokeWidth="18" strokeDasharray={`${length} ${100-length}`} strokeDashoffset={-start} transform="rotate(-90 80 80)"><title>{r.label}: {format(r.value)}</title></circle>;})}</svg><div className="donut-total"><strong>{format(total)}</strong><span>{unit}</span></div></div><div className="chart-legend">{rows.map(r=><span key={r.label}><i style={{background:r.color||'#111'}}/>{r.label} <b>{format(r.value)}</b></span>)}</div>{!total&&<p className="chart-empty">No recorded data</p>}</div>;
}
export function Bars({rows,format=formatCount,compact=false}) {
  const max=Math.max(1,...rows.map(r=>finite(r.value)));
  return <div className={`bar-chart ${compact?'compact':''}`}><div className="bar-plot">{rows.map((r,i)=><div className="bar-column" key={r.label}><span className="bar-value">{format(r.value)}</span><div className="bar-track"><div className="bar-fill" style={{height:`${Math.max(0,finite(r.value))/max*100}%`,background:r.color||(i===0?'#C8102E':'#111')}}/></div><span className="bar-label" title={r.label}>{r.label}</span></div>)}</div>{!rows.length&&<p className="chart-empty">No recorded data</p>}</div>;
}
export function Ranking({rows,unit=''}) {
  const sorted=[...rows].sort((a,b)=>b.value-a.value),max=Math.max(1,...sorted.map(r=>r.value));
  return <div className="ranking">{sorted.map((r,i)=><div className="ranking-row" key={r.label}><span title={r.label}>{r.label}</span><div className="ranking-track"><div style={{width:`${r.value/max*100}%`,background:i===0?'#C8102E':'#111'}}/></div><b>{formatCount(r.value)}{unit}</b></div>)}{!rows.length&&<p className="chart-empty">No recorded data</p>}</div>;
}
export function OverviewCharts({pc,shipments,employees,attendance,alerts}) {
 return <>
  <div className="analytics-grid four">
   <Panel title="PC status" subtitle="Current monitoring signal">{pc?<Donut rows={pcStatusRows(pc.pcs||[])} unit="seats"/>:<Unavailable/>}</Panel>
   <Panel title="Alerts by severity" subtitle="Latest returned alerts">{alerts?<Donut rows={severityRows(alerts)} unit="alerts"/>:<Unavailable/>}</Panel>
   <Panel title="Attendance" subtitle="Today's recorded statuses">{attendance?<Donut rows={Object.entries(attendance.summary||{}).map(([label,value],i)=>({label,value,color:['#111','#C8102E','#777','#bfbcb5','#e3d7d7'][i%5]}))} unit="employees"/>:<Unavailable/>}</Panel>
   <Panel title="Employees by shift" subtitle="Current employee roster">{employees?<Donut rows={countBy(employees,e=>formatShift(e.shift_timing))} unit="people"/>:<Unavailable/>}</Panel>
  </div>
  <div className="analytics-grid three">
   <Panel title="Shipments" subtitle="Overview by status">{shipments?<Bars rows={shipmentRows(shipments)}/>:<Unavailable/>}</Panel>
   <Panel title="Shipments share" subtitle="Total distribution">{shipments?<Donut rows={shipmentRows(shipments)} unit="shipments"/>:<Unavailable/>}</Panel>
   <Panel title="PCs by department" subtitle="Registered monitoring seats">{pc?<Ranking rows={countBy(pc.pcs||[],p=>p.department||'Unassigned')}/>:<Unavailable/>}</Panel>
  </div>
 </>;
}
export function PCCharts({pcs}) {
 return <details className="insight-disclosure"><summary>Usage charts and breakdowns</summary><div className="insight-content"><div className="analytics-grid wide"><Panel title="Active time by PC" subtitle="Hours and minutes recorded today"><Bars compact rows={pcs.map(p=>({label:p.pcId+(p.shiftKind?` · ${p.shiftKind}`:''),value:finite(p.todayActiveMins)}))} format={mins}/></Panel><Panel title="PC status" subtitle="Current signal distribution"><Donut rows={pcStatusRows(pcs)} unit="seats"/></Panel></div><div className="analytics-grid three"><Panel title="Alerts by PC" subtitle="Today's alert count"><Ranking rows={pcs.filter(p=>p.alertsToday>0).map(p=>({label:`${p.pcId} · ${p.employee}`,value:p.alertsToday}))}/></Panel><Panel title="PCs by location" subtitle="Registered monitoring seats"><Ranking rows={countBy(pcs,p=>p.location||'Unassigned')}/></Panel><Panel title="Machines requiring review" subtitle="PCs with alerts today"><div className="review-links">{pcs.filter(p=>p.alertsToday>0).slice(0,3).map(p=><Link key={p.seatId||p.pcId} href={`/employees/${p.seatId||p.pcId}`}><strong>{p.pcId} · {p.employee}</strong><span className="badge-danger">{p.alertsToday} alerts</span></Link>)}{!pcs.some(p=>p.alertsToday>0)&&<p className="chart-empty">No PC alerts recorded today.</p>}</div></Panel></div></div></details>;
}
export function ShipmentCharts({summary}) {
 return <details className="insight-disclosure"><summary>Shipment status chart</summary><div className="insight-content"><Panel title="Shipments by status"><Bars rows={shipmentRows(summary)}/></Panel></div></details>;
}
export function EmployeeCharts({employees}) {return <div className="analytics-grid two"><Panel title="Employees by department" subtitle="Current employee roster"><Ranking rows={countBy(employees,e=>e.department||'Unassigned')}/></Panel><Panel title="Employees by shift" subtitle="Assigned shift timings"><Donut rows={countBy(employees,e=>formatShift(e.shift_timing))} unit="people"/></Panel></div>;}
export function AlertCharts({alerts}) {return <details className="insight-disclosure"><summary>Alert breakdowns</summary><div className="insight-content"><div className="analytics-grid two"><Panel title="Alerts by severity" subtitle="Selected day and PC"><Donut rows={severityRows(alerts)} unit="alerts"/></Panel><Panel title="Alerts by employee" subtitle="Selected day and PC"><Ranking rows={countBy(alerts,a=>a.employee||a.pcId||'Unassigned')}/></Panel></div></div></details>;}
export const mins = formatMinutes;
function Unavailable(){return <p className="chart-empty">Data unavailable</p>;}
