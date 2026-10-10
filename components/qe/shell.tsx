'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Menu, Pause, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MotionSystem } from './motion';
import { Loader } from './brand';
import { PixelWordmark, PixelMotif, DitherSymbol, type SymbolShape } from './pixels';
import { LineScape } from './linescape';
import { QELogo } from './logo';
import { AnimatedFavicon } from './favicon';
const nav=[['About','/about'],['Speakers','/speakers'],['Schedule','/schedule'],['Partners','/partners'],['Past editions','/editions']];
export function Mark(){return <span className="brand"><QELogo className="brand-svg"/></span>}
const REDUCED='(prefers-reduced-motion: reduce)';
function subscribeReducedMotion(cb:()=>void){const mq=matchMedia(REDUCED);mq.addEventListener('change',cb);return()=>mq.removeEventListener('change',cb)}
export function SiteShell({children}:{children:React.ReactNode}){
 const path=usePathname(); const [open,setOpen]=useState(false);const [navPath,setNavPath]=useState(path);
 // Close the mobile menu when the route changes (adjusting state during render, not in an effect).
 if(navPath!==path){setNavPath(path);setOpen(false)}
 useEffect(()=>{if(!window.location.hash)window.scrollTo(0,0);},[path]);
 // Motion follows the OS reduced-motion setting until the visitor uses the pause toggle.
 const prefersReduced=useSyncExternalStore(subscribeReducedMotion,()=>matchMedia(REDUCED).matches,()=>false);
 const [override,setOverride]=useState<boolean|null>(null);const paused=override??prefersReduced;const setPaused=(v:boolean)=>setOverride(v);
 useEffect(()=>{document.documentElement.dataset.motion=paused?'off':'on';window.dispatchEvent(new Event('motionchange'));},[paused]);
 return <><AnimatedFavicon/><Loader/><a className="skip-link" href="#main">Skip to content</a><header className="site-header"><Link href="/" aria-label="QE Conclave home"><Mark/></Link><nav className="desktop-nav" aria-label="Main navigation">{nav.map(([label,url])=><Link key={url} className={path===url?'active':''} href={url}>{label}</Link>)}</nav><div className="header-actions"><Link className="button small light" href="/register">Register free</Link><Dialog open={open} onOpenChange={setOpen}><DialogTrigger className="menu-trigger" aria-label="Open navigation"><Menu size={22}/></DialogTrigger><DialogContent className="nav-dialog"><DialogTitle className="eyebrow">Explore QE Conclave</DialogTitle><nav aria-label="Mobile navigation">{nav.map(([label,url])=><Link key={url} href={url}>{label}</Link>)}<Link href="/register">Register free</Link></nav></DialogContent></Dialog></div></header><div className="scroll-progress"/><MotionSystem path={path}/>{children}<footer className="site-footer"><div className="footer-top"><Link href="/" aria-label="QE Conclave home"><img className="footer-logo" src="/media/qe-logo-light.webp" alt="QE Conclave · Hyderabad · 11 Dec 2026" width={803} height={181} loading="lazy"/></Link><p>Engineering confidence.<br/>Together.</p><div><span className="eyebrow">11 December 2026</span><p>HICC, Hyderabad<br/>India</p></div></div><div className="footer-links"><div>{nav.map(([label,url])=><Link key={url} href={url}>{label}</Link>)}</div><div><a href="https://www.linkedin.com/company/qe-conclave/" target="_blank" rel="noreferrer">LinkedIn</a><a href="https://www.instagram.com/qeconclave/" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.youtube.com/channel/UC7HgCxzvHx_PPGeUcD7URRw" target="_blank" rel="noreferrer">YouTube</a></div></div><div className="footer-bottom"><span>© 2026 QE Conclave</span><Link href="/privacy-policy">Privacy policy</Link><button onClick={()=>setPaused(!paused)} aria-pressed={paused}>{paused?'Enable':'Pause'} motion {paused?<Play size={11} aria-hidden="true"/>:<Pause size={11} aria-hidden="true"/>}</button><span className="footer-note">Quality is everyone’s future.</span></div><PixelWordmark text="Quality, unbound."/></footer></>;
}
export function Label({children,number}:{children:React.ReactNode,number?:string}){return <div className="eyebrow section-label">{number&&<span>{number} / </span>}{children}</div>}
export function SectionHead({label,title,text,number}:{label:string,title:React.ReactNode,text?:string,number?:string}){return <div className="section-heading reveal"><Label number={number}>{label}</Label><div><h2>{title}</h2>{text&&<p className="intro-copy">{text}</p>}</div></div>}
// One scene per page: a hand holding a world for the community, a robot for speakers, an arm at work
// for the programme, a drone for partners, and so on.
const heroSymbols:[string,SymbolShape][]=[['/about','hand'],['/speakers','robot'],['/schedule','arm'],['/partner','drone'],['/editions','planet'],['/register','chip'],['/speak','atom']];
function heroSymbol(path:string):SymbolShape{return heroSymbols.find(([p])=>path.startsWith(p))?.[1]??'gyro'}
export function PageHero({label,title,description,children}:{label:string,title:React.ReactNode,description?:string,children?:React.ReactNode}){return <section className="page-hero wrap"><DitherSymbol shape={heroSymbol(usePathname())} avoid="h1, .page-hero-bottom > *"/><Label>{label}</Label><h1 className="reveal">{title}</h1><div className="page-hero-bottom">{description&&<p>{description}</p>}{children}</div></section>}
export function JoinCTA(){return <section className="join-cta wrap reveal"><PixelMotif/><LineScape dome={false} fill className="join-scape"/><Label>Be in the room</Label><div><h2>The next chapter<br/>starts with you.</h2><div className="join-meta"><span>11.12.2026 · Hyderabad</span><Link href="/register" className="button light">Register for free</Link></div></div></section>}
export function FAQ(){const [expanded,setExpanded]=useState<number|null>(0);const items=[['When and where is QE Conclave 2026?','Friday, 11 December 2026 at Hyderabad International Convention Centre (HICC), Hyderabad, India.'],['Is registration free?','Yes. QE Conclave is free to attend in person. Registration is required, and your place is subject to confirmation by the event team.'],['Who is the event for?','Enterprise executives, QE leaders, architects, engineers and practitioners working across Quality Engineering, testing, AI assurance and autonomous systems.'],['Can I apply to speak or become a partner?','Yes. Speaker proposals and partnership enquiries are open. Use the Become a speaker or Become a partner pages to send your details.']];return <div className="faq-list">{items.map(([q,a],i)=>{const open=expanded===i;return <div key={q} className="faq-item t-acc" data-open={String(open)}><button className="t-acc-head" aria-expanded={open} aria-controls={'faq-'+i} onClick={()=>setExpanded(open?null:i)}>{q}<span className="t-acc-chevron" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M4 6.5L8 10.5L12 6.5"/></svg></span></button><div className="t-acc-panel" id={'faq-'+i} role="region" inert={!open}><div className="t-acc-panel-inner"><p>{a}</p></div></div></div>})}</div>}
