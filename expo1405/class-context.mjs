export const roomFromUrl=url=>new URL(url).searchParams.get('class')||'main';
export const roomStorageKey=(key,room)=>room==='main'?key:key+':'+room;
export function classUrl(file,room,base){const url=new URL(file,base);url.searchParams.set('class',room);return url;}
