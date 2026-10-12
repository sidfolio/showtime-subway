import test from 'node:test';
import assert from 'node:assert/strict';
import {createRewardQueue} from '../src/render/rewards.js';
import {createState} from '../src/game/state.js';
import {updatePerformer} from '../src/game/performer.js';
test('reward presentation is deduplicated, frozen on pause/safety, and resumes in order',()=>{
 const q=createRewardQueue(),a={completionId:1,awardDelta:30},b={completionId:2,awardDelta:60};q.receive(a);q.receive(a);q.receive(b);
 assert.equal(q.update(0).awardDelta,30);assert.equal(q.update(10,{paused:true}),null);assert.equal(q.update(10,{safety:true}),null);
 assert.equal(q.update(.1).awardDelta,30);assert.equal(q.update(2).awardDelta,60);assert.equal(q.update(2),null);
});
test('completed moves commit combo-inclusive totals and per-move awards once',()=>{
 const s=createState();s.player.trick={key:'l',name:'Footwork',points:30,duration:2.4,elapsed:2.39};s.combo=2;
 updatePerformer(s,{held:new Set(),pressed:new Set()},.02);
 assert.equal(s.score,60);assert.equal(s.lastReward.awardDelta,60);assert.equal(s.lastReward.runTotalAfter,60);assert.equal(s.lastReward.moveLabel,'FLOOR DANCE');
 updatePerformer(s,{held:new Set(),pressed:new Set()},.02);assert.equal(s.score,60);assert.equal(s.lastReward.completionId,1);
});
