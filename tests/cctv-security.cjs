const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 let session=null,calls=[];
 const context=vm.createContext({Response,Headers,AbortSignal,process:{env:{MODULE4_API_URL:'https://monitoring.example',MODULE4_API_KEY:'test-private-key'}},fetch:async(url,options)=>{calls.push({url,options});return new Response('ok',{status:206,headers:{'content-type':'video/mp4','content-length':'2','content-range':'bytes 0-1/10','accept-ranges':'bytes'}});}});
 const m=new vm.SourceTextModule(fs.readFileSync('app/api/cctv/[...path]/route.js','utf8'),{context});
 await m.link(async name=>{
  const values=name==='next/server'?{NextResponse:{json:(body,options={})=>new Response(JSON.stringify(body),{status:options.status||200})}}:{getSession:async()=>session};
  return new vm.SyntheticModule(Object.keys(values),function(){for(const [k,v]of Object.entries(values))this.setExport(k,v);},{context});
 });await m.evaluate();const id='a'.repeat(64),request={method:'GET',headers:new Headers({range:'bytes=0-1'})};
 let r=await m.namespace.GET(request,{params:{path:['media',id,'video.mp4']}});assert.equal(r.status,401);assert.equal(calls.length,0);
 session={role:'ceo'};
 for(const path of [['media','..','video.mp4'],['media',id,'../secret'],['media',id,'sample-7.jpg'],['https:','outside.example']]){r=await m.namespace.GET(request,{params:{path}});assert.equal(r.status,404);}
 assert.equal(calls.length,0);
 r=await m.namespace.GET(request,{params:{path:['media',id,'video.mp4']}});assert.equal(r.status,206);assert.equal(await r.text(),'ok');assert.equal(calls[0].options.headers['x-api-key'],'test-private-key');assert.equal(calls[0].options.headers.Range,'bytes=0-1');assert.equal(r.headers.get('x-api-key'),null);assert.equal(r.headers.get('content-range'),'bytes 0-1/10');
 console.log('PASS: explicit media authentication, traversal rejection, sample whitelist, private credential, and video Range forwarding.');
})().catch(e=>{console.error(e);process.exitCode=1;});
