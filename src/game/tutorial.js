import {createState} from './state.js';
import {updatePerformer} from './performer.js';
import {updateRules} from './rules.js';
import {updatePassengers} from './passengers.js';
const scenes=[
 {title:'Walk around solid poles',duration:6,detail:'The rod blocks your body. Step across the aisle, then walk around it.',setup:s=>{s.player.x=420;s.player.lane=-.58;},input:t=>t<2?['d']:t<3.2?['s']:t<5?['d']:[]},
 {title:'Duck and move carefully',duration:4,detail:'Shift lowers your stance and slows movement. It does not let you walk through people.',setup:s=>{s.player.x=600;},input:t=>t<3?['shift','d']:[]},
 {title:'Floor dance',duration:4,detail:'L performs footwork when you are on the floor with enough room.',setup:s=>{s.player.x=640;},tap:'l'},
 {title:'Grip and climb',duration:4,detail:'E grabs the pair. While holding, W / ↑ climbs and S / ↓ descends. E releases.',setup:s=>{s.player.x=480;},tap:'e',input:t=>t>.6&&t<1.6?['w']:t>2&&t<3?['s']:[]},
 {title:'Spin around the pole',duration:5,detail:'J orbits the pole. Hands stay attached while the body circles around it.',setup:grip,tap:'j'},
 {title:'Two-pole flip',duration:5,detail:'K reaches for both rods, tucks into a somersault, and returns to a held stance.',setup:grip,tap:'k'},
 {title:'Aerial spin',duration:4,detail:'L while gripping lifts and tucks the legs, leans the body inward, and spins around the pole. On the floor, L dances.',setup:grip,tap:'l'},
 {title:'Bump, stop, and go around',duration:8,detail:'Contact causes a visible bump and a strike. Step sideways to find a clear route; passengers never take damage.',setup:s=>{s.player.x=580;s.passengers=[{id:40,x:640,lane:0,seated:false,reaction:0,noise:0,color:'#636c50',skin:'#b48969'}];},input:t=>t<2?['d']:t<3.3?['s']:t<5?['d']:t<6.1?['w']:[]},
 {title:'Brace for turbulence',duration:6,detail:'The warning arrives before the lurch. Hold Q beside the rod; your grip stays secured while passengers stagger and recover.',setup:s=>{s.player.x=480;s.passengers=[{id:42,x:710,lane:-.5,seated:false,reaction:0,noise:0}];s.train.nextShake=3;},input:t=>t>2?['q']:[],shake:true},
 {title:'Give boarding passengers space',duration:5,detail:'Dismount, step into the green safe pocket, and hold Q until the doors close. Then return to the poles.',setup:s=>{s.player.x=640;s.player.lane=.8;s.train.phase='boarding';s.train.door=1;s.passengers=[{id:60,x:240,lane:-2.15,target:350,entering:true,seated:false,noise:0,reaction:0}];},input:()=>['q']},
];
function grip(s){s.player.x=s.player.pole=480;s.player.lane=0;}
function makeScene(index){const s=createState(0,true);s.demo=true;s.train.nextShake=999;s.train.nextStation=999;scenes[index].setup(s);return s;}
export function createTutorial(){return {index:0,elapsed:0,total:0,state:makeScene(0),keys:[],done:false,tapped:false};}
export function tutorialInfo(demo){return {...scenes[demo.index],index:demo.index,count:scenes.length,keys:demo.keys,progress:demo.elapsed/scenes[demo.index].duration};}
export function updateTutorial(demo,dt){
 if(demo.done)return;
 const scene=scenes[demo.index],s=demo.state;demo.elapsed+=dt;demo.total+=dt;s.time+=dt;
 const held=scene.input?.(demo.elapsed)||[],pressed=[];
 if(scene.tap&&!demo.tapped&&demo.elapsed>.35){pressed.push(scene.tap);demo.tapped=true;}
 demo.keys=[...held,...(scene.tap&&demo.elapsed<1.1?[scene.tap]:[])];
 const actions={held:new Set(held),pressed:new Set(pressed)};
 if(scene.shake){s.train.lurch=demo.elapsed>=3&&demo.elapsed<5.5?1:0;s.train.shake=s.train.lurch?1:0;for(const n of s.passengers)n.stumble=s.train.lurch?Math.max(0,1.5-(demo.elapsed-3)):0;}
 updatePassengers(s,dt);updatePerformer(s,actions,dt);updateRules(s,actions,dt);s.events=[];
 if(demo.elapsed>=scene.duration){demo.index++;demo.elapsed=0;demo.tapped=false;if(demo.index===scenes.length){demo.done=true;demo.index--;}else demo.state=makeScene(demo.index);}
}
