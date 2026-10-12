import './style.css';
import {actions,clearPressed} from './input.js';
import {cameraActions} from './input-camera.js';
import {createState,say,updateLineWarning} from './game/state.js';
import {populate,updatePassengers} from './game/passengers.js';
import {updatePerformer} from './game/performer.js';
import {updateTrain} from './game/train.js';
import {updateRules} from './game/rules.js';
import {render as render2D} from './render/canvas.js';
import {createSubwayRenderer} from './render/subway3d.js';
import {updateHUD} from './render/hud.js';
import {toggleSound,playEvents} from './audio.js';
import {toggleReactor,preloadReactor} from './reactor/skin.js';
import {createTutorial,updateTutorial} from './game/tutorial.js';
import {initializeInterface,updateInterface} from './render/interface.js';
// Version 2 fills the viewport. The documentation recorder retains its V1 frame.
const ui=document.querySelector('main'),frame=document.createElement('div');
frame.id='game-frame';ui.before(frame);frame.append(ui);
if(new URLSearchParams(location.search).has('capture'))document.body.classList.add('v1-capture');
let state=createState(1);populate(state);state.status='menu';let canvas=document.getElementById('game');const overlay=document.getElementById('overlay');
let demo=null,demoPaused=false,pendingLevel=null,savedState=null,savedView='front';
let visual;
try{visual=createSubwayRenderer(canvas)}catch(error){console.error('3D renderer unavailable:',error);const replacement=canvas.cloneNode();canvas.replaceWith(replacement);canvas=replacement;document.getElementById('view-status').textContent='WebGL unavailable · 2D fallback';document.querySelectorAll('[data-camera]').forEach(b=>b.disabled=true)}
function setCamera(view){visual?.setView(view);document.querySelectorAll('[data-camera]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.camera===view))});}
document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>setCamera(b.dataset.camera));
function start(level){state=createState(level,document.getElementById('endless').checked,document.getElementById('route').value);populate(state);state.player.x=640;state.player.lane=0;state.player.entry=false;state.player.immune=3;say(state,'Use WASD or arrow keys to move. Walk to a pole and press E to grip.',4);overlay.hidden=true;document.getElementById('result').textContent='';document.getElementById('resume').hidden=true;clearPressed();actions.held.clear();canvas.focus()}
function beginTutorial(level=null){if(demo)return;savedState=state;savedView=visual?.getView()||'side';pendingLevel=level;demo=createTutorial();state=demo.state;demoPaused=false;overlay.hidden=true;document.getElementById('tutorial-panel').hidden=false;document.getElementById('skip-tutorial').querySelector('span').textContent=level===null?'Back to game':'Skip & play';setCamera('side');document.querySelectorAll('[data-camera]').forEach(b=>b.disabled=true);clearPressed();actions.held.clear();canvas.focus();}
function finishTutorial(){demo=null;document.getElementById('tutorial-panel').hidden=true;document.querySelectorAll('[data-camera]').forEach(b=>b.disabled=!visual);setCamera(savedView);if(pendingLevel!==null)start(pendingLevel);else{state=savedState;overlay.hidden=state.status==='playing';}clearPressed();actions.held.clear();}
document.getElementById('skip-tutorial').onclick=finishTutorial;
function pause(){if(demo){demoPaused=!demoPaused;clearPressed();return;}if(state.status==='playing'){state.status='paused';overlay.hidden=false;document.querySelector('h1').textContent='PAUSED';document.getElementById('resume').hidden=false;interfaceUI.focusPause()}else if(state.status==='paused'){state.status='playing';overlay.hidden=true;canvas.focus()}else{document.getElementById('endless').checked=false;start(interfaceUI.selected())}clearPressed()}
document.getElementById('pause').onclick=pause;document.getElementById('resume').onclick=pause;
document.getElementById('sound').onclick=()=>document.getElementById('sound').textContent=`Sound: ${toggleSound()?'on':'off'}`;
document.getElementById('end').onclick=()=>{if(demo)finishTutorial();if(['playing','paused'].includes(state.status)){state.endLine=state.lineWarning?.phase==='arrived';state.status='ended';finish()}};
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(demo&&!demoPaused)pause();else if(!demo&&state.status==='playing')pause()}});window.addEventListener('blur',()=>{if(demo&&!demoPaused)pause();else if(!demo&&state.status==='playing')pause()});
function finish(){overlay.hidden=false;document.getElementById('resume').hidden=true;document.querySelector('h1').textContent=state.status==='won'?'A great ride.':state.status==='ended'?(state.endLine?'END OF THE LINE.':'RUN COMPLETE.'):'Run ended.';document.getElementById('result').textContent=`${state.score} tips · ${state.stats.tricks} tricks · ${state.stats.safeStops} safe stops · ${state.strikes} strikes. ${state.status==='lost'?(state.strikes>=3?'The conductor ended the run.':'The run ended. Try chaining more tricks.'):''}`}
const interfaceUI=initializeInterface({getState:()=>state,start,pause,beginTutorial});
const startup={characters:false,reactorModule:false,reactorStarted:false,reactorReady:false,done:false,startedAt:performance.now(),characterFallback:false};
void preloadReactor().then(ready=>{startup.reactorModule=ready;if(!ready)startup.reactorReady=true;});
let previous=performance.now(),accumulator=0;const step=1/60;
const engagementKeys=new Set(['w','a','s','d',' ','e','q','shift','j','k','l','f','g','h','c','x','z']);
function updateCharacterLoading(){
 const el=document.getElementById('character-loading');if(!el||!visual?.castProgress)return;
 const progress=visual.castProgress();
 const complete=progress.loaded+progress.failed>=progress.total;
 // A single slow or unavailable GLB must not make the already-live Reactor
 // session look frozen. Keep those riders loading in the background and use
 // the renderer's procedural placeholder until they arrive.
 const fallbackReady=!complete&&startup.reactorReady&&performance.now()-startup.startedAt>45000;
 if(fallbackReady)startup.characterFallback=true;
 startup.characters=(complete||startup.characterFallback)&&progress.total>0;
 // Start X2 as soon as the core player/sleeper/commuter assets are ready;
 // the rest of the imported cast can continue loading in parallel.
 const coreCastReady=progress.loaded+progress.failed>=3;
 if(coreCastReady&&!startup.reactorStarted){
  startup.reactorStarted=true;
  void toggleReactor({canvas,video:document.getElementById('reactor-video')}).then(message=>{startup.reactorReady=true;startup.reactorMessage=message;});
 }
 const loading=document.getElementById('startup-loading');
 const loadedParts=(startup.characters?1:Math.min(.96,progress.total?progress.loaded/progress.total:0))+(startup.reactorReady?1:.0);
 const percent=Math.round(Math.min(99,loadedParts/2*100));
 document.getElementById('startup-progress-bar')?.style.setProperty('width',`${percent}%`);
 const detail=document.getElementById('startup-loading-detail');
 if(detail)detail.textContent=startup.characters?(startup.characterFallback?'Some riders are still loading. Opening with placeholders…':startup.reactorReady?'Ready. Opening the game menu…':'Loading Reactor visuals…'):startup.reactorStarted?`Loading characters… ${progress.loaded}/${progress.total} · Reactor visuals starting…`:`Loading characters… ${progress.loaded}/${progress.total}`;
 if(!startup.done&&startup.characters&&startup.reactorReady){startup.done=true;loading.hidden=true;overlay.hidden=false;document.body.classList.remove('booting');}
 if(!startup.done){el.hidden=true;return;}
 if(complete&&!el.dataset.readyUntil){el.dataset.readyUntil=String(performance.now()+3200);el.querySelector('strong').textContent='CHARACTERS READY';}
 el.hidden=complete&&performance.now()>Number(el.dataset.readyUntil||0);
 document.getElementById('character-loading-detail').textContent=progress.failed?`${progress.loaded}/${progress.total} imported riders ready · ${progress.failed} kept as procedural placeholders`:`${progress.loaded}/${progress.total} imported riders ready · procedural placeholders remain active`;
}
function tick(now){accumulator+=Math.min(.1,(now-previous)/1000);previous=now;
 for(const [key,view] of [['1','front'],['2','rear'],['3','side']])if(actions.pressed.has(key)){if(!demo)setCamera(view);actions.pressed.delete(key)}
 if(actions.pressed.has('p')||actions.pressed.has('escape'))pause();
 if(actions.pressed.has('r')){actions.pressed.delete('r');void toggleReactor({canvas,video:document.getElementById('reactor-video')}).then(message=>say(state,message,4))}
 while(accumulator>=step){if(demo){if(!demoPaused){updateTutorial(demo,step);state=demo.state;if(demo.done)finishTutorial();}}else if(state.status==='playing'){state.time+=step;if(!state.engaged&&[...engagementKeys].some(key=>actions.held.has(key)||actions.pressed.has(key)))state.engaged=true;if(state.engaged)state.activeTime+=step;updateLineWarning(state);state.blocking=state.level===1&&actions.held.has('f');const movement=cameraActions(actions,visual?.getView()||'side',state.player.pole!==null,visual?.getMovementYaw?.()??null);updateTrain(state,step);updatePassengers(state,step);updatePerformer(state,movement,step);updateRules(state,movement,step);playEvents(state.events);state.events=[];if(['won','lost'].includes(state.status))finish()}clearPressed();accumulator-=step}
 if(demo)state.status=demoPaused?'paused':'playing';
 if(visual)visual.render(state);else render2D(canvas,state);updateHUD(demo?savedState:state);
 if(import.meta.env.DEV&&visual)canvas.dataset.diagnostics=JSON.stringify({...visual.diagnostics(),status:state.status,time:state.time,falls:state.stats.falls,nextShake:state.train.nextShake,pole:state.player.pole,player:{x:state.player.x,lane:state.player.lane},score:state.score});
 if(visual)document.getElementById('view-status').textContent=state.player.trick?state.player.trick.name:state.player.pole!==null?'Grip locked · W / S climbs':state.player.safe?'Safe pocket · wait here':`${visual.getView()} view · screen-relative movement`;
 updateCharacterLoading();
 updateInterface(state,demo,demoPaused,Math.min(.1,(now-interfacePrevious)/1000),demo?savedState:state);interfacePrevious=now;
 requestAnimationFrame(tick)
}let interfacePrevious=performance.now();requestAnimationFrame(tick);
