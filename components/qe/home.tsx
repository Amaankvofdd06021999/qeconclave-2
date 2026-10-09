'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {whenIntroDone} from './brand';
import {CountUp,countUp,EVENT_START,motionReduced} from './count-up';
import {Plus} from 'lucide-react';
import {FluidField} from './fluid-field';
import {PixelMotif,DitherSymbol} from './pixels';
import {SectionHead,Label,JoinCTA,FAQ} from './shell';
import {VideoButton,MotionVideo} from './media';
import {tracks} from './data';
import {SponsorTiers,PastPartnerMarquee} from './sponsors';
import content from '@/lib/content.json';
import {LearnArrow} from './learn-arrow';
// Days / hours / minutes to the event start. Counts up on reveal, then each unit replays the
// transitions.dev "Number pop-in" whenever its value changes.
const units=[['d','days'],['h','hrs'],['m','min']] as const;
function remaining(){const ms=Math.max(0,EVENT_START.getTime()-Date.now());const mins=Math.floor(ms/60000);return {d:Math.floor(mins/1440),h:Math.floor(mins/60)%24,m:mins%60}}
function writeDigits(group:HTMLElement,text:string,pop:boolean){
 if(group.dataset.value===text)return;group.dataset.value=text;
 group.classList.remove('is-animating');
 group.replaceChildren(...[...text].map((ch,i)=>{const d=document.createElement('span');d.className='t-digit';d.textContent=ch;if(i)d.dataset.stagger=String(Math.min(i,2));return d}));
 if(pop){void group.offsetWidth;group.classList.add('is-animating')}
}
function Countdown({seq}:{seq?:number}){const ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{const root=ref.current;if(!root)return;
  const groups=Object.fromEntries(units.map(([k])=>[k,root.querySelector<HTMLElement>(`[data-unit="${k}"]`)!])) as Record<'d'|'h'|'m',HTMLElement>;
  const label=(r:ReturnType<typeof remaining>)=>{const n=(v:number,w:string)=>`${v} ${w}${v===1?'':'s'}`;root.setAttribute('aria-label',`${n(r.d,'day')}, ${n(r.h,'hour')} and ${n(r.m,'minute')} to go`)};
  const show=(r:ReturnType<typeof remaining>,pop:boolean)=>{units.forEach(([k])=>writeDigits(groups[k],String(r[k]).padStart(2,'0'),pop));label(r)};
  let timer=0,stop=()=>{};
  const tick=()=>show(remaining(),!motionReduced());
  show({d:0,h:0,m:0},false);
  const cancelIntro=whenIntroDone(()=>{const r=remaining();
   stop=countUp(1000,1400,n=>show({d:Math.round(r.d*n/1000),h:Math.round(r.h*n/1000),m:Math.round(r.m*n/1000)},false));
   window.setTimeout(()=>{tick();timer=window.setInterval(tick,1000)},motionReduced()?0:1450);
  });
  return()=>{cancelIntro();stop();clearInterval(timer)};
 },[]);
 return <span className={"countdown"+(seq!==undefined?" hero-seq":"")} style={seq!==undefined?{"--i":seq} as React.CSSProperties:undefined} ref={ref} role="timer" aria-label="Time to go">{units.map(([k,l])=><span className="countdown-unit" key={k}><span className="t-digit-group" data-unit={k}>--</span><small>{l}</small></span>)}</span>}
// The whole afternoon on one rail. The rail fills as you scroll (motion.tsx) and each stop lights
// up in its track's colour as the rail reaches it.
const clock=(t:string)=>{const [h,m]=t.split(':').map(Number);return <>{h%12||12}:{String(m).padStart(2,'0')}<small>{h<12?'AM':'PM'}</small></>};
function ProgrammeTimeline(){return <div className="timeline">
 <div className="timeline-head"><span className="eyebrow">Friday, 11 December · 3–8 PM IST</span><span>Programme preview · Subject to confirmation</span></div>
 <ol className="timeline-list"><span className="timeline-rail" aria-hidden="true"><i/></span>
  {content.sessions.map(s=><li key={s.start} className={'timeline-stop'+(s.track==='break'?' is-break':'')} data-track={s.track}>
   <time dateTime={`2026-12-11T${s.start}+05:30`}>{clock(s.start)}</time><span className="timeline-node" aria-hidden="true"/>
   <div className="timeline-body"><h3>{s.title}</h3>{s.speaker&&<p>{s.speaker}</p>}</div><span className="tag">{s.label}</span></li>)}
 </ol></div>}
