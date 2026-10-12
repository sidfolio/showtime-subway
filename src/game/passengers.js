import {random,say} from './state.js';
import {seatPositions} from './spatial.js';
import {moveSolid} from './collision.js';
export function populate(s){
 s.passengers=s.config.sleepers.map((x,i)=>({id:i,x:seatPositions.reduce((a,b)=>Math.abs(b-x)<Math.abs(a-x)?b:a),seatSide:i%2?1:-1,lane:-.9,seated:true,sleeping:true,noise:0,color:'#6e746e',skin:'#956e55',reaction:0}));
 if(s.passengers[0]){s.passengers[0].benchResting=true;s.passengers[0].x=430;}
 if(s.passengers[1]){s.passengers[1].benchResting=true;s.passengers[1].x=770;}
 if(s.passengers[2])s.passengers[2].floorResting=true;
 const taken=new Set(s.passengers.flatMap(n=>seatPositions.filter(x=>Math.abs(x-n.x)<(n.benchResting?95:25)).map(x=>`${n.seatSide}:${x}`))); 
 const available=seatPositions.flatMap(x=>[-1,1].map(seatSide=>({x,seatSide}))).filter(n=>!taken.has(`${n.seatSide}:${n.x}`));
 for(let i=0;i<s.config.passengers;i++){const seated=i<Math.ceil(s.config.passengers*.65),seat=available[i];s.passengers.push({id:i+10,x:seated?seat.x:[315,845,1120,380,940][(i-Math.ceil(s.config.passengers*.65))%5],seatSide:seated?seat.seatSide:undefined,lane:seated?(seat.seatSide*1.6):(i%2?.45:-.45),seated,sleeping:false,noise:0,color:['#343e52','#8d5545','#626e55','#635b75','#bc9861'][i%5],skin:['#c79878','#82583e','#deb28e','#644534'][i%4],reaction:0})}
}
export function updatePassengers(s,dt){
 for(const n of s.passengers){
  n.reaction=Math.max(0,n.reaction-dt);n.noise=Math.max(0,n.noise-dt*3);
  n.stumble=Math.max(0,(n.stumble||0)-dt);n.bracing=s.train.lurch>0&&!n.seated;
  if(n.target!==undefined){const dx=n.target-n.x;
   // Let riders leave before the queue enters the same doorway.
   if(n.entering&&Math.abs(n.lane)>.45&&s.passengers.some(other=>other!==n&&other.exiting&&Math.abs(other.target-n.x)<50&&other.exitSide===Math.sign(n.lane)))continue;
   if(n.entering&&Math.abs(n.lane)>.45){n.facing=n.lane>0?-Math.PI/2:Math.PI/2;moveSolid(s,n,0,-Math.sign(n.lane)*Math.min(Math.abs(n.lane)-.45,dt*1.4),{radius:.21,exclude:n,isPlayer:false});}
   else if(n.exiting&&Math.abs(dx)<2){n.facing=n.exitSide*Math.PI/2;moveSolid(s,n,0,n.exitSide*dt*1.4,{radius:.21,exclude:n,isPlayer:false});}
   else{n.facing=dx>0?0:Math.PI;const old=n.x;const contact=moveSolid(s,n,Math.sign(dx)*Math.min(Math.abs(dx),45*dt),0,{radius:.21,exclude:n,isPlayer:false});if(contact.length&&Math.abs(n.x-old)<dt*15){const lane=n.id%2?.05:-.05;moveSolid(s,n,0,(lane-n.lane)*dt*2,{radius:.21,exclude:n,isPlayer:false});}if(Math.abs(dx)<2&&!n.exiting){delete n.target;n.entering=false;}}
  }
 }
 s.passengers=s.passengers.filter(n=>!n.exiting||Math.abs(n.lane)<2.2);
}
export function board(s){
 for(const n of s.passengers.filter(n=>!n.seated&&!n.sleeping)){n.target=Math.abs(n.x-240)<Math.abs(n.x-1020)?240:1020;n.exiting=true;n.entering=false;n.exitSide=n.target===240?-1:1;}
 const count=s.level===0?2:s.level===1?4:7;
 for(let i=0;i<count;i++){const door=i%2?1020:240;s.passengers.push({id:100+s.station*10+i,x:door,lane:(i%2?1:-1)*(3+Math.floor(i/2)*.7),entering:true,target:door+(i%2?-1:1)*(70+random(s)*160),seated:false,sleeping:false,noise:0,color:['#555d69','#7c5942','#526d69'][i%3],skin:['#c49a7a','#856044'][i%2],reaction:0})}
 say(s,'Passengers boarding. Release with E, move into the marked safe pocket, and hold Q to wait.');
}
