import {defineConfig,loadEnv} from 'vite';
import {createReadStream,statSync,createWriteStream,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';

const references=['videoplayback (1).mp4','videoplayback (2).mp4','videoplayback (3).mp4','videoplayback (4).mp4','videoplayback (5).mp4','videoplayback.webm'];

async function reactorToken(req,res,next,apiKey){
  if(req.method!=='POST')return next();
  if(!apiKey||apiKey==='rk_your_key_here'){
    res.statusCode=500;
    res.setHeader('Content-Type','application/json');
    return res.end(JSON.stringify({error:'REACTOR_API_KEY is missing from the local .env file.'}));
  }
  try{
    const response=await fetch('https://api.reactor.inc/tokens',{method:'POST',headers:{'Reactor-API-Key':apiKey}});
    const body=await response.json().catch(()=>({error:'Reactor returned an invalid response.'}));
    res.statusCode=response.status;
    res.setHeader('Content-Type','application/json');
    if(response.ok&&body.jwt)return res.end(JSON.stringify({jwt:body.jwt}));
    return res.end(JSON.stringify(body));
  }catch(error){
    console.error('Reactor token request failed:',error instanceof Error?error.message:error);
    res.statusCode=502;
    res.setHeader('Content-Type','application/json');
    return res.end(JSON.stringify({error:'Unable to reach Reactor right now.'}));
  }
}

export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'');
  const apiKey=env.REACTOR_API_KEY?.trim();
  const reactorWasm=resolve('node_modules/@reactor-team/js-sdk/dist/wasm/reactor_wasm_bg.wasm');
  return {
    server:{watch:{ignored:['**/documentation/**','**/*.glb']}},
    // Keep the model package lazy so a Reactor dependency failure cannot stop
    // the game UI from initializing. The SDK and its CommonJS dependencies
    // can then be optimized when the opt-in R path is requested.
    optimizeDeps:{include:['awaitqueue','@reactor-team/js-sdk'],exclude:['@reactor-models/x2']},
    plugins:[{name:'local-reference-review',configureServer(server){
      // Vite's dependency optimizer rewrites the SDK's relative WASM URL
      // into /node_modules/.vite/deps. Serve that generated URL with the
      // correct MIME type during development; production builds emit the
      // asset normally.
      server.middlewares.use((req,res,next)=>{
        if(!/reactor_wasm_bg(?:-[^/]+)?\.wasm(?:\?.*)?$/.test(req.url||''))return next();
        res.setHeader('Content-Type','application/wasm');
        createReadStream(reactorWasm).on('error',()=>{res.statusCode=404;res.end('Reactor WASM unavailable')}).pipe(res);
      });
      server.middlewares.use('/api/token',(req,res,next)=>reactorToken(req,res,next,apiKey));
      server.middlewares.use((req,res,next)=>{
        const match=/^\/recording-v1\/(mp4|webm)$/.exec(req.url||'');
        if(!match||req.method!=='POST')return next();
        if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`){res.statusCode=403;return res.end('Local recorder only.')}
        mkdirSync('documentation',{recursive:true});
        const path=`documentation/showtime-v1-capture.${match[1]}`;
        const file=createWriteStream(path);
        req.pipe(file);
        file.on('finish',()=>res.end(path));
        file.on('error',()=>{res.statusCode=500;res.end('Recording save failed.')});
      });
      server.middlewares.use((req,res,next)=>{
        const match=/^\/reference-video\/(\d)$/.exec(req.url||'');
        if(!match)return next();
        const filename=references[Number(match[1])];
        if(!filename){res.statusCode=404;return res.end()}
        const path=`C:/Users/Sid/Downloads/${filename}`;
        try{
          const size=statSync(path).size;
          res.setHeader('Content-Type',filename.endsWith('webm')?'video/webm':'video/mp4');
          res.setHeader('Accept-Ranges','bytes');
          const range=req.headers.range;
          if(range){
            const [a,b]=range.replace('bytes=','').split('-');
            const start=Number(a),end=b?Math.min(Number(b),size-1):size-1;
            res.statusCode=206;
            res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);
            res.setHeader('Content-Length',end-start+1);
            createReadStream(path,{start,end}).pipe(res);
          }else{
            res.setHeader('Content-Length',size);
            createReadStream(path).pipe(res);
          }
        }catch{res.statusCode=404;res.end('Reference file unavailable')}
      });
    }}]
  };
});
