// Public participant links only. Native SVG remains usable while React loads.
export function setQrCard(element,{url='',title='کد ورود مخاطب',svg='',compact=false}={}){
 if(!element)return;
 const changed=element.dataset.qrUrl!==url||element.dataset.qrTitle!==title||element.dataset.qrCompact!==String(compact);
 element.dataset.qrUrl=url;element.dataset.qrTitle=title;element.dataset.qrCompact=String(compact);
 if(element.dataset.qrEnhanced!=='true'&&changed)element.innerHTML=svg;
 if(changed)element.dispatchEvent(new Event('mofid:qr-update'));
}
export function clearQrCard(element){setQrCard(element);}
