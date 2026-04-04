gsap.registerPlugin(ScrollTrigger);

window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

/* NAV SCROLL */
window.addEventListener('scroll', () =>
  document.getElementById('navbar').classList.toggle('scrolled', scrollY > 60)
);

/* HERO ENTRANCE */
gsap.from('.hero-tag', { opacity: 0, y: 30, duration: 1, delay: 1.9, ease: 'power3.out' });
gsap.from('.hero-title', { opacity: 0, y: 50, duration: 1.1, delay: 1.9, ease: 'power3.out' });
gsap.from('.hero-desc', { opacity: 0, y: 30, duration: 1, delay: 1.9, ease: 'power3.out' });
gsap.from('.hero-actions', { opacity: 0, y: 20, duration: 0.8, delay: 1.9, ease: 'power3.out' });
gsap.from('.hero-img-frame', { opacity: 0, x: 60, duration: 1.2, delay: 1.9, ease: 'power3.out' });

/* SCROLL REVEALS */
gsap.utils
  .toArray('.reveal')
  .filter((el) => !el.closest('#about'))
  .forEach((el) => {
  gsap.from(el, {
    opacity: 0,
    y: 48,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true }
  });
});

/* SKILL BARS */
gsap.utils.toArray('.skill-item').forEach((item) => {
  const fill = item.querySelector('.skill-bar-fill');
  ScrollTrigger.create({
    trigger: item,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      fill.style.width = (item.dataset.level || 50) + '%';
    }
  });
});

/* ABOUT TRANSITION */
const aboutSection = document.getElementById('about');
const heroSection = document.getElementById('home');
if (aboutSection && heroSection) {
  const aboutLine = aboutSection.querySelector('.about-transition span');
  const aboutTransition = aboutSection.querySelector('.about-transition');
  const aboutLabel = aboutSection.querySelector('.about-label');
  const aboutTitle = aboutSection.querySelector('.section-title');
  const aboutGrid = aboutSection.querySelector('.edu-grid');
  const heroContent = heroSection.querySelector('.hero-content');
  const heroImage = heroSection.querySelector('.hero-img-wrapper');
  const heroIndicator = heroSection.querySelector('.scroll-indicator');
  const heroGlow = heroSection.querySelector('#hero-bg-glow');
  const heroCanvas = heroSection.querySelector('#hero-canvas');
  const heroCircles = heroSection.querySelectorAll('.hero-bg-circle');

  const heroTargets = [heroContent, heroImage, heroIndicator].filter(Boolean);
  const heroBackgroundTargets = [heroGlow, heroCanvas, ...heroCircles].filter(Boolean);

  const aboutHandoffTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: aboutSection,
      start: 'top bottom',
      end: 'top 44%',
      scrub: 1.15,
      invalidateOnRefresh: true
    }
  });

  aboutHandoffTimeline
    .to(
      heroTargets,
      {
        x: (index, target) => {
          if (target === heroImage) {
            return -Math.min(window.innerWidth * 0.22, 220);
          }
          return -Math.min(window.innerWidth * 0.14, 140);
        },
        y: (index, target) => (target === heroImage ? -28 : -12),
        opacity: 0,
        ease: 'none'
      },
      0
    )
    .to(
      heroBackgroundTargets,
      {
        x: () => -Math.min(window.innerWidth * 0.09, 90),
        opacity: 0.18,
        ease: 'none'
      },
      0
    )
    .fromTo(
      aboutTransition,
      {
        y: 140,
        opacity: 0.2
      },
      {
        y: 0,
        opacity: 1,
        ease: 'none'
      },
      0.08
    )
    .fromTo(
      aboutLine,
      {
        scaleX: 0
      },
      {
        scaleX: 1,
        ease: 'none'
      },
      0.16
    )
    .fromTo(
      [aboutLabel, aboutTitle],
      {
        y: 150,
        opacity: 0
      },
      {
        y: 0,
        opacity: 1,
        stagger: 0.06,
        ease: 'none'
      },
      0.18
    )
    .fromTo(
      aboutGrid,
      {
        y: 180,
        opacity: 0.16
      },
      {
        y: 0,
        opacity: 1,
        ease: 'none'
      },
      0.22
    );
}

