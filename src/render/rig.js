import * as THREE from 'three';
import {worldZ,worldX} from '../game/spatial.js';
export {worldZ,worldX} from '../game/spatial.js';

const Y = new THREE.Vector3(0, 1, 0);
const v = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const clamp = THREE.MathUtils.clamp;
export const smooth = t => { t=clamp(t,0,1); return t*t*(3-2*t); };

// Analytic two-bone IK: preserve segment lengths and bend toward a pole vector.
export function solveArm(shoulder, target, bend, upper=.34, lower=.34) {
  const direction=target.clone().sub(shoulder);
  const distance=clamp(direction.length(),.025,upper+lower-.0001);
  direction.normalize();
  const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
  const height=Math.sqrt(Math.max(0,upper*upper-along*along));
  const perpendicular=bend.clone().sub(direction.clone().multiplyScalar(bend.dot(direction)));
  if(perpendicular.lengthSq()<.00001)perpendicular.copy(v(0,0,1)).cross(direction);
  if(perpendicular.lengthSq()<.00001)perpendicular.copy(v(1,0,0));
  perpendicular.normalize();
  return {elbow:shoulder.clone().addScaledVector(direction,along).addScaledVector(perpendicular,height),
    hand:shoulder.clone().addScaledVector(direction,distance),reachable:shoulder.distanceTo(target)<=upper+lower};
}

function material(color, roughness=.8) { return new THREE.MeshStandardMaterial({color,roughness}); }
function segment(radius,mat){const m=new THREE.Mesh(new THREE.CapsuleGeometry(radius,1,5,10),mat);m.castShadow=true;return m;}
function connect(mesh,a,b,radius){const delta=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(Y,delta.clone().normalize());mesh.scale.set(1,Math.max(.005,delta.length()/(1+2*radius)),1)}
function ellipsoid(group,mat,position,size){const m=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),mat);m.position.copy(position);m.scale.copy(size);m.castShadow=true;group.add(m);return m}

