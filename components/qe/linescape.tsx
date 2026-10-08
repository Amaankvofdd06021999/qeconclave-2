'use client';
import {useEffect,useId,useMemo,useRef} from 'react';
// Isometric line plates in the style of a technical drawing: a fading grid floor, a wireframe
// dome (the HICC venue), blocks and cylinders, joined by dashed flight paths. Lines draw
// themselves in when the plate scrolls into view; dashed paths keep flowing and small signals in
// the brand colours travel along them.
type P=[number,number];
type Stroke={d:string,k:'draw'|'back'|'grid'|'dash',delay:number};
const UNIT=34;
const iso=(x:number,y:number,z=0):P=>[(x-y)*.866*UNIT,((x+y)*.5-z)*UNIT];
const path=(p:P[],close=false)=>p.map(([x,y],i)=>(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)).join('')+(close?'Z':'');
// Direction towards the viewer for this projection; surfaces facing it are drawn, the rest ghosted.
const VIEW=[1,1,1].map(v=>v/Math.sqrt(3));
const faces=(n:number[])=>n[0]*VIEW[0]+n[1]*VIEW[1]+n[2]*VIEW[2]>0;

// Split a sampled curve into runs that face the viewer and runs that do not.
function split(samples:{p:P,front:boolean}[],out:Stroke[],delay:number){let run:P[]=[samples[0].p],front=samples[0].front;
 for(let i=1;i<samples.length;i++){run.push(samples[i].p);if(samples[i].front!==front||i===samples.length-1){out.push({d:path(run),k:front?'draw':'back',delay});run=[samples[i].p];front=samples[i].front}}}
function dome(out:Stroke[],cx:number,cy:number,R:number){
 for(let lat=0;lat<90;lat+=15){const a=lat*Math.PI/180,r=R*Math.cos(a),z=R*Math.sin(a);
  split(Array.from({length:73},(_,i)=>{const t=i/72*Math.PI*2;return {p:iso(cx+r*Math.cos(t),cy+r*Math.sin(t),z),front:faces([Math.cos(a)*Math.cos(t),Math.cos(a)*Math.sin(t),Math.sin(a)])}}),out,.5+lat/150)}
 for(let lon=0;lon<360;lon+=20){const t=lon*Math.PI/180;
  split(Array.from({length:25},(_,i)=>{const a=i/24*Math.PI/2;return {p:iso(cx+R*Math.cos(a)*Math.cos(t),cy+R*Math.cos(a)*Math.sin(t),R*Math.sin(a)),front:faces([Math.cos(a)*Math.cos(t),Math.cos(a)*Math.sin(t),Math.sin(a)])}}),out,.9+lon/900)}
 const b=R*1.15;out.push({d:path([iso(cx-b,cy-b),iso(cx+b,cy-b),iso(cx+b,cy+b),iso(cx-b,cy+b)],true),k:'draw',delay:.4})}
// A block shows its top and its two near sides.
function box(out:Stroke[],x:number,y:number,z:number,w:number,d:number,h:number,delay:number){const c=(dx:number,dy:number,dz:number)=>iso(x+dx,y+dy,z+dz);
 out.push({d:path([c(0,0,h),c(w,0,h),c(w,d,h),c(0,d,h)],true)+path([c(w,0,h),c(w,0,0),c(w,d,0),c(0,d,0),c(0,d,h)])+path([c(w,d,h),c(w,d,0)]),k:'draw',delay})}
function cylinder(out:Stroke[],x:number,y:number,r:number,h:number,delay:number){const ring=(z:number,front:boolean)=>Array.from({length:49},(_,i)=>i/48*Math.PI*2).filter(t=>!front||Math.cos(t)+Math.sin(t)>=-.05).map(t=>iso(x+r*Math.cos(t),y+r*Math.sin(t),z));
 const s1=iso(x+r*Math.cos(Math.PI*.75),y+r*Math.sin(Math.PI*.75)),s2=iso(x+r*Math.cos(-Math.PI*.25),y+r*Math.sin(-Math.PI*.25));
 out.push({d:path(ring(h,false),true)+path(ring(0,true))+`M${s1[0]} ${s1[1]}l0 ${-h*UNIT}M${s2[0]} ${s2[1]}l0 ${-h*UNIT}`,k:'draw',delay})}
