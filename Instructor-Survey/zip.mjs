// Small dependency-free reader/writer for the stored ZIP entries in our XLSX template.
const encoder=new TextEncoder(),decoder=new TextDecoder();
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
export const utf8=s=>encoder.encode(s);
export const decode=b=>decoder.decode(b);
export function crc32(b){let n=0xffffffff;for(const v of b)n=crcTable[(n^v)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
export function unzipStored(bytes){
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),files={};let p=0;
  while(p+30<=bytes.length&&v.getUint32(p,true)===0x04034b50){
    if(v.getUint16(p+8,true)!==0||(v.getUint16(p+6,true)&8))throw Error('قالب اکسل قابل خواندن نیست.');
    const size=v.getUint32(p+18,true),nameLen=v.getUint16(p+26,true),extra=v.getUint16(p+28,true),start=p+30+nameLen+extra;
    if(start+size>bytes.length)throw Error('قالب اکسل ناقص است.');
    files[decode(bytes.subarray(p+30,p+30+nameLen))]=bytes.slice(start,start+size);p=start+size;
  }
  if(!Object.keys(files).length)throw Error('قالب اکسل پیدا نشد.');return files;
}
export function zipStored(files){
  const chunks=[],central=[];let offset=0,centralLength=0;
  for(const [name,value] of Object.entries(files)){
    const nameBytes=utf8(name),data=typeof value==='string'?utf8(value):value,crc=crc32(data),header=new Uint8Array(30+nameBytes.length),h=new DataView(header.buffer);
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,0x5d5f,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,nameBytes.length,true);header.set(nameBytes,30);
    const c=new Uint8Array(46+nameBytes.length),d=new DataView(c.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,0x5d5f,true);d.setUint32(16,crc,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,nameBytes.length,true);d.setUint32(42,offset,true);c.set(nameBytes,46);
    chunks.push(header,data);central.push(c);offset+=header.length+data.length;centralLength+=c.length;
  }
  const end=new Uint8Array(22),e=new DataView(end.buffer),n=central.length;e.setUint32(0,0x06054b50,true);e.setUint16(8,n,true);e.setUint16(10,n,true);e.setUint32(12,centralLength,true);e.setUint32(16,offset,true);
  const all=[...chunks,...central,end],out=new Uint8Array(offset+centralLength+22);let pos=0;for(const b of all){out.set(b,pos);pos+=b.length;}return out;
}
