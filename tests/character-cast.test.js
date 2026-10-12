import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {passengerCharacter,characterFiles} from '../src/game/character-catalog.js';
import {populate} from '../src/game/passengers.js';
import {createState} from '../src/game/state.js';
import {performerPose} from '../src/render/rig.js';
import {lockHands} from '../src/render/skinned-pose.js';

test('rush-hour cast uses all passenger identities and sleepers retain their identity on wake',()=>{
 const s=createState(2);populate(s);const roles=new Set(s.passengers.map(passengerCharacter));
 for(const kind of Object.keys(characterFiles).filter(k=>k!=='acrobat'))assert.ok(roles.has(kind),kind);
 const sleeper=s.passengers.find(n=>n.id<10);assert.equal(passengerCharacter(sleeper),'sleeper');sleeper.sleeping=false;assert.equal(passengerCharacter(sleeper),'sleeper');
 assert.equal(passengerCharacter({id:999}),'subway-orator');
});

test('all newly supplied Meshy passenger assets are present and assigned',()=>{
 const expected=['music-enthusiast','hospital-worker','gym-enthusiast','smartphone-gamer','subway-orator','protective-pet-owner'];
 for(const kind of expected){assert.ok(characterFiles[kind],kind);assert.ok(fs.existsSync(new URL(`../public/assets/characters/${characterFiles[kind]}`,import.meta.url)),kind);}
 const s=createState(2);populate(s);const roles=new Set(s.passengers.map(passengerCharacter));
 for(const kind of expected)assert.ok(roles.has(kind),kind);
});

function exportedRig(){
 const b=fs.readFileSync(new URL('../public/assets/characters/acrobat.glb',import.meta.url));
 const d=JSON.parse(b.subarray(20,20+b.readUInt32LE(12))),jointIds=new Set(d.skins[0].joints);
 const nodes=d.nodes.map((n,i)=>{const o=jointIds.has(i)?new THREE.Bone():new THREE.Group();o.name=n.name||'';if(n.matrix)o.applyMatrix4(new THREE.Matrix4().fromArray(n.matrix));else{if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);}return o;});
 d.nodes.forEach((n,i)=>n.children?.forEach(c=>nodes[i].add(nodes[c])));
 const parent=new THREE.Group(),group=new THREE.Group(),body=new THREE.Group(),model=new THREE.Group();parent.add(group);group.add(body);body.add(model);d.scenes[d.scene||0].nodes.forEach(i=>model.add(nodes[i]));
 const bones={};model.traverse(o=>{if(o.isBone)bones[o.name.replace(/^mixamorig:?/,'')]=o;});parent.updateMatrixWorld(true);
 const hipHeight=bones.Hips.getWorldPosition(new THREE.Vector3()).y;model.position.y=-hipHeight;
 const rest=new Map();model.traverse(o=>{if(o.isBone)rest.set(o,{q:o.quaternion.clone(),p:o.position.clone()});});
 return {group,body,model,bones,gripTargets:[],rest,hipHeight,parent};
}
test('the actual exported Acrobat rig reaches both grips through pole spins and flips',()=>{
 const rig=exportedRig(),s=createState();s.player.x=s.player.pole=480;
 for(const move of ['j','k','l'])for(const progress of [.2,.3,.4,.5,.6,.7,.8]){
  s.player.trick={key:move,duration:4,elapsed:progress*4};const pose=performerPose(s);
  for(const [bone,r]of rig.rest){bone.quaternion.copy(r.q);bone.position.copy(r.p);}
  rig.group.position.copy(pose.root);rig.group.position.y+=rig.hipHeight-.87;rig.body.quaternion.copy(pose.rotation);
  rig.parent.rotation.z=.025;rig.parent.position.y=.01;rig.parent.updateMatrixWorld(true);
  lockHands(rig,pose.grips);
  assert.equal(rig.gripTargets.length,2);
  for(const g of rig.gripTargets)assert.ok(g.actual.distanceTo(g.target)<.003,`${move} ${progress}: grip error ${g.actual.distanceTo(g.target)}`);
 }
});