// Procedural articulated stand-in. Each limb is posed individually, not rotated as a sprite.
export function createHuman({shirt='#b55a32',skin='#b88865',pants='#293e50',player=false}={}) {
  const group=new THREE.Group(),body=new THREE.Group();group.add(body);
  const cloth=material(shirt),skinMat=material(skin,.66),trousers=material(pants),shoeMat=material('#c3c8c6'),hair=material('#272522');
  const chest=ellipsoid(body,cloth,v(0,.39,0),v(.235,.31,.135));
  const pelvis=ellipsoid(body,trousers,v(0,.02,0),v(.195,.15,.125));
  ellipsoid(body,skinMat,v(0,.71,0),v(.073,.1,.073));
  const head=new THREE.Group();head.position.set(0,.85,0);body.add(head);
  ellipsoid(head,skinMat,v(),v(.12,.155,.115));
  ellipsoid(head,hair,v(0,.103,-.008),v(.122,.065,.116));
  for(const side of [-1,1]){ellipsoid(head,skinMat,v(side*.119,-.005,0),v(.025,.04,.021));
    ellipsoid(head,material('#262b2e'),v(side*.044,.018,.105),v(.011,.008,.005));
    ellipsoid(head,material('#644533'),v(side*.046,.041,.101),v(.03,.007,.006));}
  ellipsoid(head,skinMat,v(0,-.017,.116),v(.024,.04,.031));
  ellipsoid(head,material('#69483b'),v(0,-.066,.103),v(.035,.007,.006));
  if(player){ellipsoid(head,material('#26343e'),v(0,.12,0),v(.128,.072,.122));ellipsoid(head,material('#26343e'),v(0,.09,.12),v(.13,.014,.09));}
  // Hoodie seams, cuffs, and sneaker soles give a readable human silhouette.
  const seam=new THREE.Mesh(new THREE.BoxGeometry(.007,.4,.009),material('#bbb2a6'));seam.position.set(0,.37,.131);body.add(seam);
  const phone=new THREE.Mesh(new THREE.BoxGeometry(.065,.115,.012),material('#20262b'));phone.position.set(.03,.19,.34);phone.rotation.x=-.6;phone.visible=false;body.add(phone);
  const limbs={}, hands=[],feet=[];
  for(const side of [-1,1]){
    const key=side<0?'left':'right';
    limbs[key]={upperArm:segment(.071,cloth),forearm:segment(.047,skinMat),thigh:segment(.085,trousers),shin:segment(.065,trousers)};
    Object.values(limbs[key]).forEach(m=>body.add(m));
    const hand=ellipsoid(body,skinMat,v(),v(.042,.055,.027));hands.push(hand);
    for(let i=0;i<3;i++)ellipsoid(hand,skinMat,v((i-1)*.21,-.55,.1),v(.15,.48,.55));
    const foot=new THREE.Group();body.add(foot);ellipsoid(foot,shoeMat,v(0,.025,.06),v(.082,.06,.16));
    const sole=new THREE.Mesh(new THREE.BoxGeometry(.15,.025,.26),material('#e4e6df'));sole.position.set(0,-.025,.055);foot.add(sole);feet.push(foot);
  }
  let pose={root:v(),rotation:new THREE.Quaternion(),headTilt:0,hipTilt:0};
  let initialized=false;const jointPose=[0,1].map(()=>({elbow:v(),hand:v(),knee:v(),foot:v()}));
  const labelCanvas=document.createElement('canvas');labelCanvas.width=256;labelCanvas.height=64;
  const ctx=labelCanvas.getContext('2d');ctx.font='bold 27px Arial';ctx.textAlign='center';ctx.fillStyle=player?'#ffe2b4':'#e2e6e1';ctx.fillText(player?'YOU':'',128,42);
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(labelCanvas),depthTest:false,transparent:true}));label.scale.set(.8,.2,1);group.add(label);
  const gripTargets=[];let labelText=player?'YOU':'';
  function setLabel(value){if(value===labelText)return;labelText=value;ctx.clearRect(0,0,256,64);ctx.fillStyle=player?'#ffe2b4':'#d4e6ef';ctx.fillText(value,128,42);label.material.map.needsUpdate=true;}
  function update(next,dt){
    // Smooth stance transitions; exact grip endpoints are solved AFTER smoothing the torso.
    const alpha=dt>0?1-Math.exp(-dt*18):0,first=!initialized;
    if(first){pose.root.copy(next.root);pose.rotation.copy(next.rotation||new THREE.Quaternion());initialized=true;}
    pose.root.lerp(next.root,alpha);pose.rotation.slerp(next.rotation||new THREE.Quaternion(),alpha);
    group.position.copy(pose.root);body.quaternion.copy(pose.rotation);
    head.rotation.z=THREE.MathUtils.lerp(head.rotation.z,next.headTilt||0,alpha);
    head.rotation.x=THREE.MathUtils.lerp(head.rotation.x,next.headNod||0,alpha);phone.visible=Boolean(next.phone);
    group.updateWorldMatrix(true,true);
    gripTargets.length=0;
    for(let index=0;index<2;index++){
      const side=index===0?-1:1,key=index===0?'left':'right',limb=limbs[key];
      const shoulder=v(side*.205,.56,0),hip=v(side*.105,0,0);
      let elbow=next.elbows?.[index]||v(side*.27,.22,-.02),hand=next.hands?.[index]||v(side*.24,-.03,.035);
      const target=next.grips?.[index]?group.parent.localToWorld(next.grips[index].clone()):null;
      if(target){const local=body.worldToLocal(target.clone());const solved=solveArm(shoulder,local,v(side,-.2,-1));elbow=solved.elbow;hand=solved.hand;gripTargets.push({target:target.clone(),actual:body.localToWorld(hand.clone()),reachable:solved.reachable});}
      const joint=jointPose[index];
      if(target||first){joint.elbow.copy(elbow);joint.hand.copy(hand);}else{joint.elbow.lerp(elbow,alpha);joint.hand.lerp(hand,alpha);elbow=joint.elbow;hand=joint.hand;}
      connect(limb.upperArm,shoulder,elbow,.071);connect(limb.forearm,elbow,hand,.047);hands[index].position.copy(hand);
      const desiredKnee=next.knees?.[index]||v(side*.11,-.42,.03),desiredFoot=next.feet?.[index]||v(side*.12,-.83,0);
      if(first){joint.knee.copy(desiredKnee);joint.foot.copy(desiredFoot);}else{joint.knee.lerp(desiredKnee,alpha);joint.foot.lerp(desiredFoot,alpha);}
      const knee=joint.knee,foot=joint.foot;
      connect(limb.thigh,hip,knee,.085);connect(limb.shin,knee,foot,.065);feet[index].position.copy(foot);
      feet[index].rotation.x=next.footTilt||0;
    }
    label.position.set(0,1.12,0);label.visible=Boolean(labelText);
  }
  function dispose(){const materials=new Set();group.traverse(o=>{if(o.isMesh)o.geometry.dispose();if(o.material)materials.add(o.material);});for(const m of materials){m.map?.dispose();m.dispose();}}
  return {group,update,gripTargets,dispose,setLabel};
}