/* SECTION TITLES */
gsap.utils
  .toArray('.section-title')
  .filter((el) => !el.closest('#about'))
  .forEach((el) => {
  gsap.from(el, {
    opacity: 0,
    x: -40,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true }
  });
});

/* CONTACT PARALLAX */
gsap.to('.contact-big', {
  y: -80,
  ease: 'none',
  scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'bottom top', scrub: true }
});

/* LOADER */
window.addEventListener('load', () => {
  window.scrollTo(0, 0);

  const loader = document.getElementById('loader');
  const bar = document.getElementById('loader-bar');
  const counter = document.getElementById('loader-counter');
  const name = document.getElementById('loader-name');

  gsap.to(name, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 });

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
          onComplete: () => {
            loader.style.display = 'none';
            if (typeof initAnimations === 'function') {
              initAnimations();
            }
          }
        });
      }, 300);
    }
    bar.style.width = progress + '%';
    counter.textContent = String(Math.floor(progress)).padStart(3, '0');
  }, 60);
});

/* HERO AURORA BG */
(() => {
  const canvas = document.getElementById('hero-canvas');
  const bgGlow = document.getElementById('hero-bg-glow');
  const section = document.getElementById('home');
  if (!canvas || !bgGlow || !section) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  let width;
  let height;
  let dots = [];
  let isActive = false;
  let rafId = null;
  const hue = 230;
  const maxDots = 48;
  const maxWidth = 12;
  const minWidth = 2;
  const hueDifference = 50;
  const glow = 6;
  const maxSpeed = 24;
  const minSpeed = 4;

  function resize() {
    width = canvas.width = section.offsetWidth;
    height = canvas.height = section.getBoundingClientRect().height || window.innerHeight;
    dots = [];
    pushDots();
    ctx.globalCompositeOperation = 'lighter';
  }

  function pushDots() {
    for (let i = 1; i < maxDots; i += 1) {
      dots.push({
        x: Math.random() * width,
        y: (Math.random() * height) / 2,
        h: Math.random() * (height * 0.9 - height * 0.5) + height * 0.5,
        w: Math.random() * (maxWidth - minWidth) + minWidth,
        c: Math.random() * (hueDifference * 2) + (hue - hueDifference),
        m: Math.random() * (maxSpeed - minSpeed) + minSpeed
      });
    }
  }

  function render() {
    if (!isActive) {
      rafId = null;
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < dots.length; i += 1) {
      const dot = dots[i];
      const gradient = ctx.createLinearGradient(dot.x, dot.y, dot.x + dot.w, dot.y + dot.h);
      gradient.addColorStop(0, `hsla(${dot.c},50%,50%,0)`);
      gradient.addColorStop(0.2, `hsla(${dot.c + 20},50%,50%,.5)`);
      gradient.addColorStop(0.5, `hsla(${dot.c + 50},70%,60%,.8)`);
      gradient.addColorStop(0.8, `hsla(${dot.c + 80},50%,50%,.5)`);
      gradient.addColorStop(1, `hsla(${dot.c + 100},50%,50%,0)`);
      ctx.shadowBlur = glow;
      ctx.shadowColor = `hsla(${dot.c},50%,50%,1)`;
      ctx.fillStyle = gradient;
      ctx.fillRect(dot.x, dot.y, dot.w, dot.h);
      dot.x += dot.m / 100;

      if (dot.x > width + maxWidth) {
        dot.x = -maxWidth;
      }
    }

    rafId = requestAnimationFrame(render);
  }

  function startRender() {
    if (isActive || document.hidden) {
      return;
    }

    isActive = true;
    if (rafId === null) {
      render();
    }
  }

  function stopRender() {
    isActive = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  bgGlow.style.background = `radial-gradient(ellipse at center, hsla(${hue},50%,50%,.8) 0%,rgba(0,0,0,0) 100%)`;
  resize();
  window.addEventListener('resize', resize);

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        startRender();
      } else {
        stopRender();
      }
    },
    { threshold: 0.15 }
  );

  observer.observe(section);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopRender();
    } else if (section.getBoundingClientRect().bottom > 0 && section.getBoundingClientRect().top < window.innerHeight) {
      startRender();
    }
  });
})();

