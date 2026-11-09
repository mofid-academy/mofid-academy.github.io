'use client';
import * as React from 'react';
import {CheckIcon,DownloadIcon} from 'lucide-react';
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from '@/components/ui/card';
import {ShinyButton} from '@/components/ui/shiny-button';
import {cn} from '@/lib/utils';

export interface QRCodeResult{data:string;size:number;output:string}
type QRCodeDisplayProps={data?:QRCodeResult|null;isLoading?:boolean;error?:string|null;title?:string;compact?:boolean;filename?:string};

export function QRCodeDisplay({data,isLoading=false,error,title='کد ورود مخاطب',compact=false,filename='qrcode.png'}:QRCodeDisplayProps){
 const [downloading,setDownloading]=React.useState(false),[downloaded,setDownloaded]=React.useState(false),[localError,setLocalError]=React.useState<string|null>(null);
 const generation=React.useRef(0);
 React.useEffect(()=>{generation.current++;setDownloaded(false);setDownloading(false);setLocalError(null);return()=>{generation.current++;};},[data?.data]);
 const handleDownload=async()=>{
  if(!data?.output||downloading)return;const current=generation.current;setDownloading(true);setLocalError(null);
  try{
   // This application creates PNGs locally; the QR URL never leaves the page.
   if(!data.output.startsWith('data:image/png;base64,'))throw Error('invalid_png');
   const bytes=Uint8Array.from(atob(data.output.slice(data.output.indexOf(',')+1)),c=>c.charCodeAt(0));
   const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
   const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
   if(current===generation.current){setDownloaded(true);setTimeout(()=>{if(current===generation.current)setDownloaded(false);},1600);}
  }catch{if(current===generation.current)setLocalError('دانلود انجام نشد؛ دوباره تلاش کنید.');}
  finally{if(current===generation.current)setDownloading(false);}
 };
 return <Card className={cn('qr-code-card',compact&&'qr-code-card-compact')}>
  {!compact&&<CardHeader><CardTitle>{title}</CardTitle><CardDescription dir="ltr">{data?.data||'QR مخصوص همین پنل'}</CardDescription></CardHeader>}
  <CardContent>
   {isLoading?<div className="qr-loading" role="status" aria-label="در حال آماده‌کردن QR"/>:error?<p className="qr-error" role="alert">{error}</p>:!data?<p className="qr-empty">پنل را انتخاب کنید تا QR آن آماده شود.</p>:<>
    <div className="qr-image-board"><img src={data.output} alt="کد QR ورود به همین پنل" width={data.size} height={data.size} decoding="async"/></div>
    {!compact&&<><p className="qr-card-note">با اسکن این کد وارد همین پنل شوید.</p><ShinyButton onClick={handleDownload} disabled={downloading} className="qr-download" aria-busy={downloading} aria-live="polite" aria-label={downloaded?'QR ذخیره شد':downloading?'در حال دانلود QR':'دانلود QR به صورت PNG'}>{downloaded?<CheckIcon aria-hidden="true"/>:<DownloadIcon aria-hidden="true"/>}<span>{downloaded?'ذخیره شد':downloading?'در حال دانلود…':'دانلود PNG'}</span></ShinyButton></>}
   </>}
   {!compact&&localError&&<p className="qr-error" role="alert">{localError}</p>}
  </CardContent>
 </Card>;
}
export default QRCodeDisplay;
