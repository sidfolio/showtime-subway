// Map screen-relative directions into the shared longitudinal / aisle coordinates.
// A held pole always keeps W/S and Up/Down mapped to climbing.
export function cameraActions(actions,view,holdingPole=false,yaw=null){
  if(holdingPole)return actions;
  if(yaw!==null){const forward=Number(actions.held.has('w'))-Number(actions.held.has('s')),right=Number(actions.held.has('d'))-Number(actions.held.has('a'));const scale=Math.max(1,Math.hypot(forward,right));return {...actions,longitudinal:(forward*Math.cos(yaw)+right*Math.sin(yaw))/scale,lateral:(forward*Math.sin(yaw)-right*Math.cos(yaw))/scale};}
  // A camera looking down +Z sees +X on the LEFT; looking down -Z reverses it.
  // The side camera looks from +X, so +Z likewise points screen-left.
  const mapping=view==='front'?{w:'d',s:'a',a:'s',d:'w'}:view==='rear'?{w:'a',s:'d',a:'w',d:'s'}:{w:'w',s:'s',a:'d',d:'a'};
  const mapped=set=>new Set([...set].map(key=>mapping[key]||key));
  return {held:mapped(actions.held),pressed:mapped(actions.pressed)};
}
