const canvas = document.getElementById('canvas');
const colorInp = document.getElementById('color');
const sizeInp = document.getElementById('size');
const clearBtn = document.getElementById('clear');
const ctx = canvas.getContext && canvas.getContext('2d');
function resize(){
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  ctx.scale(ratio, ratio);
}
window.addEventListener('resize', resize);
resize();
let drawing=false;
function pos(e){
  const r = canvas.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
  return {x,y};
}
canvas.addEventListener('pointerdown', (e)=>{drawing=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y);});
canvas.addEventListener('pointermove', (e)=>{ if(!drawing) return; const p=pos(e); ctx.lineTo(p.x,p.y); ctx.strokeStyle = colorInp.value; ctx.lineWidth = sizeInp.value; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();});
canvas.addEventListener('pointerup', ()=>{drawing=false});
clearBtn.addEventListener('click', ()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); });
