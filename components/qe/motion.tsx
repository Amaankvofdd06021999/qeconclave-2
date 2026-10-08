'use client';
import {useEffect} from 'react';
import {whenIntroDone} from './brand';
// Each section draws its highlight colour at random from the burst mark, never repeating its
// neighbour. Yellow is skipped on light sections where it would not read.
const accents=['var(--qe-cyan)','var(--qe-yellow)','var(--qe-red)'];
function assignAccents(){let prev='';document.querySelectorAll<HTMLElement>('main section, main .page-hero').forEach(el=>{const light=!!el.closest('.light-section');const pool=accents.filter(a=>a!==prev&&!(light&&a.includes('yellow')));const pick=pool[Math.floor(Math.random()*pool.length)];el.style.setProperty('--hl',pick);prev=pick})}
// Scatter the red and cyan pixel patches on each light section to new spots every page load.
function scatterPatches(){const r=(a:number,b:number)=>a+Math.random()*(b-a);document.querySelectorAll<HTMLElement>('.light-section').forEach(el=>{
 // Patches hug the left and right edges, away from the text column, so they never sit under copy.
 ['r1','r2','b1','b2'].forEach((k,i)=>{el.style.setProperty(`--${k}x`,(i%2?r(96,108):r(-8,4)).toFixed(1)+'%');el.style.setProperty(`--${k}y`,r(5,95).toFixed(1)+'%');el.style.setProperty(`--${k}s`,Math.round(r(280,460))+'px')})})}
// The pieces of a section that rise in turn: text blocks, buttons and links, images, and whole
// cards or rows (a card rises as one piece rather than in fragments). Decorative canvases and
// parallax images (which already move) are left alone.
const RISE='h1,h2,h3,h4,p,li,dt,dd,time,label,blockquote,address,img,video,.eyebrow,.button,.text-link,.tag,.tracks-name,[role=tablist],.t-acc-head,.schedule-top>span,.sponsor-tier-head,.sponsor-logo,.registration-date,.pass-price,.edition-banner>div:last-child,[data-rise]';
const ATOMIC='a,button,li,.tracks-panel,.all-partners>div,.archive-session,article,figure,.person-card,.faq-item,.timeline-stop,.timeline-head,.community-photo,.venue-image,.stats-bar>div,.join-meta,.section-end';
// Collapsed accordion panels are inert: skip them so hidden text never takes a turn in the queue.
const SKIP='.pixel-motif,.dither-symbol,.linescape,.word-reveal span,[inert]';
function riseUnits(sec:HTMLElement){const set=new Set<HTMLElement>();
 sec.querySelectorAll<HTMLElement>(RISE).forEach(el=>{if(el.closest(SKIP))return;let unit=el.classList.contains('parallax-img')?el.parentElement!:el;
  for(let a=unit.parentElement;a&&a!==sec;a=a.parentElement)if(a.matches(ATOMIC))unit=a;set.add(unit)});
 // Links and buttons stay their own beat even inside a paragraph, so they arrive after its text.
 const all=[...set];return all.filter(u=>u.matches('.text-link,.button')||!all.some(o=>o!==u&&o.contains(u)))}
// Sort by visual rows (tops within 24px count as one row), then left to right within a row.
function readingOrder(units:HTMLElement[]){const box=new Map(units.map(u=>[u,u.getBoundingClientRect()]));
 return [...units].sort((a,b)=>{const ra=box.get(a)!,rb=box.get(b)!;return Math.abs(ra.top-rb.top)<24?ra.left-rb.left:ra.top-rb.top})}
