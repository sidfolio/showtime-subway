// Keep the eye inside the physical car, including during pan and zoom.
export function containCamera(position){
 position.x=Math.max(-1.28,Math.min(1.28,position.x));
 position.y=Math.max(.65,Math.min(2.3,position.y));
 position.z=Math.max(-7.15,Math.min(7.15,position.z));
 return position;
}
