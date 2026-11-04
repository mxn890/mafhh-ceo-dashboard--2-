'use client';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {useState} from 'react';
const LINKS=[['/','Overview'],['/shipments','Shipments'],['/module4','PC Monitoring'],['/cctv','CCTV Review'],['/employees','Employees'],['/attendance','Attendance'],['/alerts','Alerts']];
export default function Navigation(){
 const [open,setOpen]=useState(false);const pathname=usePathname(),router=useRouter();
 async function logout(){await fetch('/api/auth/logout',{method:'POST'});router.push('/login');router.refresh();}
 const active=href=>href==='/'?pathname==='/':pathname.startsWith(href);
 return <nav className="executive-nav" aria-label="Main navigation"><div className="executive-nav-row"><Link className="executive-brand" href="/"><i aria-hidden="true"/>MAFHH AVIATION</Link><div className="executive-nav-links">{LINKS.map(([href,label])=><Link key={href} href={href} aria-current={active(href)?'page':undefined} className={active(href)?'active':''}>{label}</Link>)}</div><button onClick={logout} className="sign-out desktop-sign-out">Sign out</button><button className="nav-toggle" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(!open)}>{open?'✕':'☰'}</button></div>{open&&<div className="mobile-navigation" id="mobile-navigation">{LINKS.map(([href,label])=><Link key={href} href={href} aria-current={active(href)?'page':undefined} className={active(href)?'active':''} onClick={()=>setOpen(false)}>{label}</Link>)}<button className="sign-out" onClick={logout}>Sign out</button></div>}</nav>;
}