const axisY=v(0,1,0),axisX=v(1,0,0);
export function performerPose(s){
  const p=s.player,t=s.time,climb=p.y/155*.62;
  const result={root:v(worldX(p.lane),.87+climb,worldZ(p.x)),rotation:new THREE.Quaternion()};
  const walking=Math.abs(p.vx)>1||Math.abs(p.laneVelocity||0)>.01;
  result.walking=walking&&p.pole===null&&!p.trick&&!p.brace&&!p.duck&&!p.fall;
  const gait=Math.sin(t*9)*(walking?.26:0);
  result.knees=[v(-.12,-.42,gait*.6),v(.12,-.42,-gait*.6)];
  result.feet=[v(-.12,-.83, gait),v(.12,-.83,-gait)];
  result.elbows=[v(-.26,.24,-gait*.5),v(.26,.24,gait*.5)];
  result.hands=[v(-.24,-.03,-gait),v(.24,-.03,gait)];
  const facing=p.facing??0;result.rotation.setFromAxisAngle(axisY,facing);
  if(p.duck){result.root.y-=.3;result.knees=[v(-.17,-.26,.2),v(.17,-.26,.2)];result.feet=[v(-.18,-.53,-.07),v(.18,-.53,-.07)]}
  if(p.bump){result.rotation.multiply(new THREE.Quaternion().setFromAxisAngle(axisX,-.14));result.hands=[v(-.25,.3,.28),v(.25,.3,.28)];}
  if(p.brace){result.root.y-=.08;result.feet=[v(-.24,-.75,-.12),v(.24,-.75,.12)];result.knees=[v(-.19,-.36,.06),v(.19,-.36,.19)];result.rotation.multiply(new THREE.Quaternion().setFromAxisAngle(v(0,0,1),-.06));}
  if(p.pole!==null||p.bracePole!==undefined){
    const z=worldZ(p.pole??p.bracePole),height=.87+climb,gripSide=p.gripSide||-1;
    result.root.set(gripSide*.20,height,z+.35);result.rotation.setFromAxisAngle(axisY,Math.PI);
    result.grips=[v(gripSide*.42,1.43+climb,z),v(gripSide*.42,1.25+climb,z)];
    result.knees=[v(-.12,-.35,.15),v(.12,-.4,.06)];result.feet=[v(-.12,-.76,.12),v(.12,-.80,0)];
    if(p.climb>5){result.knees=[v(-.11,-.25,.23),v(.11,-.3,.2)];result.feet=[v(-.12,-.55,.3),v(.12,-.63,.3)]}
  }
  if(p.trick){
    const progress=clamp(p.trick.elapsed/p.trick.duration,0,1),engage=smooth(progress/.18)*(1-smooth((progress-.82)/.18));
    const phase=smooth((progress-.14)/.72),angle=phase*Math.PI*2,z=worldZ(p.pole??p.x);
    if(p.trick.key==='j'){
      const orbit=angle+Math.PI/4,radius=.45,gripSide=p.gripSide||-1;
      result.root.set(gripSide*.42+Math.cos(orbit)*radius,.95+climb+Math.sin(progress*Math.PI)*.1,z+Math.sin(orbit)*radius);
      result.rotation.setFromAxisAngle(axisY,Math.atan2(-Math.cos(orbit),-Math.sin(orbit)));
      result.grips=[v(gripSide*.42,1.50+climb,z),v(gripSide*.42,1.30+climb,z)];
      result.knees=[v(-.13,-.24,.28),v(.19,-.38,-.12)];result.feet=[v(-.13,-.50,.25),v(.23,-.68,-.2)];
    }else if(p.trick.key==='k'){
      // Both hands remain on the opposed rods. Tuck legs to fit below the ceiling.
      const center=v(0,1.73,z),offset=v(0,-.43,0).applyAxisAngle(axisX,angle);
      const flipRoot=center.add(offset);
      result.root.lerp(flipRoot,engage);result.rotation.slerp(new THREE.Quaternion().setFromAxisAngle(axisX,angle),engage);
      const doubleGrips=[v(-.42,1.90,z),v(.42,1.90,z)];
      if(progress>=.18&&progress<=.82)result.grips=doubleGrips;
      else{
        // Reaching / returning: no locked contact until both grips are in reach.
        delete result.grips;
        const inverse=result.rotation.clone().invert();
        const reach=doubleGrips.map((point,index)=>solveArm(v(index?.205:-.205,.56,0),point.clone().sub(result.root).applyQuaternion(inverse),v(index?1:-1,-.2,-1)));
        result.elbows=reach.map(a=>a.elbow);result.hands=reach.map(a=>a.hand);
      }
      result.knees=result.knees.map((point,i)=>point.clone().lerp(v(i?.12:-.12,-.15,.28),engage));result.feet=result.feet.map((point,i)=>point.clone().lerp(v(i?.12:-.12,-.34,.08),engage));
    }else if(p.pole!==null){
      // A separate aerial spin: lift and tuck the legs, lean inward, and rotate
      // around a fixed pole. Blend into / out of the pose without releasing it.
      const orbit=angle+Math.PI/4;
      const gripSide=p.gripSide||-1;
      result.root.lerp(v(gripSide*.42+Math.cos(orbit)*.45,1.05+climb,z+Math.sin(orbit)*.45),engage);
      const tilt=new THREE.Quaternion().setFromAxisAngle(axisY,Math.atan2(-Math.cos(orbit),-Math.sin(orbit))).multiply(new THREE.Quaternion().setFromAxisAngle(axisX,Math.PI/3));
      result.rotation.slerp(tilt,engage);
      result.grips=[v(gripSide*.42,1.54+climb,z),v(gripSide*.42,1.22+climb,z)];
      result.knees=result.knees.map((point,i)=>point.clone().lerp(v(i?.14:-.14,-.15,.35),engage));result.feet=result.feet.map((point,i)=>point.clone().lerp(v(i?.14:-.14,-.18,.55),engage));
    }else{
      const dance=Math.sin(progress*Math.PI*8);result.root.x+=dance*.08;result.root.y-=Math.abs(dance)*.07;
      result.rotation.setFromAxisAngle(axisY,facing+dance*.27);result.hands=[v(-.4,.35+dance*.1,.2),v(.4,.35-dance*.1,.2)];
      result.elbows=[v(-.34,.39,.05),v(.34,.39,.05)];result.feet=[v(-.15,-.83,dance*.2),v(.15,-.83,-dance*.2)];
    }
  }
  if(s.blocking){result.elbows=[v(-.23,.4,.1),v(.23,.4,.1)];result.hands=[v(-.12,.7,.22),v(.12,.7,.22)]}
  if(p.pole===null&&!p.brace){const sway=Math.sin(t*8)*s.train.shake*.09*(1-p.balance/180);result.rotation.multiply(new THREE.Quaternion().setFromAxisAngle(v(0,0,1),sway));}
  if(p.rest)restPose(result,p.rest,worldX(p.lane),worldZ(p.x));
  if(p.fall){
    const elapsed=1.2-p.fall,down=elapsed<.25?smooth(elapsed/.25):elapsed<.65?1:1-smooth((elapsed-.65)/.55);
    const axis=p.fallLane?v(0,0,-Math.sign(p.fallLane)):v(Math.sign(p.fallDX)||1,0,0);
    result.root.y=.87-down*.56;result.rotation.setFromAxisAngle(axis,down*Math.PI/2);result.walking=false;delete result.grips;
    result.hands=[v(-.3,.38,-.18),v(.3,.38,-.18)];result.elbows=[v(-.33,.4,-.05),v(.33,.4,-.05)];
    result.knees=[v(-.15,-.36,-.08),v(.15,-.36,-.08)];result.feet=[v(-.16,-.78,-.06),v(.16,-.78,-.06)];
  }
  return result;
}

