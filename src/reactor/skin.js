let model=null;
let sourceStream=null;
let active=false;
let connecting=null;
let X2Model=null;
let preloadPromise=null;

export function preloadReactor(){
  if(X2Model)return Promise.resolve(true);
  if(!preloadPromise){
    preloadPromise=import('@reactor-models/x2/core')
      .then(mod=>{X2Model=mod.X2Model;return true;})
      .catch(error=>{console.warn('Reactor model preload failed:',error);return false;});
  }
  return preloadPromise;
}

function setStatus(label,state=''){
  const el=document.querySelector('#reactor-status');
  if(!el)return;
  el.textContent=`REACTOR · ${label}`;
  el.className=`reactor-status ${state}`;
  el.hidden=false;
}

const enhancementPrompt=[
  'Appearance-only enhancement of a locked 3D game render: realistic NYC R160 subway interior, continuous stainless shell, framed windows, curved orange benches, dark speckled rubber floor, side fluorescent lights, dim aisle, worn ads, fingerprints, grime, subtle graffiti, and tunnel motion outside the windows.',
  'Keep frame timing, camera framing, train geometry, windows, poles, player and passenger locations, collisions, silhouettes, and every gameplay action exactly unchanged. Keep all views inside the train; never show an exterior camera, detached walls, or an open-sided car.',
  'Do not invent motion, camera shake, people, limbs, floating hands, signage, subtitles, logos, or readable text. Keep hands attached during pole grips, climbs, spins, flips, and falls.'
].join(' ');

async function disconnect(video){
  active=false;
  setStatus('OFF');
  video?.classList.remove('reactor-active');
  if(sourceStream){sourceStream.getTracks().forEach(track=>track.stop());sourceStream=null;}
  const current=model;model=null;
  if(current){try{await current.reset();}catch{}try{await current.disconnect();}catch{}}
  if(video){video.pause();video.srcObject=null;}
}

export async function toggleReactor({canvas=document.querySelector('#game'),video=document.querySelector('#reactor-video')}={}){
  if(active){await disconnect(video);return 'Reactor enhancement off · local render active.';}
  if(connecting)return 'Reactor is connecting…';
  if(!canvas?.captureStream){setStatus('UNAVAILABLE','error');return 'Reactor needs a browser with canvas capture support.';}

  setStatus('CONNECTING','connecting');
  connecting=(async()=>{
    if(!await preloadReactor())throw new Error('Reactor model package could not load.');
    const tokenResponse=await fetch('/api/token',{method:'POST'});
    const tokenBody=await tokenResponse.json().catch(()=>({}));
    if(tokenResponse.status===404)throw new Error('Restart Vite so its local /api/token middleware is loaded.');
    if(!tokenResponse.ok||!tokenBody.jwt)throw new Error(tokenBody.error||'Token request failed.');

    const client=new X2Model();
    model=client;
    let firstFrameResolve=null,firstFrameTimer=null;
    const firstFrame=new Promise((resolve,reject)=>{
      firstFrameResolve=resolve;
      firstFrameTimer=setTimeout(()=>reject(new Error('Reactor connected but no visual frame arrived within 20 seconds.')),20000);
    });
    client.on('error',error=>{
      const code=error?.code||'SDK_ERROR';
      setStatus(`ERROR · ${code}`,'error');
      console.error('Reactor SDK error:',error);
    });
    client.onMainVideo((_track,stream)=>{
      if(!video)return;
      video.srcObject=stream;
      video.classList.add('reactor-active');
      setStatus('LIVE','live');
      if(firstFrameTimer)clearTimeout(firstFrameTimer);
      firstFrameResolve?.();firstFrameResolve=null;
      void video.play().catch(()=>{});
    });
    await client.connect(tokenBody.jwt);
    await client.setKeepBacklog({keep_backlog:false});
    sourceStream=canvas.captureStream(24);
    await client.publishSource(sourceStream.getVideoTracks()[0]);
    await client.setPrompt({prompt:enhancementPrompt});
    // Do not dismiss the loading screen until X2 has actually produced the
    // visual track that the player will see.
    await firstFrame;
    active=true;
    return 'Reactor X2 live · visual stream connected.';
  })();

  try{return await connecting;}
  catch(error){
    const sdkError=model?.getLastError?.();
    const detail=sdkError?.code?`${sdkError.code}${sdkError.message?` · ${sdkError.message}`:''}`:(error instanceof Error?error.message:'connection failed');
    await disconnect(video);
    setStatus(`ERROR · ${detail}`,'error');
    return `Reactor unavailable · ${detail}`;
  }
  finally{connecting=null;}
}

export function reactorIsActive(){return active;}

export function setReactorInteractive(interactive){
  document.querySelector('#reactor-video')?.classList.toggle('reactor-interaction-bypass',Boolean(interactive));
}
