import {changeRest} from './rest.js';
import {poles,say} from './state.js';
import {hasTrickClearance} from './spatial.js';
import {moveSolid} from './collision.js';
function nearestPole(x){return poles.reduce((nearest,pole)=>Math.abs(pole-x)<Math.abs(nearest-x)?pole:nearest,poles[0]);}
function poleHasPassenger(s,pole,gripSide){const sideLane=gripSide*.58;return s.passengers.some(n=>!n.seated&&!n.sleeping&&Math.abs(n.x-pole)<58&&(Math.abs(n.lane)<.25||Math.abs(n.lane-sideLane)<.45));}
export function updatePerformer(s,a,dt){
 const p=s.player,h=a.held,tap=a.pressed;p.cooldown=Math.max(0,p.cooldown-dt);p.immune=Math.max(0,p.immune-dt);p.duck=h.has('shift');p.brace=h.has('q');
 p.bracePole=p.brace?poles.find(x=>Math.abs(x-p.x)<48&&Math.abs(p.lane)<.7):undefined;
 for(const key of ['c','x','z'])if(tap.has(key)&&!p.fall&&!p.trick)say(s,changeRest(s,key)?'C sits; X lies down; Z stands. Movement stands when the aisle is clear.':'Space occupied. Find an empty bench or clear floor.');
 if(p.rest){if([...h].some(k=>['w','a','s','d'].includes(k)))changeRest(s,'z');if(p.rest){p.vx=p.laneVelocity=0;return;}}
 p.safe=(p.x>565&&p.x<715&&p.lane>.5&&p.y===0);
 if(tap.has('e')&&!p.trick&&!p.entry&&!p.fall){
  if(p.pole!==null){p.pole=null;p.gripSide=-1;p.climb=0;p.vy=0;p.cooldown=.08}
  else{
   const pole=nearestPole(p.x);
   const gripSide=p.lane>=0?1:-1;
   if(Math.abs(pole-p.x)<=72&&Math.abs(p.lane)<=.82){
    if(poleHasPassenger(s,pole,gripSide))say(s,'That side of the pole is occupied. Step around and use the other handle.');
    else{p.pole=pole;p.gripSide=gripSide;p.x=pole;p.lane=0;p.vx=0;say(s,'Pole held. W/S climbs; J spins; K does a two-pole somersault.');}
   }else say(s,'Move close to the pole pair and toward the center aisle, then press E.');
  }
 }
 p.bump=Math.max(0,(p.bump||0)-dt);p.fall=Math.max(0,(p.fall||0)-dt);
 if(p.fall){moveSolid(s,p,(p.fallDX||0)*dt*p.fall,(p.fallLane||0)*dt*p.fall);p.vx=p.laneVelocity=0;return;}
 if(p.entry){const before=p.x;moveSolid(s,p,Math.min(640-p.x,320*dt),-p.lane*dt*4);p.vx=(p.x-before)/dt;p.facing=0;if(p.x-before<dt*20||p.x>=640){p.entry=false;p.vx=0;say(s,'Use WASD / arrows to move around passengers. E grips a nearby pole.',7)}return}
 if(p.trick){p.trick.elapsed+=dt;if(p.trick.elapsed>=p.trick.duration){const earned=p.trick.points*s.combo;s.score+=earned;s.combo=Math.min(8,s.combo+1);s.comboUntil=s.time+6;s.stats.tricks++;const moveId=p.trick.key==='l'?(p.pole===null?'floor':'aerial'):p.trick.key;const names={floor:'FLOOR DANCE',aerial:'AERIAL SPIN',j:'POLE SPIN',k:'TWO-POLE FLIP'};s.moveRewards??={};const record=s.moveRewards[moveId]??={count:0,subtotal:0};record.count++;record.subtotal+=earned;s.lastReward={completionId:s.stats.tricks,moveLabel:names[moveId],awardDelta:earned,count:record.count,subtotal:record.subtotal,runTotalAfter:s.score};s.events.push('tip');say(s,`${p.trick.name} landed! +${earned} tips`);p.trick=null;p.cooldown=.08}return}
 if(p.pole!==null){p.climb=Math.max(0,Math.min(155,p.climb+((h.has('w')?1:0)-(h.has('s')?1:0))*320*dt));p.y=p.climb;p.lane=0;p.vx=0;p.laneVelocity=0}
 else{let direction=a.longitudinal??((h.has('d')?1:0)-(h.has('a')?1:0));const lateral=a.lateral??((h.has('s')?1:0)-(h.has('w')?1:0));p.vx=direction*(p.duck?85:205)*(p.brace?.3:1);p.laneVelocity=lateral*(p.duck?1.2:3.3)*(p.brace?.3:1);const beforeX=p.x,beforeLane=p.lane;const contacts=moveSolid(s,p,p.vx*dt,p.laneVelocity*dt);p.vx=(p.x-beforeX)/dt;p.laneVelocity=(p.lane-beforeLane)/dt;if(contacts.length&&(direction||lateral)){p.bump=.35;p.contacts=contacts;for(const n of contacts)if(typeof n==='object')n.reaction=Math.max(n.reaction||0,1.2);say(s,contacts.includes('pole')?'Solid pole. Go around it, or press E to grip.':'Passenger ahead. Step sideways and go around; ducking does not let you pass through.',2)}if(direction||lateral)p.facing=Math.atan2(lateral*.72,direction);if(tap.has(' ')&&p.y===0){p.vy=380;s.events.push('jump')}p.vy-=1150*dt;p.y=Math.max(0,p.y+p.vy*dt);if(p.y===0)p.vy=0}
 if(p.cooldown>0)return;
 const key=['j','k','l'].find(k=>tap.has(k));if(!key)return;
 if(s.train.phase==='boarding'){say(s,'Doors are open. Wait in the marked safe space; tricks resume after boarding.');return}
 if(p.safe){say(s,'Step out of the safe space to perform.');return}
 if(p.balance<30){say(s,'Recover your balance before starting another trick.');return}
 if(!hasTrickClearance(s,key)){say(s,'Not enough clearance for the whole move. Try another pole pair or let the crowd pass.');return}
 if((key==='j'||key==='k')&&p.pole===null){say(s,'Grab a pole with E first. L is your floor dance.');return}
 p.trick={key,name:key==='j'?'Pole orbit':key==='k'?'Two-pole somersault':p.pole!==null?'Aerial spin':'Footwork',elapsed:0,duration:key==='k'?1:key==='j'?.75:p.pole!==null?.85:.65,points:key==='k'?95:key==='j'?65:p.pole!==null?55:30};s.events.push('trick');
 for(const n of s.passengers)if(n.sleeping&&Math.abs(n.x-p.x)<220)n.noise=Math.min(100,n.noise+(key==='k'?48:30));
}

