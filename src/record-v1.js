// Development-only capture page. Records the current game's actual WebGL output
// and composites its live HUD / prompts with a visible keyboard overlay.
const frame=document.getElementById('game-frame'),output=document.getElementById('capture'),ctx=output.getContext('2d');
let doc,recorder,chunks=[],started=0,recorded=0,segmentStart=0,extension='webm',held=new Set(),lastKey='',lastKeyUntil=0;
const status=document.getElementById('status'),record=document.getElementById('record'),hold=document.getElementById('hold'),save=document.getElementById('save');
const get=id=>doc?.getElementById(id),text=id=>get(id)?.textContent||'';
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function label(value,x,y,size=14,color='#eeeeee'){ctx.fillStyle=color;ctx.font=`${size}px Arial`;ctx.fillText(value,x,y)}
function lines(value,x,y,width,size=14){ctx.font=`${size}px Arial`;let line='',row=0;for(const word of value.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){label(line,x,y+row*(size+6),size);line=word;row++;}else line=next;}label(line,x,y+row*(size+6),size);return (row+1)*(size+6);}
function shown(el){return el&&!el.hidden&&getComputedStyle(el).display!=='none'}
function panel(el){if(!shown(el))return;const stage=get('game').getBoundingClientRect(),bounds=el.getBoundingClientRect();const x=bounds.left-stage.left,y=80+bounds.top-stage.top;rect(x,y,bounds.width,bounds.height,'#20272bf0');ctx.strokeStyle='#909891';ctx.strokeRect(x,y,bounds.width,bounds.height);lines(el.textContent,x+12,y+20,bounds.width-24,13);}
function draw(){
 if(doc&&get('game')){
  rect(0,0,1280,960,'#16191c');ctx.drawImage(get('game'),0,80,1280,832);
  label('SHOWTIME  •  VERSION 1',14,29,22);label(document.getElementById('chapter').value,365,29,15,'#d9dfda');
  label(`Train ${get('route')?.value||'1'}   ${text('sound')}   ${text('pause')}   ${text('end')}`,880,29,13);
  rect(0,48,1280,32,'#252b30');label(text('level'),14,69,12);label('Tips '+text('score'),225,69,12);label('Combo '+text('combo'),435,69,12);label('Balance',645,69,12);rect(699,59,100,9,'#697476');rect(699,59,Number(get('balance')?.value||0),9,'#6ea549');label('Strikes '+text('strikes'),900,69,12);label(text('station'),1125,69,12);
  const buttons=[...doc.querySelectorAll('[data-camera]')];let x=12;for(const b of buttons){const w=ctx.measureText(b.textContent).width+24;rect(x,92,w,30,b.getAttribute('aria-pressed')==='true'?'#45555c':'#20272be8');label(b.textContent,x+10,112,12);x+=w+7;}
  rect(1030,92,238,30,'#20272be8');label(text('view-status').slice(0,38),1040,112,12);
  panel(get('turbulence'));panel(get('action-prompt'));
  const tutorial=get('tutorial-panel');if(shown(tutorial)){rect(1002,180,260,430,'#20262bf5');label(text('demo-count'),1020,209,13);let y=245;y+=lines(text('demo-title'),1020,y,220,21)+12;y+=lines(text('demo-detail'),1020,y,220,14)+15;label('Keys / action trigger',1020,y,13);y+=18;rect(1015,y,232,60,'#384149');lines(text('demo-keys'),1025,y+22,212,16);y+=78;rect(1020,y,220,5,'#a8b1b5');rect(1020,y,220*Number(get('demo-progress')?.value||0),5,'#86b3d6');lines('Watch-only tutorial • ten demonstrations',1020,y+30,220,13);}
  const overlay=get('overlay');if(shown(overlay)){rect(0,80,1280,832,'#10151a9e');rect(300,330,680,330,'#20262bf2');label(doc.querySelector('h1')?.textContent||'Showtime',350,385,32);lines(doc.querySelector('#overlay .panel p')?.textContent||'',350,420,580,17);label('1 • Late Night Local     2 • Off-Peak     3 • Rush Hour Express',350,500,16);lines(text('result')||'WASD / arrows move • E grips • J / K / L performs • Q braces',350,545,570,14);label(shown(get('resume'))?'Resume to continue':'Choose a level to begin',350,615,17);}
  const keys=[...held];const keyText=keys.length?keys.map(k=>k===' '?'SPACE':k.toUpperCase()).join(' + '):performance.now()<lastKeyUntil?lastKey:'—';
  rect(955,807,305,87,'#121a20ed');label('KEYS PRESSED',972,831,12,'#bfcbd0');label(keyText,972,866,25,'#f7d59a');
  rect(0,912,1280,24,'#252b30');label(text('message').slice(0,172),12,929,12);
  rect(0,936,1280,24,'#16191c');label('WASD / arrows  MOVE     SPACE  JUMP     E  GRIP     Q  BRACE     SHIFT  DUCK     J  SPIN     K  FLIP     L  DANCE / AERIAL     F / G / H  DEFENSE (LEVEL 2)',12,952,11);
 }
 requestAnimationFrame(draw);
}
frame.addEventListener('load',()=>{doc=frame.contentDocument;doc.addEventListener('keydown',e=>{held.add(e.key);lastKey=e.key===' '?'SPACE':e.key.toUpperCase();lastKeyUntil=performance.now()+1100;});doc.addEventListener('keyup',e=>held.delete(e.key));frame.contentWindow.addEventListener('blur',()=>held.clear());status.textContent='Ready. Captures the full 1280 × 960 game frame at 30 fps, with visible key presses.';});
record.onclick=()=>{
 const types=['video/mp4;codecs=avc1.640028','video/mp4;codecs=avc1.42001e','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8'];const mime=types.find(t=>MediaRecorder.isTypeSupported(t));if(!mime){status.textContent='No video encoder is available in this browser.';return;}
 extension=mime.includes('mp4')?'mp4':'webm';chunks=[];recorded=0;started=segmentStart=performance.now();recorder=new MediaRecorder(output.captureStream(30),{mimeType:mime,videoBitsPerSecond:18000000});
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=async()=>{status.textContent='Saving the Version 1 recording…';try{const blob=new Blob(chunks,{type:mime});const response=await fetch(`/recording-v1/${extension}`,{method:'POST',body:blob});if(!response.ok)throw new Error(await response.text());status.textContent=`Saved ${await response.text()} • ${(blob.size/1048576).toFixed(1)} MB`;record.disabled=false;}catch(error){status.textContent=error.message;save.disabled=false;save.textContent='Retry save';save.onclick=()=>recorder.onstop();}};
 recorder.start(1000);record.disabled=true;hold.disabled=save.disabled=false;status.textContent=`Recording ${mime} • 1280 × 960 • 30 fps • 18 Mbps target. Pause recording between chapters to trim dead time.`;
};
hold.onclick=()=>{if(recorder.state==='recording'){recorded+=performance.now()-segmentStart;recorder.pause();hold.textContent='Resume recording';status.textContent=`Recording paused at ${(recorded/1000).toFixed(1)} seconds.`;}else{segmentStart=performance.now();recorder.resume();hold.textContent='Pause recording';status.textContent='Recording resumed.';}};
save.onclick=()=>{if(recorder?.state==='recording')recorded+=performance.now()-segmentStart;recorder?.stop();hold.disabled=save.disabled=true;hold.textContent='Pause recording';};
draw();

