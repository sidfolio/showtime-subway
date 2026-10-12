import {containCamera} from './camera-space.js';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import { createHuman, performerPose, passengerPose, worldZ, worldX } from './rig.js';
import { poles } from '../game/state.js';
import {seatPositions} from '../game/spatial.js';
import {createCommuter,commuterStatus,castStatus,castProgress} from './commuter.js';
import {passengerCharacter} from '../game/character-catalog.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const length=15.4, width=3.05, height=2.70;
function texture(kind){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
  c.fillStyle=kind==='floor'?'#34383b':'#a0a6a7';c.fillRect(0,0,256,256);
  let seed=73;
  for(let i=0;i<14000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%256;seed=(seed*1664525+1013904223)>>>0;const y=seed%256;const shade=seed%110+100;c.fillStyle=`rgba(${shade},${shade},${shade},${kind==='floor'?.20:.08})`;c.fillRect(x,y,kind==='floor'?1:8,1)}
  const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='floor'?4:2,kind==='floor'?20:4);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function signTexture(title,subtitle='',background='#19262c',color='#f0ece1',size=512){const canvas=document.createElement('canvas');canvas.width=size;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle=background;c.fillRect(0,0,size,128);c.fillStyle=color;c.textAlign='center';c.font=`bold ${subtitle?35:42}px Arial`;c.fillText(title,size/2,subtitle?53:80);if(subtitle){c.font='20px Arial';c.fillText(subtitle,size/2,97)}const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;return map;}

