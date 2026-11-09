import type {QRCodeResult} from '@/components/ui/qr-code-generator';
type QRMatrix={addData(value:string):void;make():void;getModuleCount():number;isDark(row:number,column:number):boolean};
declare global{interface Window{qrcode?:(type:number,level:string)=>QRMatrix}}

export function createQRCodeResult(url:string,requestedSize=960):QRCodeResult{
 if(!window.qrcode)throw Error('QR در دسترس نیست؛ صفحه را دوباره باز کنید.');
 const qr=window.qrcode(0,'M');qr.addData(url);qr.make();
 const count=qr.getModuleCount(),quiet=4,scale=Math.max(1,Math.floor(requestedSize/(count+quiet*2))),size=(count+quiet*2)*scale;
 const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('تصویر QR آماده نشد.');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);ctx.fillStyle='#052c25';
 for(let row=0;row<count;row++)for(let column=0;column<count;column++)if(qr.isDark(row,column))ctx.fillRect((column+quiet)*scale,(row+quiet)*scale,scale,scale);
 return {data:url,size,output:canvas.toDataURL('image/png')};
}
