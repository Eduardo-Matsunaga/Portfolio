gsap.registerPlugin(ScrollTrigger);

/* ── CURSOR ── */
const dot  = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');
let mx = -100, my = -100, rx = -100, ry = -100;

window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

(function animCursor() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  dot.style.transform  = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
  requestAnimationFrame(animCursor);
})();

document.querySelectorAll('a, button, .project-card, .skill-item, .edu-card').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

/* ── NAV SCROLL ── */
window.addEventListener('scroll', () =>
  document.getElementById('navbar').classList.toggle('scrolled', scrollY > 60)
);

/* ── HERO ENTRANCE ── */
gsap.from('.hero-tag',      { opacity: 0, y: 30,  duration: 1,   delay: 1.9,  ease: 'power3.out' });
gsap.from('.hero-title',    { opacity: 0, y: 50,  duration: 1.1, delay: 1.9,  ease: 'power3.out' });
gsap.from('.hero-desc',     { opacity: 0, y: 30,  duration: 1,   delay: 1.9, ease: 'power3.out' });
gsap.from('.hero-actions',  { opacity: 0, y: 20,  duration: .8,  delay: 1.9,   ease: 'power3.out' });
gsap.from('.hero-img-frame',{ opacity: 0, x: 60,  duration: 1.2, delay: 1.9,  ease: 'power3.out' });

/* ── SCROLL REVEALS ── */
gsap.utils.toArray('.reveal').forEach(el => {
  gsap.from(el, {
    opacity: 0, y: 48, duration: .9, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true }
  });
});

/* ── SKILL BARS ── */
gsap.utils.toArray('.skill-item').forEach(item => {
  const fill = item.querySelector('.skill-bar-fill');
  ScrollTrigger.create({
    trigger: item, start: 'top 85%', once: true,
    onEnter: () => { fill.style.width = (item.dataset.level || 50) + '%'; }
  });
});

/* ── SECTION TITLES ── */
gsap.utils.toArray('.section-title').forEach(el => {
  gsap.from(el, {
    opacity: 0, x: -40, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true }
  });
});

/* ── CONTACT PARALLAX ── */
gsap.to('.contact-big', {
  y: -80, ease: 'none',
  scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'bottom top', scrub: true }
});

// ── LOADER ──────────────────────────────────────
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  const bar = document.getElementById('loader-bar');
  const counter = document.getElementById('loader-counter');
  const name = document.getElementById('loader-name');

  // Animate name in
  gsap.to(name, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', delay: 0.1 });

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        gsap.to(loader, {
          yPercent: -100,
          duration: 0.9,
          ease: 'power4.inOut',
          onComplete: () => { loader.style.display = 'none'; initAnimations(); }
        });
      }, 300);
    }
    bar.style.width = progress + '%';
    counter.textContent = String(Math.floor(progress)).padStart(3, '0');
  }, 60);
});

// ── HERO AURORA BG ──
(function() {
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  const bgg = document.getElementById('hero-bg-glow');
  const section = document.getElementById('home');

  let w, h, dots = [], hue = 230;
  const md = 100, maxWidth = 15, minWidth = 2, hueDif = 50, glow = 10;
  const maxSpeed = 35, minSpeed = 6;

  function resize() {
    w = canvas.width = section.offsetWidth;
    h = canvas.height = section.getBoundingClientRect().height || window.innerHeight;
    dots = [];
    pushDots();
    ctx.globalCompositeOperation = 'lighter';
  }

  function pushDots() {
    for (let i = 1; i < md; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h / 2,
        h: Math.random() * (h * .9 - h * .5) + h * .5,
        w: Math.random() * (maxWidth - minWidth) + minWidth,
        c: Math.random() * (hueDif * 2) + (hue - hueDif),
        m: Math.random() * (maxSpeed - minSpeed) + minSpeed
      });
    }
  }

  function render() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      ctx.beginPath();
      const grd = ctx.createLinearGradient(d.x, d.y, d.x + d.w, d.y + d.h);
      grd.addColorStop(0,  `hsla(${d.c},50%,50%,0)`);
      grd.addColorStop(.2, `hsla(${d.c+20},50%,50%,.5)`);
      grd.addColorStop(.5, `hsla(${d.c+50},70%,60%,.8)`);
      grd.addColorStop(.8, `hsla(${d.c+80},50%,50%,.5)`);
      grd.addColorStop(1,  `hsla(${d.c+100},50%,50%,0)`);
      ctx.shadowBlur = glow;
      ctx.shadowColor = `hsla(${d.c},50%,50%,1)`;
      ctx.fillStyle = grd;
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.closePath();
      d.x += d.m / 100;
      if (d.x > w + maxWidth) d.x = -maxWidth;
    }
    requestAnimationFrame(render);
  }

  bgg.style.background = `radial-gradient(ellipse at center, hsla(${hue},50%,50%,.8) 0%,rgba(0,0,0,0) 100%)`;
  resize();
  render();
  window.addEventListener('resize', resize);
})();