export function passengerPose(n,s){
  const side=n.seatSide||-1;
  const pose={root:v(n.seated?side*1.17:worldX(n.lane),n.seated?.59:.87,worldZ(n.x)),rotation:new THREE.Quaternion().setFromAxisAngle(axisY,n.seated?-side*Math.PI/2:0)};
  const gait=n.target!==undefined?Math.sin(s.time*8)*.23:0;
  pose.knees=[v(-.12,-.42,gait*.5),v(.12,-.42,-gait*.5)];pose.feet=[v(-.12,-.83,gait),v(.12,-.83,-gait)];
  if(n.seated){pose.knees=[v(-.12,-.05,.37),v(.12,-.05,.37)];pose.feet=[v(-.12,-.54,.40),v(.12,-.54,.40)];pose.elbows=[v(-.25,.24,.16),v(.25,.24,.16)];pose.hands=[v(-.1,.1,.35),v(.1,.1,.35)];
    if(n.sleeping){pose.headTilt=side*.24;pose.rotation.multiply(new THREE.Quaternion().setFromAxisAngle(v(0,0,1),.07));}}
  else{pose.rotation.setFromAxisAngle(axisY,n.facing??(n.target!==undefined?(n.target>n.x?0:Math.PI):0));pose.hands=[v(-.23,-.03,-gait),v(.23,-.03,gait)];pose.elbows=[v(-.26,.23,-gait*.5),v(.26,.23,gait*.5)];pose.rotation.multiply(new THREE.Quaternion().setFromAxisAngle(v(0,0,1),Math.sin(s.time*7+n.id)*s.train.shake*.06));}
  if(n.reaction>0){pose.hands=[v(-.35,.6,.3),v(.35,.6,.3)];pose.elbows=[v(-.3,.4,.15),v(.3,.4,.15)]}
  const fidget=Math.sin(s.time*(.8+(n.id%4)*.14)+n.id);
  pose.headNod=n.sleeping?.27:Math.sin(s.time*.6+n.id)*.04;pose.headTilt=(pose.headTilt||0)+fidget*.035;
  if(!n.sleeping&&n.reaction<=0){pose.root.y+=fidget*.009;if(n.id%3===0){pose.phone=true;pose.headNod=.18;pose.elbows=[v(-.24,.26,.16),v(.24,.26,.16)];pose.hands=[v(-.035,.17,.34),v(.045,.17,.34)];}else if(!n.seated&&n.target===undefined){pose.hands=[v(-.28,.95,.18),v(.24,-.02,.05)];pose.elbows=[v(-.32,.65,.06),v(.27,.24,.02)];}}
  if(n.bracing){pose.phone=false;pose.hands=[v(-.29,.65,.28),v(.3,.85,.16)];pose.elbows=[v(-.31,.44,.12),v(.34,.65,.02)];pose.root.y-=.06;pose.feet=[v(-.22,-.77,-.1),v(.23,-.77,.1)];}
  if(n.stumble>0){const dip=Math.sin(Math.min(1,n.stumble/1.5)*Math.PI)*.18;pose.root.y-=dip;pose.knees=[v(-.18,-.3,.19),v(.18,-.3,.19)];pose.feet=[v(-.23,-.83+dip,-.12),v(.23,-.83+dip,.12)];pose.rotation.multiply(new THREE.Quaternion().setFromAxisAngle(axisX,dip*.7));}
  if(n.sleeping&&(n.floorResting||n.benchResting))restPose(pose,n.benchResting?'benchLie':'floorLie',side*1.17,worldZ(n.x));
  if(n.id===999){pose.rotation.setFromAxisAngle(axisY,s.player.x>n.x?0:Math.PI);if(n.attackPhase==='windup'||n.attackPhase==='swing'){const swing=n.attackPhase==='swing';pose.hands=[v(-.14,.62,swing?.66:.15),v(.18,.68,.19)];pose.elbows=[v(-.24,.51,swing?.4:-.09),v(.28,.48,.12)];pose.root.z+=(swing?.12:0)*(s.player.x>n.x?1:-1);}}
  return pose;
}

