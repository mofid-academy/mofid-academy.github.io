export const PLAYBACK_RATES=Object.freeze([0.5,0.75,1,1.25,1.5,1.75,2,2.5,3]);
const STORAGE_KEY='mofid-academy-video-speed';

export function playbackRate(value){
  const rate=Number(value);
  return PLAYBACK_RATES.includes(rate)?rate:1;
}

export function readPlaybackRate(storage){
  try{return playbackRate((storage??globalThis.localStorage)?.getItem(STORAGE_KEY));}
  catch{return 1;}
}

export function savePlaybackRate(value,storage){
  try{(storage??globalThis.localStorage)?.setItem(STORAGE_KEY,String(playbackRate(value)));}
  catch{}
}
