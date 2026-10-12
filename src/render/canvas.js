const W=1280,H=832,FLOOR=565;
let c;
function box(x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h)}
function grad(x,y,w,h,a,b){let g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,a);g.addColorStop(.5,b);g.addColorStop(1,a);box(x,y,w,h,g)}
function line(x,y,x2,y2,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke()}
function rounded(x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
function text(t,x,y,size=14,color='#eee'){c.fillStyle=color;c.font=`${size}px Arial`;c.fillText(t,x,y)}
function rail(x,y,x2,y2,width=9){line(x+2,y+2,x2+2,y2+2,'#161d2399',width+4);line(x,y,x2,y2,'#68757c',width);line(x-2,y,x2-2,y2,'#e0e5df',2)}
function ad(x,title,sub,color){rounded(x,106,150,57,2,'#646b68');box(x+4,110,142,49,color);text(title,x+12,131,14);text(sub,x+12,148,9)}
function car(s){
 grad(0,0,W,H,'#7c837e','#b8bcb2');grad(0,0,W,95,'#707972','#c2c7bd');
 for(let x=0;x<W;x+=160){line(x,0,x+25,93,'#68726a');for(let i=0;i<6;i++)line(x+38,22+i*5,x+106,22+i*5,'#5c665f',2)}
 box(0,83,W,12,'#4d5655');box(0,92,W,8,'#fffde3');box(0,99,W,4,'#d3d9c0');
 for(let x=0;x<W;x+=8){box(x,174,1,348,'#ffffff04')}
 ad(35,'NEW YORK','A city. A million stories.','#415f67');ad(348,'MAKE YOUR MOVE','Your stage is everywhere.','#80604d');ad(565,'SHOWTIME','Please respect your fellow riders.','#4e6555');ad(825,'ART UNDERGROUND','Find something unexpected.','#555474');ad(1084,'GO SOMEWHERE','Take the local.','#7b6240');
 for(const x of [15,340,565,820,1110]){rounded(x,190,x===565?150:158,167,16,'#66716e');rounded(x+5,195,x===565?140:148,157,12,'#d2d5c9');rounded(x+12,202,x===565?126:134,143,10,'#132c35');c.save();c.beginPath();c.rect(x+12,202,x===565?126:134,143);c.clip();for(let j=0;j<5;j++){let p=(s.time*135+j*320)%1700-300;box(p,245+j*5,90,7,'#687164');box(p+35,209,12,127,'#293e40')}grad(x+13,203,60,140,'#61736e33','#b9c9bd44');line(x+25,214,x+94,326,'#cedbd122',9);c.restore()}
 for(const x of [190,960]){grad(x,175,130,350,'#5b6462','#d0d1c5');box(x+62,178,3,343,'#3d4947');text('Do not hold doors',x+15,190,9,'#161b1b');for(const dx of [8,72]){rounded(x+dx,208,49,151,14,'#354b4e');rounded(x+dx+4,212,41,143,11,'#10272c');rail(x+dx+12,376,x+dx+12,417,4)}if(s.train.door){box(x+15,200,100,319,'#303c3d');box(x+20,353,90,166,'#777c72');box(x+20,481,90,7,'#c8b661');text('PLATFORM',x+25,321,11);grad(x-25,175,39,350,'#66706b','#b6bcb2');grad(x+117,175,39,350,'#66706b','#b6bcb2')}}
 box(0,520,W,H-520,'#242d30');let floor=c.createLinearGradient(0,520,0,H);floor.addColorStop(0,'#414b4c');floor.addColorStop(1,'#20282c');box(0,520,W,H-520,floor);
 for(let i=0;i<2400;i++){let x=(i*73)%W,y=525+(i*47)%(H-525);box(x,y,1.3,1,'#b9c8c322')}
 for(const [x,w] of [[8,167],[335,209],[735,214],[1120,155]]){grad(x,399,w,74,'#687f9a','#b3c4d4');rounded(x,463,w,25,9,'#7f9fba');box(x+5,489,w-10,8,'#ccd4ce');grad(x+10,497,w-20,50,'#68716e','#aab3ab');for(let n=x+20;n<x+w-15;n+=8)line(n,505,n,537,'#424d4a',2);for(let n=x+43;n<x+w;n+=55)line(n,405,n,482,'#607893');rail(x,393,x,490,7);rail(x+w,393,x+w,490,7)}
 rail(10,172,1270,172,7);
 for(const x of [300,480,800,980]){rail(x,96,x,566);rounded(x-9,548,18,13,2,'#909d97');rail(x,170,x+45,170,6);rail(x+45,170,x+45,106,6)}
 rounded(519,23,242,44,5,'#202928');text(`${s.route}   ${s.train.phase==='boarding'?'STAND CLEAR':s.train.phase==='approaching'?'NEXT STOP':'DOWNTOWN LOCAL'}`,533,51,18,'#e1ab58');
 c.save();c.globalAlpha=.6;rounded(564,615,151,56,8,'#58766a');c.setLineDash([7,6]);c.strokeStyle='#bdd4c6';c.strokeRect(566,617,147,52);c.restore();text('SAFE SPACE',592,643,13,'#d3e2d9');text('S ↓ · wait here',594,660,10,'#bccbc3');
}
function limb(x,y,x2,y2,color,width){line(x,y,x2,y2,'#131a2090',width+2);line(x,y,x2,y2,color,width)}
function person(n,s,player=false){
 const p=player?s.player:n;let base=FLOOR+(p.lane||0)*47;let x=p.x,y=base-(p.y||0);let scale=player?1: .91;let asleep=n.sleeping,seated=n.seated,duck=player&&p.duck;
 c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#0005';c.beginPath();c.ellipse(0,(p.y||0)*.85,32,8,0,0,7);c.fill();
 let walk=player?Math.sin(s.time*11)*Math.min(1,Math.abs(p.vx)/100):n.target?Math.sin(s.time*8):0;
 if(player&&p.trick){let phase=p.trick.elapsed/p.trick.duration;if(p.trick.key==='j'){c.translate(Math.sin(phase*Math.PI*2)*42,-35);c.scale(Math.cos(phase*Math.PI*2)*.4+.7,1);c.rotate(Math.sin(phase*Math.PI*2)*.4)}if(p.trick.key==='k'){c.translate(90,-90);c.rotate(phase*Math.PI*2)}if(p.trick.key==='l'&&p.pole!==null){c.translate(62,-58);c.rotate(-Math.PI/2)}if(p.trick.key==='l'&&p.pole===null)c.rotate(Math.sin(phase*20)*.12)}
 if(asleep)c.rotate(.15);if(duck)c.scale(1,.68);if(n.reaction)c.rotate(Math.sin(s.time*17)*.06);
 let torso=seated?-98:-128;const shirt=player?'#b45d37':n.color||'#565d63',skin=n.skin||'#b9825d',pants=player?'#263d4c':'#333a43';
 if(seated){limb(-11,-55,-15,-27,pants,17);limb(11,-55,25,-27,pants,17);limb(-15,-27,-16,0,pants,14);limb(25,-27,28,0,pants,14)}else{limb(-10,-67,-15+walk*19,-35,pants,18);limb(10,-67,14-walk*19,-35,pants,18);limb(-15+walk*19,-35,-18-walk*16,-5,pants,14);limb(14-walk*19,-35,18+walk*16,-5,pants,14)}
 rounded(-28-walk*12,-8,25,11,4,'#d7dbd8');rounded(7+walk*12,-8,26,11,4,'#d7dbd8');box(-26-walk*12,0,22,3,'#65716e');box(9+walk*12,0,22,3,'#65716e');
 let g=c.createLinearGradient(-25,0,25,0);g.addColorStop(0,'#202a30');g.addColorStop(.3,shirt);g.addColorStop(.8,shirt);g.addColorStop(1,'#393a39');rounded(-24,torso,48,torso===-128?67:46,12,g);line(0,torso+6,0,torso+54,'#e5c2a133',1);line(-16,torso+28,-12,torso+54,'#1116',2);
 const grabbing=player&&p.pole!==null,block=player&&s.blocking;
 if(grabbing){limb(-19,torso+8,-39,torso-22,shirt,12);limb(-39,torso-22,-8,torso-35,skin,9);limb(19,torso+8,29,torso-12,shirt,12);limb(29,torso-12,5,torso-22,skin,9)}else if(seated){limb(-19,torso+9,-28,torso+38,shirt,12);limb(-28,torso+38,-5,torso+49,skin,8);limb(19,torso+9,27,torso+36,shirt,12);limb(27,torso+36,5,torso+49,skin,8);if(!asleep)rounded(-6,torso+37,12,18,2,'#151f29')}else{let dance=player&&p.trick?Math.sin(s.time*9)*25:walk*13;limb(-19,torso+8,-30,torso+37-dance,shirt,12);limb(-30,torso+37-dance,-23,torso+62-dance,skin,8);limb(19,torso+8,30,torso+35+dance,shirt,12);limb(30,torso+35+dance,22,torso+61+dance,skin,8)}
 box(-6,torso-10,12,15,skin);let face=c.createLinearGradient(-15,0,15,0);face.addColorStop(0,'#634735');face.addColorStop(.4,skin);face.addColorStop(1,'#d0a589');rounded(-15,torso-43,30,37,13,face);rounded(-16,torso-45,32,13,6,player?'#19252e':'#302c29');box(-16,torso-37,5,12,'#332d28');line(-8,torso-25,-4,torso-25,'#312c28',2);line(5,torso-25,9,torso-25,'#312c28',2);line(0,torso-23,2,torso-16,'#77573c',1);line(-4,torso-12,6,torso-12,'#6e4739',1);if(player){box(-20,torso-38,40,3,'#141e26');text('NY',-8,torso-37,8)}
 if(asleep){text('z z z',22,torso-49+Math.sin(s.time)*4,15,'#dce8ed');if(n.noise>3){box(-24,torso-64,48,4,'#293238');box(-24,torso-64,n.noise*.48,4,n.noise>65?'#de8963':'#95b5c4')}}
 if(player){text('YOU',-15,torso-64,11,'#f5d7ac');if(p.brace)text('BRACED',-25,torso-80,10,'#a8dbc3');if(s.blocking)text('BLOCK',-20,torso-80,10,'#b5d9eb');if(p.trick)text(p.trick.name,-45,torso-85,12,'#eac891')}
 c.restore();
}
export function render(canvas,s){c=canvas.getContext('2d');c.clearRect(0,0,W,H);c.save();let shake=s.status==='playing'?s.train.shake:0;c.translate(Math.sin(s.time*38)*shake*5,Math.cos(s.time*31)*shake*3);car(s);
 const figures=[...s.passengers.map(n=>({n,player:false})),{n:s.player,player:true}];if(s.aggressor)figures.push({n:{...s.aggressor,lane:0,color:'#703f42',skin:'#b48665'},player:false});figures.sort((a,b)=>(a.n.lane||0)-(b.n.lane||0));for(const f of figures)person(f.n,s,f.player);
 if(s.aggressor){text(s.aggressor.warning?'ATTACK INCOMING':'AGGRESSOR',s.aggressor.x-55,360,12,'#ffc6b4')}
 for(const x of [300,480,800,980]){rail(x,530,x,566,8)}
 let vignette=c.createRadialGradient(640,340,220,640,340,760);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#08101688');box(0,0,W,H,vignette);c.restore();
}
