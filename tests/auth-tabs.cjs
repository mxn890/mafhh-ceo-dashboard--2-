const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),jose=require('jose');
const root=path.resolve(__dirname,'..'),cache=new Map(),jar=new Map();let cookie;
const context=vm.createContext({console,URL,TextEncoder,Date,process:{env:{JWT_SECRET:'test-only-auth-tabs',NODE_ENV:'production'}}});
function stub(id,values){return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v)},{context,identifier:id});}
async function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});cache.set(file,m);await m.link((s,p)=>{
 if(s==='jose')return stub(s,{SignJWT:jose.SignJWT,jwtVerify:jose.jwtVerify});
 if(s==='next/headers')return stub(s,{cookies:async()=>({get:k=>jar.has(k)?{value:jar.get(k)}:undefined,set:(k,v,o)=>{cookie={value:v,...o};jar.set(k,v)},delete:k=>jar.delete(k)})});
 if(s==='next/server')return stub(s,{NextResponse:{json:(body,opts={})=>({body,...opts}),redirect:url=>({redirect:String(url)}),next:()=>({next:true})}});
 let f=s.startsWith('@/')?path.join(root,s.slice(2)):path.resolve(path.dirname(p.identifier),s);if(!path.extname(f))f+='.js';return load(f);
 });return m;}
function req(url){const u=new URL(url,'https://dashboard.example');return {url:u.href,nextUrl:u,cookies:{get:k=>jar.has(k)?{value:jar.get(k)}:undefined}};}
(async()=>{
 const a=await load(path.join(root,'app/lib/auth/jwt.js'));await a.evaluate();const A=a.namespace;
 const m=await load(path.join(root,'middleware.js'));await m.evaluate();const M=m.namespace.middleware;
 const r=await load(path.join(root,'app/api/auth/session/route.js'));await r.evaluate();const GET=r.namespace.GET;
 const safe=cache.get(path.join(root,'app/lib/auth/return-path.js')).namespace.safeReturnPath;
 for(const x of ['https://evil.test','//evil.test','/\\evil.test','/login','/api/auth/logout','/a\n'])assert.equal(safe(x),'/');
 assert.equal(safe('/cctv?review=abc'),'/cctv?review=abc');
 assert.equal((await M(req('/api/attendance/overview'))).status,401);
 assert.equal(new URL((await M(req('/cctv?review=abc'))).redirect).searchParams.get('next'),'/cctv?review=abc');
 assert.equal((await M(req('/shipments'))).next,true);assert.equal((await GET()).body.authenticated,false);
 const token=await A.createToken('test','test@example.invalid','ceo');await A.setAuthCookie(token);
 assert.equal(cookie.sameSite,'lax');assert.equal(cookie.httpOnly,true);assert.equal(cookie.secure,true);assert.equal(cookie.path,'/');
 const payload=await A.verifyToken(token);assert(cookie.maxAge<=payload.exp-Date.now()/1000);assert(cookie.maxAge<=604800);
 assert.equal((await M(req('/cctv'))).next,true);assert.equal((await M(req('/attendance'))).next,true);
 assert.equal((await M(req('/login?next=%2Fcctv%3Freview%3Dabc'))).redirect,'https://dashboard.example/cctv?review=abc');
 assert.equal((await M(req('/login?next=https://evil.test'))).redirect,'https://dashboard.example/');
 const result=await GET();assert.equal(result.body.authenticated,true);assert.deepEqual(Object.keys(result.body),['authenticated']);assert.equal(result.headers['Cache-Control'],'private, no-store');assert.equal(cookie.value,token);
 const expired=await new jose.SignJWT({}).setProtectedHeader({alg:'HS256'}).setExpirationTime(Math.floor(Date.now()/1000)-1).sign(new TextEncoder().encode('test-only-auth-tabs'));
 for(const token of [expired,'invalid']){jar.set('auth_token',token);assert.equal((await GET()).body.authenticated,false);assert.equal((await M(req('/api/attendance/overview'))).status,401);}
 console.log('PASS: signed session restoration, shared-tab cookies, expiry/security flags, safe return URLs, protected routes, public shipments.');
})().catch(e=>{console.error(e);process.exitCode=1});
