import {PageHero} from '@/components/qe/shell';
import policy from '@/lib/privacy.json';
export const metadata={title:'Privacy policy'};
export default function Page(){return <main id="main"><PageHero label="QE Conclave / Privacy" title="Privacy policy."/><article className="wrap legal-content">{policy.map((p,i)=>p.tag.startsWith('h')?<h2 key={i}>{p.text}</h2>:<p className={p.tag==='li'?'legal-list-item':''} key={i}>{p.text}</p>)}</article></main>}
