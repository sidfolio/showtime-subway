import {say,lineLeadSeconds} from './state.js';
import {hasTrickClearance} from './spatial.js';
import {moveSolid} from './collision.js';
export function strike(s,message){if(s.player.immune>0)return;s.strikes=Math.min(3,s.strikes+1);s.combo=1;s.player.trick=null;s.player.immune=3;s.player.balance=70;s.events.push('strike');say(s,message,5);if(s.strikes>=3)say(s,'Three strikes. Stay in control; the ten-minute performance window is still open.',8)}
export function updateRules(s,a,dt){const p=s.player;
 if(s.comboUntil&&s.time>s.comboUntil&&!p.trick)s.combo=1;
 const secured=p.pole!==null||p.brace&&p.bracePole!==undefined||p.safe||Boolean(p.rest);
 if(s.train.lurch>0&&!secured&&!p.fall){
  p.exposure=(p.exposure||0)+dt;
  if(p.exposure>=.12&&p.lastFallShake!==(s.train.shakeId||0)){
   p.lastFallShake=s.train.shakeId||0;s.stats.falls++;strike(s,'Unsecured grip  |  knocked down by the train. Grab E before the next lurch.');
   p.trick=null;p.fall=1.2;p.y=p.vy=p.climb=0;p.pole=null;p.gripSide=-1;
   const direction=(s.train.shakeId||0)%4;p.fallDX=direction<2?(direction===0?-85:85):0;p.fallLane=direction>=2?(direction===2?-1.2:1.2):0;
  }
 }else{p.exposure=0;p.balance=Math.min(100,p.balance+dt*(secured?35:10));}
 if(p.trick&&(!hasTrickClearance(s,p.trick.key)||s.train.phase==='boarding')){p.trick=null;p.cooldown=.5;s.combo=1;say(s,'Move stopped safely: the crowd entered your clearance zone. Wait or choose another pole.')}
 for(const n of s.passengers){if(p.contacts?.includes(n)&&!p.entry){n.reaction=2;strike(s,'Passenger bump. One strike. Move sideways to go around.')}if(n.sleeping){if(a.pressed.has(' ')&&Math.abs(n.x-p.x)<150)n.noise+=38;if(n.noise>=100){n.sleeping=false;n.reaction=4;strike(s,'You woke a sleeping passenger. Keep loud tricks farther away.')}}}p.contacts=[];
 // A run cannot be cut short by strikes during the opening ten-minute performance window.
 // The player still receives feedback and can recover, but the conductor only ends a run
 // after the scheduled line window has elapsed.
 if(s.strikes>=3&&s.activeTime>=lineLeadSeconds&&s.train.phase==='boarding')s.status='lost';
 if(s.level===1)defense(s,a,dt);
}
function defense(s,a,dt){
 const p=s.player;
 if(!s.aggressor&&!s.threatResolved&&s.time>24){s.aggressor={x:1130,lane:0,timer:0,warning:0,stun:0,resolve:0};say(s,'An aggressive passenger approaches. F blocks, G dodges, H pushes back. Stay clear of bystanders.',8);}
 const n=s.aggressor;if(!n)return;
 const distance=()=>Math.hypot((n.x-p.x)/85,(n.lane-p.lane)*.72);
 n.timer+=dt;n.stun=Math.max(0,n.stun-dt);
 if(n.stun===0&&n.warning===0){const before=n.x;moveSolid(s,n,Math.sign(p.x-n.x)*Math.min(Math.abs(n.x-p.x),180*dt),0,{exclude:n,radius:.23,isPlayer:false});if(Math.abs(n.x-before)<dt*60&&distance()>1)moveSolid(s,n,0,(Math.abs(n.lane)<.7?1:-1)*dt*2,{exclude:n,radius:.23,isPlayer:false});}
 if(a.pressed.has('g')&&!p.fall&&!p.rest&&p.pole===null){const incoming=n.warning>0&&distance()<1.3,old=p.lane;const side=p.lane<=n.lane?-1:1;moveSolid(s,p,0,side-old);if(incoming&&Math.abs(p.lane-old)>.35){n.resolve++;n.warning=0;n.stun=.75;p.immune=Math.max(p.immune,.7);say(s,'Dodged the attack into clear space.');s.events.push('block');}else say(s,'Repositioned. Hold F if the dodge path is blocked.');}
 if(a.pressed.has('h')&&distance()<1.15&&!p.fall){const push=Math.sign(n.x-p.x)||1;if(s.passengers.some(b=>!b.seated&&Math.abs(b.x-n.x-push*70)<100&&Math.abs(b.lane-n.lane)<.6)){say(s,'Bystander too close. Block or dodge instead.');}else{moveSolid(s,n,push*90,0,{exclude:n,radius:.23,isPlayer:false});n.stun=.75;n.warning=0;n.resolve++;s.events.push('block');say(s,'Push-back creates space. No passenger was hurt.');}}
 if(distance()<.9&&p.pole===null&&!p.fall&&n.stun===0){n.warning+=dt;if(n.warning<.25)say(s,'Attack incoming - hold F to block or G to dodge.',1);if(n.warning>.45){if(a.held.has('f')||p.safe){n.resolve++;say(s,'Attack blocked. Keep creating space.');s.events.push('block');}else{strike(s,'Caught by the aggressor. One strike. Use F to block.');p.bump=.35;}n.warning=0;n.stun=.75;}}
 else if(distance()>=.9)n.warning=0;
 n.attackPhase=n.stun>0?'recover':n.warning>.25?'swing':n.warning>0?'windup':'approach';
 if(n.resolve>=3){s.aggressor=null;s.threatResolved=true;s.score+=100;say(s,'Situation defused. +100 tips. Return to your performance.',6);}
}