// The five tracks, laid out for reading: a two-tone heading and short intro, then a numbered
// list that opens one track at a time. The panel on the left mirrors whichever track is open,
// crossfading between the abstract gradient images (track-1…5, reused in turn if tracks outnumber them).
function TracksSection(){const [open,setOpen]=useState(0);const t=tracks[open];
 return <section className="light-section section wrap tracks-section">
  <div className="tracks-panel" aria-hidden="true">{tracks.map((_,i)=><img key={i} src={`/media/track-${i%5+1}.jpg`} alt="" className={i===open?'is-active':''} loading={i?'lazy':undefined}/>)}
   <div className="tracks-panel-copy" key={open}><span className="eyebrow">{t.number} / {String(tracks.length).padStart(2,'0')}</span><strong>{t.name}</strong><span className="tracks-panel-tags">{t.tags.join(' · ')}</span></div></div>
  <div className="tracks-copy"><Label number="02">The conversations</Label>
   <h2 className="two-tone">A new intelligence.<span>A higher standard.</span></h2>
   <p className="tracks-intro">Five tracks follow quality from the code you ship to the AI that ships it. Each one pairs leaders with practitioners, so every idea arrives with the evidence behind it.</p>
   <div className="tracks-accordion">{tracks.map((tr,i)=>{const on=open===i;return <div key={tr.number} className="tracks-row" data-open={on}>
    <button aria-expanded={on} aria-controls={'track-panel-'+i} onClick={()=>setOpen(i)}><span className="tracks-num">{tr.number}</span><span className="tracks-name">{tr.short}</span><span className="tracks-toggle" aria-hidden="true"/></button>
    <div className="tracks-detail" id={'track-panel-'+i} role="region" inert={!on}><div><p><strong>{tr.name}.</strong> {tr.description}</p><Link className="text-link" href={'/about#track-'+tr.number}>Explore the track<LearnArrow/></Link></div></div></div>})}</div>
  </div></section>}
// Brand-yellow ticker between sections. The line repeats so the loop is seamless; screen readers
// get it once.
const TICKER=['QE Conclave 2026','Engineering Confidence Across Code, AI & Autonomous Systems',"India's Largest Quality Engineering Conference"];
function Ticker(){const run=(hidden:boolean)=><div className="ticker-run" aria-hidden={hidden||undefined}>{TICKER.map(t=><span key={t}>{t}<i aria-hidden="true">|</i></span>)}</div>;
 return <aside className="ticker" aria-label={TICKER.join('. ')}><div className="ticker-track">{run(false)}{run(true)}</div></aside>}
