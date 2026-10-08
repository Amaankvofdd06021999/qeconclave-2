'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle} from '@/components/ui/dialog';
// Editorial photo gallery: a mosaic whose tiles follow a repeating seven-photo rhythm (one hero
// frame, then smaller pairs and threes), and a full-screen viewer with previous/next, arrow keys,
// a counter and a thumbnail strip.
const RHYTHM=['g-hero','g-tall','g-sq','g-sq','g-sq','g-wide','g-wide'];
export function Gallery({images,label,initial=14}:{images:string[],label:string,initial?:number}){
 const [all,setAll]=useState(false);const [at,setAt]=useState<number|null>(null);const strip=useRef<HTMLDivElement>(null);
 const shown=all?images:images.slice(0,initial),open=at!==null,step=(d:number)=>setAt(i=>i===null?i:(i+d+images.length)%images.length);
 useEffect(()=>{if(!open)return;const key=(e:KeyboardEvent)=>{if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)});
 useEffect(()=>{strip.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'})},[at]);
 const alt=(i:number)=>`${label} · photo ${i+1} of ${images.length}`;
 return <>
  <div className="gallery">{shown.map((src,i)=><button key={src} className={'gallery-tile '+RHYTHM[i%RHYTHM.length]} onClick={()=>setAt(i)} aria-label={'Open '+alt(i)}>
   <img src={src} alt={alt(i)} loading="lazy"/><span className="gallery-index" aria-hidden="true">{String(i+1).padStart(2,'0')}</span></button>)}</div>
  {images.length>shown.length&&<button className="button gallery-more" onClick={()=>setAll(true)}>Show all {images.length} photos</button>}
  <Dialog open={open} onOpenChange={o=>{if(!o)setAt(null)}}><DialogContent className="gallery-viewer">
   <DialogTitle className="gallery-count"><span>{String((at??0)+1).padStart(2,'0')}</span> / {String(images.length).padStart(2,'0')} · {label}</DialogTitle>
   {open&&<div className="gallery-stage"><img key={at} src={images[at!]} alt={alt(at!)}/>
    <button className="gallery-nav prev" onClick={()=>step(-1)} aria-label="Previous photo"><ArrowLeft size={18}/></button>
    <button className="gallery-nav next" onClick={()=>step(1)} aria-label="Next photo"><ArrowRight size={18}/></button></div>}
   <div className="gallery-strip" ref={strip}>{images.map((src,i)=><button key={src} aria-current={i===at} onClick={()=>setAt(i)} aria-label={'Show photo '+(i+1)}><img src={src} alt="" loading="lazy"/></button>)}</div>
  </DialogContent></Dialog>
 </>;
}
