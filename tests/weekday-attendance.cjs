const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),cache=new Map();let session={role:'ceo'},clock='2026-11-10T10:30:00Z';let employees=[],records=[];
class FakeDate extends Date {constructor(...a){super(...(a.length?a:[clock]));}static now(){return +new Date(clock);}}
const context=vm.createContext({Date:FakeDate,console,Map,Set,Number,String,Array,Error});
function query(a,one=false){return{sort(){return this},limit(){return this},lean(){return this},then(ok,no){return Promise.resolve(one?a[0]||null:a).then(ok,no)}}}
const models={Employee:{find:()=>query(employees)},Attendance:{find:()=>query(records)},AttendanceConfig:{findOne:()=>query([],true)},LeaveRequest:{find:()=>query([])}};
function synthetic(id,values){const m=new vm.SyntheticModule(Object.keys(values),function(){for(const [k,v]of Object.entries(values))this.setExport(k,v)},{context,identifier:id});return m;}
async function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});cache.set(file,m);await m.link((spec,parent)=>{
 if(spec==='next/server')return synthetic(spec,{NextResponse:{json:(body,opts={})=>({body,status:opts.status||200})}});
 if(spec.endsWith('/db/connect'))return synthetic(spec,{default:async()=>{}});
 if(spec.endsWith('/db/models'))return synthetic(spec,models);
 if(spec.endsWith('/auth/jwt'))return synthetic(spec,{getSession:async()=>session});
 let p=spec.startsWith('@/')?path.join(root,spec.slice(2)):path.resolve(path.dirname(parent.identifier),spec);if(!path.extname(p))p+='.js';return load(p);
 });return m;}
(async()=>{
 const a=await load(path.join(root,'app/api/attendance/manager/today/route.js'));await a.evaluate();const b=await load(path.join(root,'app/api/attendance/overview/route.js'));await b.evaluate();
 employees=[{employeeId:'one',shiftStart:'09:00',shiftEnd:'17:00',weeklyShifts:[{day:2,startTime:'10:00',endTime:'16:00'}]},{employeeId:'off',shiftStart:'09:00',shiftEnd:'17:00',weeklyOffDays:[2]},{employeeId:'future',shiftStart:'19:00',shiftEnd:'23:00'}];
 for(const route of [a.namespace,b.namespace]){const r=await route.GET();assert.equal(r.status,200);assert.equal(r.body.rows[0].shift_timing,'10:00 – 16:00');assert.equal(r.body.rows[0].status,'Pending');assert.equal(r.body.rows[1].status,'Off');assert.equal(r.body.rows[2].status,'Scheduled');}
 clock='2026-11-10T11:00:01Z';assert.equal((await b.namespace.GET()).body.rows[0].status,'Absent');
 employees=[{employeeId:'night',shiftStart:'09:00',shiftEnd:'17:00',weeklyShifts:[{day:1,startTime:'22:00',endTime:'06:00'}]}];clock='2026-11-10T00:45:00Z';records=[{employeeId:'night',date:'2026-11-09',status:'Late',checkIn:{time:'2026-11-09T17:40:00Z'}}];
 for(const route of [a.namespace,b.namespace]){const r=await route.GET();assert.equal(r.body.rows[0].attendanceDate,'2026-11-09');assert.equal(r.body.rows[0].shift_timing,'22:00 – 06:00 (+1 day)');assert.equal(r.body.rows[0].status,'Late');}
 session={role:'viewer'};assert.equal((await a.namespace.GET()).status,403);session=null;assert.equal((await b.namespace.GET()).status,401);
 console.log('PASS: CEO and manager routes use weekday shifts, off/future statuses, overnight records, and existing access checks.');
})().catch(e=>{console.error(e);process.exitCode=1});
