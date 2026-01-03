const btn = document.getElementById('clickBtn');
const scoreEl = document.getElementById('score');
const reset = document.getElementById('reset');
let score = 0;
btn && btn.addEventListener('click', ()=>{ score += 1; scoreEl.textContent = score; });
reset && reset.addEventListener('click', ()=>{ score = 0; scoreEl.textContent = score; });