// Dashed selection frame with square handles, as if the object were picked in an editor.
function frame(out:Stroke[],x:number,y:number,s:number,delay:number){const q=[iso(x-s,y-s),iso(x+s,y-s),iso(x+s,y+s),iso(x-s,y+s)];out.push({d:path(q,true),k:'dash',delay});
 q.forEach(([px,py])=>out.push({d:`M${px-4} ${py}L${px} ${py-4}L${px+4} ${py}L${px} ${py+4}Z`,k:'draw',delay:delay+.3}))}

function build(withDome:boolean){const out:Stroke[]=[];
 for(let i=-10;i<=10;i++){out.push({d:path([iso(i,-10),iso(i,10)]),k:'grid',delay:Math.abs(i)*.02},{d:path([iso(-10,i),iso(10,i)]),k:'grid',delay:Math.abs(i)*.02})}
 if(withDome)dome(out,0,0,4);else{box(out,-1.6,-1.6,0,3.2,3.2,1.2,.5);box(out,-1,-1,1.2,2,2,1,.8);box(out,-.5,-.5,2.2,1,1,.9,1.1)}
 const floats:Stroke[]=[];box(floats,-8,-1.5,0,1.5,1.5,1.5,1.2);box(floats,-7.6,-1.1,1.5,.7,.7,.7,1.4);
 box(out,-5,6,0,.6,.6,.3,1.3);box(out,-4.2,6,0,.6,.6,.55,1.4);box(out,-3.4,6,0,.6,.6,.9,1.5);
 cylinder(out,7,-2.4,.45,1.4,1.3);cylinder(out,8.3,-1.3,.32,.8,1.4);
 box(out,6,2.4,0,1.6,1.6,.35,1.5);box(out,6,2.4,.35,1.6,1.6,.35,1.6);
 frame(out,4.6,5.6,1.2,1.6);cylinder(out,4.6,5.6,.75,.12,1.7);
 const a=iso(-9.5,1.5),b=iso(8.5,-7),arc=`M${a[0]} ${a[1]}C${a[0]+120} ${a[1]-420} ${b[0]-160} ${b[1]-380} ${b[0]} ${b[1]}`;
 const c=iso(-4.7,6.3,.3),e=iso(-4.6,2.6),link=`M${c[0]} ${c[1]}C${c[0]+40} ${c[1]-60} ${e[0]-60} ${e[1]+40} ${e[0]} ${e[1]}`;
 out.push({d:arc,k:'dash',delay:1.8},{d:link,k:'dash',delay:1.9},{d:'M-620 0L620 0',k:'dash',delay:.2});
 return {strokes:out,floats,signals:[arc,link,arc]};
}
const SIGNAL=['var(--qe-cyan)','var(--qe-yellow)','var(--qe-red)'];
export function LineScape({dome=true,fill=false,className=''}:{dome?:boolean,fill?:boolean,className?:string}){const ref=useRef<SVGSVGElement>(null);
 const plate=useMemo(()=>build(dome),[dome]),id=useId().replace(/:/g,'');
 useEffect(()=>{const svg=ref.current;if(!svg)return;
  const sync=()=>{if(document.documentElement.dataset.motion==='off')svg.pauseAnimations();else svg.unpauseAnimations()};
  const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){svg.classList.add('is-on');io.disconnect()}},{threshold:.25});io.observe(svg);
  sync();window.addEventListener('motionchange',sync);return()=>{io.disconnect();window.removeEventListener('motionchange',sync)};
 },[]);
 const line=(s:Stroke,i:number)=><path key={i} d={s.d} pathLength={s.k==='dash'?undefined:1} className={'ls-'+s.k} style={{'--d':s.delay.toFixed(2)+'s'} as React.CSSProperties}/>;
 return <svg ref={ref} className={'linescape '+className} viewBox="-620 -360 1240 720" preserveAspectRatio={fill?"xMidYMid slice":"xMidYMid meet"} aria-hidden="true" fill="none">
  <defs><radialGradient id={id+"f"}><stop offset=".35" stopColor="#fff"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient><mask id={id+"m"}><rect x="-620" y="-360" width="1240" height="720" fill={`url(#${id}f)`}/></mask></defs>
  <g mask={`url(#${id}m)`}>{plate.strokes.map(line)}<g className="ls-float">{plate.floats.map((s,i)=>line(s,1000+i))}</g>
   {plate.signals.map((d,i)=><circle key={i} r="3.5" fill={SIGNAL[i]} className="ls-signal"><animateMotion dur={`${7+i*2.5}s`} begin={`${2+i*1.7}s`} repeatCount="indefinite" path={d}/></circle>)}</g>
 </svg>;
}
