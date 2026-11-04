// Presentation-only derivations. No data writes or estimates of missing records.
export const finite = value => Number.isFinite(Number(value)) && Number(value)>0 ? Number(value) : 0;
const COLORS=['#111111','#C8102E','#777777','#BFBDB7','#E2D6D8','#57534e'];
export function countBy(rows,key){const groups=new Map();for(const row of rows||[]){const label=key(row);groups.set(label,(groups.get(label)||0)+1);}return [...groups].map(([label,value],i)=>({label,value,color:COLORS[i%COLORS.length]}));}
export function pcStatusRows(pcs){return [['Working','ONLINE','#111'],['Idle','IDLE','#777'],['No signal','OFFLINE','#bfbdb7']].map(([label,status,color])=>({label,color,value:(pcs||[]).filter(p=>p.status===status).length}));}
export function severityRows(alerts){return ['HIGH','MEDIUM','LOW'].map((label,i)=>({label,value:(alerts||[]).filter(a=>String(a.severity).toUpperCase()===label).length,color:['#C8102E','#777','#bfbdb7'][i]}));}
export function shipmentRows(summary={}){return ['Pending','Active','Delayed','Completed'].map((label,i)=>({label,value:finite(summary[label]),color:['#bbb8b2','#777','#C8102E','#111'][i]}));}
