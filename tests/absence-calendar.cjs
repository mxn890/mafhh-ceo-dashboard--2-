const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),cache=new Map();let session={role:'ceo'},clock='2026-11-20T13:00:01Z',employees=[],records=[];
class FakeDate extends Date {constructor(...a){super(...(a.length?a:[clock]));}static now(){return +new Date(clock);}}
const context=vm.createContext({Date:FakeDate,console,Map,Set,Number,String,Array,Error,Object});
function query(value){return {sort(){return this},limit(){return this},lean(){return this},then(ok,no){return Promise.resolve(value).then(ok,no)}}}
function match(r,q){return (!q.employeeId||r.employeeId===q.employeeId)&&(!q.date||(r.date>=q.date.$gte&&r.date<=q.date.$lte));}
const models={Employee:{find:()=>query(employees),findOne:q=>query(employees.find(e=>e.employeeId===q.employeeId)||null)},Attendance:{find:q=>query(records.filter(r=>match(r,q)))},AttendanceConfig:{findOne:()=>query(null)},LeaveRequest:{find:()=>query([])}};
function synthetic(id,values){return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v)},{context,identifier:id});}
async function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});cache.set(file,m);await m.link((spec,parent)=>{
 if(spec==='next/server')return synthetic(spec,{NextResponse:{json:(body,opts={})=>({body,status:opts.status||200,headers:opts.headers})}});
 if(spec.endsWith('/db/connect'))return synthetic(spec,{default:async()=>{}});
 if(spec.endsWith('/db/models'))return synthetic(spec,models);
 if(spec.endsWith('/auth/jwt'))return synthetic(spec,{getSession:async()=>session});
 let p=spec.startsWith('@/')?path.join(root,spec.slice(2)):path.resolve(path.dirname(parent.identifier),spec);if(!path.extname(p))p+='.js';return load(p);
 });return m;}
(async()=>{
 const module=await load(path.join(root,'app/lib/attendance-calendar.js'));await module.evaluate();const P=module.namespace;
 const emp={employeeId:'one',createdAt:'2026-11-15T00:00:00Z',shiftStart:'09:00',shiftEnd:'18:00',weeklyOffDays:[0],workDateOverrides:[{date:'2026-11-18',isOff:true}]};
 const saved=[{employeeId:'one',date:'2026-11-16',status:'Late',checkIn:{time:'2026-11-16T05:00:00Z'}},{employeeId:'one',date:'2026-11-19',status:'Leave',reviewedBy:'manager'}];
 const before=JSON.stringify(saved),rows=P.calendarHistory(emp,saved,{},6,new Date(clock));
 assert.equal(rows.length,6);assert.equal(rows.find(r=>r.date==='2026-11-17').status,'Absent');assert.equal(rows.find(r=>r.date==='2026-11-18').status,'Off');assert.equal(rows.find(r=>r.date==='2026-11-15').status,'Off');assert.equal(rows.find(r=>r.date==='2026-11-19').status,'Leave');assert.equal(P.attendanceSummary(rows).Absent,2);assert.equal(JSON.stringify(saved),before);
 const fresh={...emp,createdAt:'2026-11-20T00:00:00Z'};assert.equal(P.calendarHistory(fresh,[],{},30,new Date(clock)).length,1);
 assert.equal(P.resolvedAttendanceStatus(emp,{status:'Absent'},{},new Date('2026-11-20T07:00:00Z'),'2026-11-20'),'Pending');assert.equal(P.resolvedAttendanceStatus(emp,{status:'Absent',reviewedBy:'manager'},{},new Date('2026-11-20T07:00:00Z'),'2026-11-20'),'Absent');
 const night={...emp,shiftStart:'22:00',shiftEnd:'06:00'};assert.equal(P.calendarHistory(night,[],{},3,new Date('2026-11-20T00:59:59Z')).find(r=>r.date==='2026-11-19').status,'Pending');assert.equal(P.calendarHistory(night,[],{},3,new Date('2026-11-20T01:00:01Z')).find(r=>r.date==='2026-11-19').status,'Absent');
 employees=[emp];records=[{employeeId:'one',date:'2026-11-19',status:'OnTime',checkIn:{time:'2026-11-19T04:00:00Z',photo:'private-photo'}}];
 for(const file of ['app/api/attendance/manager/today/route.js','app/api/attendance/overview/route.js']){const m=await load(path.join(root,file));await m.evaluate();const r=await m.namespace.GET();assert.equal(r.body.rows[0].status,'Absent','Yesterday open check-in must not conceal today absence');assert.equal(r.body.rows[0].attendanceDate,'2026-11-20');}
 const request={nextUrl:{searchParams:new URLSearchParams('days=3')}};
 for(const file of ['app/api/attendance/manager/employee/[employeeId]/history/route.js','app/api/attendance/employee/[employeeId]/route.js']){
  const m=await load(path.join(root,file));await m.evaluate();session={role:'ceo'};const r=await m.namespace.GET(request,{params:Promise.resolve({employeeId:'one'})});assert.equal(r.body.records.length,3);assert.equal(r.body.records[0].status,'Absent');assert.equal(r.body.records[2].status,'Off');assert.equal(r.headers['Cache-Control'],'no-store');
  if(!file.includes('/manager/'))assert(!Object.hasOwn(r.body.records[1],'checkInPhoto'),'Preserve existing photo privacy');
  session=null;assert.equal((await m.namespace.GET(request,{params:{employeeId:'one'}})).status,file.includes('/manager/')?403:401);
 }
 console.log('PASS: calendar absence, off/leave/manual decisions, registration boundary, overnight shifts, stale check-ins, history permissions/photo privacy, and no database rewrites.');
})().catch(e=>{console.error(e);process.exitCode=1});
