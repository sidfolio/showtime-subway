import {poles} from './state.js';

import {hasTrickClearance} from './spatial.js';

export function actionPrompt(s){

 const p=s.player;

 if(s.train.phase==='boarding')return 'Doors open · E releases · move into the green safe pocket · hold Q to wait';

 if(p.rest)return 'Resting  |  Z stands up  |  C sits  |  X lies down';

 if(p.entry)return 'Boarding… watch for people, then move around them';

 if(p.fall>0)return 'Recovering from a fall | E secures a pole before the next shake';

 if(p.trick)return `${p.trick.name} · keep your grip · wait for the landing`;

 if(p.pole!==null){

  if(!hasTrickClearance(s,'j'))return 'Pole held · crowd too close · wait or release with E';

  return 'Hit J to spin on the pole · Hit K to flip between two poles · Hit L for an aerial spin · W / S climbs · E releases';

 }

 const near=poles.some(x=>Math.abs(x-p.x)<48&&Math.abs(p.lane)<.7);

 if(near)return 'Hit E to grip · then J spins / K flips between two poles / L does an aerial spin';

 if(p.safe)return 'Safe pocket · hold Q and let passengers pass';

 if(p.bump>0)return 'Blocked · step sideways to go around · Shift ducks, but bodies stay solid';

 return 'Hit L to dance in open space · move toward a pole pair for E / J / K';

}

export function turbulencePrompt(s){
 if(s.train.phase!=='riding')return '';
 const p=s.player;
 if(s.train.lurch>0)return `TRAIN SHAKING | ${p.pole!==null||p.brace&&p.bracePole!==undefined?'Grip secured':p.rest?'Resting low':'E grips a pole | Q braces beside a rod'}`;
 const remaining=s.train.nextShake-s.time;
 return remaining>0&&remaining<=3?`SHAKE IN ${Math.ceil(remaining)}s | E grips a pole | Q braces beside a rod`:'';
}
