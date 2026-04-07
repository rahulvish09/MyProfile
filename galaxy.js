(function(){
'use strict';
var CONFIG={starCount:3000,starSize:1.8,starDepth:1200,galaxyArms:2,galaxyStars:12000,galaxyRadius:600,galaxySpread:25,nebulaCount:1500,nebulaRadius:600,nebulaSize:3,rotationSpeed:0.00008,driftSpeed:0.00003,cameraZ:600,
starColors:[[0.95,0.95,1],[0.85,0.88,1],[1,0.92,0.85],[0.75,0.85,1],[1,0.85,0.8]],
galaxyColorInner:new THREE.Color(0xfff5cc),galaxyColorMid:new THREE.Color(0xd946ef),galaxyColorOuter:new THREE.Color(0x3b82f6),
nebulaColor1:new THREE.Color(0x3b82f6),nebulaColor2:new THREE.Color(0x8b5cf6),nebulaColor3:new THREE.Color(0xec4899)};

var scene,camera,renderer,canvas,starField,galaxyGroup,galaxyPoints,nebulaPoints;
var mouseX=0,mouseY=0,targetMouseX=0,targetMouseY=0,time=0,isLowPerf=false;

function detectPerf(){
var gl=document.createElement('canvas').getContext('webgl');
if(!gl)return true;
var d=gl.getExtension('WEBGL_debug_renderer_info');
if(d){var r=gl.getParameter(d.UNMASKED_RENDERER_WEBGL);if(/intel|mesa|swiftshader|llvmpipe/i.test(r))return true;}
if(window.devicePixelRatio<1.5&&window.innerWidth<768)return true;
return false;
}

function init(){
canvas=document.getElementById('galaxy-canvas');
if(!canvas)return;
isLowPerf=detectPerf();
if(isLowPerf){CONFIG.starCount=1500;CONFIG.galaxyStars=3000;CONFIG.nebulaCount=800;}

scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x04060f,0.00025);
camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,1,2000);
camera.position.z=CONFIG.cameraZ;

renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:!isLowPerf,alpha:false,powerPreference:isLowPerf?'low-power':'high-performance'});
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setClearColor(0x04060f,1);

createStarField();
createSpiralGalaxy();
createNebulaDust();

window.addEventListener('mousemove',function(e){targetMouseX=(e.clientX/window.innerWidth-0.5)*2;targetMouseY=(e.clientY/window.innerHeight-0.5)*2;},{passive:true});
window.addEventListener('resize',function(){camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));},{passive:true});
animate();
}

function createStarField(){
var c=CONFIG.starCount,pos=new Float32Array(c*3),col=new Float32Array(c*3);
for(var i=0;i<c;i++){var i3=i*3;
var t=Math.random()*Math.PI*2,p=Math.acos(2*Math.random()-1),r=CONFIG.starDepth*(0.3+Math.random()*0.7);
pos[i3]=r*Math.sin(p)*Math.cos(t);pos[i3+1]=r*Math.sin(p)*Math.sin(t);pos[i3+2]=r*Math.cos(p);
var sc=CONFIG.starColors[Math.floor(Math.random()*CONFIG.starColors.length)],b=0.5+Math.random()*0.5;
col[i3]=sc[0]*b;col[i3+1]=sc[1]*b;col[i3+2]=sc[2]*b;}
var g=new THREE.BufferGeometry();
g.setAttribute('position',new THREE.BufferAttribute(pos,3));
g.setAttribute('color',new THREE.BufferAttribute(col,3));
var m=new THREE.PointsMaterial({size:CONFIG.starSize,vertexColors:true,transparent:true,opacity:0.9,sizeAttenuation:true,depthWrite:false,blending:THREE.AdditiveBlending});
starField=new THREE.Points(g,m);scene.add(starField);
}

