'use client';
import React,{useEffect,useRef,useState} from 'react';
import {startVelaris} from '@/lib/velaris-runtime';

const colors=['#70d8ad','#129b75','#075b48','#071d17'] as const;
export default function Velaris({staticOnly=false}:{staticOnly?:boolean}){
 const container=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [generation,setGeneration]=useState(0);
 useEffect(()=>{const element=canvas.current;if(!element)return;const restore=()=>setGeneration(value=>value+1);element.addEventListener('webglcontextrestored',restore);return()=>element.removeEventListener('webglcontextrestored',restore);},[staticOnly]);
 useEffect(()=>{if(staticOnly||!canvas.current||!container.current)return;return startVelaris(canvas.current,container.current,{bg:'#04140f',colors,speed:.45,grain:.12});},[staticOnly,generation]);
 return <div ref={container} className="ambient-layer velaris-layer" data-background="velaris" aria-hidden="true">{!staticOnly&&<canvas ref={canvas} className="velaris-canvas" data-renderer="fallback" aria-hidden="true"/>}</div>;
}
