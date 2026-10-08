'use client';
import {useEffect,useRef} from 'react';
import {whenIntroDone} from './brand';
// Event start, from the official 2026 logo lockup ("11 Dec 2026, 3–8 PM IST").
export const EVENT_START=new Date('2026-12-11T15:00:00+05:30');
export const motionReduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='off';
// Ease-out curve matching --ease-smooth-out: fast start, long settle.
const easeOut=(t:number)=>1-Math.pow(1-t,4);
export function countUp(to:number,duration:number,onFrame:(n:number)=>void){
 if(motionReduced()||to===0){onFrame(to);return()=>{}}
 let raf=0;const start=performance.now();
 const tick=(now:number)=>{const t=Math.min(1,(now-start)/duration);onFrame(Math.round(easeOut(t)*to));if(t<1)raf=requestAnimationFrame(tick)};
 raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
}
const fmt=(n:number,pad:number)=>n.toLocaleString('en-US').padStart(pad,'0');
// Counts from 0 to `value` the first time it scrolls into view (after the loading intro).
// The server renders the final value, so the number is correct without JavaScript.
export function CountUp({value,suffix='',pad=0,duration=1600}:{value:number,suffix?:string,pad?:number,duration?:number}){
 const ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{const el=ref.current;if(!el||motionReduced())return;
  const num=el.firstChild as Text;num.data=fmt(0,pad);let stop=()=>{};
  const io=new IntersectionObserver(([e])=>{if(!e.isIntersecting)return;io.disconnect();stop=countUp(value,duration,n=>{num.data=fmt(n,pad)})},{threshold:.6});
  const cancelIntro=whenIntroDone(()=>io.observe(el));
  return()=>{cancelIntro();io.disconnect();stop()};
 },[value,pad,duration]);
 return <span ref={ref} className="count-up">{fmt(value,pad)}{suffix&&<span aria-hidden="true">{suffix}</span>}</span>;
}
