// Small UI helpers: theme toggle, mobile menu, year
(function(){
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');

  // set year
  const y = new Date().getFullYear();
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = y;

  // theme from localStorage
  function setTheme(theme){
    if(theme) root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
    localStorage.setItem('theme', theme||'');
    if(themeToggle) themeToggle.textContent = theme==='dark' ? '☀️' : '🌙';
  }

  const stored = localStorage.getItem('theme');
  if(stored) setTheme(stored);

  // sync theme across tabs/windows
  window.addEventListener('storage', (e)=>{
    if(e.key === 'theme') setTheme(e.newValue || '');
  });

  themeToggle && themeToggle.addEventListener('click', ()=>{
    const cur = root.getAttribute('data-theme') === 'dark' ? '' : 'dark';
    setTheme(cur);
  });

  // mobile menu
  menuToggle && menuToggle.addEventListener('click', ()=>{
    if(nav.classList.contains('open')) nav.classList.remove('open');
    else nav.classList.add('open');
  });

  // smooth scroll for internal links
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a');
    if(!a) return;
    const href = a.getAttribute('href');
    if(href && href.startsWith('#')){
      const el = document.querySelector(href);
      if(el){
        e.preventDefault();
        el.scrollIntoView({behavior:'smooth',block:'start'});
        if(nav.classList.contains('open')) nav.classList.remove('open');
      }
    }
  });

})();
