gsap.registerPlugin(ScrollTrigger);

let heroTitleReady = false;
let aboutWarpProgress = 0;
let aboutWarpDirection = 1;

window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

document.querySelectorAll('.hero-title, .section-title').forEach((title, titleIndex) => {
  if (title.dataset.lettersReady === 'true') {
    return;
  }

  title.dataset.lettersReady = 'true';
  title.classList.add('title-motion');
  title.style.setProperty('--title-cycle', `${11 + (titleIndex % 3)}s`);
  const isHeroTitle = title.classList.contains('hero-title');

  let charIndex = 0;

  const wrapNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const fragment = document.createDocumentFragment();

      [...node.textContent].forEach((char) => {
        if (char.trim() === '') {
          fragment.appendChild(document.createTextNode(char));
          return;
        }

        const span = document.createElement('span');
        span.className = 'char';

        const spreadBase = (isHeroTitle ? 14 : 24) + (charIndex % 5) * (isHeroTitle ? 5 : 8);
        const angleA = (charIndex * 37 + titleIndex * 29) * (Math.PI / 180);
        const angleB = (charIndex * 53 + titleIndex * 17 + 90) * (Math.PI / 180);
        const sx = Math.cos(angleA) * spreadBase;
        const sy = Math.sin(angleA) * (spreadBase * (isHeroTitle ? 0.38 : 0.62));
        const sr = (charIndex % 2 === 0 ? 1 : -1) * (isHeroTitle ? 8 + (charIndex % 4) * 4 : 10 + (charIndex % 4) * 6);
        const ex = Math.cos(angleB) * (spreadBase * (isHeroTitle ? 0.92 : 1.12));
        const ey = Math.sin(angleB) * (spreadBase * (isHeroTitle ? 0.48 : 0.88));
        const er = (charIndex % 2 === 0 ? -1 : 1) * (isHeroTitle ? 10 + (charIndex % 5) * 4 : 14 + (charIndex % 5) * 5);

        span.style.setProperty('--char-index', charIndex);
        span.style.setProperty('--sx', `${sx}px`);
        span.style.setProperty('--sy', `${sy}px`);
        span.style.setProperty('--sr', `${sr}deg`);
        span.style.setProperty('--ex', `${ex}px`);
        span.style.setProperty('--ey', `${ey}px`);
        span.style.setProperty('--er', `${er}deg`);
        span.dataset.sx = String(sx);
        span.dataset.sy = String(sy);
        span.dataset.sr = String(sr);
        span.dataset.ex = String(ex);
        span.dataset.ey = String(ey);
        span.dataset.er = String(er);
        span.textContent = char;

        fragment.appendChild(span);
        charIndex += 1;
      });

      node.parentNode.replaceChild(fragment, node);
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('char')) {
      Array.from(node.childNodes).forEach(wrapNode);
    }
  };

  Array.from(title.childNodes).forEach(wrapNode);
});

function animateTitleTogether(title) {
  const chars = title.querySelectorAll('.char');
  if (!chars.length) {
    return;
  }

  const isHeroTitle = title.classList.contains('hero-title');

  gsap.to(chars, {
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    duration: isHeroTitle ? 2.35 : 1.35,
    ease: isHeroTitle ? 'elastic.out(1, 0.58)' : 'power3.out',
    stagger: isHeroTitle ? 0.075 : 0.045,
    overwrite: 'auto'
  });
}

function animateTitleApart(title, direction = 'down') {
  const chars = title.querySelectorAll('.char');
  if (!chars.length) {
    return;
  }

  gsap.to(chars, {
    x: (index, char) => Number(char.dataset[direction === 'down' ? 'ex' : 'sx'] || 0),
    y: (index, char) => Number(char.dataset[direction === 'down' ? 'ey' : 'sy'] || 0),
    rotate: (index, char) => Number(char.dataset[direction === 'down' ? 'er' : 'sr'] || 0),
    opacity: direction === 'down' ? 0 : 0,
    duration: 1.05,
    ease: direction === 'down' ? 'power2.in' : 'power2.out',
    stagger: 0.03,
    overwrite: 'auto'
  });
}

