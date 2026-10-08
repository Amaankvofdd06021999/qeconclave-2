'use client';
import {useEffect,useRef} from 'react';
// Pixel motifs built from the burst-mark palette: a wordmark that lights up under the pointer,
// and quiet pixel clusters for empty columns. Both draw to a canvas sized to their box.
const PALETTE=['#19bbe9','#f2eb53','#ef3a30'];
const BURST=[{c:0,p:[354,50,273,0,208,148,131,0,54,58,207,205]},{c:1,p:[199,217,8,165,1,262,141,248,54,380,144,420]},{c:2,p:[222,217,413,165,420,262,280,248,367,380,277,420]}];
// Hover ramps: index 0 is the pure brand colour, 15 is lifted toward white. Pixels nearest the
// pointer sit high on the ramp and slide back to the pure colour as they cool.
const RAMPS=[[25,187,233],[242,235,83],[239,58,48]].map(([r,g,b])=>Array.from({length:16},(_,k)=>{const m=k/15*.55;return `rgb(${Math.round(r+(255-r)*m)},${Math.round(g+(255-g)*m)},${Math.round(b+(255-b)*m)})`}));
const ramp=(c:number,k:number)=>RAMPS[c][Math.max(0,Math.min(15,Math.round(k*k*15)))];
const motionOff=()=>document.documentElement.dataset.motion==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches;
function setupCanvas(canvas:HTMLCanvasElement,w:number,h:number){const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);canvas.style.height=h+'px';const c=canvas.getContext('2d')!;c.setTransform(d,0,0,d,0,0);return c}

