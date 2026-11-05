// Presentation-only derivations. No data writes or estimates of missing records.
export const finite = value => Number.isFinite(Number(value)) && Number(value)>0 ? Number(value) : 0;
const COLORS=['#111111','#C8102E','#777777','#BFBDB7','#E2D6D8','#57534e'];
export function countBy(rows,key){const groups=new Map();for(const row of rows||[]){const label=key(row);groups.set(label,(groups.get(label)||0)+1);}return [...groups].map(([label,value],i)=>({label,value,color:COLORS[i%COLORS.length]}));}
export function pcStatusRows(pcs){return [['Working','ONLINE','#111'],['Idle','IDLE','#777'],['No signal','OFFLINE','#bfbdb7']].map(([label,status,color])=>({label,color,value:(pcs||[]).filter(p=>p.status===status).length}));}
export function severityRows(alerts){return ['HIGH','MEDIUM','LOW'].map((label,i)=>({label,value:(alerts||[]).filter(a=>String(a.severity).toUpperCase()===label).length,color:['#C8102E','#777','#bfbdb7'][i]}));}
export function shipmentRows(summary={}){return ['Pending','Active','Delayed','Completed'].map((label,i)=>({label,value:finite(summary[label]),color:['#bbb8b2','#777','#C8102E','#111'][i]}));}

export function departmentStatusRows(pcs=[]) {
 const groups=new Map();
 for(const pc of pcs){
  const label=pc.department||'Unassigned';
  if(!groups.has(label))groups.set(label,{label,total:0,values:[0,0,0,0]});
  const row=groups.get(label),index=['ONLINE','IDLE','OFFLINE'].indexOf(pc.status);
  row.total++;row.values[index<0?3:index]++;
 }
 return [...groups.values()].sort((a,b)=>b.total-a.total);
}

// Use only recorded observations from the same employee/shift and rule.
// No inferred zero points, cumulative sums or invented historical values.
export function alertActivitySeries(alerts=[],now=new Date()) {
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Karachi'});
 const day=date=>formatter.format(date);
 const today=day(now);
 const valid=alerts.filter(a=>Number.isFinite(Date.parse(a.timestamp))&&day(new Date(a.timestamp))===today&&finite(a.duration)>0)
  .sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
 const latest=valid.at(-1);
 if(!latest)return {points:[],latest:null};
 const key=a=>[a.seatId||a.pcId,a.activity||'',a.evidenceKey||a.url||''].join('|');
 const points=valid.filter(a=>key(a)===key(latest)).slice(-24)
  .map(a=>({time:Date.parse(a.timestamp),value:finite(a.duration)}));
 return {points,latest};
}
