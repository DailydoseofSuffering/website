(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W, H, DPR;

  function resize() {
    DPR = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.max(300, Math.floor(W * DPR));
    canvas.height = Math.max(200, Math.floor(H * DPR));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Game state
  let asteroids = [];
  let bullets = [];
  let keys = {};
  let score = 0;
  let lives = 3;
  let running = true;

  const hudScore = document.getElementById('score');
  const hudLives = document.getElementById('lives');
  const restartBtn = document.getElementById('restart');

  // Player
  const ship = {
    x: 0, y: 0, r: 14, speed: 280
  };

  function resetShip(){
    ship.x = W/2; ship.y = H - 60; ship.r = 14;
  }

  // Asteroid factory
  function spawnAsteroid(size=3, x=null, y=null){
    const s = size; // 3 large, 2 medium, 1 small
    const radius = 12 * s + (s*4);
    const ax = x !== null ? x : (Math.random() * (W-40) + 20);
    const ay = y !== null ? y : -20 - Math.random()*200;
    const speedY = 30 + Math.random()*80 + (3 - s)*30; // smaller fall faster
    const vx = (Math.random()-0.5) * 80;
    asteroids.push({x:ax,y:ay,vx:vx,vy:speedY,r:radius,size:s});
  }

  // spawn initial set
  function fillAsteroids(n=6){
    for(let i=0;i<n;i++) spawnAsteroid(3);
  }

  function splitAsteroid(a){
    if(a.size <= 1) return;
    const newSize = a.size - 1;
    for(let i=0;i<2;i++){
      const angle = (Math.PI/4) + (Math.random()*Math.PI/2) * (i===0? -1:1);
      const speed = 80 + Math.random()*80;
      const vx = Math.cos(angle)*speed + (Math.random()-0.5)*30;
      const vy = Math.sin(angle)*speed + Math.abs(a.vy)*0.2;
      spawnAsteroid(newSize, a.x + (i? 6:-6), a.y + (i?6:-6));
      const na = asteroids[asteroids.length-1];
      na.vx = vx; na.vy = Math.abs(vy);
    }
  }

  // controls
  window.addEventListener('keydown', (e)=>{ keys[e.code]=true; if(e.code==='Space') e.preventDefault(); });
  window.addEventListener('keyup', (e)=>{ keys[e.code]=false; });

  // shooting
  let lastShot = 0;
  function shoot(){
    // asteroids
    for(const a of asteroids){
      // draw using image when loaded, otherwise fallback to circle
      if(asteroidImg && asteroidImg.complete && asteroidImg.naturalWidth){
        const size = a.r;
        ctx.save();
        ctx.translate(a.x, a.y);
        // rotate slightly based on x to give some variation
        const rot = (a.x % 360) * Math.PI/180;
        ctx.rotate(rot);
        ctx.drawImage(asteroidImg, -size, -size, size*2, size*2);
        ctx.restore();
      } else {
        ctx.beginPath(); ctx.fillStyle = 'var(--asteroid)';
        ctx.arc(a.x, a.y, a.r, 0, Math.PI*2); ctx.fill();
        // crater lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x - a.r*0.4, a.y - a.r*0.2); ctx.lineTo(a.x + a.r*0.3, a.y + a.r*0.4); ctx.stroke();
      }
    }
  let last = performance.now();
  function step(now){
    const dt = Math.min(40, now - last) / 1000; last = now;
    // bullets: draw as short white line segments for visibility
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for(const b of bullets){
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + 6);
      ctx.lineTo(b.x, b.y - 6);
      ctx.stroke();
    }
    render();
    requestAnimationFrame(step);
  }

  function update(dt){
    // player movement
    if(keys['ArrowLeft'] || keys['KeyA']) ship.x -= ship.speed * dt;
    if(keys['ArrowRight'] || keys['KeyD']) ship.x += ship.speed * dt;
    if(keys['Space']) shoot();
    // clamp
    ship.x = Math.max(16, Math.min(W-16, ship.x));

    // bullets
    for(let i=bullets.length-1;i>=0;i--){
      const b = bullets[i];
      b.y += b.vy * dt;
      if(b.y < -20) bullets.splice(i,1);
    }

    // asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // wrap horizontally
      if(a.x < -100) a.x = W + 100;
      if(a.x > W + 100) a.x = -100;
      // if asteroid passes bottom, player loses a life and asteroid removed
      if(a.y - a.r > H + 50){
        asteroids.splice(i,1);
        loseLife();
      }
    }

    // collisions bullet <-> asteroid
    for(let bi=bullets.length-1; bi>=0; bi--){
      const b = bullets[bi];
      for(let ai=asteroids.length-1; ai>=0; ai--){
        const a = asteroids[ai];
        const dx = b.x - a.x; const dy = b.y - a.y; const dist = Math.hypot(dx,dy);
        if(dist < a.r + b.r){
          // hit
          bullets.splice(bi,1);
          asteroids.splice(ai,1);
          score += 10 * a.size;
          hudScore.textContent = score;
          if(a.size > 1) splitAsteroid(a);
          break;
        }
      }
    }

    // collisions ship <-> asteroid
    for(let ai=asteroids.length-1; ai>=0; ai--){
      const a = asteroids[ai];
      const dx = ship.x - a.x; const dy = ship.y - a.y; const dist = Math.hypot(dx,dy);
      if(dist < a.r + ship.r - 6){
        // collision
        asteroids.splice(ai,1);
        loseLife();
      }
    }

    // spawn occasionally
    if(Math.random() < 0.015) spawnAsteroid(3);
    // keep some asteroids
    if(asteroids.length < 4) fillAsteroids(1);
  }

  function loseLife(){
    lives -= 1; hudLives.textContent = lives;
    if(lives <= 0){ running = false; showGameOver(); }
    else resetShip();
  }

  function showGameOver(){
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.font = '28px sans-serif';
    ctx.fillText('Game Over — Score: ' + score, W/2, H/2 - 10);
    ctx.font = '16px sans-serif'; ctx.fillText('Press Restart to play again', W/2, H/2 + 18);
    ctx.restore();
  }

  function render(){
    // clear
    ctx.clearRect(0,0,W,H);
    // background
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#001018'); g.addColorStop(1,'#00182a');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // asteroids
    for(const a of asteroids){
      ctx.beginPath(); ctx.fillStyle = 'var(--asteroid)';
      ctx.arc(a.x, a.y, a.r, 0, Math.PI*2); ctx.fill();
      // crater lines
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(a.x - a.r*0.4, a.y - a.r*0.2); ctx.lineTo(a.x + a.r*0.3, a.y + a.r*0.4); ctx.stroke();
    }

    // bullets
    ctx.fillStyle = 'var(--bullet)';
    for(const b of bullets){ ctx.beginPath(); ctx.arc(b.x, b.y, b.r,0,Math.PI*2); ctx.fill(); }

    // ship (triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.fillStyle = 'var(--ship)'; ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.moveTo(0,-ship.r); ctx.lineTo(ship.r, ship.r); ctx.lineTo(-ship.r, ship.r); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // restart
  function restart(){
    asteroids = []; bullets = []; score = 0; lives = 3; running = true; hudScore.textContent = score; hudLives.textContent = lives; resetShip(); fillAsteroids(6);
  }
  restartBtn.addEventListener('click', restart);

  // init
  resetShip(); fillAsteroids(6);
  hudScore.textContent = score; hudLives.textContent = lives;
  requestAnimationFrame(step);

}})
