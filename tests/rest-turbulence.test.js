import test from 'node:test';
import assert from 'node:assert/strict';
import {createState} from '../src/game/state.js';
import {changeRest} from '../src/game/rest.js';
import {updatePerformer} from '../src/game/performer.js';
import {updateRules} from '../src/game/rules.js';
import {populate} from '../src/game/passengers.js';
import {performerPose,passengerPose} from '../src/render/rig.js';
import {containCamera} from '../src/render/camera-space.js';
import {cameraActions} from '../src/input-camera.js';
const input=(held=[],pressed=[])=>({held:new Set(held),pressed:new Set(pressed)});
test('rest postures use empty seats or clear floor and stand without entering passengers',()=>{
 const s=createState();assert.ok(changeRest(s,'c'));assert.equal(s.player.rest,'floorSit');assert.ok(changeRest(s,'x'));assert.equal(s.player.rest,'floorLie');assert.ok(changeRest(s,'z'));
 s.player.x=430;s.player.lane=1;assert.ok(changeRest(s,'x'));assert.equal(s.player.rest,'benchLie');assert.ok(changeRest(s,'z'));
 s.passengers=[{x:430,lane:1.6,seated:true,seatSide:1}];s.player.x=430;s.player.lane=1;changeRest(s,'c');assert.notEqual(s.player.rest,'seat');
 s.player.x=480;s.player.lane=0;updatePerformer(s,input([],['e']),.01);updatePerformer(s,input([],['j']),.1);assert.ok(s.player.trick.duration<1);
});
test('four lurch directions produce full knockdowns; recovery and secured grip work',()=>{
 for(let id=1;id<=4;id++){const s=createState();s.train.shakeId=id;s.train.lurch=2;updateRules(s,input(),.15);assert.equal(s.stats.falls,1);updatePerformer(s,input(),.35);assert.ok(performerPose(s).root.y<.5);updatePerformer(s,input(),1);assert.equal(s.player.fall,0);updateRules(s,input(),.15);assert.equal(s.stats.falls,1);}
 const s=createState();s.player.x=480;updatePerformer(s,input([],['e']),.01);s.train.lurch=2;updateRules(s,input(),.2);assert.equal(s.stats.falls,0);
});
test('bench sleepers reserve neighboring seats and lie horizontally',()=>{
 const s=createState();populate(s);for(const n of s.passengers.filter(n=>n.benchResting)){assert.ok(!s.passengers.some(other=>other!==n&&other.seated&&other.seatSide===n.seatSide&&Math.abs(other.x-n.x)<95));assert.ok(passengerPose(n,s).root.y<.7);}
});
test('camera containment and continuously rotated keyboard directions',()=>{
 for(const x of [-100,0,100])for(const z of [-100,0,100]){const p=containCamera({x,y:10,z});assert.ok(Math.abs(p.x)<=1.28&&Math.abs(p.z)<=7.15&&p.y<=2.3);}
 const a=cameraActions(input(['w']),'front',false,Math.PI/2);assert.ok(Math.abs(a.longitudinal)<1e-6);assert.equal(a.lateral,1);
 assert.equal(cameraActions(input(['w']),'rear',true,1).held.has('w'),true);
});
test('aggressor visibly telegraphs a fast attack; blocking and dodging defuse it',()=>{
 const s=createState(1);s.time=25;s.aggressor={x:700,lane:0,warning:0,stun:0,resolve:0,timer:0};
 updateRules(s,input(),.3);assert.equal(s.aggressor.attackPhase,'swing');
 updateRules(s,input(['f']),.2);assert.equal(s.aggressor.resolve,1);assert.equal(s.strikes,0);
 s.aggressor.stun=0;s.aggressor.warning=.3;s.aggressor.x=s.player.x+50;
 updateRules(s,input([],['g']),.01);assert.equal(s.aggressor.resolve,2);assert.equal(s.strikes,0);
});