// "Quality, unbound." as a greyed pixel grid that fills the footer width edge to edge.
export function PixelWordmark({text}:{text:string}){const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;const canvas=el.querySelector('canvas')!;
  let w=0,h=0,cell=6,cols=0,rows=0,on=new Uint8Array(0),heat=new Float32Array(0),hue=new Uint8Array(0),c:CanvasRenderingContext2D|null=null;
  let px=-1e4,py=-1e4,inside=false,frame=0,running=false,tone=Math.floor(Math.random()*3);
  const build=()=>{w=el.clientWidth;if(!w)return;cell=Math.max(4,Math.round(w/200));
   const font=getComputedStyle(el).fontFamily;const m=document.createElement('canvas').getContext('2d')!;
   const spacing=(size:number)=>{if('letterSpacing' in m)(m as CanvasRenderingContext2D&{letterSpacing:string}).letterSpacing=(-.06*size)+'px'};
   m.font=`400 100px ${font}`;spacing(100);let mt=m.measureText(text);
   const size=100*w/(mt.actualBoundingBoxLeft+mt.actualBoundingBoxRight);m.font=`400 ${size}px ${font}`;spacing(size);mt=m.measureText(text);
   cols=Math.floor(w/cell);rows=Math.ceil((mt.actualBoundingBoxAscent+mt.actualBoundingBoxDescent)/cell)+1;h=rows*cell;
   const off=document.createElement('canvas');off.width=Math.ceil(w);off.height=h;const o=off.getContext('2d',{willReadFrequently:true})!;
   o.font=m.font;if('letterSpacing' in o)(o as CanvasRenderingContext2D&{letterSpacing:string}).letterSpacing=(-.06*size)+'px';
   const ox=(w-cols*cell)/2;o.fillStyle='#fff';o.textBaseline='alphabetic';o.fillText(text,mt.actualBoundingBoxLeft,mt.actualBoundingBoxAscent+cell*.5);
   const data=o.getImageData(0,0,off.width,off.height).data;on=new Uint8Array(cols*rows);heat=new Float32Array(cols*rows);hue=new Uint8Array(cols*rows);
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const sx=Math.floor(ox+(x+.5)*cell),sy=Math.floor((y+.5)*cell);on[y*cols+x]=data[(sy*off.width+sx)*4+3]>110?1:0;hue[y*cols+x]=tone}
   c=setupCanvas(canvas,w,h);draw();
  };
  const draw=()=>{if(!c)return;c.clearRect(0,0,w,h);const s=cell-Math.max(1,cell*.18);const ox=(w-cols*cell)/2;
   c.fillStyle='rgba(150,158,170,.13)';for(let i=0;i<on.length;i++)if(on[i])c.fillRect(ox+(i%cols)*cell,Math.floor(i/cols)*cell,s,s);
   for(let i=0;i<on.length;i++){const k=heat[i];if(k<.02)continue;c.globalAlpha=on[i]?Math.min(1,.25+k):k*.16;c.fillStyle=ramp(hue[i],k);c.fillRect(ox+(i%cols)*cell,Math.floor(i/cols)*cell,s,s)}c.globalAlpha=1;
  };
  const step=()=>{let live=false;const r=cell*10,r2=r*r;const ox=(w-cols*cell)/2;
   if(inside){const x0=Math.max(0,Math.floor((px-ox-r)/cell)),x1=Math.min(cols-1,Math.ceil((px-ox+r)/cell)),y0=Math.max(0,Math.floor((py-r)/cell)),y1=Math.min(rows-1,Math.ceil((py+r)/cell));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const dx=ox+(x+.5)*cell-px,dy=(y+.5)*cell-py,d2=dx*dx+dy*dy;if(d2>r2)continue;const i=y*cols+x,f=1-Math.sqrt(d2)/r;
     if(f>heat[i]){heat[i]=f;hue[i]=tone}}}
   for(let i=0;i<heat.length;i++)if(heat[i]>.02){heat[i]*=on[i]?.955:.9;live=true}
   draw();if(live||inside)frame=requestAnimationFrame(step);else running=false;
  };
  const kick=()=>{if(!running){running=true;frame=requestAnimationFrame(step)}};
  const move=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;const was=inside;inside=px>=0&&py>=0&&px<=r.width&&py<=r.height;if(inside&&!was)tone=(tone+1)%3;kick()};
  const leave=()=>{inside=false;kick()};
  el.addEventListener('pointermove',move,{passive:true});el.addEventListener('pointerleave',leave);
  const ro=new ResizeObserver(()=>{if(el.clientWidth!==w)build()});ro.observe(el);
  document.fonts?.ready.then(build).catch(build);build();
  return()=>{cancelAnimationFrame(frame);ro.disconnect();el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave)};
 },[text]);
 return <div ref={ref} className="pixel-wordmark" aria-hidden="true"><canvas/></div>;
}

