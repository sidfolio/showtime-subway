import {poles} from '../game/state.js';

import {hasTrickClearance} from '../game/spatial.js';

import {turbulencePrompt} from '../game/prompts.js';

import {tutorialInfo} from '../game/tutorial.js';

import {createRewardQueue} from './rewards.js';

const $=id=>document.getElementById(id);

const key=(value,large=false)=>`<kbd class="${value==='shift'?'wide':value==='space'?'space':large?'large':''}">${value}</kbd>`;

const groups=[['MOVEMENT',[[['W','A','S','D'],'MOVE / CLIMB','WASD / ARROWS'],[['space'],'JUMP'],[['shift'],'DUCK'],[['E'],'GRAB / RELEASE'],[['Q'],'BRACE NEAR A POLE'],[['C'],'SIT ON SEAT / FLOOR'],[['X'],'LIE ON BENCH / FLOOR'],[['Z'],'STAND UP']]],['PERFORMANCE / DEFENSE',[[['J'],'POLE SPIN'],[['K'],'TWO-POLE FLIP'],[['L'],'FLOOR DANCE / AERIAL'],[['F'],'BLOCK','LEVEL 2'],[['G'],'DODGE','LEVEL 2'],[['H'],'PUSH BACK','LEVEL 2']]],['CAMERA / INTERFACE',[[['1'],'FRONT AISLE'],[['2'],'REAR AISLE'],[['3'],'SIDE AISLE'],[['DRAG'],'LOOK AROUND','SHIFT + DRAG TO PAN; SCROLL TO ZOOM'],[['P'],'PAUSE / RESUME'],[['R'],'REACTOR ENHANCE','Optional paid visual overlay'],[['\\'],'HIDE / SHOW INSTRUCTIONS']]]];

function controls(){return groups.map(([title,rows])=>`<div class="control-group"><h3>${title}</h3>${rows.map(([keys,label,detail])=>`<div class="control-row"><div class="key-set">${keys.map(k=>key(k)).join('')}</div><div>${label}${detail?`<small>${detail}</small>`:''}</div></div>`).join('')}</div>`).join('');}

let help=true,expanded=false,drawer=false,selected=1,queue=createRewardQueue(),previousState=null,lastPrompt='',lastDemo='',lastAnnouncement='';

