import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {characterFiles} from '../game/character-catalog.js';
import {aimBone,lockHands} from './skinned-pose.js';

// One local asset and shared GPU resources; each rider gets an independent skeleton.
const assets=new Map(),failures=new Map(),pending=new Map();let loadChain=Promise.resolve();
function load(kind){if(pending.has(kind))return pending.get(kind);const path=characterFiles[kind];if(!path)return Promise.resolve();
 const job=loadChain.then(async()=>{
  const gltf=await new GLTFLoader().loadAsync('/assets/characters/'+path),textures=new Set(),oldImages=new Set();
  gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;
   // Detach mesh buffers from the large GLB image buffer retained by typed views.
   const old=o.geometry;o.geometry=old.clone();old.dispose();
   for(const m of Array.isArray(o.material)?o.material:[o.material])for(const value of Object.values(m))if(value?.isTexture)textures.add(value);
  }});
  const images=new Map(),limit=kind==='acrobat'?4096:2048;
  for(const texture of textures){const source=texture.image;if(!source?.width)continue;let image=images.get(source);
   if(!image){const scale=Math.min(1,limit/Math.max(source.width,source.height));
    if(scale<1){image=document.createElement('canvas');image.width=Math.round(source.width*scale);image.height=Math.round(source.height*scale);const ctx=image.getContext('2d');ctx.drawImage(source,0,0,image.width,image.height);oldImages.add(source);}else image=source;
    images.set(source,image);
   }texture.image=image;texture.needsUpdate=true;
  }for(const source of oldImages)source.close?.();
  for(const clip of gltf.animations)for(const track of clip.tracks){track.times=track.times.slice();track.values=track.values.slice();}
  // Don't retain GLTFParser, which otherwise keeps the original embedded images.
  assets.set(kind,{scene:gltf.scene,animations:gltf.animations});
 }).catch(error=>{failures.set(kind,error.message);console.warn(`${kind} asset unavailable; keeping procedural riders.`,error);});
 loadChain=job;pending.set(kind,job);return job;
}
export const acrobatReady=load('acrobat');
export const sleeperReady=load('sleeper');
export const commuterReady=load('commuter');
export const castReady=Promise.all(Object.keys(characterFiles).map(load));
export const commuterStatus=(kind='commuter')=>({loaded:assets.has(kind),error:failures.get(kind)||null});
export const castStatus=()=>Object.fromEntries(Object.keys(characterFiles).map(kind=>[kind,commuterStatus(kind)]));
export const castProgress=()=>{const statuses=Object.values(castStatus());return {loaded:statuses.filter(status=>status.loaded).length,failed:statuses.filter(status=>status.error).length,total:statuses.length};};

export function createCommuter(kind='commuter'){
  const asset=assets.get(kind);
  if(!asset)return null;
  const group=new THREE.Group(),body=new THREE.Group(),model=clone(asset.scene);
  group.add(body);body.add(model);model.updateMatrixWorld(true);
  const bones={};model.traverse(o=>{if(o.isBone)bones[o.name.replace(/^mixamorig:?/,'')]=o;});
  const hips=bones.Hips;if(!hips)return null;const hipHeight=hips.getWorldPosition(new THREE.Vector3()).y;
  const sides=bones.LeftArm.getWorldPosition(new THREE.Vector3()).x<bones.RightArm.getWorldPosition(new THREE.Vector3()).x?['Left','Right']:['Right','Left'];
  model.position.y=-hipHeight;
  const rest=new Map();model.traverse(o=>{if(o.isBone)rest.set(o,{q:o.quaternion.clone(),p:o.position.clone()});});
  const mixer=new THREE.AnimationMixer(model);
  const walking=asset.animations.find(a=>/walking/i.test(a.name));
  // Simulation owns translation. Imported root motion must never cross a collider.
  const walk=walking?mixer.clipAction(new THREE.AnimationClip('InPlaceWalking',walking.duration,walking.tracks.filter(t=>!t.name.endsWith('.position')))):null;
  walk?.play();
  let previous=null,labelText='',previousMoving=false;const gripTargets=[];
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64;
  const ctx=canvas.getContext('2d');ctx.font='bold 26px Arial';ctx.textAlign='center';
  const map=new THREE.CanvasTexture(canvas),label=new THREE.Sprite(new THREE.SpriteMaterial({map,depthTest:false,transparent:true}));
  label.scale.set(1.35,.17,1);label.position.y=1.14;group.add(label);
  function setLabel(value){if(labelText===value)return;labelText=value;ctx.clearRect(0,0,512,64);ctx.fillStyle='#d4e6ef';ctx.fillText(value,256,42);map.needsUpdate=true;label.visible=Boolean(value);}
  // Aim each joint using its actual exported bind orientation, rather than
  // assuming Meshy's bones use the same axes as our procedural character.
  const aim=(name,childName,target)=>aimBone(body,model,bones,name,childName,target);
  function update(pose,dt){
    const moving=kind==='acrobat'?Boolean(pose.walking):dt===0?previousMoving:previous&&Math.hypot(pose.root.x-previous.x,pose.root.z-previous.z)>dt*.06&&!pose.grips;
    previousMoving=moving;
    previous=pose.root.clone();
    for(const [bone,r]of rest){bone.quaternion.copy(r.q);bone.position.copy(r.p);}
    group.position.copy(pose.root);group.position.y+=hipHeight-.87;
    body.quaternion.copy(pose.rotation);group.updateWorldMatrix(true,true);
    if(moving&&walk){walk.enabled=true;mixer.update(dt);}
    else{
      if(walk)walk.enabled=false;
      for(const [i,side]of sides.entries()){
        aim(side+'UpLeg',side+'Leg',pose.knees[i]);
        aim(side+'Leg',side+'Foot',pose.feet[i]);
        // Shoes stay level in seated and standing poses.
        const foot=bones[side+'Foot'];if(foot){foot.quaternion.copy(foot.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(body.getWorldQuaternion(new THREE.Quaternion())));}
      }
    }
    for(const [i,side]of sides.entries()){
      if(pose.elbows)aim(side+'Arm',side+'ForeArm',pose.elbows[i]);
      if(pose.hands)aim(side+'ForeArm',side+'Hand',pose.hands[i]);
    }
    lockHands({group,body,model,bones,gripTargets,sides},pose.grips);
    bones.Head?.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pose.headNod||0,0,pose.headTilt||0)));
    label.visible=Boolean(labelText);
  }
  function dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);map.dispose();label.material.dispose();}
  return {group,update,setLabel,dispose,gripTargets,imported:true,kind};
}
