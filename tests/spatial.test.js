import test from 'node:test';import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {solveArm,performerPose} from '../src/render/rig.js';
import {createState} from '../src/game/state.js';
import {populate,board,updatePassengers} from '../src/game/passengers.js';
import {cameraActions} from '../src/input-camera.js';
import {hasTrickClearance} from '../src/game/spatial.js';
import {updateRules} from '../src/game/rules.js';

test('IK preserves arm lengths and reaches a feasible hand target',()=>{
 const shoulder=new Vector3(),target=new Vector3(.4,.3,0);const result=solveArm(shoulder,target,new Vector3(0,0,1));
 assert.ok(result.reachable);assert.ok(Math.abs(shoulder.distanceTo(result.elbow)-.34)<1e-6);assert.ok(Math.abs(result.hand.distanceTo(result.elbow)-.34)<1e-6);assert.ok(result.hand.distanceTo(target)<1e-6);
});
test('pole grips are reachable throughout orbit, aerial spin, and the locked flip phase',()=>{
 for(const key of ['idle','j','k','l'])for(const climb of [0,80,155])for(let i=0;i<=100;i++){
  const s=createState();s.player.x=s.player.pole=480;s.player.climb=s.player.y=climb;if(key!=='idle')s.player.trick={key,elapsed:i/100,duration:1};const pose=performerPose(s);
  pose.grips?.forEach((grip,index)=>{const shoulder=new Vector3(index?.205:-.205,.56,0).applyQuaternion(pose.rotation).add(pose.root);assert.ok(shoulder.distanceTo(grip)<=.68,`${key} ${climb} ${i}: hand cannot reach pole (${shoulder.distanceTo(grip)})`)});
 }
});
test('front / rear controls are camera-relative, while held poles preserve climb keys',()=>{
 const a={held:new Set(['w','a']),pressed:new Set(['e'])};assert.deepEqual([...cameraActions(a,'front').held],['d','s']);assert.deepEqual([...cameraActions(a,'rear').held],['a','w']);assert.equal(cameraActions(a,'rear',true),a);
});
test('seated passengers never share a seat',()=>{for(let level=0;level<3;level++){const s=createState(level);populate(s);const chairs=s.passengers.filter(n=>n.seated).map(n=>`${n.x}:${n.seatSide}`);assert.equal(new Set(chairs).size,chairs.length)}});
test('a standing passenger in the swept stunt volume prevents or aborts a trick',()=>{
 const s=createState();s.player.x=s.player.pole=480;s.passengers=[{x:530,lane:.5,seated:false,reaction:0}];assert.equal(hasTrickClearance(s,'j'),false);
 s.player.trick={key:'j',elapsed:1,duration:3};updateRules(s,{held:new Set(),pressed:new Set()},.01);assert.equal(s.player.trick,null);assert.equal(s.strikes,0);
});
test('boarding crosses the doorway and exiting passengers leave the car',()=>{
 const s=createState();s.passengers=[{id:1,x:240,lane:0,seated:false,noise:0,reaction:0}];board(s);
 const entrant=s.passengers.find(n=>n.entering);assert.ok(Math.abs(entrant.lane)>2);const x=entrant.x;
 updatePassengers(s,.5);assert.equal(entrant.x,x);assert.equal(Math.abs(entrant.lane),3,'incoming riders wait for the exiting rider');
 for(let i=0;i<600;i++)updatePassengers(s,1/60);
 assert.ok(!s.passengers.some(n=>n.id===1));assert.ok(!entrant.entering);assert.ok(Math.abs(entrant.lane)<=.45);
});
