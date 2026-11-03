import {createHash,createHmac} from 'node:crypto';

const sha=v=>createHash('sha256').update(v).digest('hex');
const hmac=(key,v)=>createHmac('sha256',key).update(v).digest();
const encode=v=>encodeURIComponent(v).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
export function objectKey(value){
  if(typeof value!=='string'||!value||value.length>1024||/[\x00-\x1f\x7f\\]/.test(value)||value.startsWith('/')||value.split('/').some(p=>p==='.'||p==='..'))throw Error('INVALID_OBJECT_KEY');
  return value;
}
export function storageConfig(input){
  const endpoint=new URL(input.endpoint);
  if(endpoint.protocol!=='https:'||!/^s3\.[a-z0-9-]+\.arvanstorage\.ir$/.test(endpoint.hostname)||endpoint.port||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||!['','/'].includes(endpoint.pathname))throw Error('INVALID_STORAGE_ENDPOINT');
  if(!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(input.bucket||'')||!/^[a-z0-9-]{1,50}$/.test(input.region||''))throw Error('INVALID_STORAGE_CONFIG');
  if(typeof input.accessKey!=='string'||input.accessKey.length<8||input.accessKey.length>256||typeof input.secretKey!=='string'||input.secretKey.length<16||input.secretKey.length>512)throw Error('INVALID_STORAGE_CREDENTIALS');
  return {endpoint:endpoint.origin,bucket:input.bucket,region:input.region,accessKey:input.accessKey,secretKey:input.secretKey};
}
export function signedURL(config,{method='GET',key='',query={},expires=900,now=new Date(),headers={}}={}){
  config=storageConfig(config);if(key)objectKey(key);
  const date=now.toISOString().replace(/[:-]|\.\d{3}/g,''),day=date.slice(0,8),scope=day+'/'+config.region+'/s3/aws4_request';
  const host=new URL(config.endpoint).host;
  const path='/'+encode(config.bucket)+(key?'/'+key.split('/').map(encode).join('/'):'');
  const signedHeaders={host,...Object.fromEntries(Object.entries(headers).map(([k,v])=>[k.toLowerCase(),String(v).trim().replace(/\s+/g,' ')]))};
  const names=Object.keys(signedHeaders).sort(),headerList=names.join(';');
  const params={...query,'X-Amz-Algorithm':'AWS4-HMAC-SHA256','X-Amz-Credential':config.accessKey+'/'+scope,'X-Amz-Date':date,'X-Amz-Expires':String(Math.max(1,Math.min(3600,expires))),'X-Amz-SignedHeaders':headerList};
  const qs=Object.entries(params).map(([k,v])=>[encode(k),encode(String(v))]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:a[1]<b[1]?-1:1).map(x=>x.join('=')).join('&');
  const canonical=[method,path,qs,names.map(k=>k+':'+signedHeaders[k]+'\n').join(''),headerList,'UNSIGNED-PAYLOAD'].join('\n');
  const signing=hmac(hmac(hmac(hmac('AWS4'+config.secretKey,day),config.region),'s3'),'aws4_request');
  const signature=createHmac('sha256',signing).update('AWS4-HMAC-SHA256\n'+date+'\n'+scope+'\n'+sha(canonical)).digest('hex');
  return config.endpoint+path+'?'+qs+'&X-Amz-Signature='+signature;
}
export const xmlEscape=v=>String(v).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
const unxml=v=>String(v||'').replace(/&#(x[0-9a-f]+|[0-9]+);|&(amp|lt|gt|quot|apos);/gi,(_,num,name)=>num?String.fromCodePoint(num[0].toLowerCase()==='x'?parseInt(num.slice(1),16):+num):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[name]));
const tag=(xml,name)=>unxml(xml.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>'))?.[1]||'');
export function parseListing(xml){
  if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('INVALID_STORAGE_RESPONSE');
  const files=[...xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)].map(x=>({key:tag(x[1],'Key'),size:Number(tag(x[1],'Size'))||0,modified:tag(x[1],'LastModified')})).filter(f=>/\.(mp4|webm|m4v)$/i.test(f.key));
  return {files,cursor:tag(xml,'NextContinuationToken'),truncated:tag(xml,'IsTruncated')==='true'};
}
export function createStorage({fetchImpl=fetch,now=()=>new Date()}={}){
  async function request(config,options={},body){
    const headers=options.headers||{},url=signedURL(config,{...options,now:now()});
    const r=await fetchImpl(url,{method:options.method||'GET',headers,body,redirect:'error',signal:AbortSignal.timeout(20000)});
    if(!r.ok){const err=new Error(r.status===403?'STORAGE_ACCESS_DENIED':'STORAGE_UNAVAILABLE');err.status=r.status;throw err;}
    return r;
  }
  return {
    async list(config,prefix='',cursor=''){
      const query={'list-type':'2','max-keys':'500',prefix};if(cursor)query['continuation-token']=cursor;
      return parseListing(await(await request(config,{query})).text());
    },
    async head(config,key){
      const r=await request(config,{method:'HEAD',key});
      return {size:Number(r.headers.get('content-length'))||0,type:r.headers.get('content-type')||'video/mp4'};
    },
    play(config,key){return signedURL(config,{key,now:now(),expires:3600,query:{'response-content-disposition':'inline'}});},
    put(config,key,type){return signedURL(config,{method:'PUT',key,now:now(),expires:900,headers:{'content-type':type}});},
    async begin(config,key,type){
      const r=await request(config,{method:'POST',key,query:{uploads:''},headers:{'content-type':type}});
      const id=tag(await r.text(),'UploadId');if(!id)throw Error('INVALID_STORAGE_RESPONSE');return id;
    },
    part(config,key,id,number){return signedURL(config,{method:'PUT',key,query:{uploadId:id,partNumber:number},now:now(),expires:3600});},
    async complete(config,key,id,parts){
      const body='<CompleteMultipartUpload>'+parts.map(p=>'<Part><PartNumber>'+p.number+'</PartNumber><ETag>'+xmlEscape(p.etag)+'</ETag></Part>').join('')+'</CompleteMultipartUpload>';
      const r=await request(config,{method:'POST',key,query:{uploadId:id},headers:{'content-type':'application/xml'}},body);
      if(/<Error[\s>]/.test(await r.text()))throw Error('STORAGE_UPLOAD_FAILED');
      return this.head(config,key);
    },
    async abort(config,key,id){await request(config,{method:'DELETE',key,query:{uploadId:id}});},
    async configureCors(config,origin){
      const url=signedURL(config,{method:'GET',query:{cors:''},now:now()});
      let old='';const r=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(20000)});
      if(r.ok)old=await r.text();else if(r.status!==404)throw Error('STORAGE_CORS_DENIED');
      const rules=[...old.matchAll(/<CORSRule>([\s\S]*?)<\/CORSRule>/g)].filter(m=>!m[1].includes('<ID>mofid-academy-video</ID>')).map(m=>m[0]).join('');
      const body='<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">'+rules+'<CORSRule><ID>mofid-academy-video</ID><AllowedOrigin>'+xmlEscape(origin)+'</AllowedOrigin><AllowedMethod>GET</AllowedMethod><AllowedMethod>HEAD</AllowedMethod><AllowedMethod>PUT</AllowedMethod><AllowedHeader>*</AllowedHeader><ExposeHeader>ETag</ExposeHeader><ExposeHeader>Content-Range</ExposeHeader><MaxAgeSeconds>3600</MaxAgeSeconds></CORSRule></CORSConfiguration>';
      await request(config,{method:'PUT',query:{cors:''},headers:{'content-type':'application/xml','content-md5':createHash('md5').update(body).digest('base64')}},body);return true;
    }
  };
}