// The burst mark as a small solid emblem that turns slowly clockwise. Hovering breaks it into
// pixels that scatter outward; moving away pulls them back together into the solid mark.
type Bit={x:number,y:number,c:number,dx:number,dy:number,lag:number};
export function PixelMotif({className=''}:{className?:string}){const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;const canvas=el.querySelector('canvas')!;
  // The canvas is twice the box (see CSS) so scattered pixels have room and fade out instead of
  // stopping at a square edge.
  let w=0,h=0,bw=0,bh=0,S=0,g=0,bits:Bit[]=[],c:CanvasRenderingContext2D|null=null,frame=0,last=0,angle=0,k=0,hover=false,visible=false;
  const build=()=>{bw=el.clientWidth;bh=el.clientHeight;if(!bw||!bh)return;w=bw*2;h=bh*2;S=Math.min(bw,bh)*.56;g=Math.max(3,S/34);const sc=S/421;
   const n=Math.ceil(S/g),off=document.createElement('canvas');off.width=n;off.height=n;const o=off.getContext('2d',{willReadFrequently:true})!;
   BURST.forEach(b=>{o.fillStyle=['#f00','#0f0','#00f'][b.c];o.beginPath();for(let i=0;i<b.p.length;i+=2){const x=b.p[i]*sc/g,y=b.p[i+1]*sc/g;if(i)o.lineTo(x,y);else o.moveTo(x,y)}o.closePath();o.fill()});
   const d=o.getImageData(0,0,n,n).data;bits=[];
   for(let y=0;y<n;y++)for(let x=0;x<n;x++){const q=(y*n+x)*4;const ci=d[q]>100?0:d[q+1]>100?1:d[q+2]>100?2:-1;if(ci<0)continue;
    const lx=(x+.5)*g-S/2,ly=(y+.5)*g-S/2,len=Math.hypot(lx,ly)||1,push=S*(.18+Math.random()*.42),a=Math.atan2(ly,lx)+(Math.random()-.5)*1.1;
    bits.push({x:lx,y:ly,c:ci,dx:Math.cos(a)*push+lx/len*S*.08,dy:Math.sin(a)*push+ly/len*S*.08,lag:Math.random()*.45})}
   c=setupCanvas(canvas,w,h);canvas.style.width=w+'px';draw();
  };
  const ease=(x:number)=>1-Math.pow(1-Math.max(0,Math.min(1,x)),3);
  const draw=()=>{if(!c)return;c.clearRect(0,0,w,h);c.save();c.translate(w/2,h/2);c.rotate(angle);
   if(k<.002){const sc=S/421;BURST.forEach(b=>{c!.fillStyle=PALETTE[b.c];c!.beginPath();for(let i=0;i<b.p.length;i+=2){const x=b.p[i]*sc-S/2,y=b.p[i+1]*sc-S/2;if(i)c!.lineTo(x,y);else c!.moveTo(x,y)}c!.closePath();c!.fill()})}
   else{const size=g*(1.04-.5*Math.min(1,k*2.5));for(const b of bits){const e=ease((k-b.lag*.6)/(1-b.lag*.6)),reach=Math.hypot(b.x+b.dx*e,b.y+b.dy*e)/(S*1.25);c.globalAlpha=Math.max(0,(1-e*.4)*(1-Math.max(0,reach-.55)/.45));c.fillStyle=PALETTE[b.c];c.fillRect(b.x+b.dx*e-size/2,b.y+b.dy*e-size/2,size,size)}c.globalAlpha=1}
   c.restore();
  };
    const loop=(now:number)=>{frame=requestAnimationFrame(loop);if(!visible||document.hidden)return;const dt=Math.min(.05,(now-(last||now))/1000);last=now;
   if(!motionOff())angle+=dt*.32;k+=((hover?1:0)-k)*Math.min(1,dt*(hover?3.2:2.6));if(Math.abs((hover?1:0)-k)<.001)k=hover?1:0;draw()};
  const move=(e:PointerEvent)=>{if(!visible)return;const r=el.getBoundingClientRect();hover=Math.hypot(e.clientX-r.left-bw/2,e.clientY-r.top-bh/2)<S*.62};
  const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;last=0});io.observe(el);
  const ro=new ResizeObserver(()=>{if(el.clientWidth!==bw||el.clientHeight!==bh)build()});ro.observe(el);
  window.addEventListener('pointermove',move,{passive:true});build();frame=requestAnimationFrame(loop);
  return()=>{cancelAnimationFrame(frame);io.disconnect();ro.disconnect();window.removeEventListener('pointermove',move)};
 },[]);
 return <div ref={ref} className={'pixel-motif '+className} aria-hidden="true"><canvas/></div>;
}

