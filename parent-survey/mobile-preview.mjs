document.querySelector('#previewWidth').addEventListener('change',e=>{document.querySelector('#mobileFrame').style.width=e.target.value+'px';});
document.querySelector('#previewPage').addEventListener('change',e=>{document.querySelector('#mobileFrame').src=e.target.value==='admin'?'./admin.html?demo=1&v=20261031.3':'./?preview=1&v=20261031.3';});
