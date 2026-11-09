import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import QRCodeDisplay from '@/components/ui/qr-code-generator';
import {createQRCodeResult} from '@/lib/qr-code';
import './aurora.css';

const read=(element:HTMLElement)=>({url:element.dataset.qrUrl||'',title:element.dataset.qrTitle||'کد ورود مخاطب',compact:element.dataset.qrCompact==='true'});
function QRMount({element}:{element:HTMLElement}){
 const [packet,setPacket]=useState(()=>read(element));
 useEffect(()=>{const update=()=>{const value=read(element);setPacket(previous=>previous.url===value.url&&previous.title===value.title&&previous.compact===value.compact?previous:value);};element.addEventListener('mofid:qr-update',update);update();return()=>element.removeEventListener('mofid:qr-update',update);},[element]);
 const result=useMemo(()=>{if(!packet.url)return {data:null,error:null};try{return {data:createQRCodeResult(packet.url),error:null};}catch(error){return {data:null,error:error instanceof Error?error.message:'تصویر QR آماده نشد.'};}},[packet.url]);
 const id=packet.url?new URL(packet.url,location.href).searchParams.get('class')||'main':'main';
 return <QRCodeDisplay data={result.data} error={result.error} title={packet.title} compact={packet.compact} filename={'panel-qr-'+id+'.png'}/>;
}
for(const element of document.querySelectorAll<HTMLElement>('[data-qr-card]')){
 element.dataset.qrEnhanced='true';createRoot(element).render(<QRMount element={element}/>);
 if(element.id==='classQr'){const fallback=document.getElementById('downloadClassQr');if(fallback)fallback.hidden=true;}
}
