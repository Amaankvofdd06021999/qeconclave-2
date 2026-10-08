'use client';
import {useEffect,useState} from 'react';
import {LOADER_SEEN_KEY as SEEN} from './loader-boot';
// Burst mark traced from the official QE Conclave logo: cyan above, yellow left, red right.
const burstArms=[
 {key:'cyan',color:'var(--qe-cyan)',points:'354,50 273,0 208,148 131,0 54,58 207,205'},
 {key:'yellow',color:'var(--qe-yellow)',points:'199,217 8,165 1,262 141,248 54,380 144,420'},
 {key:'red',color:'var(--qe-red)',points:'222,217 413,165 420,262 280,248 367,380 277,420'},
];
export function Burst({className='',title}:{className?:string,title?:string}){return <svg className={'burst '+className} viewBox="0 0 421 421" role={title?'img':undefined} aria-hidden={title?undefined:true} aria-label={title}>{burstArms.map(a=><polygon key={a.key} className={'burst-arm burst-'+a.key} points={a.points} fill={a.color}/>)}</svg>}
// Lets page content (e.g. the hero text reveal) start as the loader's curtain lifts.
function markIntroDone(){document.documentElement.dataset.intro='done';window.dispatchEvent(new Event('qe:intro-done'))}
export function whenIntroDone(cb:()=>void){if(document.documentElement.dataset.intro==='done'){cb();return()=>{}}window.addEventListener('qe:intro-done',cb,{once:true});return()=>window.removeEventListener('qe:intro-done',cb)}
export function Loader(){
 const [state,setState]=useState<'run'|'leave'|'gone'>('run');
 useEffect(()=>{
  if(document.documentElement.classList.contains('qe-intro-seen')){markIntroDone();return} // already hidden by CSS
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start=performance.now();const min=reduced?300:1850;let leaveTimer=0,goneTimer=0,finished=false;
  const finish=()=>{if(finished)return;finished=true;const wait=Math.max(0,min-(performance.now()-start));leaveTimer=window.setTimeout(()=>{setState('leave');markIntroDone();try{sessionStorage.setItem(SEEN,'1')}catch{}goneTimer=window.setTimeout(()=>setState('gone'),reduced?250:900)},wait)};
  const cap=window.setTimeout(finish,3200);
  if(document.readyState==='complete')finish();else window.addEventListener('load',finish,{once:true});
  return()=>{window.removeEventListener('load',finish);clearTimeout(cap);clearTimeout(leaveTimer);clearTimeout(goneTimer)};
 },[]);
 if(state==='gone')return null;
 return <div className={'qe-loader'+(state==='leave'?' is-leaving':'')} role="status" aria-live="polite" aria-label="Loading QE Conclave 2026">
  <div className="qe-loader-mark"><Burst/></div>
  <div className="qe-loader-word" aria-hidden="true"><span>QE Conclave</span><small>11.12.2026 · Hyderabad</small></div>
  <div className="qe-loader-bar" aria-hidden="true"><i/><i/><i/></div>
 </div>;
}
