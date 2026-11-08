import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createPortal} from 'react-dom';
import {motion} from 'framer-motion';
import {Sun,Moon} from 'lucide-react';
import {AuroraBackground} from '@/components/ui/aurora-background';
import './aurora.css';
const key='mofid-academy-theme';
function App(){
 const [theme,setTheme]=useState(document.documentElement.dataset.theme==='light'?'light':'dark');
 useEffect(()=>{const root=document.documentElement;root.dataset.theme=theme;root.dataset.academyTheme=theme;root.classList.toggle('dark',theme==='dark');root.style.colorScheme=theme;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#071d17':'#f2faf5');try{localStorage.setItem(key,theme)}catch{}},[theme]);
 useEffect(()=>{const sync=(e:StorageEvent)=>{if(e.key===key&&(e.newValue==='dark'||e.newValue==='light'))setTheme(e.newValue);};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
 const target=document.querySelector('[data-theme-control]');
 return <><motion.div className="aurora-mount" aria-hidden="true" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.8}}><AuroraBackground><span/></AuroraBackground></motion.div><div className="aurora-vignette" aria-hidden="true"/>{target&&createPortal(<button type="button" className="theme-toggle" aria-label={theme==='dark'?'فعال کردن حالت روز':'فعال کردن حالت شب'} onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun aria-hidden="true"/>:<Moon aria-hidden="true"/>}<span>{theme==='dark'?'حالت روز':'حالت شب'}</span></button>,target)}</>;
}
const root=document.getElementById('auroraRoot');if(root)createRoot(root).render(<App/>);
