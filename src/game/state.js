import {levels} from './levels.js';
export const poles=[300,480,800,980];
export const lineLeadSeconds=600;
export const lineCountdownSeconds=20;
export function createState(level=0,endless=false,route='1'){
 return {level,config:levels[level],endless,route,status:'playing',time:0,activeTime:0,engaged:false,lineWarning:null,endLine:false,score:0,combo:1,strikes:0,station:0,events:[],message:'WASD or arrow keys to move. Walk to a pole and press E. J spins, K flips, L dances.',messageUntil:10,player:{x:640,y:0,lane:0,vx:0,vy:0,balance:100,pole:null,gripSide:-1,climb:0,trick:null,cooldown:0,immune:0,duck:false,brace:false,safe:false},passengers:[],train:{shake:0,lurch:0,nextShake:8,phase:'riding',phaseTime:0,nextStation:30,door:0},aggressor:null,threatResolved:false,stats:{tricks:0,falls:0,safeStops:0},seed:42};
}
export function say(s,message,seconds=4){s.message=message;s.messageUntil=s.time+seconds}
export function random(s){s.seed=(s.seed*1664525+1013904223)>>>0;return s.seed/4294967296}
export function updateLineWarning(s){
 if(!s.engaged){s.lineWarning=null;return}
 const remaining=lineLeadSeconds-s.activeTime;
 s.lineWarning=remaining<=0?{phase:'arrived',remaining:0}:remaining<=lineCountdownSeconds?{phase:'approaching',remaining:Math.ceil(remaining)}:null;
}