function setTitleState(title, state, direction = 'down') {
  if (title.dataset.titleState === state) {
    return;
  }

  title.dataset.titleState = state;

  if (state === 'together') {
    animateTitleTogether(title);
    return;
  }

  animateTitleApart(title, direction);
}

const flowTitleItems = [];

document.querySelectorAll('.hero-title, .section-title').forEach((title) => {
  const isHeroTitle = title.classList.contains('hero-title');
  const isSkillsTitle = Boolean(title.closest('#skills'));
  const isProjectsTitle = Boolean(title.closest('#projects'));
  const isContactTitle = Boolean(title.closest('#contact'));
  const trigger = title.closest('section, div[id]') || title;

  gsap.set(title.querySelectorAll('.char'), {
    x: (index, char) => Number(char.dataset.sx || 0),
    y: (index, char) => Number(char.dataset.sy || 0),
    rotate: (index, char) => Number(char.dataset.sr || 0),
    opacity: 0
  });
  title.dataset.titleState = 'apart';

  if (isSkillsTitle || isProjectsTitle || isContactTitle) {
    const section = title.closest('#skills, #projects, #contact');
    if (section) {
      flowTitleItems.push({ section, title });
    }

    return;
  }

  ScrollTrigger.create({
    trigger,
    start: 'top 72%',
    end: 'bottom 28%',
    onEnter: () => {
      if (isHeroTitle && !heroTitleReady) {
        return;
      }
      setTitleState(title, 'together');
    },
    onEnterBack: () => {
      if (isHeroTitle && !heroTitleReady) {
        return;
      }
      setTitleState(title, 'together');
    },
    onLeave: () => {
      if (isHeroTitle && !heroTitleReady) {
        return;
      }
      setTitleState(title, 'apart', 'down');
    },
    onLeaveBack: () => {
      if (isHeroTitle && !heroTitleReady) {
        return;
      }
      setTitleState(title, 'apart', 'up');
    }
  });
});

if (flowTitleItems.length) {
  const updateFlowTitleStates = () => {
    const anchor = window.innerHeight * 0.56;
    let activeIndex = -1;

    flowTitleItems.forEach((item, index) => {
      const rect = item.section.getBoundingClientRect();
      if (rect.top <= anchor && rect.bottom >= anchor && activeIndex === -1) {
        activeIndex = index;
      }
    });

    if (activeIndex === -1) {
      const firstRect = flowTitleItems[0].section.getBoundingClientRect();
      const lastIndex = flowTitleItems.length - 1;
      const lastRect = flowTitleItems[lastIndex].section.getBoundingClientRect();

      if (firstRect.top > anchor) {
        flowTitleItems.forEach((item) => setTitleState(item.title, 'apart', 'up'));
        return;
      }

      if (lastRect.bottom < anchor) {
        flowTitleItems.forEach((item, index) => {
          setTitleState(item.title, index === lastIndex ? 'together' : 'apart', 'down');
        });
        return;
      }

      return;
    }

    flowTitleItems.forEach((item, index) => {
      if (index === activeIndex) {
        setTitleState(item.title, 'together');
        return;
      }

      setTitleState(item.title, 'apart', index < activeIndex ? 'down' : 'up');
    });
  };

  ScrollTrigger.create({
    trigger: document.documentElement,
    start: 0,
    end: 'max',
    onUpdate: updateFlowTitleStates
  });

  ScrollTrigger.addEventListener('refresh', updateFlowTitleStates);
  window.addEventListener('load', updateFlowTitleStates);
  window.addEventListener('resize', updateFlowTitleStates);
}

/* NAV SCROLL */
window.addEventListener('scroll', () =>
  document.getElementById('navbar').classList.toggle('scrolled', scrollY > 60)
);

