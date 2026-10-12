import {random,say} from './state.js';
import {board} from './passengers.js';
export function updateTrain(s,dt){let t=s.train;t.phaseTime+=dt;t.shake=Math.max(0,t.shake-dt*.5);t.lurch=Math.max(0,t.lurch-dt);
 if(t.phase==='riding'&&s.time>=t.nextStation){t.phase='approaching';t.phaseTime=0;say(s,'Next station. Finish your move and find the marked safe space.',7)}
 if(t.phase==='approaching'&&t.phaseTime>5){t.phase='boarding';t.phaseTime=0;t.shake=0;t.door=1;s.station++;board(s);s.events.push('doors')}
 if(t.phase==='boarding'&&t.phaseTime>9){
  // Anyone still on the platform stays there; nobody crosses a closed door.
  s.passengers=s.passengers.filter(n=>!n.entering||Math.abs(n.lane)<1.7);
  s.passengers=s.passengers.filter(n=>!n.exiting||Math.abs(n.lane)<1.7);
  for(const n of s.passengers)if(n.exiting){n.exiting=false;delete n.target;}
  t.phase='riding';t.phaseTime=0;t.door=0;t.nextStation=s.time+Math.max(24,s.config.duration/s.config.stations-14);t.nextShake=s.time+6;if(s.player.safe)s.stats.safeStops++;say(s,'Stand clear. Doors closing. The aisle is yours again.');
 }
 if(t.phase==='riding'&&s.time>=t.nextShake-2&&s.time<t.nextShake)say(s,'Track bend ahead — grab a pole with E or hold Q beside a rod.',2);
 if(t.phase==='riding'&&s.time>=t.nextShake){t.shake=1;t.lurch=2.5;t.shakeId=(t.shakeId||0)+1;t.nextShake=s.time+s.config.shakeFrequency+random(s)*5;for(const n of s.passengers)if(!n.seated)n.stumble=n.id%3===0?1.5:.65;s.events.push('lurch');say(s,'Train lurch! Secure a pole grip to avoid a fall.',3)}
}
