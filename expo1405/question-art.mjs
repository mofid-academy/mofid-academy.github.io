// A single local illustration for the current question, shared by every view.
// Only the question already supplied to the view is needed; no extra data requests.
const artwork=['mofid','vault','bv','jet','ribbon'];

export function questionArtwork(question={}){
 const position=Number(question?.position);
 const index=Number.isSafeInteger(position)&&position>0?(position-1)%artwork.length:0;
 return {key:artwork[index],src:`./assets/glass-${artwork[index]}.webp`};
}

export function questionArtMarkup(question){
 const {src}=questionArtwork(question);
 return `<div class="question-art" aria-hidden="true"><img src="${src}" alt="" width="144" height="144" decoding="async"></div>`;
}