export function MotionSystem({path}:{path:string}){
 useEffect(()=>{assignAccents();scatterPatches()},[path]);
 // transitions.dev "Skeleton reveal" (image form): images still loading start soft (opacity 0,
 // 2px blur) and cross-blur in over 400ms once they arrive. Already-cached images are untouched.
 useEffect(()=>{document.querySelectorAll<HTMLImageElement>('main img').forEach(img=>{if(img.complete&&img.naturalWidth)return;img.classList.add('t-img','is-loading');const done=()=>img.classList.remove('is-loading');img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true})})},[path]);
 // transitions.dev "Card hover tilt" on speaker portraits. One delegated listener tracks the
 // pointer over the flat card link and leans the portrait inside toward it with a soft glare, so
 // cards re-rendered by search or filters keep working. Mouse only: touch scrolling is untouched.
 useEffect(()=>{const MAX=8;let wrap:HTMLElement|null=null,card:HTMLElement|null=null;
  const reset=()=>{if(!wrap||!card)return;wrap.classList.remove('is-hover');card.classList.remove('is-tilting');card.style.setProperty('--tilt-rx','0deg');card.style.setProperty('--tilt-ry','0deg');wrap=card=null};
  const move=(e:PointerEvent)=>{const next=e.pointerType==='mouse'?(e.target as Element|null)?.closest<HTMLElement>('.person-card')??null:null;if(next!==wrap)reset();
   if(!next||document.documentElement.dataset.motion==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   const portrait=next.querySelector<HTMLElement>('.portrait');if(!portrait)return;wrap=next;card=portrait;
   if(!card.classList.contains('t-tilt-card')){card.classList.add('t-tilt-card');const glare=document.createElement('span');glare.className='t-tilt-glare';glare.setAttribute('aria-hidden','true');card.appendChild(glare)}
   const r=wrap.getBoundingClientRect(),px=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),py=Math.min(1,Math.max(0,(e.clientY-r.top)/r.height));
   wrap.classList.add('is-hover');card.classList.add('is-tilting');card.style.setProperty('--tilt-ry',((px-.5)*MAX).toFixed(2)+'deg');card.style.setProperty('--tilt-rx',((.5-py)*MAX).toFixed(2)+'deg');card.style.setProperty('--tilt-gx',(px*100).toFixed(1)+'%');card.style.setProperty('--tilt-gy',(py*100).toFixed(1)+'%')};
  document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerleave',reset);return()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',reset);reset()}},[]);
 useEffect(()=>{let cleanup=()=>{};let cancelled=false;
 Promise.all([import('gsap'),import('gsap/ScrollTrigger'),import('gsap/CustomEase')]).then(([{gsap},{ScrollTrigger},{CustomEase}])=>{
 if(cancelled)return;gsap.registerPlugin(ScrollTrigger,CustomEase);
 // One long, soft deceleration curve (cubic-bezier .22,1,.36,1) for every entrance.
 const rise=CustomEase.create('qeRise','.22,1,.36,1');
 // Scroll triggers created after the loading intro live outside the GSAP context (adding them to
 // it from inside the nested matchMedia context links the two and recurses on revert), so they are
 // tracked here and killed alongside it.
 const late:ScrollTrigger[]=[],cancels:(()=>void)[]=[];
 const ctx=gsap.context(()=>{
 const mm=gsap.matchMedia();mm.add('(prefers-reduced-motion: no-preference)',()=>{
 // Element by element, in reading order: each piece rises (28px, sharpening from a 3px blur) as it
 // reaches the screen, joining a single queue so pieces never arrive together. Each starts 0.2s
 // after the one before; scrolling fast shrinks that gap and the duration so content keeps up with
 // the reader, and a backlog (a long row entering at once) tightens the gap the same way. A section label rides along with the heading beside it rather than taking a beat.
 // Every page: inner-page heroes join the queue too (label, headline, description, actions), so
 // each page opens with the same one-after-another entrance as the home hero.
 const sections=gsap.utils.toArray<HTMLElement>('main > :not(.hero):not(.tunnel-banner):not(.ticker)');
 let clock=0;
 const enter=(el:HTMLElement,velocity:number)=>{const now=gsap.ticker.time,backlog=Math.max(0,clock-now),fast=Math.min(1,velocity/2600),gap=.2*(1-fast*.8)/(1+backlog*4),start=Math.max(now,clock);
  if(!el.matches('.section-label'))clock=start+gap;
  gsap.to(el,{opacity:1,y:0,filter:'blur(0px)',clearProps:'filter',duration:1.5*(1-fast*.5),ease:rise,delay:start-now,overwrite:true})};
 sections.forEach(sec=>{const units=readingOrder(riseUnits(sec));if(!units.length)return;gsap.set(units,{opacity:0,y:28,filter:'blur(3px)'});
  // Triggers are created once the loading intro lifts, so nothing plays unseen behind it.
  cancels.push(whenIntroDone(()=>units.forEach(u=>late.push(ScrollTrigger.create({trigger:u,start:'top 92%',once:true,onEnter:st=>enter(u,Math.abs(st.getVelocity()))})))))});
 // Programme timeline: the rail fills with scroll and stops light up as it passes them.
 gsap.utils.toArray<HTMLElement>('.timeline-list').forEach(list=>{const rail=list.querySelector('.timeline-rail i');if(rail)gsap.fromTo(rail,{scaleY:0},{scaleY:1,ease:'none',scrollTrigger:{trigger:list,start:'top 65%',end:'bottom 65%',scrub:.4}});
  list.querySelectorAll<HTMLElement>('.timeline-stop').forEach(stop=>ScrollTrigger.create({trigger:stop,start:'top 65%',toggleClass:{targets:stop,className:'is-reached'}}))});
 gsap.utils.toArray<HTMLElement>('.reveal').filter(el=>!sections.some(sec=>sec===el||sec.contains(el))).forEach(el=>gsap.fromTo(el,{y:28,opacity:0},{y:0,opacity:1,duration:1.8,ease:rise,scrollTrigger:{trigger:el,start:'top 94%',once:true}}));
 gsap.utils.toArray<HTMLElement>('.parallax-img').forEach(el=>gsap.fromTo(el,{yPercent:-5},{yPercent:5,ease:'none',scrollTrigger:{trigger:el.parentElement,start:'top bottom',end:'bottom top',scrub:1.4}}));
 gsap.to('.scroll-progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.2}});
 gsap.utils.toArray<HTMLElement>('.word-reveal span').forEach((el,i)=>gsap.fromTo(el,{color:'#45484e'},{color:'#f1f3f5',scrollTrigger:{trigger:'.word-reveal',start:`top ${83-i*1.5}%`,end:`top ${55-i*1.5}%`,scrub:1}}));
 });
 });cleanup=()=>{cancels.forEach(c=>c());late.forEach(t=>t.kill());ctx.revert()};
 }).catch(()=>{});return()=>{cancelled=true;cleanup()};},[path]);return null;
}
