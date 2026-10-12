import test from 'node:test';import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {createState} from '../src/game/state.js';import {updatePerformer} from '../src/game/performer.js';import {updateRules} from '../src/game/rules.js';
import {moveSolid,obstacles,playerRadius} from '../src/game/collision.js';import {worldX,worldZ} from '../src/game/spatial.js';
import {cameraActions} from '../src/input-camera.js';import {createTutorial,updateTutorial,tutorialInfo} from '../src/game/tutorial.js';
import {actionPrompt,turbulencePrompt} from '../src/game/prompts.js';
import {updateTrain} from '../src/game/train.js';
const input=(held=[],pressed=[])=>({held:new Set(held),pressed:new Set(pressed)});
test('left and right move toward the matching screen edge in every camera',()=>{
 for(const view of ['front','rear','side'])for(const key of ['a','d']){
  const s=createState(),cam=new PerspectiveCamera(66,1280/832,.05,70);
  cam.position.set(...(view==='front'?[0,1.86,-3.2]:view==='rear'?[0,1.86,3.2]:[9.5,5.3,0]));cam.lookAt(0,1.1,0);cam.updateMatrixWorld();
  const before=new Vector3(worldX(s.player.lane),.87,worldZ(s.player.x)).project(cam).x;
  updatePerformer(s,cameraActions(input([key]),view),.1);
  const after=new Vector3(worldX(s.player.lane),.87,worldZ(s.player.x)).project(cam).x;
  assert.ok(key==='a'?after<before:after>before,`${view} ${key} reversed`);
 }
});
test('solid pole stops even a large movement step; diagonal movement slides around',()=>{
 const s=createState();s.player.x=400;s.player.lane=-.42/.72;moveSolid(s,s.player,200,0);
 assert.ok(s.player.x<480);
 for(const o of obstacles(s))assert.ok(Math.hypot(worldX(s.player.lane)-o.x,worldZ(s.player.x)-o.z)>=playerRadius+o.radius-.0001);
 moveSolid(s,s.player,0,1);moveSolid(s,s.player,120,0);assert.ok(s.player.x>480);
});
test('passengers stop the performer, react to contact, and allow a route around',()=>{
 for(const duck of [false,true]){const s=createState();s.player.x=580;const n={id:4,x:640,lane:0,seated:false,reaction:0,noise:0};s.passengers=[n];
  updatePerformer(s,input(duck?['d','shift']:['d']),2);assert.ok(s.player.x<610);assert.ok(n.reaction>0);updateRules(s,input(),.01);assert.equal(s.strikes,1);
  moveSolid(s,s.player,0,1);moveSolid(s,s.player,120,0);assert.ok(s.player.x>640);assert.equal('health' in n,false);
 }
});
test('NPC movement also respects the player and rods',()=>{const s=createState();s.player.x=640;const n={x:580,lane:0};moveSolid(s,n,160,0,{exclude:n,radius:.21,isPlayer:false});assert.ok(n.x<610)});
test('closing doors leaves the waiting queue outside and cancels unfinished exits',()=>{const s=createState();s.train.phase='boarding';s.train.phaseTime=9;s.passengers=[{id:1,x:240,lane:-2.5,entering:true},{id:2,x:300,lane:0,exiting:true,target:240}];updateTrain(s,.1);assert.equal(s.train.door,0);assert.deepEqual(s.passengers.map(n=>n.id),[2]);assert.equal(s.passengers[0].exiting,false);assert.equal(s.passengers[0].target,undefined)});
test('prompts explain the available floor, pole, boarding and turbulence actions',()=>{
 const s=createState();assert.match(actionPrompt(s),/L to dance/);s.player.x=s.player.pole=480;assert.match(actionPrompt(s),/J.*K.*L/);s.train.phase='boarding';assert.match(actionPrompt(s),/safe pocket/);s.train.phase='riding';s.time=6;assert.match(turbulencePrompt(s),/SHAKE IN 2s/);s.train.lurch=1;assert.match(turbulencePrompt(s),/Grip secured/);
});
test('watch-only tutorial completes all ten scenes and demonstrates actual tricks and bumps',()=>{
 const demo=createTutorial(),seen=new Set();let landed=0,bumped=false,braced=false;
 for(let frame=0;frame<4000&&!demo.done;frame++){seen.add(tutorialInfo(demo).title);updateTutorial(demo,1/60);landed=Math.max(landed,demo.state.score);bumped||=demo.state.strikes>0;braced||=demo.state.train.lurch>0&&demo.state.player.brace;}
 assert.ok(demo.done);assert.equal(seen.size,10);assert.ok(landed>=95);assert.ok(bumped);assert.ok(braced);
});
