import {poles} from './state.js';
import {worldX,worldZ} from './spatial.js';

// All collision distances are in metres, matching the 3D car. Small steps
// prevent tunnelling, and projecting out of circles lets the player slide past.
export const playerRadius=.19;
export function obstacles(s,{exclude=null,people=true}={}){
 const result=poles.flatMap(pole=>[-1,1].map(side=>({x:side*.42,z:worldZ(pole),radius:.035,kind:'pole'})));
 if(people)for(const n of [...s.passengers,...(s.aggressor?[s.aggressor]:[])]){if(n===exclude)continue;
  const x=n.seated?(n.seatSide||-1)*.99:worldX(n.lane),z=worldZ(n.x);
  if((n.floorResting||n.benchResting)&&n.sleeping)for(const offset of [-.45,0,.45])result.push({x:(n.seatSide||-1)*1.1,z:z+offset,radius:n.benchResting?.2:.24,kind:'passenger',person:n});
  else result.push({x,z,radius:.23,kind:'passenger',person:n});
 }
 return result;
}
export function moveSolid(s,body,dx,dlane,{radius=playerRadius,exclude=null,people=true,isPlayer=true}={}){
 const solids=obstacles(s,{exclude,people});
 if(!isPlayer&&s.player.rest?.endsWith('Lie'))for(const offset of [-.6,0,.6])solids.push({x:worldX(s.player.lane),z:worldZ(s.player.x)+offset,radius:.19,kind:'player'});
 if(!isPlayer)solids.push({x:s.player.pole!==null?(s.player.gripSide||-1)*.20:worldX(s.player.lane),z:worldZ(s.player.x)+(s.player.pole!==null?.35:0),radius:playerRadius,kind:'player'});
 const count=Math.max(1,Math.ceil(Math.hypot(dx/85,dlane*.72)/.065));let x=worldX(body.lane),z=worldZ(body.x);const contacts=new Set();
 for(let step=0;step<count;step++){
  x+=dlane*.72/count;z+=dx/85/count;
  for(let iteration=0;iteration<3;iteration++)for(const obstacle of solids){
   const vx=x-obstacle.x,vz=z-obstacle.z,d=Math.hypot(vx,vz),limit=radius+obstacle.radius;
   if(d>=limit-.00001)continue;
   contacts.add(obstacle.person||obstacle.kind);
   const nx=d>.00001?vx/d:dx?0:Math.sign(dlane)||1,nz=d>.00001?vz/d:dx?-Math.sign(dx):0;
   x=obstacle.x+nx*(limit+.00001);z=obstacle.z+nz*(limit+.00001);
  }
  if(isPlayer){x=Math.max(-.72,Math.min(.72,x));z=Math.max(worldZ(70),Math.min(worldZ(1210),z));}
 }
 body.x=z*85+640;body.lane=x/.72;return [...contacts];
}