export function HomePage(){const hero=useRef<HTMLElement>(null);
 // transitions.dev "Texts reveal": stagger the hero copy in once the loading intro hands over.
 useEffect(()=>whenIntroDone(()=>{const block=hero.current;if(!block)return;block.classList.remove('is-hiding','is-shown');void block.offsetHeight;block.classList.add('is-shown')}),[]);
 return <main id="main">
<section className="hero wrap t-stagger" ref={hero}><FluidField/><div className="hero-top hero-seq" style={{"--i":0} as React.CSSProperties}><span className="eyebrow">India’s largest quality engineering conference</span><span className="eyebrow hero-edition">Edition 04 <span className="tiny-cross">+</span></span></div><div className="hero-title"><h1><span className="t-stagger-line hero-seq" style={{"--i":1} as React.CSSProperties}>Quality,</span><span className="t-stagger-line hero-seq" style={{"--i":2} as React.CSSProperties}>unbound<span className="period">.</span></span></h1><div className="hero-coordinate hero-seq" style={{"--i":2} as React.CSSProperties} aria-hidden="true">17.4726° N<br/>78.3725° E</div></div><div className="hero-bottom"><div className="hero-date"><span className="eyebrow hero-seq" style={{"--i":3} as React.CSSProperties}>11 December 2026</span><p className="hero-seq" style={{"--i":3} as React.CSSProperties}>HICC, Hyderabad</p><Countdown seq={4}/></div><div className="hero-message"><p className="t-stagger-line hero-seq" style={{"--i":5} as React.CSSProperties}>Engineering confidence across<br/>code, AI & autonomous systems.</p><div className="hero-buttons"><span className="hero-seq" style={{"--i":6} as React.CSSProperties}><Link className="button light" href="/register">Register free</Link></span><span className="hero-seq" style={{"--i":7} as React.CSSProperties}><VideoButton src="/media/qe-intro.mp4" poster="/media/qe-intro-poster.webp" className="button ghost"/></span></div></div></div><div className="hero-foot hero-seq" style={{"--i":8} as React.CSSProperties}><span className="hero-interaction">Move through the field. Find your signal.</span><span>QE / 2026</span></div></section>
<section className="stats-bar wrap" aria-label="Event at a glance">{([[1500,'+','Attendees',0],[20,'+','Speakers',0],[700,'+','Companies represented',0],[4,'','Editions of possibility',2]] as const).map(([n,suffix,l,pad])=><div key={l}><span><CountUp value={n} suffix={suffix} pad={pad}/></span><p>{l}</p></div>)}</section>
<section className="section wrap intro-section" id="stats"><PixelMotif/><Label number="01">The gathering</Label><div className="intro-main"><h2 className="word-reveal">{'When brilliant minds meet, quality moves forward.'.split(' ').map((word,i)=><span key={i}>{word} </span>)}</h2><div className="intro-bottom"><p>QE Conclave brings together Quality Engineering’s brilliant minds, powerful voices, and industry-shaping conversations in Hyderabad, India’s vibrant hub of technological innovation.</p><p>A culture of quality.<br/>A community of excellence.<br/><Link className="text-link" href="/about">Discover the conclave<LearnArrow/></Link></p></div></div></section>
<TracksSection/>
<section className="light-section section wrap people-section" id="speakers"><SectionHead number="03" label="The people" title={<>Big ideas.<br/>Remarkable minds.</>} text="A community shaped by the leaders, builders and practitioners who have taken our stage."/><div className="people-grid">{[content.alumni[0],content.alumni[1],content.alumni[2],content.alumni[5]].map((a,i)=><Link href="/speakers" className="person-card reveal" key={a.name}><div className="portrait"><img src={a.image} alt={a.name} loading="lazy"/><span className="portrait-index">0{i+1}</span><span className="portrait-plus"><Plus size={18}/></span></div><h3>{a.name}</h3><p>QE Conclave {a.edition} · Past speaker</p></Link>)}</div><div className="people-footer"><p>The 2026 speaker announcements are ahead.<br/>Have a perspective that belongs on this stage?</p><div><Link href="/speakers" className="text-link">Meet our speaker community<LearnArrow/></Link><Link href="/speak" className="button dark">Become a speaker</Link></div></div></section>

<Ticker/>
<section className="light-section section wrap agenda-preview" id="agenda"><SectionHead number="04" label="The programme" title={<>One day.<br/>New perspectives.</>} text="Keynotes, real-world case studies, hands-on learning, and the conversations that stay with you."/><ProgrammeTimeline/><div className="section-end"><Link href="/schedule" className="button dark">Explore the programme</Link><span>All times shown in India Standard Time</span></div></section>
<section className="section wrap community-section"><SectionHead number="05" label="Beyond the stage" title={<>You come for the ideas.<br/>You stay for the people.</>}/><div className="community-collage"><div className="community-photo large"><img className="parallax-img" src="/media/event-0.webp" alt="The QE Conclave community gathered at the event" loading="lazy"/><span className="image-caption">Conversations that move an industry.</span></div><div className="community-photo small"><img className="parallax-img" src="/media/dsc04803.webp" alt="Quality engineering leaders exchanging ideas" loading="lazy"/></div><div className="community-note"><span className="eyebrow">Shared curiosity. Real connection.</span><p>From the first conversation<br/>to the last breakthrough.</p><Link className="text-link" href="/editions">Explore past editions<LearnArrow/></Link></div></div></section>
<section className="light-section section wrap sponsors-section" id="sponsors"><SectionHead label="2026 partners" title={<>Backed by the leaders<br/>of quality engineering.</>} text="The organisations making QE Conclave 2026 possible. Partner slots are open across every tier."/><SponsorTiers/><div className="past-partners-row"><span className="eyebrow">Past partners</span><PastPartnerMarquee/></div><div className="section-end"><Link href="/partner" className="button dark">Become a partner</Link><Link href="/partners" className="text-link">Explore partnership options<LearnArrow/></Link></div></section>
<section className="tunnel-banner"><MotionVideo/><div className="tunnel-overlay"/><div className="wrap tunnel-content"><Label>11.12.2026 / HICC, Hyderabad</Label><h2>The future of quality<br/>is a shared pursuit.</h2><div className="tunnel-actions"><Link href="/register" className="button light">Be part of it</Link><VideoButton src="/media/qe-intro.mp4" poster="/media/qe-intro-poster.webp" label="Watch 2025 highlights" className="button ghost"/></div></div></section>
<section className="section wrap venue-section"><div className="venue-image"><img src="/media/hicc-1-entrance.webp" alt="Hyderabad International Convention Centre entrance" loading="lazy"/></div><div className="venue-copy"><Label number="06">The meeting place</Label><h2>All roads lead<br/>to Hyderabad.</h2><p>Hyderabad International Convention Centre</p><address>Novotel Hotel Road, Izzathnagar, Shilpa Hills,<br/>Kothaguda, Hyderabad, Telangana 500084</address><a className="text-link" href="https://maps.google.com/?q=Hyderabad+International+Convention+Centre" target="_blank" rel="noreferrer">Plan your visit<LearnArrow/></a></div></section>
<section className="section wrap faq-section"><DitherSymbol shape="chip"/><SectionHead label="Good to know" title="A few answers."/><FAQ/></section><JoinCTA/>
</main>}
