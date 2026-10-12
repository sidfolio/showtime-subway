import {seatPositions,worldX,worldZ} from './spatial.js';
import {obstacles} from './collision.js';

export function clearSpot(s,x,lane,length=.2){
 return !obstacles(s).some(o=>Math.abs(o.z-worldZ(x))<length+o.radius&&Math.abs(o.x-worldX(lane))<.19+o.radius);
}
export function changeRest(s,key){
 const p=s.player;
 if(key==='z'){
  for(const lane of [Math.sign(p.lane)*.7,0,-Math.sign(p.lane)*.7])if(clearSpot(s,p.x,lane)){p.lane=lane;p.rest=null;return true;}
  return false;
 }
 const side=Math.sign(p.lane)||1;
 const seats=seatPositions.filter(x=>Math.abs(x-p.x)<75).sort((a,b)=>Math.abs(a-p.x)-Math.abs(b-p.x));
 if(Math.abs(p.lane)>.4)for(const x of seats){
  const span=key==='x'?90:25;
  if(key==='x'&&(!seatPositions.some(other=>other<x&&x-other<90)||!seatPositions.some(other=>other>x&&other-x<90)))continue;
  if(s.passengers.some(n=>n.seated&&n.seatSide===side&&Math.abs(n.x-x)<span+(n.benchResting&&n.sleeping?90:25)))continue;
  p.x=x;p.lane=side*1.625;p.rest=key==='x'?'benchLie':'seat';p.pole=null;p.y=p.climb=p.vy=0;return true;
 }
 if(clearSpot(s,p.x,p.lane,key==='x'?.85:.25)){p.rest=key==='x'?'floorLie':'floorSit';p.pole=null;p.y=p.climb=p.vy=0;return true;}
 return false;
}