export function createSubwayRenderer(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:new URLSearchParams(location.search).has('capture')});renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.setSize(1280,832,false);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.83;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#10181d');
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.32;room.dispose();pmrem.dispose();
  const train=new THREE.Group();scene.add(train);
  const shell=new THREE.Group();train.add(shell);
  const sideWallGroups=[],doorLeaves=[],platforms=[],actors=new Map(),destinationSigns=[];let view='front',previousTime=0,currentState=null,lastSign='';
  const metal=new THREE.MeshStandardMaterial({color:'#9fa9ae',metalness:.82,roughness:.55,map:texture('metal')});
  const chrome=new THREE.MeshStandardMaterial({color:'#c3d0d6',metalness:.95,roughness:.17});
  const seatMats=['#b94d23','#ce8624','#b66329'].map(color=>new THREE.MeshStandardMaterial({color,roughness:.68,metalness:.03}));
  const cream=new THREE.MeshStandardMaterial({color:'#aaa28d',roughness:.75,map:texture('metal')});
  const black=new THREE.MeshStandardMaterial({color:'#171c20',roughness:.8});
  const rubber=new THREE.MeshStandardMaterial({color:'#343b3f',roughness:.92,map:texture('floor')});
  const lightMat=new THREE.MeshBasicMaterial({color:'#fff7d9'});
  const mat=(color,metalness=0,roughness=.65)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  function box(w,h,d,x,y,z,material,parent=shell){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
  function cylinder(radius,a,b,material,parent=shell){const distance=a.distanceTo(b);const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,distance,12),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());m.castShadow=true;parent.add(m);return m}
  function plaque(title,subtitle,w,h,x,y,z,rotation=0,parent=shell,bg='#263137'){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:signTexture(title,subtitle,bg),side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=rotation;parent.add(m);return m;
  }
  box(width,.12,length,0,-.065,0,rubber);
  box(width,.10,length,0,height+.05,0,cream);
  for(let z=-7.3;z<=7.3;z+=1.12){box(2.2,.015,.013,0,height-.014,z,metal);box(.48,.025,.38,0,height-.032,z,black);for(let i=0;i<7;i++)box(.47,.007,.018,0,height-.05,z-.15+i*.05,metal)}
  for(const side of [-1,1]){
    const wall=new THREE.Group();shell.add(wall);sideWallGroups.push(wall);
    box(.13,.12,length,side*1.52,.06,0,metal,wall);box(.13,.40,length,side*1.52,2.50,0,metal,wall);
    box(.25,.05,length-.2,side*1.28,2.60,0,lightMat);
    cylinder(.022,V(side*1.02,2.31,-7.3),V(side*1.02,2.31,7.3),chrome);
    const dz=[worldZ(240),worldZ(1020)],segments=[[-length/2,dz[0]-.78],[dz[0]+.78,dz[1]-.78],[dz[1]+.78,length/2]];
    const panelCenters=[];
    for(const [start,end]of segments){const size=end-start,center=(start+end)/2,count=Math.max(1,Math.round(size/1.30)),cell=size/count;
      box(.13,1.25,size,side*1.52,.625,center,metal,wall);box(.13,.42,size,side*1.52,2.49,center,metal,wall);
      for(let i=0;i<=count;i++)box(.13,1.03,.16,side*1.52,1.765,start+i*cell,metal,wall);
      for(let i=0;i<count;i++)panelCenters.push({z:start+(i+.5)*cell,w:cell-.16});
    }
    for(let i=0;i<panelCenters.length;i++){
      const {z,w}=panelCenters[i];
      // An actual opening in the wall: glass and thin frame, no opaque plate behind it.
      const glass=new THREE.Mesh(new THREE.PlaneGeometry(w,.96),new THREE.MeshPhysicalMaterial({color:'#819496',transparent:true,opacity:.13,roughness:.22,metalness:.1,side:THREE.DoubleSide,depthWrite:false}));glass.position.set(side*1.49,1.765,z);glass.rotation.y=-side*Math.PI/2;wall.add(glass);
      for(const y of [1.27,2.26])box(.055,.035,w+.06,side*1.438,y,z,chrome,wall);
      for(const offset of [-w/2,w/2])box(.055,1.02,.035,side*1.438,1.765,z+offset,chrome,wall);
      plaque(['NEW YORK','MAKE YOUR MOVE','ART UNDERGROUND','TAKE THE LOCAL'][i%4],['A city. A million stories.','Please give each other space.','Find something unexpected.','Your next stop is out there.'][i%4],1.05,.23,side*1.435,2.36,z,-side*Math.PI/2,wall,['#416875','#966f43','#58547a','#4f6c58'][i%4]);
      if(i%2===0)cylinder(.021,V(side*1.00,.5,z-.48),V(side*1.00,2.58,z-.48),chrome);
    }
    for(const z of [worldZ(240),worldZ(1020)]){
      const doorway=new THREE.Group();wall.add(doorway);
      box(.09,2.10,.10,side*1.47,1.06,z-.73,chrome,doorway);box(.09,2.10,.10,side*1.47,1.06,z+.73,chrome,doorway);box(.09,.10,1.56,side*1.47,2.14,z,chrome,doorway);
      // Outside platform is only visible when the sliding leaves open.
      const platform=new THREE.Group();doorway.add(platform);platforms.push(platform);box(.12,2.08,1.42,side*1.95,1.05,z,mat('#5a6466'),platform);box(.14,.05,1.40,side*1.59,.1,z,mat('#c7b866'),platform);
      for(const direction of [-1,1]){
        const leaf=new THREE.Group();leaf.position.set(side*1.45,0,z+direction*.35);doorway.add(leaf);
        box(.07,1.02,.69,0,.51,0,metal,leaf);box(.07,.23,.69,0,1.92,0,metal,leaf);for(const offset of [-.27,.27])box(.07,.8,.15,0,1.43,offset,metal,leaf);
        const pane=new THREE.Mesh(new THREE.PlaneGeometry(.40,.77),new THREE.MeshBasicMaterial({color:'#809397',transparent:true,opacity:.15,side:THREE.DoubleSide,depthWrite:false}));pane.rotation.y=-side*Math.PI/2;pane.position.set(-side*.042,1.43,0);leaf.add(pane);
        box(.08,.04,.43,-side*.052,1.82,0,chrome,leaf);box(.08,.04,.43,-side*.052,1.04,0,chrome,leaf);
        box(.08,.18,.014,-side*.05,.83,-direction*.18,chrome,leaf);
        doorLeaves.push({leaf,base:leaf.position.z,direction,wall});
      }
      plaque('Do not hold doors','Stand clear',1.2,.14,side*1.38,2.20,z,-side*Math.PI/2,wall);
    }
    for(const [index,x]of seatPositions.entries()){const z=worldZ(x);
      box(.40,.32,.68,side*1.28,.16,z,metal);
      const profile=new THREE.Shape();profile.moveTo(0,.48);profile.bezierCurveTo(.08,.43,.32,.44,.40,.50);profile.bezierCurveTo(.45,.58,.44,.89,.50,1.02);profile.lineTo(.55,1.02);profile.bezierCurveTo(.49,.88,.51,.56,.46,.46);profile.bezierCurveTo(.34,.39,.08,.39,0,.43);profile.closePath();
      const seat=new THREE.Mesh(new THREE.ExtrudeGeometry(profile,{depth:.66,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:12}),seatMats[index%3]);seat.position.set(side*.93,0,z-.33);seat.scale.x=side;seat.castShadow=true;seat.receiveShadow=true;shell.add(seat);
      for(let k=0;k<6;k++)box(.008,.26,.045,side*1.05,.20,z-.22+k*.087,black);
    }
  }
  for(const z of [-length/2,length/2]){
    const end=new THREE.Group();shell.add(end);
    box(.80,height,.10,-1.13,1.35,z,metal,end);box(.80,height,.10,1.13,1.35,z,metal,end);
    box(1.48,.58,.10,0,2.42,z,metal,end);box(1.40,2.1,.1,0,1.05,z,metal,end);box(.54,.72,.12,0,1.5,z,black,end);
    cylinder(.025,V(.44,.9,z),V(.44,1.22,z),chrome,end);
    destinationSigns.push(plaque('1   DOWNTOWN LOCAL','NEXT STOP • 14 ST',1.36,.21,0,2.35,z+(z<0?.07:-.07),z<0?0:Math.PI,end,'#121d21'));
  }
  for(const pole of poles){const z=worldZ(pole);for(const side of [-1,1]){cylinder(.027,V(side*.42,.04,z),V(side*.42,2.62,z),chrome);cylinder(.055,V(side*.42,.01,z),V(side*.42,.045,z),chrome);cylinder(.020,V(side*.42,2.15,z),V(side*1.05,2.15,z),chrome);}}
  // Safe pocket, offset from the boarding path.
  const safe=new THREE.Mesh(new THREE.PlaneGeometry(.36,1.76),new THREE.MeshBasicMaterial({map:signTexture('SAFE','WAIT HERE','#38574d','#d7e9df'),transparent:true,opacity:.85,side:THREE.DoubleSide}));safe.rotation.x=-Math.PI/2;safe.position.set(.54,.011,0);shell.add(safe);
  const glow=new THREE.HemisphereLight('#d5ceac','#25292a',.55);scene.add(glow);
  for(const side of [-1,1])for(const z of [-5,-1.8,1.8,5]){const point=new THREE.PointLight('#e7ddbc',6.5,5.5,1.7);point.position.set(side*1.26,2.52,z);train.add(point);}
  const shadowLight=new THREE.DirectionalLight('#dcd3bb',.45);shadowLight.position.set(1.28,2.6,-1);shadowLight.castShadow=true;shadowLight.shadow.mapSize.set(1024,1024);Object.assign(shadowLight.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:20});shadowLight.shadow.bias=-.0006;train.add(shadowLight);
  const tunnel=new THREE.Group();scene.add(tunnel);const tunnelSides=[];
  for(const side of [-1,1]){const outside=new THREE.Group();tunnel.add(outside);tunnelSides.push(outside);box(.08,3.5,40,side*2.1,1.3,0,mat('#202322'),outside);for(let i=0;i<32;i++){const z=-16+i;box(.09,2.6,.10,side*1.98,1.3,z,mat('#363a35'),outside);box(.04,.12,.3,side*1.88,1.77,z,mat(i%5===0?'#9c9675':'#3d4945'),outside);}}
  // Window scenery stays outside the car and cycles between underground, street,
  // and bridge views so the side camera remains an interior passenger view.
  const cityScene=new THREE.Group(),bridgeScene=new THREE.Group();tunnel.add(cityScene,bridgeScene);
  const cityGlass=mat('#344553',.05,.85),buildingMats=['#43515b','#5a514d','#384b55','#6a5f55'].map(c=>mat(c,.02,.82));
  const streetMat=mat('#262d30',.02,.96),treeTrunk=mat('#483b31',0,.95),treeLeaf=mat('#3f5d4a',0,.9),bridgeMetal=mat('#59636a',.72,.45),bridgeShadow=mat('#29353b',.12,.82);
  for(const side of [-1,1]){
    const citySide=new THREE.Group();cityScene.add(citySide);
    box(.10,4.25,40,side*2.34,2.10,0,cityGlass,citySide);
    box(.08,.035,40,side*2.02,.05,0,streetMat,citySide);
    for(let i=0;i<18;i++){
      const z=-16+i*1.86+(side<0?.22:0),h=1.25+((i*17+side*3+40)%11)*.16,w=.72+((i*7)%4)*.12;
      box(.18,h,w,side*2.09,.10+h/2,z,buildingMats[i%buildingMats.length],citySide);
      for(let row=0;row<3;row++)for(let col=0;col<2;col++){
        const lit=(i+row+col)%4===0;
        box(.012,.055,.10,side*1.985,.42+row*.30+h*.10,z-w*.25+col*w*.28,mat(lit?'#d3b86b':'#27353b',0,.7),citySide);
      }
    }
    for(let i=0;i<9;i++){
      const z=-15.4+i*3.7+(side>0?.55:0);
      cylinder(.045,V(side*1.96,.08,z),V(side*1.96,.85,z),treeTrunk,citySide);
      const crown=new THREE.Mesh(new THREE.SphereGeometry(.34,10,8),treeLeaf);crown.position.set(side*1.96,1.12,z);crown.scale.set(1,.9,1.25);crown.castShadow=true;citySide.add(crown);
    }
    const bridgeSide=new THREE.Group();bridgeScene.add(bridgeSide);
    box(.11,3.9,40,side*2.34,1.95,0,bridgeShadow,bridgeSide);
    box(.12,.05,40,side*2.02,.08,0,streetMat,bridgeSide);
    for(const z of [-6.2,2.6]){
      box(.16,2.95,.22,side*2.03,1.52,z,bridgeMetal,bridgeSide);
      box(.16,2.95,.22,side*2.03,1.52,z+1.25,bridgeMetal,bridgeSide);
      box(.16,.18,1.52,side*2.03,2.86,z+.62,bridgeMetal,bridgeSide);
      for(let j=0;j<5;j++)cylinder(.018,V(side*1.94,1.0+j*.34,z-.55),V(side*1.94,1.0+(j+1)*.34,z+.62),bridgeMetal,bridgeSide);
    }
    box(.08,.12,40,side*2.00,2.78,0,bridgeMetal,bridgeSide);
  }
  cityScene.visible=false;bridgeScene.visible=false;
  // Worn surfaces and small props are geometry / canvas textures, so no external assets are needed.
  function decal(draw,w,h,x,y,z,rotation=-Math.PI/2,parent=shell){const c=document.createElement('canvas');c.width=c.height=256;draw(c.getContext('2d'));const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide,opacity:.60}));m.position.set(x,y,z);m.rotation.x=rotation;parent.add(m);return m;}
  for(const [x,z]of [[.50,-1.8],[-.55,2.0],[.20,5.6]])decal(c=>{c.fillStyle='#3b2a18';c.beginPath();c.ellipse(120,130,95,65,.3,0,Math.PI*2);c.fill();for(let i=0;i<14;i++){c.beginPath();c.ellipse((i*83)%256,(i*51)%256,7,4,0,0,Math.PI*2);c.fill();}},.65,.9,x,.004,z);
  for(let i=0;i<9;i++){const paper=box(.13,.003,.19,(i%2?1:-1)*(.28+(i%3)*.12),.008,-6.3+i*1.48,mat('#bcb49a'));paper.rotation.y=i*1.7;}
  box(.19,.24,.20,1.17,.60,worldZ(590),mat('#998266'));box(.13,.025,.10,1.17,.73,worldZ(590),mat('#635d4c'));
  for(const side of [-1,1])for(const z of [-2.0,3.0]){const mark=decal(c=>{c.strokeStyle='#484b40';c.lineWidth=6;c.font='italic bold 40px Arial';c.strokeText('LOCAL',20,130);c.beginPath();c.moveTo(18,159);c.bezierCurveTo(90,116,150,200,231,135);c.stroke();},.8,.25,side*1.448,1.08,z,0,sideWallGroups[side<0?0:1]);mark.rotation.y=-side*Math.PI/2;}
  decal(c=>{c.fillStyle='#625e4e';c.font='italic 30px Arial';c.fillText('NYC / 24',35,140);},.75,.35,-.6,2.693,2.7,Math.PI/2);
  // Layered dirt and wear: no opaque decals across the window openings.
  for(let i=0;i<24;i++)decal(c=>{c.fillStyle='rgba(39,30,18,.42)';for(let k=0;k<20;k++){c.beginPath();c.ellipse((k*43+i*17)%256,(k*73)%256,14+k%9,6+k%7,.6,0,Math.PI*2);c.fill();}c.strokeStyle='rgba(155,148,131,.3)';c.lineWidth=2;for(let k=0;k<10;k++){c.beginPath();c.moveTo(k*25,0);c.lineTo(k*25+70,256);c.stroke();}},.55,.85,(i%2?1:-1)*.75,.012,-6.9+i*.59);
  for(const side of [-1,1])for(let i=0;i<12;i++){
    const mark=decal(c=>{c.fillStyle='rgba(59,43,23,.5)';for(let k=0;k<12;k++)c.fillRect(k*23,(k*13)%80,4,120+(k*31)%120);c.strokeStyle='#9b9581';c.lineWidth=2;for(let k=0;k<9;k++){c.beginPath();c.moveTo(k*28,120);c.lineTo(k*28+40,100);c.stroke();}},.55,.48,side*1.445,.94,-6.7+i*1.2,0);mark.rotation.y=-side*Math.PI/2;
    decal(c=>{c.strokeStyle='rgba(203,184,143,.6)';c.lineWidth=4;for(let k=0;k<14;k++){c.beginPath();c.moveTo(k*17,40+(k*19)%170);c.lineTo(k*17+35,55+(k*19)%170);c.stroke();}},.24,.46,side*1.14,.513,worldZ(seatPositions[i]));
  }
  for(const [x,z]of [[-.78,-4.1],[.85,2.4],[-.7,5.5]]){const cup=new THREE.Mesh(new THREE.CylinderGeometry(.035,.052,.14,12),mat('#afa487'));cup.rotation.z=1.4;cup.position.set(x,.053,z);shell.add(cup);}
  // Batch fixed metal / plastic meshes per group. Sliding doors and characters stay separate.
  function batch(group){for(const child of [...group.children])if(child.isGroup&&!doorLeaves.some(d=>d.leaf===child))batch(child);
    const buckets=new Map();for(const child of group.children)if(child.isMesh&&child.position.y<2.64){const list=buckets.get(child.material)||[];list.push(child);buckets.set(child.material,list)}
    for(const [material,meshes]of buckets){if(meshes.length<3)continue;const geometries=meshes.map(m=>{m.updateMatrix();return m.geometry.clone().applyMatrix4(m.matrix)});const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!merged)continue;const combined=new THREE.Mesh(merged,material);combined.castShadow=true;combined.receiveShadow=true;group.add(combined);meshes.forEach(m=>{group.remove(m);m.geometry.dispose()})}
  }batch(shell);
  const actorGroup=new THREE.Group();train.add(actorGroup);
  let player=createHuman({player:true});actorGroup.add(player.group);
  const camera=new THREE.PerspectiveCamera(66,1280/832,.05,70);camera.position.set(0,1.9,-6.95);
  const target=V(),desired=V();let cut=true,doorAmount=0;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.30,.335,40),new THREE.MeshBasicMaterial({color:'#f0bd78',side:THREE.DoubleSide,transparent:true,opacity:.8}));ring.rotation.x=-Math.PI/2;actorGroup.add(ring);
  train.add(camera);
  let lookYaw=0,lookPitch=0,panX=0,panZ=0,zoom=1,drag=null,movementYaw=0;
  canvas.style.touchAction='none';
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;drag={x:e.clientX,y:e.clientY,pan:e.shiftKey||e.button===2};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;if(drag.pan){panX-=dx*.006;panZ-=dy*.009;}else{lookYaw-=dx*.005;lookPitch=THREE.MathUtils.clamp(lookPitch+dy*.004,-.85,.85);}cut=true;});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=THREE.MathUtils.clamp(zoom*Math.exp(e.deltaY*.001),.48,1.5);cut=true;},{passive:false});
  function updateCamera(s,dt){const pz=worldZ(s.player.x),px=worldX(s.player.lane);
    if(view==='front')desired.set(.02,1.86,pz-3.2*zoom);
    else if(view==='rear')desired.set(-.02,1.86,pz+3.2*zoom);
    else desired.set(1.22,1.93,pz+1.7*zoom);
    desired.x=THREE.MathUtils.clamp(desired.x+panX,-1.28,1.28);desired.z=THREE.MathUtils.clamp(desired.z+panZ,-7.15,7.15);
    desired.y=THREE.MathUtils.clamp(desired.y,.65,2.3);
    // Avoid placing the lens inside a rider head or a rod when panning.
    const solids=[...s.passengers.map(n=>({x:n.seated?(n.seatSide||-1)*1.17:worldX(n.lane),z:worldZ(n.x),r:n.seated?.19:.32})),...poles.flatMap(pole=>[-1,1].map(side=>({x:side*.42,z:worldZ(pole),r:.12})))];
    for(let pass=0;pass<3;pass++)for(const o of solids){const dx=desired.x-o.x,dz=desired.z-o.z,d=Math.hypot(dx,dz);if(d<o.r){desired.x=o.x+(d>1e-5?dx/d:-Math.sign(o.x))*o.r;desired.z=o.z+(d>1e-5?dz/d:0)*o.r;}}containCamera(desired);
    target.set(px,1.10,pz);const direction=target.clone().sub(desired).normalize();
    const baseYaw=Math.atan2(direction.x,direction.z);movementYaw=baseYaw+lookYaw;
    const pitch=THREE.MathUtils.clamp(Math.asin(direction.y)-lookPitch,-1.2,1.2);
    direction.set(Math.sin(movementYaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(movementYaw)*Math.cos(pitch));
    camera.position.lerp(desired,cut?1:1-Math.exp(-dt*12));
    target.copy(camera.position).add(direction);train.updateWorldMatrix(true,false);camera.lookAt(train.localToWorld(target.clone()));
    camera.rotateZ(Math.sin(s.time*13)*s.train.shake*.025);
    camera.fov=THREE.MathUtils.clamp((view==='side'?82:66)*Math.sqrt(zoom),40,95);camera.updateProjectionMatrix();cut=false;
    sideWallGroups.forEach(wall=>wall.visible=true);
    shell.children.filter(o=>o.isMesh&&o.position.y>2.64).forEach(o=>o.visible=true);
  }
  function render(s){
    // Keep the simulation and Reactor source at the authored 1280×832 aspect.
    // CSS may scale the canvas responsively, but it must never distort the car
    // or change the source aspect between frames.
    const width=1280,height=832;
    if(camera.aspect!==width/height){camera.aspect=width/height;camera.updateProjectionMatrix();}
    currentState=s;const dt=s.status==='paused'?0:s.time===previousTime?1/60:Math.min(.1,Math.max(.001,s.time-previousTime));previousTime=s.time;
    const signKey=`${s.route}:${s.station}:${s.train.phase}`;if(signKey!==lastSign){lastSign=signKey;for(const sign of destinationSigns){sign.material.map.dispose();sign.material.map=signTexture(`${s.route}   ${s.train.phase==='boarding'?'STAND CLEAR':'DOWNTOWN LOCAL'}`,s.train.phase==='boarding'?'Doors open • passengers boarding':`STOP ${s.station+1} • ${['14 ST','34 ST','TIMES SQ','59 ST'][s.station%4]}`,'#121d21','#f0bf70');}}
    train.rotation.z=Math.sin(s.time*2.4)*.005+Math.sin(s.time*13)*s.train.shake*.075;
    train.rotation.x=Math.sin(s.time*1.8)*.003+Math.cos(s.time*16)*s.train.shake*.035;
    train.position.y=Math.sin(s.time*10)*s.train.shake*.01;
    tunnel.position.z=(s.train.phase==='boarding'?0:s.time*5)%2;
    const exteriorMode=Math.floor(Math.max(0,s.time)/18)%3;
    tunnelSides.forEach(wall=>wall.visible=exteriorMode===0);
    cityScene.visible=exteriorMode===1;
    bridgeScene.visible=exteriorMode===2;
    platforms.forEach(platform=>platform.visible=s.train.phase==='boarding');
    doorAmount=THREE.MathUtils.lerp(doorAmount,s.train.door,1-Math.exp(-dt*4));doorLeaves.forEach(d=>d.leaf.position.z=d.base+d.direction*doorAmount*.66);
    if(!player.imported&&commuterStatus('acrobat').loaded){const next=createCommuter('acrobat');if(next){actorGroup.remove(player.group);player.dispose();player=next;player.setLabel('YOU');actorGroup.add(player.group);}}
    player.update(performerPose(s),dt);ring.position.set(player.group.position.x,.018,player.group.position.z);
    ring.material.opacity=s.player.immune>0?.35:.8;
    const live=new Set();
    const all=[...s.passengers];if(s.aggressor)all.push({...s.aggressor,id:999,color:'#783e45',skin:'#b08a6b'});
    for(const n of all){live.add(n.id);let actor=actors.get(n.id);
      // Sleeper identity survives waking up; noise changes behavior, not appearance.
      const kind=passengerCharacter(n),useImported=Boolean(kind);
      if(actor&&useImported&&!actor.imported&&commuterStatus(kind).loaded){actorGroup.remove(actor.group);actor.dispose();actors.delete(n.id);actor=null;}
      if(!actor){actor=(useImported?createCommuter(kind):null)||createHuman({shirt:n.color,skin:n.skin});actors.set(n.id,actor);actorGroup.add(actor.group);}
      actor.setLabel(n.id===999?'AGGRESSOR':n.sleeping?`RESTING ${Math.round(n.noise/10)*10}%`:n.reaction>0?'GIVE ME SPACE':'');actor.update(passengerPose(n,s),dt);}
    for(const [id,actor]of actors)if(!live.has(id)){actorGroup.remove(actor.group);actor.dispose();actors.delete(id)}
    updateCamera(s,dt);renderer.render(scene,camera);
  }
  function setView(next){if(!['front','rear','side'].includes(next))return;view=next;lookYaw=lookPitch=panX=panZ=0;zoom=1;cut=true;}
  function diagnostics(){return {view,cameraLocal:camera.position.toArray(),cameraYaw:movementYaw,rest:currentState?.player.rest||null,fall:currentState?.player.fall||0,width:canvas.width,height:canvas.height,actors:actors.size+1,playerModel:player.kind||'procedural',cast:castStatus(),passengerModels:Object.fromEntries([...new Set([...actors.values()].map(a=>a.kind||'procedural'))].map(kind=>[kind,[...actors.values()].filter(a=>(a.kind||'procedural')===kind).length])),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,grips:player.gripTargets.map(g=>({error:g.actual.distanceTo(g.target),reachable:g.reachable})),phase:currentState?.player.trick?.name||'idle'};}
  function promptAnchor(){const point=player.group.localToWorld(V(0,1.1,0)).project(camera);return {x:(point.x+1)*canvas.clientWidth/2,y:(1-point.y)*canvas.clientHeight/2};}
  return {render,setView,getMovementYaw:()=>movementYaw,getView:()=>view,diagnostics,promptAnchor,castProgress};
}
