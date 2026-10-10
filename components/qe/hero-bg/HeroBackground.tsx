'use client';
import {useEffect,useRef} from 'react';
import type {ForwardRefExoticComponent,RefAttributes} from 'react';
import QEBackgroundJS from './QEBackground';
// Home hero background: the "columns" style from qe-backgrounds.js — quantized vertical light bars lit
// by a drifting source that follows the pointer; a click sends light up a bar. It pauses off-screen
// and in hidden tabs, shows a still frame for reduced motion, and follows the footer pause switch.
type BgApi={pause:()=>void,play:()=>void,refresh:()=>void};
// The supplied wrapper is plain JSX; describe its props for TypeScript.
const QEBackground=QEBackgroundJS as unknown as ForwardRefExoticComponent<{variant:string}&RefAttributes<BgApi>>;
export function HeroBackground(){const api=useRef<BgApi|null>(null);
 useEffect(()=>{const sync=()=>{if(document.documentElement.dataset.motion==='off')api.current?.pause();else api.current?.play()};sync();window.addEventListener('motionchange',sync);return()=>window.removeEventListener('motionchange',sync)},[]);
 return <QEBackground ref={api} variant="columns"/>;
}
