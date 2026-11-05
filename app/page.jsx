'use client';
import {useState} from 'react';
import Link from 'next/link';
import Navigation from './components/common/Navigation';
import {Panel,StatGrid,OverviewCharts,Bars} from './components/common/Analytics';
import {shipmentRows} from './lib/dashboard-analytics';
import {relativeTime,formatAlertText} from './lib/display-format';
import {useLivePolling} from './lib/useLivePolling';

export default function Homepage(){
 const [pc,setPc]=useState(null),[shipments,setShipments]=useState(null),[employees,setEmployees]=useState(null),[alerts,setAlerts]=useState(null),[attendance,setAttendance]=useState(null),[errors,setErrors]=useState({});
 async function load(){
  async function source(key,url,done){
   try{const r=await fetch(url),b=await r.json();if(!r.ok)throw Error(b.error||'Request failed');done(b);setErrors(v=>{const next={...v};delete next[key];return next;});}
   catch(e){setErrors(v=>({...v,[key]:e.message}));}
  }
  await Promise.all([
   source('pc','/api/pc-monitoring',setPc),source('shipments','/api/shipments',b=>setShipments(b.summary)),
   source('employees','/api/employees',b=>setEmployees(b.employees||[])),source('alerts','/api/alerts',b=>setAlerts(b.alerts||[])),
   source('attendance','/api/attendance/overview',setAttendance)
  ]);
 }
 useLivePolling(load);
 const shortcuts=[['/module4','PC monitoring','Status and usage'],['/attendance/manager','Attendance manager','Attendance and leave'],['/shipments','Shipments','Bookings and flights'],['/alerts','Alerts','Items needing attention']];
 return <div className="min-h-screen bg-mist"><Navigation/><main className="container mx-auto px-4 py-8">
  <header><h1>Overview</h1><p className="text-sm text-slate">Today's operations at a glance.</p></header>
  <div className="quick-tiles">{shortcuts.map(([href,title,detail])=><Link className="quick-tile" key={href} href={href}><h2>{title}<span className="round-arrow" aria-hidden="true">↗</span></h2><p>{detail}</p></Link>)}</div>
  <StatGrid items={[{label:'Active PCs',value:pc?.summary?.online,of:pc?.summary?.total,href:'/module4',tone:'dark'},{label:'PC alerts today',value:pc?.summary?.alertsToday,href:'/alerts',tone:'danger'},{label:'Shipments pending',value:shipments?.Pending,href:'/shipments'},{label:'Shipments in transit',value:shipments?.Active,href:'/shipments'},{label:'Employees',value:employees?.length,href:'/employees'}]}/>
  {Object.keys(errors).length>0&&<p className="load-note" role="status">Some sources are unavailable: {Object.keys(errors).join(', ')}. Retrying automatically.</p>}
  <div className="analytics-grid two">
   <Panel title="Shipments by status">{shipments?<Bars rows={shipmentRows(shipments)}/>:<p className="chart-empty">{errors.shipments?'Data unavailable':'Loading shipments…'}</p>}</Panel>
   <Panel title="Recent alerts"><div className="recent-alerts">{alerts?.slice(0,4).map((a,i)=><div className="recent-alert" key={a._id||i}><div><p>{formatAlertText(a.message)}</p><small>{relativeTime(a.timestamp)}</small></div><span className={String(a.severity).toUpperCase()==='HIGH'?'badge-danger':'badge-warning'}>{a.severity}</span></div>)}{alerts?.length===0&&<p className="chart-empty">No recent alerts.</p>}{!alerts&&<p className="chart-empty">{errors.alerts?'Data unavailable':'Loading alerts…'}</p>}<Link href="/alerts" className="text-sm text-signal">View all alerts →</Link></div></Panel>
  </div>
  <details className="insight-disclosure"><summary>More operational breakdowns</summary><div className="insight-content"><OverviewCharts pc={pc} shipments={shipments} employees={employees} attendance={attendance} alerts={alerts}/></div></details>
 </main></div>;
}
