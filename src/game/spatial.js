// Shared car-space conventions. Simulation coordinates are independent of cameras.
export const seatPositions=[100,160,350,430,510,590,690,770,850,930,1110,1180];
export const worldZ=x=>(x-640)/85;
export const worldX=lane=>lane*.72;
// Conservative swept clearance for the ENTIRE stunt, not just the standing pose.
export function hasTrickClearance(s,key){
 const p=s.player,centerZ=worldZ(p.pole??p.x);
 const zRadius=key==='k'?.92:key==='j'||p.pole!==null?.88:.72;
 const xRadius=key==='j'||key==='l'&&p.pole!==null?1.10:key==='k'?.78:.70;
 return !s.passengers.some(n=>{
   const nx=n.seated?(n.seatSide||-1)*1.17:worldX(n.lane);
   const centerX=p.pole!==null?0:worldX(p.lane);
   // Seated bodies stay behind the aisle; standing passengers require a .22 m margin.
   return Math.abs(worldZ(n.x)-centerZ)<zRadius+(n.sleeping&&(n.benchResting||n.floorResting)?.9:.22)&&Math.abs(nx-centerX)<xRadius+(n.seated?.05:.22);
 });
}
