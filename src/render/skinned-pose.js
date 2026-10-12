import * as THREE from 'three';
import {solveArm} from './rig.js';
const v=()=>new THREE.Vector3(),q=()=>new THREE.Quaternion();
export function aimBone(body,model,bones,name,childName,target){
 const bone=bones[name],child=bones[childName];if(!bone||!child)return;
 model.updateWorldMatrix(true,true);
 const origin=bone.getWorldPosition(v()),current=child.getWorldPosition(v()).sub(origin).normalize();
 const desired=body.localToWorld(target.clone()).sub(origin).normalize(),world=bone.getWorldQuaternion(q());
 bone.quaternion.copy(bone.parent.getWorldQuaternion(q()).invert().multiply(q().setFromUnitVectors(current,desired).multiply(world)));
}
export function lockHands({group,body,model,bones,gripTargets,sides=['Right','Left']},grips){
 gripTargets.length=0;if(!grips)return;
 const targets=grips.map(g=>group.parent.localToWorld(g.clone()));
 // Move the torso slightly into the feasible reach volume using measured arm
 // lengths. Keep actual bone lengths, rather than stretching the textured skin.
 for(let pass=0;pass<12;pass++)for(let i=0;i<targets.length;i++){
  model.updateWorldMatrix(true,true);const side=sides[i],arm=bones[side+'Arm'],fore=bones[side+'ForeArm'],hand=bones[side+'Hand'];
  const shoulder=arm.getWorldPosition(v()),reach=shoulder.distanceTo(fore.getWorldPosition(v()))+fore.getWorldPosition(v()).distanceTo(hand.getWorldPosition(v()))-.001;
  const delta=targets[i].clone().sub(shoulder),excess=delta.length()-reach;
  if(excess>0){const world=group.getWorldPosition(v()).addScaledVector(delta.normalize(),excess+.001);group.position.copy(group.parent.worldToLocal(world));}
 }
 for(let i=0;i<targets.length;i++){
  const side=sides[i],arm=bones[side+'Arm'],fore=bones[side+'ForeArm'],hand=bones[side+'Hand'];
  model.updateWorldMatrix(true,true);
  const shoulder=body.worldToLocal(arm.getWorldPosition(v()));
  const elbow=body.worldToLocal(fore.getWorldPosition(v())),endpoint=body.worldToLocal(hand.getWorldPosition(v()));
  const target=body.worldToLocal(targets[i].clone());
  const solved=solveArm(shoulder,target,new THREE.Vector3(i?1:-1,-.2,-1),shoulder.distanceTo(elbow),elbow.distanceTo(endpoint));
  aimBone(body,model,bones,side+'Arm',side+'ForeArm',solved.elbow);
  aimBone(body,model,bones,side+'ForeArm',side+'Hand',solved.hand);
  model.updateWorldMatrix(true,true);
  gripTargets.push({target:targets[i],actual:hand.getWorldPosition(v()),reachable:solved.reachable});
 }
}
