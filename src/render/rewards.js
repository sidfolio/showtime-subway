// Presentation queue: completion records are received once, never awarded here.
export function createRewardQueue(){
 const seen=new Set(),queue=[];let current=null;
 return {
  receive(record){if(!record||seen.has(record.completionId))return;seen.add(record.completionId);queue.push({...record,remaining:1.8});},
  update(dt,{paused=false,safety=false}={}){if(paused||safety)return null;if(!current)current=queue.shift()||null;else{current.remaining-=dt;if(current.remaining<=0)current=queue.shift()||null;}return current;},
 };
}