function restPose(pose,kind,x,z){
 pose.walking=false;pose.phone=false;delete pose.grips;
 if(kind==='benchLie'||kind==='floorLie'){
  pose.root.set(x,kind==='benchLie'?.63:.20,z);pose.rotation.setFromAxisAngle(axisX,Math.PI/2);pose.headNod=.08;
  pose.knees=[v(-.12,-.4,-.02),v(.12,-.4,-.02)];pose.feet=[v(-.12,-.8,-.03),v(.12,-.8,-.03)];
  pose.hands=[v(-.14,.3,-.13),v(.14,.3,-.13)];pose.elbows=[v(-.23,.4,-.07),v(.23,.4,-.07)];
 }else{
  const seat=kind==='seat';pose.root.set(x,seat?.59:.24,z);pose.rotation.setFromAxisAngle(axisY,seat?-Math.sign(x)*Math.PI/2:0);
  pose.knees=[v(-.18,seat?-.05:.02,.35),v(.18,seat?-.05:.02,.35)];pose.feet=[v(-.2,seat?-.54:-.2,.42),v(.2,seat?-.54:-.2,.42)];
  pose.hands=[v(-.14,.08,.3),v(.14,.08,.3)];pose.elbows=[v(-.25,.22,.14),v(.25,.22,.14)];
 }
}
