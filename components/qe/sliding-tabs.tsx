'use client';
import {useLayoutEffect,useRef} from 'react';
import {TabsList} from '@/components/ui/tabs';
// transitions.dev "Tabs sliding": JS writes the active tab's offset/size onto the pill, CSS owns the tween.
// Triggers need the `t-tab` class; Radix already sets aria-selected on the active one.
export function SlidingTabsList({value,variant,children}:{value:string,variant?:'default'|'line',children:React.ReactNode}){
 const list=useRef<HTMLDivElement>(null);const pill=useRef<HTMLSpanElement>(null);
 const moveTo=(animate:boolean)=>{
  const bar=list.current,p=pill.current;if(!bar||!p)return;
  const tabs=[...bar.querySelectorAll<HTMLElement>('.t-tab')];const tab=tabs.find(t=>t.getAttribute('aria-selected')==='true')||tabs[0];if(!tab)return;
  // Filters can wrap onto a second row, so carry the row offset as well as offsetLeft.
  const pos=`translate(${tab.offsetLeft}px, ${tab.offsetTop-tabs[0].offsetTop}px)`;
  if(!animate){const prev=p.style.transition;p.style.transition='none';p.style.transform=pos;p.style.width=`${tab.offsetWidth}px`;void p.offsetWidth;p.style.transition=prev}
  else{p.style.transform=pos;p.style.width=`${tab.offsetWidth}px`}
 };
 const move=useRef(moveTo);
 useLayoutEffect(()=>{move.current=moveTo});
 // First paint and resizes snap without a transition; the observer fires once on observe, which places the pill.
 useLayoutEffect(()=>{const bar=list.current;if(!bar)return;const ro=new ResizeObserver(()=>move.current(false));ro.observe(bar);return()=>ro.disconnect()},[]);
 const first=useRef(true);
 useLayoutEffect(()=>{if(first.current){first.current=false;return}move.current(true)},[value]);
 return <TabsList ref={list} variant={variant} className="t-tabs"><span ref={pill} className="t-tabs-pill" aria-hidden="true"/>{children}</TabsList>;
}