/* HERO ENTRANCE */
gsap.from('.hero-tag', { opacity: 0, y: 30, duration: 1, delay: 1.9, ease: 'power3.out' });
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

  ScrollTrigger.create({
    trigger: aboutSection,
    start: 'top top',
    end: () => `+=${Math.max(window.innerHeight * 0.9, 700)}`,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      aboutWarpProgress = self.progress;
      aboutWarpDirection = self.direction || 1;
    },
    onLeave: () => {
      aboutWarpProgress = 1;
      aboutWarpDirection = 1;
    },
    onEnterBack: () => {
      aboutWarpProgress = 1;
      aboutWarpDirection = -1;
    },
    onLeaveBack: () => {
      aboutWarpProgress = 0;
      aboutWarpDirection = -1;
    }
  });
}

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
            heroTitleReady = true;
            animateTitleTogether(document.querySelector('.hero-title'));
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

/* ABOUT STAR WARP */
(() => {
  const container = document.getElementById('about-star-container');
  const section = document.getElementById('about');
  if (!container || !section) {
    return;
  }

  const stars = [];
  let lastScrollY = window.scrollY;
  let active = false;

  function buildStars() {
    container.innerHTML = '';
    stars.length = 0;

    const count = window.innerWidth < 1280 ? 56 : 80;
    for (let i = 0; i < count; i += 1) {
      const star = document.createElement('div');
      star.className = 'about-star';

      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const isStatic = Math.random() < 0.3;
      const speed = isStatic ? 0 : 0.2 + Math.random() * 0.6;
      const size = isStatic ? 1 + Math.random() : 1 + Math.random() * 2;

      star.style.left = `${x}%`;
      star.style.top = `${y}%`;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.setProperty('--duration', `${2 + Math.random() * 4}s`);
      star.style.animationDelay = `${Math.random() * 5}s`;

      container.appendChild(star);
      stars.push({ el: star, initialY: y, speed });
    }
  }

  function updateStars() {
    if (!active) {
      return;
    }

    const scroll = window.scrollY;
    const velocity = scroll - lastScrollY;
    lastScrollY = scroll;
    const progressBoost = 1 + aboutWarpProgress * 2.4;
    const stretch = Math.max(1, Math.min(1 + Math.abs(velocity) * 0.28 + aboutWarpProgress * 12, 22));
    const travelBoost = Math.max(0, Math.min(Math.abs(velocity) * 0.22 + aboutWarpProgress * 22, 40));
    const driftDirection = velocity === 0 ? -aboutWarpDirection : (velocity >= 0 ? -1 : 1);

    stars.forEach((star) => {
      if (star.speed === 0) {
        star.el.style.transform = `scaleY(${Math.max(1, stretch * 0.32)})`;
        star.el.style.opacity = `${Math.min(1, 0.35 + Math.abs(velocity) * 0.02 + aboutWarpProgress * 0.25)}`;
        return;
      }

      let pos = (star.initialY - scroll * star.speed * (0.11 * progressBoost) + driftDirection * travelBoost * star.speed) % 100;
      if (pos < 0) {
        pos += 100;
      }

      star.el.style.top = `${pos}%`;
      star.el.style.transform = `scaleY(${stretch}) scaleX(${Math.min(2.8, 1 + Math.abs(velocity) * 0.02 + aboutWarpProgress * 0.9)})`;
      star.el.style.opacity = `${Math.min(1, 0.52 + Math.abs(velocity) * 0.05 + star.speed * 0.4 + aboutWarpProgress * 0.18)}`;
    });
  }

  function handleScroll() {
    if (!active) {
      return;
    }
    updateStars();
  }

  function start() {
    if (active || document.hidden || window.innerWidth <= 900) {
      return;
    }

    active = true;
    lastScrollY = window.scrollY;
    updateStars();
  }

  function stop() {
    active = false;
  }

  buildStars();
  window.addEventListener('resize', buildStars);
  window.addEventListener('scroll', handleScroll, { passive: true });

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && window.innerWidth > 900) {
        start();
      } else {
        stop();
      }
    },
    { threshold: 0.18 }
  );

  observer.observe(section);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else if (window.innerWidth > 900 && section.getBoundingClientRect().bottom > 0 && section.getBoundingClientRect().top < window.innerHeight) {
      start();
    }
  });
})();

