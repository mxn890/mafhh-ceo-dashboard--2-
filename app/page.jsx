'use client';
import {useState} from 'react';
import Link from 'next/link';
import Navigation from './components/common/Navigation';
import {StatGrid,OverviewCharts,AlertActivity,RecentAlerts} from './components/common/Analytics';
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
 const shortcuts=[['/module4','PC monitoring →','Active PCs, idle time and usage'],['/attendance/manager','Attendance manager →',"Today's attendance and leave requests"],['/shipments','Shipments →','Bookings and flight updates'],['/alerts','Alerts →','Items that need your attention']];
 return <div className="min-h-screen bg-mist"><Navigation/><main className="container mx-auto px-4 py-8">
  <header><h1>Overview</h1><p className="text-sm text-slate">Choose a section below, or review today’s totals.</p></header>
  <div className="quick-tiles">{shortcuts.map(([href,title,detail])=><Link className="quick-tile" key={href} href={href}><h2>{title}<span className="round-arrow" aria-hidden="true">↗</span></h2><p>{detail}</p></Link>)}</div>
  <StatGrid items={[{label:'Active PCs',value:pc?.summary?.online,of:pc?.summary?.total,href:'/module4',tone:'dark'},{label:'PC alerts today',value:pc?.summary?.alertsToday,href:'/alerts',tone:'danger'},{label:'Shipments pending',value:shipments?.Pending,href:'/shipments'},{label:'Shipments in transit',value:shipments?.Active,href:'/shipments'},{label:'Employees',value:employees?.length,href:'/employees'}]}/>
  {Object.keys(errors).length>0&&<p className="load-note" role="status">Some sources are unavailable: {Object.keys(errors).join(', ')}. Retrying automatically.</p>}
  <div className="analytics-grid overview-feature-grid"><AlertActivity alerts={alerts}/><RecentAlerts alerts={alerts}/></div>
  <OverviewCharts pc={pc} shipments={shipments} employees={employees} attendance={attendance} alerts={alerts}/>
 </main></div>;
}