function createSpiralGalaxy(){
var c=CONFIG.galaxyStars,pos=new Float32Array(c*3),col=new Float32Array(c*3);
var arms=CONFIG.galaxyArms,rad=CONFIG.galaxyRadius,sp=CONFIG.galaxySpread;
for(var i=0;i<c;i++){var i3=i*3;
var ai=i%arms,aa=(ai/arms)*Math.PI*2,dist=Math.pow(Math.random(),1.8)*rad;
var sa=dist*0.015+aa;
var sx=(Math.random()-0.5)*sp*(dist/rad),sy=(Math.random()-0.5)*sp*0.3*(dist/rad),sz=(Math.random()-0.5)*sp*(dist/rad);
pos[i3]=Math.cos(sa)*dist+sx;pos[i3+1]=sy;pos[i3+2]=Math.sin(sa)*dist+sz;
var tt=dist/rad,co=new THREE.Color();
if(tt<0.25){co.copy(CONFIG.galaxyColorInner).lerp(CONFIG.galaxyColorMid,tt/0.25);}
else{co.copy(CONFIG.galaxyColorMid).lerp(CONFIG.galaxyColorOuter,(tt-0.25)/0.75);}
var br=1-tt*0.4;col[i3]=co.r*br;col[i3+1]=co.g*br;col[i3+2]=co.b*br;}
var g=new THREE.BufferGeometry();
g.setAttribute('position',new THREE.BufferAttribute(pos,3));
g.setAttribute('color',new THREE.BufferAttribute(col,3));
var m=new THREE.PointsMaterial({size:2.8,vertexColors:true,transparent:true,opacity:0.95,sizeAttenuation:true,depthWrite:false,blending:THREE.AdditiveBlending});
galaxyPoints=new THREE.Points(g,m);
galaxyGroup=new THREE.Group();
galaxyGroup.add(galaxyPoints);
galaxyGroup.rotation.x=Math.PI*0.35;galaxyGroup.position.y=-80;galaxyGroup.position.z=-150;
scene.add(galaxyGroup);
}

function createNebulaDust(){
var c=CONFIG.nebulaCount,pos=new Float32Array(c*3),col=new Float32Array(c*3);
var nc=[CONFIG.nebulaColor1,CONFIG.nebulaColor2,CONFIG.nebulaColor3];
for(var i=0;i<c;i++){var i3=i*3;
var t=Math.random()*Math.PI*2,p=Math.acos(2*Math.random()-1),r=CONFIG.nebulaRadius*(0.2+Math.random()*0.8);
var cx=(Math.random()-0.5)*200,cz=(Math.random()-0.5)*200;
pos[i3]=r*Math.sin(p)*Math.cos(t)+cx;pos[i3+1]=r*Math.sin(p)*Math.sin(t)*0.3;pos[i3+2]=r*Math.cos(p)+cz;
var co=nc[Math.floor(Math.random()*nc.length)],b=0.15+Math.random()*0.25;
col[i3]=co.r*b;col[i3+1]=co.g*b;col[i3+2]=co.b*b;}
var g=new THREE.BufferGeometry();
g.setAttribute('position',new THREE.BufferAttribute(pos,3));
g.setAttribute('color',new THREE.BufferAttribute(col,3));
var m=new THREE.PointsMaterial({size:CONFIG.nebulaSize,vertexColors:true,transparent:true,opacity:0.3,sizeAttenuation:true,depthWrite:false,blending:THREE.AdditiveBlending});
nebulaPoints=new THREE.Points(g,m);scene.add(nebulaPoints);
}

function animate(){
requestAnimationFrame(animate);time+=0.001;
mouseX+=(targetMouseX-mouseX)*0.02;mouseY+=(targetMouseY-mouseY)*0.02;
camera.position.x=mouseX*80;camera.position.y=-mouseY*40;camera.lookAt(0,0,0);
if(starField){starField.rotation.y+=CONFIG.rotationSpeed*0.5;starField.rotation.x+=CONFIG.rotationSpeed*0.2;}
if(galaxyGroup){galaxyPoints.rotation.y-=CONFIG.rotationSpeed*25;}
if(nebulaPoints){nebulaPoints.rotation.y-=CONFIG.rotationSpeed*0.3;nebulaPoints.rotation.x+=CONFIG.driftSpeed;}
if(starField&&starField.material){starField.material.opacity=0.85+Math.sin(time*2)*0.1;}
renderer.render(scene,camera);
}

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
})();
