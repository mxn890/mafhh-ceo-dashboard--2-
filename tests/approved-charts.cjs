const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const A=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('app/lib/dashboard-analytics.js','utf8')).toString('base64'));
 const now=new Date('2026-11-05T04:00:00Z');
 const records=[
  {pcId:'PC-10',seatId:'PC-10-S1',activity:'idle',duration:30,timestamp:'2026-11-05T01:00:00Z'},
  {pcId:'PC-10',seatId:'PC-10-S1',activity:'idle',duration:45,timestamp:'2026-11-05T02:00:00Z'},
  {pcId:'PC-10',seatId:'PC-10-S2',activity:'idle',duration:80,timestamp:'2026-11-05T01:30:00Z'},
  {pcId:'PC-10',seatId:'PC-10-S1',activity:'non-work',duration:50,timestamp:'2026-11-05T01:40:00Z'},
  {pcId:'PC-10',seatId:'PC-10-S1',activity:'idle',duration:20,timestamp:'2026-11-04T18:59:00Z'},
  {pcId:'PC-10',seatId:'PC-10-S1',activity:'idle',duration:Infinity,timestamp:'bad'}
 ];
 const result=A.alertActivitySeries(records,now);
 assert.deepEqual(result.points.map(p=>p.value),[30,45]);
 assert.deepEqual(result.points.map(p=>p.time),[Date.parse(records[0].timestamp),Date.parse(records[1].timestamp)]);
 assert.equal(A.alertActivitySeries([],now).points.length,0);
 assert.equal(A.alertActivitySeries([{duration:15,timestamp:'bad'}],now).latest,null);
 const pkt=A.alertActivitySeries([{pcId:'PC-01',duration:10,timestamp:'2026-11-04T19:01:00Z'}],now);
 assert.equal(pkt.points.length,1);
 const departments=A.departmentStatusRows([{department:'Ops',pcId:'PC-10',status:'ONLINE'},{department:'Ops',pcId:'PC-10',status:'OFFLINE'},{department:'Ops',status:'UNKNOWN'},{department:'Finance',status:'IDLE'}]);
 assert.deepEqual(departments[0],{label:'Ops',total:3,values:[1,0,1,1]});
 assert.equal(departments.reduce((n,d)=>n+d.values.reduce((s,v)=>s+v,0),0),4);
 assert.equal(records[0].duration,30);
 console.log('PASS approved chart evidence: PKT day, shift/rule isolation, chronological observations, empty/invalid data, department totals, no input mutation');
})();