export function initializeInterface({getState,start,pause,beginTutorial}){

 $('expanded-controls').innerHTML=controls();

 const liveRows=[['FRONT AISLE',['1']],['REAR AISLE',['2']],['SIDE AISLE',['3']],['POLE SPIN',['J']],['TWO-POLE FLIP',['K']],['DANCE / AERIAL',['L']],['GRAB / RELEASE',['E']],['BRACE NEAR ROD',['Q']],['PAUSE',['P']],['REACTOR ENHANCE',['R']],['DUCK',['shift']],['JUMP',['space']],['SIT / LIE / STAND',['C','X','Z']],['LOOK / ZOOM',['DRAG']],['MOVE / CLIMB',['W','A','S','D']]];

 $('live-controls').innerHTML=liveRows.map(([label,keys])=>`<div class="live-mapping"><span>${label}</span><div class="key-set">${keys.map(k=>key(k)).join('')}</div></div>`).join('');

 $('expanded-controls').lastElementChild.append(document.querySelector('.session-settings'));

 const BASE_WIDTH=1280,BASE_HEIGHT=832;
 function layout(){
  const scale=Math.min(1,innerWidth/BASE_WIDTH,innerHeight/BASE_HEIGHT);
 const width=innerWidth/scale,height=innerHeight/scale;
  // The game is a fixed viewport experience; never restore a browser scroll
  // offset when a modal button receives focus.
  document.documentElement.scrollTop=0;document.body.scrollTop=0;
  document.documentElement.style.setProperty('--u',String(scale));
  $('ui-layer').style.width=width+'px';
  $('ui-layer').style.height=height+'px';
  document.documentElement.style.setProperty('--modal-scale',String(Math.min(1,(width-48)/1293,(height-80)/913)));
 }
 layout();window.addEventListener('resize',layout);

 function select(level){selected=level;document.querySelectorAll('[data-level]').forEach(b=>{const on=Number(b.dataset.level)===level;b.setAttribute('aria-pressed',String(on));b.querySelector('.mode-surface').src=on?'/assets/ui/cba21.svg':'/assets/ui/fbe06.svg';});}

 document.querySelectorAll('[data-level]').forEach(b=>{b.onclick=()=>select(Number(b.dataset.level));b.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const next=selected===1?2:1;select(next);document.querySelector(`[data-level="${next}"]`).focus();}};});

 $('practice').onclick=()=>{$('endless').checked=true;start(selected);drawer=false;};

 $('late-night').onclick=()=>{selected=0;$('endless').checked=false;start(0);drawer=false;};

 $('menu-tutorial').onclick=()=>beginTutorial(selected);$('watch-tutorial').onclick=()=>beginTutorial(selected);

 $('demo-pause').onclick=pause;

 $('controls-toggle').onclick=()=>{expanded=!expanded;$('expanded-controls').hidden=!expanded;$('rules-and-rewards').hidden=expanded;document.querySelector('.main-rule').hidden=expanded;$('controls-toggle').setAttribute('aria-expanded',String(expanded));$('controls-toggle').querySelector('span').textContent=expanded?'CONTROLS −':'CONTROLS +';};

 function toggleHelp(){help=!help;drawer=help&&!$('overlay').hidden?false:help;}

 $('instructions-toggle').onclick=toggleHelp;

 window.addEventListener('keydown',e=>{if(e.key==='\\'&&!['INPUT','SELECT'].includes(e.target.tagName)){e.preventDefault();toggleHelp();}

  if(e.key==='Tab'&&!$('overlay').hidden){const buttons=[...document.querySelectorAll('header button,#instructions-toggle,#overlay button')].filter(b=>!b.hidden);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}

 });

 // Resume starts a selected mode at entry/results; within a paused run it resumes.

 $('resume').onclick=()=>{if(getState().status==='paused'&&getState().level===selected)pause();else{$('endless').checked=false;start(selected);}};

 select(selected);

 return {selected:()=>selected,focusPause:()=>$('resume').focus()};

}