// Dithered 3D scenes for page heroes. Each scene is a signed-distance field ray-marched on the GPU
// at one sample per dot, lit, then reduced to dots with an ordered dither so it reads like a pixel
// print of a small world in motion. Each part of a scene owns one brand colour; loose dots gather
// near the silhouette and fade out in a soft circle around it.
export type SymbolShape='hand'|'planet'|'atom'|'gyro'|'robot'|'arm'|'drone'|'chip';
type Scene={cell?:number,zoom?:number,bound:number,colors:number[],yaw:(t:number)=>number,pitch:(t:number)=>number,glsl:string};
const glv=(...n:number[])=>'vec3('+n.map(v=>v.toFixed(4)).join(',')+')';
// Hand skeleton: four fingers of three phalanges curling up around the world, a three-part thumb
// and the forearm. Knuckle, thumb and forearm bones blend into the palm; finger joints stay crisp.
const HAND_GLSL=(()=>{const out:string[]=[];
 const bone=(a:number[],e:number[],ra:number,rb:number,blend:boolean)=>{const d=`cone(p,${glv(...a)},${glv(...e)},${ra.toFixed(4)},${rb.toFixed(4)})`;out.push(blend?`hd=smin(hd,${d},.035);`:`hd=min(hd,${d});`)};
 [{x:-.2,z:.25,len:[.28,.17,.13],r:.054},{x:-.068,z:.28,len:[.31,.19,.14],r:.057},{x:.068,z:.27,len:[.29,.18,.13],r:.053},{x:.2,z:.22,len:[.22,.14,.11],r:.046}].forEach(f=>{
  let x=f.x,y=-.41,z=f.z,th=.22;f.len.forEach((l,k)=>{th+=k?.72:0;const nx=x+f.x*.22,ny=y+Math.sin(th)*l,nz=z+Math.cos(th)*l;bone([x,y,z],[nx,ny,nz],f.r*(1-k*.12),f.r*(.9-k*.12),k===0);x=nx;y=ny;z=nz})});
 bone([-.24,-.44,-.1],[-.4,-.35,.03],.072,.064,true);bone([-.4,-.35,.03],[-.47,-.2,.13],.064,.055,true);bone([-.47,-.2,.13],[-.44,-.06,.2],.055,.046,true);
 bone([0,-.46,-.24],[0,-.53,-.78],.13,.15,true);return out.join('\n')})();
