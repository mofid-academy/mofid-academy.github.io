const normalize=value=>String(value??'').trim().replace(/\s+/g,' ');

// Preserve the complete entered name while keeping the existing reporting fields.
export function respondentNameParts(value,previous={}){
  const full_name=normalize(value);
  const first=normalize(previous.first_name),last=normalize(previous.last_name);
  if(first&&last&&full_name===normalize(first+' '+last))return {full_name,first_name:first,last_name:last};
  const split=full_name.lastIndexOf(' ');
  return {full_name,first_name:split<0?full_name:full_name.slice(0,split),last_name:split<0?'':full_name.slice(split+1)};
}