export function updateInterface(s,demo,demoPaused,dt,runState=s){

 if(!demo&&s!==previousState){queue=createRewardQueue();previousState=s;}

 if(!demo)queue.receive(s.lastReward);

 const paused=!demo&&s.status!=='playing'||Boolean(demo&&demoPaused);
 $('ui-layer').classList.toggle('overlay-open',!$('overlay').hidden);
 const trainingStage=s.stats.tricks>=3?'advanced':s.stats.tricks>0?'stunts':s.engaged?'stunts':'basic';
 $('ui-layer').classList.remove('controls-basic','controls-stunts','controls-advanced');
 $('ui-layer').classList.add(`controls-${trainingStage}`);
 const progression={
  basic:['STAGE 1 · ORIENTATION','MOVE TO AN OPEN AISLE · WASD / ARROWS'],
  stunts:['STAGE 2 · FIRST STUNT',s.player.pole!==null?'LAND A SAFE SPIN · J / K / L':'REACH A ROD · E TO GRIP'],
  advanced:['STAGE 3 · BUILD YOUR COMBO',s.stats.tricks<3?'LAND 3 STUNTS TO UNLOCK RUSH HOUR':'KEEP THE CROWD SAFE · COMBO ACTIVE']
 }[trainingStage];
 $('progression-stage').textContent=progression[0];$('progression-objective').textContent=progression[1];

 const danger=s.level===1&&s.aggressor&&Math.abs(s.aggressor.x-s.player.x)<100;

 const warning=!demo?turbulencePrompt(s):'';

 const safety=Boolean(danger||warning||!demo&&s.train.phase==='boarding');

 const reward=queue.update(dt,{paused:paused||Boolean(demo),safety});

 $('reward').hidden=!reward||paused||Boolean(demo);

 if(reward){$('reward-move').textContent=reward.moveLabel;$('reward-amount').textContent=`+${reward.awardDelta} TIPS!`;$('reward-detail').textContent=reward.count>1?`${reward.count} ${reward.moveLabel==='FLOOR DANCE'?'DANCES':'MOVES'} · ${reward.subtotal} TIPS`:'MOVE COMPLETED';const msg=`${reward.moveLabel}, ${reward.awardDelta} tips earned, total ${s.score}`;if(msg!==lastAnnouncement){$('ui-announcement').textContent=msg;lastAnnouncement=msg;}}

 const helpText=help?'HIDE INSTRUCTIONS WITH':'SHOW INSTRUCTIONS WITH';$('instructions-toggle').querySelector('span').textContent=helpText;$('instructions-toggle').setAttribute('aria-expanded',String(help));$('instructions-drawer').hidden=!drawer||paused||Boolean(demo);$('ui-layer').classList.toggle('help-expanded',!$('instructions-drawer').hidden);$('tutorial-panel').hidden=!demo||!help;

 $('pause').querySelector('span').textContent=paused?'RESUME':'PAUSE';$('resume').hidden=false;

 const safetyText=danger?'F BLOCK · G DODGE · H PUSH BACK':warning||(s.train.phase==='boarding'?'DOORS OPEN · STEP INTO THE SAFE POCKET · HOLD Q':'');

 $('turbulence').textContent=safetyText;$('turbulence').hidden=paused||Boolean(demo)||!safetyText;$('turbulence').classList.toggle('shaking',Boolean(danger||s.train.lurch));

 const line=s.lineWarning;
 const lineBanner=$('line-warning');
 lineBanner.hidden=paused||Boolean(demo)||!line;
 lineBanner.classList.toggle('arrived',line?.phase==='arrived');
 $('line-warning-label').textContent=line?.phase==='arrived'?'END OF LINE REACHED':'END OF LINE APPROACHING';
 $('line-warning-countdown').textContent=line?.phase==='arrived'?'READY WHEN YOU ARE':`${line?.remaining ?? ''}s`;

 let prompt='',large=false;

 if(!paused&&!demo&&help&&!reward&&!safety&&!s.player.entry&&!s.player.trick){

  if(s.player.rest)prompt=`RESTING  |  ${key('Z')} STAND UP` ;

  else if(s.player.fall)prompt='FALLEN  |  RECOVERING';

  else if(s.player.pole!==null)prompt=hasTrickClearance(s,'j')?`${key('J')} SPIN · ${key('K')} FLIP<br>${key('L')} AERIAL · E RELEASE`:'CROWD TOO CLOSE · WAIT OR RELEASE WITH E';

  else if(poles.some(x=>Math.abs(x-s.player.x)<48&&Math.abs(s.player.lane)<.7)){prompt=`GRAB THE ROD ${key('E',true)}`;large=true;}

  else if(!s.player.safe&&hasTrickClearance(s,'l'))prompt=`FLOOR DANCE ${key('L',true)}`;

 }

 $('action-prompt').hidden=!prompt;$('action-prompt').classList.toggle('detailed',!large);if(prompt!==lastPrompt){$('prompt-content').innerHTML=prompt;lastPrompt=prompt;}

 if(demo){const info=tutorialInfo(demo),titles=['GO AROUND','DUCK','FLOOR DANCE','GRIP & CLIMB','POLE SPIN','TWO-POLE FLIP','AERIAL SPIN','GIVE SPACE','BRACE','BOARDING'];$('demo-title').textContent=titles[info.index];$('demo-count').textContent=`${info.index+1} / ${info.count}`;

  const detail=['Poles block your path.','People still block your path.','Dance where the aisle is clear.','E grips. W climbs, S descends.','Keep both hands attached.','Tuck, flip, return to your grip.','L spins while holding the rod.','Bump, stop, then go around.','Hold Q beside a rod before the shake.','Wait in the safe pocket.'][info.index];$('demo-detail').textContent=detail;

  const labels={d:'A',a:'D',w:'W',s:'S',shift:'shift',q:'Q',e:'E',j:'J',k:'K',l:'L'},keys=info.keys.length?info.keys:info.tap?[info.tap]:[];const html=keys.map(k=>key(labels[k]||k)).join(' + ');if(html!==lastDemo){$('demo-keys').innerHTML=html||'WATCH THE MOVEMENT';lastDemo=html;}$('demo-progress').value=info.progress;$('demo-pause').innerHTML=key('P')+(demoPaused?' RESUME':' PAUSE');

 }

 document.querySelectorAll('.strike-indicators i').forEach((slot,i)=>slot.style.display=runState.strikes>i?'block':'none');

}

