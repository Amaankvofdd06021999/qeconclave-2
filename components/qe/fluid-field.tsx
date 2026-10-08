'use client';
import {useEffect,useRef} from 'react';
import * as THREE from 'three';
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}`;
const frag=`precision highp float;
varying vec2 vUv;uniform float uTime;uniform float uScroll;uniform vec2 uResolution;uniform vec2 uMouse;uniform sampler2D uFlow;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+1.7;a*=.5;}return v;}
void main(){
 vec2 uv=vUv;float aspect=uResolution.x/uResolution.y;
 vec2 cell=floor(uv*uResolution/3.5)*3.5/uResolution;vec2 p=(cell-.5)*vec2(aspect,1.);
 float t=uTime*.13;vec2 flow=texture2D(uFlow,uv).rg-.5;p+=flow*.1;
 p.x+=.12;float n=fbm(p*2.4+vec2(t,-t*.4));
 float center=.14*sin(p.x*2.9+t*1.3)+.17*sin(p.x*1.45-t*.5);
 float wave=p.y-center-(n-.5)*.27;
 float envelope=exp(-abs(wave)*5.8);
 float ribs=pow(.5+.5*sin(wave*95.+n*8.+p.x*2.5-t*4.),11.);
 float broad=exp(-abs(wave)*9.)*.32;
 float mesh=pow(.5+.5*sin(p.x*115.+n*5.),12.);
 float intensity=(ribs*.85+broad+mesh*.15)*envelope;
 float arc=1.-smoothstep(.3,.9,abs(p.x-.17));intensity*=mix(.25,1.,arc);
 vec3 col=mix(vec3(.015,.11,.38),vec3(.37,.67,1.),smoothstep(-.15,.22,wave));
 col=mix(col,vec3(.72,.88,1.),pow(intensity,2.)*.7);
 vec2 grid=fract(uv*uResolution/3.5);float pixel=step(.12,grid.x)*step(.12,grid.y);
 col*=intensity*pixel*1.9;float vignette=smoothstep(.9,.25,length((uv-.5)*vec2(.9,1.3)));
 float spark=step(.995,hash(floor(uv*uResolution/5.)))*envelope*.35;
 col+=vec3(.3,.6,1.)*spark;col*=vignette;
 col=mix(col,col.bgr,.08*uScroll);gl_FragColor=vec4(col,1.);
}`;
const flowFrag=`precision highp float;varying vec2 vUv;uniform sampler2D uPrevious;uniform vec2 uMouse;uniform vec2 uVelocity;uniform float uAspect;void main(){vec2 prev=texture2D(uPrevious,vUv-uVelocity*.001).rg;prev=mix(vec2(.5),prev,.965);float d=length((vUv-uMouse)*vec2(uAspect,1.));float influence=exp(-d*d*60.);prev+=uVelocity*influence*.07;gl_FragColor=vec4(clamp(prev,0.,1.),0.,1.);}`;
function canvasFallback(el:HTMLDivElement){
 const canvas=document.createElement('canvas');el.appendChild(canvas);const c=canvas.getContext('2d');if(!c){canvas.remove();return()=>{}}let w=1,h=1,t=0,frame=0,last=0,active=true;let mx=.6,my=.5;let paused=document.documentElement.dataset.motion==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const resize=()=>{const r=el.getBoundingClientRect();w=r.width;h=r.height;const d=Math.min(devicePixelRatio,1.5);canvas.width=w*d;canvas.height=h*d;c.setTransform(d,0,0,d,0,0)};resize();const ro=new ResizeObserver(resize);ro.observe(el);const io=new IntersectionObserver(([e])=>active=e.isIntersecting);io.observe(el);
 const move=(e:PointerEvent)=>{const r=el.getBoundingClientRect();mx=(e.clientX-r.left)/w;my=(e.clientY-r.top)/h};const change=()=>paused=document.documentElement.dataset.motion==='off';window.addEventListener('pointermove',move,{passive:true});window.addEventListener('motionchange',change);
 function draw(now:number){frame=requestAnimationFrame(draw);if(now-last<45||!active||document.hidden)return;last=now;if(!paused)t+=.02;c!.clearRect(0,0,w,h);
 const glow=c!.createRadialGradient(w*.62,h*.5,0,w*.62,h*.5,w*.48);glow.addColorStop(0,'rgba(12,71,149,.12)');glow.addColorStop(1,'rgba(0,10,30,0)');c!.fillStyle=glow;c!.fillRect(0,0,w,h);
 for(let j=0;j<66;j++){const z=j/65;for(let i=0;i<165;i++){const u=i/164;const taper=Math.pow(Math.sin(u*Math.PI),.9);const wave=Math.sin(u*7.5+z*2.1+t)*.14+Math.sin(u*11.3-z*3.3-t*.65)*.08;const dx=u-mx;const ripple=Math.sin(Math.sqrt(dx*dx+Math.pow(z-my,2))*22-t*2)*.009*Math.exp(-dx*dx*12);const x=u*w;const y=h*(.38+z*.27+(wave+ripple)*taper);const focus=Math.exp(-Math.pow((u-.61)*2.2,2));const alpha=taper*focus*(.15+.62*Math.pow(Math.sin(z*Math.PI),2));c!.fillStyle=`rgba(${Math.round(55+z*105)},${Math.round(123+z*90)},255,${alpha})`;const size=1.05+focus*.55;c!.fillRect(x,y,size,size);}}
 }
 frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);ro.disconnect();io.disconnect();window.removeEventListener('pointermove',move);window.removeEventListener('motionchange',change);canvas.remove()};
}

export function FluidField(){const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;let renderer:THREE.WebGLRenderer;
 const glCanvas=document.createElement('canvas');const context=glCanvas.getContext('webgl2',{alpha:true,antialias:false,powerPreference:'low-power'});if(!context)return canvasFallback(el);try{renderer=new THREE.WebGLRenderer({canvas:glCanvas,context,antialias:false,alpha:true,powerPreference:'low-power'});}catch{return canvasFallback(el);}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));el.appendChild(renderer.domElement);
 const scene=new THREE.Scene();const cam=new THREE.Camera();const geo=new THREE.PlaneGeometry(2,2);const mouse=new THREE.Vector2(.5,.5),velocity=new THREE.Vector2();let a=new THREE.WebGLRenderTarget(128,128),b=new THREE.WebGLRenderTarget(128,128);
 const uniforms={uTime:{value:0},uScroll:{value:0},uResolution:{value:new THREE.Vector2(1000,800)},uMouse:{value:mouse},uFlow:{value:a.texture}};
 const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:frag,uniforms});const mesh=new THREE.Mesh(geo,material);scene.add(mesh);
 const fs=new THREE.Scene();const fm=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:flowFrag,uniforms:{uPrevious:{value:a.texture},uMouse:{value:mouse},uVelocity:{value:velocity},uAspect:{value:1}}});fs.add(new THREE.Mesh(geo,fm));
 const resize=()=>{const r=el.getBoundingClientRect();renderer.setSize(r.width,r.height);uniforms.uResolution.value.set(r.width*renderer.getPixelRatio(),r.height*renderer.getPixelRatio());fm.uniforms.uAspect.value=r.width/r.height;};resize();const ro=new ResizeObserver(resize);ro.observe(el);
 const move=(e:PointerEvent)=>{const r=el.getBoundingClientRect();const nx=(e.clientX-r.left)/r.width,ny=1-(e.clientY-r.top)/r.height;velocity.set((nx-mouse.x)*9,(ny-mouse.y)*9);mouse.set(nx,ny);};window.addEventListener('pointermove',move,{passive:true});
 let active=true,frame=0,time=0,last=0;let paused=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const change=()=>{paused=document.documentElement.dataset.motion==='off';};window.addEventListener('motionchange',change);
 const io=new IntersectionObserver(([entry])=>active=entry.isIntersecting);io.observe(el);
 const render=(now:number)=>{frame=requestAnimationFrame(render);if(now-last<32||!active||document.hidden)return;last=now;if(!paused)time+=.032;uniforms.uTime.value=time;uniforms.uScroll.value=Math.min(window.scrollY/900,1);velocity.multiplyScalar(.94);fm.uniforms.uPrevious.value=a.texture;renderer.setRenderTarget(b);renderer.render(fs,cam);[a,b]=[b,a];uniforms.uFlow.value=a.texture;renderer.setRenderTarget(null);renderer.render(scene,cam);};frame=requestAnimationFrame(render);
 return()=>{cancelAnimationFrame(frame);window.removeEventListener('pointermove',move);window.removeEventListener('motionchange',change);ro.disconnect();io.disconnect();geo.dispose();material.dispose();fm.dispose();a.dispose();b.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);return <div ref={ref} className="fluid-field" aria-hidden="true"/>;
}
