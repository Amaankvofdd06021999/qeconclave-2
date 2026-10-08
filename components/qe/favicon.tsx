'use client';
import {useEffect} from 'react';
// Animated favicon. Firefox animates the SVG favicon on its own (CSS spin inside favicon.svg);
// Chromium only paints an SVG favicon's first frame, so there the burst is redrawn on a small
// canvas and swapped in ~10 times a second — one turn every 16s, matching the navbar logo.
// Safari ignores favicon changes, so it keeps the static icon. Stops when motion is paused.
const ARMS:[string,number[]][]=[['#19bbe9',[354,50,273,0,208,148,131,0,54,58,207,205]],['#f2eb53',[199,217,8,165,1,262,141,248,54,380,144,420]],['#ef3a30',[222,217,413,165,420,262,280,248,367,380,277,420]]];
export function AnimatedFavicon(){
 useEffect(()=>{if(/Firefox\//.test(navigator.userAgent))return;
  const size=64,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const c=canvas.getContext('2d');if(!c)return;
  const link=document.createElement('link');link.rel='icon';link.type='image/png';link.id='qe-favicon-live';document.head.appendChild(link);
  const draw=(angle:number)=>{const k=size/481;c.clearRect(0,0,size,size);c.fillStyle='#0b0d10';c.beginPath();c.roundRect(0,0,size,size,96*k);c.fill();
   c.save();c.translate(size/2,size/2);c.rotate(angle);c.translate(-(210.5+30)*k,-(210+30)*k);
   for(const [fill,p] of ARMS){c.fillStyle=fill;c.beginPath();for(let i=0;i<p.length;i+=2){const x=(p[i]+30)*k,y=(p[i+1]+30)*k;if(i)c.lineTo(x,y);else c.moveTo(x,y)}c.closePath();c.fill()}
   c.restore();link.href=canvas.toDataURL('image/png')};
  const still=()=>document.documentElement.dataset.motion==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start=performance.now();draw(0);
  const timer=window.setInterval(()=>{if(!still())draw(((performance.now()-start)/16000)*Math.PI*2)},100);
  return()=>{clearInterval(timer);link.remove()};
 },[]);
 return null;
}