const SCENES:Record<SymbolShape,Scene>={
 // An open hand cradling a small ringed world: the community holding quality up.
 hand:{cell:2.5,zoom:1.25,bound:1.2,colors:[0,1,2,0],yaw:t=>Math.PI+.6+Math.sin(t*.3)*.28,pitch:t=>.55+Math.sin(t*.21)*.06,glsl:`
float scene(vec3 p){best=1e9;vec3 w=p-vec3(0.,.16,.06);U(length(w)-.34,0);
 vec3 r=w;r.xy=rot(.5)*w.xy;U(tor(r,.52,.022),2);
 if(length(p-vec3(-.05,-.4,-.1))-1.15<best){
  float hd=smin(rbox(p-vec3(0.,-.43,.02),vec3(.25,.04,.23),.065),length(p-vec3(-.17,-.42,-.1))-.11,.08);
  ${HAND_GLSL}
  U(hd,1);}
 return best;}
float tex(int m,vec3 p){return m==0?continents(p-vec3(0.,.16,.06),uTime*.5):1.;}`},
 // A ringed planet with two moons on crossing orbits.
 planet:{bound:1.08,colors:[0,1,2,0],yaw:t=>t*.18,pitch:t=>.38+Math.sin(t*.2)*.1,glsl:`
float scene(vec3 p){best=1e9;U(length(p)-.48,0);vec3 q=p;q.yz=rot(.42)*p.yz;U(tor(q,.74,.03),1);U(tor(q,.86,.018),1);
 float a=uTime*.8,b=-uTime*.55+2.;U(length(p-vec3(cos(a)*.98,sin(a)*.98*.35,sin(a)*.98))-.09,2);
 U(length(p-vec3(cos(b)*.74,-cos(b)*.74*.45,sin(b)*.74))-.07,2);return best;}
float tex(int m,vec3 p){return m==0?continents(p,uTime*.4):1.;}`},
 // A nucleus with three orbits, each carrying an electron.
 atom:{bound:.98,colors:[2,0,1,0],yaw:t=>t*.3,pitch:t=>.5+Math.sin(t*.25)*.2,glsl:`
void orbit(vec3 a,float k,int m){U(tor(a,.78,.02),m);float e=uTime*(1.1+k*.3)+k*2.1;U(length(a-vec3(cos(e)*.78,0.,sin(e)*.78))-.07,3);}
float scene(vec3 p){best=1e9;U(length(p)-.24-.025*sin(p.x*18.+uTime)*sin(p.y*17.)*sin(p.z*19.),0);
 orbit(p,0.,1);vec3 q=p;q.xy=rot(1.05)*p.xy;orbit(q,1.,2);q=p;q.xy=rot(-1.05)*p.xy;orbit(q,2.,1);return best;}
float tex(int m,vec3 p){return 1.;}`},
 // A robot head and shoulders. The head looks around on its own; the visor and antenna tip glow.
 robot:{cell:4,zoom:1.1,bound:1.15,colors:[0,1,2,0],yaw:t=>Math.PI+Math.sin(t*.2)*.35,pitch:t=>.12+Math.sin(t*.17)*.05,glsl:`
float scene(vec3 p){best=1e9;
 U(rbox(p-vec3(0.,-.66,0.),vec3(.5,.1,.24),.12),0);U(cyl(p-vec3(0.,-.42,0.),.1,.12),2);
 vec3 h=p-vec3(0.,.04,0.);h.xz=rot(sin(uTime*.6)*.55)*h.xz;h.yz=rot(sin(uTime*.45)*.12)*h.yz;
 U(rbox(h,vec3(.25,.24,.23),.11),0);
 U(rbox(h-vec3(0.,.05,.33),vec3(.25,.075,.04),.04),1);
 vec3 e=h;e.x=abs(e.x);U(cyl((e-vec3(.37,0.,0.)).yxz,.1,.05),2);
 U(cyl(h-vec3(.1,.48,0.),.012,.12),2);U(length(h-vec3(.1,.62,0.))-.045,1);
 return best;}
float tex(int m,vec3 p){if(m==1)return 1.5+.4*sin(uTime*3.+p.x*20.);return 1.;}`},
 // An industrial robot arm: base turning, shoulder and elbow working, gripper opening and closing.
 arm:{cell:4,zoom:1.05,bound:1.2,colors:[0,1,2,0],yaw:t=>.6+Math.sin(t*.22)*.5,pitch:()=>.32,glsl:`
float scene(vec3 p){best=1e9;
 U(cyl(p-vec3(0.,-.86,0.),.34,.04),0);
 vec3 q=p;q.xz=rot(sin(uTime*.4)*1.2)*p.xz;U(cyl(q-vec3(0.,-.72,0.),.2,.1),0);
 float a1=.55+.3*sin(uTime*.7),a2=1.25+.35*sin(uTime*.9+1.),a3=.4*sin(uTime*1.1+2.);
 vec3 S=vec3(0.,-.55,0.),E=S+.58*vec3(sin(a1),cos(a1),0.),W=E+.5*vec3(sin(a1+a2),cos(a1+a2),0.);
 vec2 dir=vec2(sin(a1+a2+a3),cos(a1+a2+a3)),nrm=vec2(dir.y,-dir.x);
 U(cyl((q-S).xzy,.13,.11),0);U(cone(q,S,E,.085,.07),1);U(cyl((q-E).xzy,.1,.09),0);U(cone(q,E,W,.065,.05),1);
 vec3 G=W+.06*vec3(dir,0.);U(length(q-W)-.075,2);float o=.05+.035*sin(uTime*1.6);
 U(cone(q,G+o*vec3(nrm,0.),G+o*vec3(nrm,0.)+.16*vec3(dir,0.),.025,.018),2);
 U(cone(q,G-o*vec3(nrm,0.),G-o*vec3(nrm,0.)+.16*vec3(dir,0.),.025,.018),2);
 return best;}
float tex(int m,vec3 p){return 1.;}`},
 // A quadcopter drone hovering: body, four arms, motors and spinning two-blade rotors.
 drone:{cell:4,zoom:1.1,bound:1.,colors:[0,1,2,0],yaw:t=>t*.25,pitch:t=>-.5-Math.sin(t*.3)*.08,glsl:`
float scene(vec3 p){best=1e9;p.y-=.05*sin(uTime*1.3);p.xy=rot(.08*sin(uTime*.9))*p.xy;
 U(rbox(p,vec3(.18,.05,.24),.06),0);U(length(p-vec3(0.,-.1,.22))-.07,2);
 vec3 a=p;a.xz=abs(a.xz);U(cone(a,vec3(.1,0.,.1),vec3(.5,.02,.5),.035,.03),0);
 vec3 m=a-vec3(.5,.06,.5);U(cyl(m,.06,.05),1);
 vec3 r=m-vec3(0.,.07,0.);r.xz=rot(uTime*9.+(p.x>0.?1.:0.)+(p.z>0.?2.:0.))*r.xz;U(rbox(r,vec3(.25,.004,.025),.006),2);
 return best;}
float tex(int m,vec3 p){return 1.;}`},
 // A processor package with pins; light pulses run across the die like data.
 chip:{cell:4,zoom:1.05,bound:1.,colors:[0,1,2,0],yaw:t=>t*.2,pitch:t=>-.75-Math.sin(t*.25)*.12,glsl:`
float scene(vec3 p){best=1e9;p.y-=.03*sin(uTime*.8);
 U(rbox(p,vec3(.5,.04,.5),.025),0);U(rbox(p-vec3(0.,.07,0.),vec3(.26,.03,.26),.01),1);
 vec3 q=p;q.x=mod(q.x+.05,.1)-.05;if(abs(p.x)<.46){vec3 s=q;s.z=abs(s.z)-.6;U(rbox(s-vec3(0.,-.03,0.),vec3(.022,.012,.08),.004),2);}
 q=p;q.z=mod(q.z+.05,.1)-.05;if(abs(p.z)<.46){vec3 s=q;s.x=abs(s.x)-.6;U(rbox(s-vec3(0.,-.03,0.),vec3(.08,.012,.022),.004),2);}
 return best;}
float tex(int m,vec3 p){if(m==1){float g=step(.5,fract(p.x*14.))*step(.5,fract(p.z*14.));return .7+.9*smoothstep(.85,1.,sin(length(p.xz)*18.-uTime*3.))+.2*g;}
 if(m==0)return .75+.25*step(.92,fract((p.x+p.z)*6.));return 1.;}`},
 // Nested gimbal rings turning on separate axes around a steady core: an autonomous system.
 gyro:{bound:.98,colors:[0,1,2,0],yaw:t=>t*.12,pitch:()=>.35,glsl:`
float scene(vec3 p){best=1e9;U(length(p)-.28,0);
 vec3 a=p;a.yz=rot(uTime*.7)*p.yz;U(tor(a,.5,.04),1);
 vec3 b=a;b.xy=rot(uTime*.5)*a.xy;U(tor(b.xzy,.68,.035),2);
 vec3 c=b;c.xz=rot(uTime*.9+1.)*b.xz;U(tor(c.xzy,.86,.03),3);return best;}
float tex(int m,vec3 p){return m==0?continents(p,uTime*.3):1.;}`}
};
const VERT='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const fragment=(scene:string)=>`precision highp float;
uniform float uTime,uYaw,uPitch,uE,uB,uN,uTick,uHover;uniform vec2 uMouse;uniform vec3 uC0,uC1,uC2,uC3;
float best;int MAT;
void U(float d,int m){if(d<best){best=d;MAT=m;}}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
float tor(vec3 p,float R,float r){return length(vec2(length(p.xz)-R,p.y))-r;}
float rbox(vec3 p,vec3 b,float r){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}
float cyl(vec3 p,float r,float h){vec2 d=abs(vec2(length(p.xz),p.y))-vec2(r,h);return min(max(d.x,d.y),0.)+length(max(d,0.));}
float smin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
float cone(vec3 p,vec3 a,vec3 b,float ra,float rb){vec3 v=b-a,w=p-a;float h=clamp(dot(w,v)/dot(v,v),0.,1.);return length(w-v*h)-mix(ra,rb,h);}
float continents(vec3 p,float s){vec2 xz=rot(s)*p.xz;return sin(xz.x*7.1+1.3)*sin(p.y*6.3)*sin(xz.y*7.7+.4)+.35*sin(xz.x*13.+p.y*11.)>.02?1.:.5;}
${scene}
vec3 obj(vec3 q){q.yz=rot(-uPitch)*q.yz;q.xz=rot(uYaw)*q.xz;return q;}
float f(vec3 q){return scene(obj(q));}
float bayer2(vec2 a){a=floor(a);return fract(dot(a,vec2(.5,a.y*.75)));}
float bayer4(vec2 a){return bayer2(.5*a)*.25+bayer2(a);}
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
vec3 col(int m){return m==0?uC0:m==1?uC1:m==2?uC2:uC3;}
void main(){
 // Four canvas pixels per dot: a 3x3 dot and a one-pixel gap.
 vec2 cell=floor(gl_FragCoord.xy/4.),inner=mod(gl_FragCoord.xy,4.);if(inner.x>=3.||inner.y>=3.)discard;
 vec2 uv=((cell+.5)/uN*2.-1.)*uE;float r=length(uv);
 // Hover: dots part around the pointer like a lens, with a ripple running outward from it.
 vec2 dm=uv-uMouse;float dl=length(dm),lens=uHover*exp(-dl*dl*7.);
 uv+=dm/(dl+.04)*(lens*.2+uHover*.035*sin(dl*16.-uTime*7.)*exp(-dl*1.6));float r2=dot(uv,uv);
 float minD=9.,t=0.;bool hit=false;int mat=0;
 if(r2<uB*uB){float hl=sqrt(uB*uB-r2);t=-hl;
  for(int i=0;i<90;i++){if(t>hl)break;float d=f(vec3(uv,t));minD=min(minD,d);if(d<.0025){hit=true;mat=MAT;break;}t+=max(d*.9,.004);}}
 if(hit){vec3 p=vec3(uv,t);vec2 e=vec2(.006,0.);
  vec3 n=normalize(vec3(f(p+e.xyy)-f(p-e.xyy),f(p+e.yxy)-f(p-e.yxy),f(p+e.yyx)-f(p-e.yyx)));
  float lit=max(0.,dot(n,normalize(vec3(-.45,.55,-.7)))),rim=pow(1.-abs(n.z),3.),ao=clamp(f(p+n*.07)/.07,.35,1.);
  float b=(.2+.9*lit+.25*rim)*ao*tex(mat,obj(p));
  if(b<=bayer4(cell))discard;gl_FragColor=vec4(col(mat),1.)*min(1.,.5+b*.5);return;}
 float pr=(minD<.22?.3*pow(1.-minD/.22,2.):0.)+.014*pow(max(0.,1.-r/(uE*.92)),2.)+lens*.3;
 if(hash(vec3(cell,uTick))>=pr)discard;
 float k=hash(vec3(cell.yx,uTick));gl_FragColor=vec4(k<.333?uC0:k<.667?uC1:uC2,1.)*.5;}`;
const RGB=[[25,187,233],[242,235,83],[239,58,48]].map(c=>c.map(v=>v/255));
// With `avoid`, the symbol sizes and places itself in the largest gap to the right of those
// elements' text lines, so it never collides with a headline however it wraps.
function placeBeside(el:HTMLElement,avoid:string){const parent=el.parentElement;if(!parent)return;const pr=parent.getBoundingClientRect(),cs=getComputedStyle(parent);
 const right=pr.width-parseFloat(cs.paddingRight),gap=48,max=Math.min(420,innerWidth*.27),lines:DOMRect[]=[];
 parent.querySelectorAll(avoid).forEach(n=>{const r=document.createRange();r.selectNodeContents(n);lines.push(...Array.from(r.getClientRects()))});
 let best={size:0,top:0};for(let top=24;top<pr.height-120;top+=8){let edge=0;for(const l of lines){const lt=l.top-pr.top,lb=l.bottom-pr.top;if(lb>top&&lt<top+max)edge=Math.max(edge,l.right-pr.left)}const size=Math.min(max,right-edge-gap,pr.height-top-24);if(size>best.size+4)best={size,top}}
 Object.assign(el.style,best.size<150?{display:'none'}:{display:'',top:best.top+'px',left:(right-best.size)+'px',width:best.size+'px',height:best.size+'px'});
}
export function DitherSymbol({shape,avoid,className=''}:{shape:SymbolShape,avoid?:string,className?:string}){const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const el=ref.current;if(!el)return;const canvas=el.querySelector('canvas')!;const sc=SCENES[shape];
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false});if(!gl){el.style.display='none';return}
  const compile=(type:number,src:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))console.warn(gl.getShaderInfoLog(s));return s};
  const prog=gl.createProgram()!;gl.attachShader(prog,compile(gl.VERTEX_SHADER,VERT));gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,fragment(sc.glsl)));gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){el.style.display='none';return}
  gl.useProgram(prog);const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(prog,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const u=(name:string)=>gl.getUniformLocation(prog,name);
  sc.colors.forEach((ci,i)=>gl.uniform3fv(u('uC'+i),RGB[ci]));
  // The canvas overhangs the placement box (see CSS) so stray dots fade out in a circle, not a square.
  const OVER=1.4;let n=0,frame=0,last=0,time=Math.random()*30,visible=false,box=0,hover=0,target=0,mx=0,my=0;
  const build=()=>{box=el.clientWidth;if(!box)return;const cell=sc.cell??(box<300?6:7);n=Math.floor(box*OVER/cell);
   canvas.width=canvas.height=n*4;canvas.style.width=canvas.style.height=n*cell+'px';gl.viewport(0,0,n*4,n*4);draw()};
  const draw=()=>{if(!n)return;gl.uniform1f(u('uTime'),time);gl.uniform1f(u('uYaw'),sc.yaw(time));gl.uniform1f(u('uPitch'),sc.pitch(time));
   gl.uniform1f(u('uB'),sc.bound);gl.uniform1f(u('uE'),sc.bound*OVER*.86/(sc.zoom??1));gl.uniform1f(u('uN'),n);gl.uniform1f(u('uTick'),Math.floor(time*2.5));gl.uniform1f(u('uHover'),hover);gl.uniform2f(u('uMouse'),mx,my);
   gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,3)};
  const loop=(now:number)=>{frame=requestAnimationFrame(loop);if(!visible||document.hidden||now-last<33)return;const dt=last?Math.min(.1,(now-last)/1000):0;last=now;hover+=(target-hover)*Math.min(1,dt*5);if(motionOff()&&Math.abs(target-hover)<.01)return;time+=dt*(1+hover*1.8);draw()};
  // Pointer position in scene units; the scene reacts while the pointer is over its dots.
  const move=(e:PointerEvent)=>{if(!visible||!n)return;const r=canvas.getBoundingClientRect(),E=sc.bound*OVER*.86/(sc.zoom??1);
   mx=((e.clientX-r.left)/r.width*2-1)*E;my=-((e.clientY-r.top)/r.height*2-1)*E;target=Math.hypot(mx,my)<sc.bound*1.05?1:0};
  window.addEventListener('pointermove',move,{passive:true});
  const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;last=0});io.observe(el);
  const ro=new ResizeObserver(()=>{if(el.clientWidth!==box)build()});ro.observe(el);
  const place=()=>{if(avoid)placeBeside(el,avoid)};const pro=new ResizeObserver(place);if(avoid&&el.parentElement){pro.observe(el.parentElement);document.fonts?.ready.then(place)}
  place();build();frame=requestAnimationFrame(loop);
  return()=>{cancelAnimationFrame(frame);io.disconnect();ro.disconnect();pro.disconnect();window.removeEventListener('pointermove',move);gl.getExtension('WEBGL_lose_context')?.loseContext()};
 },[shape,avoid]);
 return <div ref={ref} className={'dither-symbol '+className} aria-hidden="true"><canvas/></div>;
}
