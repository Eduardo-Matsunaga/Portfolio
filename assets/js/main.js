gsap.registerPlugin(ScrollTrigger);

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const performanceProfile = {
  lowEnd: document.documentElement.classList.contains('low-end-device'),
  reducedMotion: reducedMotionQuery.matches
};

document.documentElement.classList.toggle('low-end-device', performanceProfile.lowEnd);
window.runtimePerformanceProfile = performanceProfile;

let lenis = null;
let heroTitleReady = false;
let aboutWarpProgress = 0;
let aboutWarpDirection = 1;
const titleCharsMap = new WeakMap();

if (typeof window.Lenis === 'function' && !performanceProfile.reducedMotion) {
  lenis = new window.Lenis({
    autoRaf: false,
    anchors: true,
    lerp: performanceProfile.lowEnd ? 0.075 : 0.09,
    wheelMultiplier: 1,
    touchMultiplier: 1
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
  window.lenis = lenis;
}

function setWillChange(targets, value) {
  gsap.utils.toArray(targets).forEach((target) => {
    if (target) {
      target.style.willChange = value;
    }
  });
}

function clearWillChange(targets) {
  gsap.utils.toArray(targets).forEach((target) => {
    if (target) {
      target.style.removeProperty('will-change');
    }
  });
}

function createLayeredTween(method, targets, vars, willChange = 'transform, opacity') {
  const elements = gsap.utils.toArray(targets).filter(Boolean);
  if (!elements.length) {
    return null;
  }

  const { onStart, onComplete, onInterrupt } = vars;

  return gsap[method](elements, {
    ...vars,
    force3D: vars.force3D ?? true,
    onStart: () => {
      setWillChange(elements, willChange);
      onStart?.();
    },
    onComplete: () => {
      clearWillChange(elements);
      onComplete?.();
    },
    onInterrupt: () => {
      clearWillChange(elements);
      onInterrupt?.();
    }
  });
}

function throttleWithAnimationFrame(callback) {
  let scheduled = false;

  return (...args) => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      callback(...args);
    });
  };
}

const scrollSubscribers = new Set();
const notifyScrollSubscribers = throttleWithAnimationFrame(() => {
  const scrollY = window.scrollY;
  scrollSubscribers.forEach((callback) => callback(scrollY));
});

function addScrollSubscriber(callback, { immediate = false } = {}) {
  scrollSubscribers.add(callback);

  if (scrollSubscribers.size === 1) {
    window.addEventListener('scroll', notifyScrollSubscribers, { passive: true });
  }

  if (immediate) {
    callback(window.scrollY);
  }

  return () => {
    scrollSubscribers.delete(callback);

    if (!scrollSubscribers.size) {
      window.removeEventListener('scroll', notifyScrollSubscribers);
    }
  };
}

window.addEventListener('beforeunload', () => {
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true });
    return;
  }

  window.scrollTo(0, 0);
});

document.querySelectorAll('.hero-title, .section-title').forEach((title, titleIndex) => {
  if (title.dataset.lettersReady === 'true') {
    return;
  }

  title.dataset.lettersReady = 'true';

  title.classList.add('title-motion');
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
        const isNarrowHero = isHeroTitle && window.innerWidth <= 768;
        const isAboutTitle = !isHeroTitle && title.closest('#about');
        const isNarrowAboutTitle = isAboutTitle && window.innerWidth <= 768;

        const spreadBase = (
          isHeroTitle
            ? (isNarrowHero ? 10 : 14)
            : (isNarrowAboutTitle ? 14 : 24)
        ) + (charIndex % 5) * (
          isHeroTitle
            ? (isNarrowHero ? 3 : 5)
            : (isNarrowAboutTitle ? 4 : 8)
        );
        const angleA = (charIndex * 37 + titleIndex * 29) * (Math.PI / 180);
        const angleB = (charIndex * 53 + titleIndex * 17 + 90) * (Math.PI / 180);
        const sx = Math.cos(angleA) * spreadBase;
        const sy = Math.sin(angleA) * (spreadBase * (
          isHeroTitle
            ? (isNarrowHero ? 0.22 : 0.38)
            : (isNarrowAboutTitle ? 0.34 : 0.62)
        ));
        const sr = (charIndex % 2 === 0 ? 1 : -1) * (
          isHeroTitle
            ? (isNarrowHero ? 5 + (charIndex % 4) * 2 : 8 + (charIndex % 4) * 4)
            : (isNarrowAboutTitle ? 6 + (charIndex % 4) * 2 : 10 + (charIndex % 4) * 6)
        );
        const ex = Math.cos(angleB) * (spreadBase * (
          isHeroTitle
            ? (isNarrowHero ? 0.72 : 0.92)
            : (isNarrowAboutTitle ? 0.78 : 1.12)
        ));
        const ey = Math.sin(angleB) * (spreadBase * (
          isHeroTitle
            ? (isNarrowHero ? 0.28 : 0.48)
            : (isNarrowAboutTitle ? 0.42 : 0.88)
        ));
        const er = (charIndex % 2 === 0 ? -1 : 1) * (
          isHeroTitle
            ? (isNarrowHero ? 6 + (charIndex % 5) * 2 : 10 + (charIndex % 5) * 4)
            : (isNarrowAboutTitle ? 8 + (charIndex % 5) * 2 : 14 + (charIndex % 5) * 5)
        );

        span.style.setProperty('--sx', `${sx}px`);
        span.style.setProperty('--sy', `${sy}px`);
        span.style.setProperty('--sr', `${sr}deg`);
        span.style.setProperty('--ex', `${ex}px`);
        span.style.setProperty('--ey', `${ey}px`);
        span.style.setProperty('--er', `${er}deg`);
        span._motion = { sx, sy, sr, ex, ey, er };
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
  titleCharsMap.set(title, Array.from(title.querySelectorAll('.char')));
});

function animateTitleTogether(title) {
  const chars = titleCharsMap.get(title) || [];
  if (!chars.length) {
    return;
  }

  const isHeroTitle = title.classList.contains('hero-title');

  createLayeredTween('to', chars, {
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
  const chars = titleCharsMap.get(title) || [];
  if (!chars.length) {
    return;
  }

  createLayeredTween('to', chars, {
    x: (index, char) => char._motion?.[direction === 'down' ? 'ex' : 'sx'] ?? 0,
    y: (index, char) => char._motion?.[direction === 'down' ? 'ey' : 'sy'] ?? 0,
    rotate: (index, char) => char._motion?.[direction === 'down' ? 'er' : 'sr'] ?? 0,
    opacity: 0,
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
  const isContactTitle = Boolean(title.closest('#contact'));
  const trigger = title.closest('section, div[id]') || title;

  const chars = titleCharsMap.get(title) || [];

  gsap.set(chars, {
    x: (index, char) => char._motion?.sx ?? 0,
    y: (index, char) => char._motion?.sy ?? 0,
    rotate: (index, char) => char._motion?.sr ?? 0,
    opacity: 0
  });
  title.dataset.titleState = 'apart';

  if (isSkillsTitle || isContactTitle) {
    const section = title.closest('#skills, #contact');
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
  const applyFlowTitleState = (activeIndex) => {
    flowTitleItems.forEach((item, index) => {
      if (index === activeIndex) {
        setTitleState(item.title, 'together');
        return;
      }

      setTitleState(item.title, 'apart', index < activeIndex ? 'down' : 'up');
    });
  };

  const setFlowTitlesBeforeFirst = () => {
    flowTitleItems.forEach((item) => setTitleState(item.title, 'apart', 'up'));
  };

  const setFlowTitlesAfterLast = () => {
    const lastIndex = flowTitleItems.length - 1;
    flowTitleItems.forEach((item, index) => {
      setTitleState(item.title, index === lastIndex ? 'together' : 'apart', 'down');
    });
  };

  const flowTriggers = flowTitleItems.map((item, index) => {
    const isFirst = index === 0;
    const isLast = index === flowTitleItems.length - 1;

    const trigger = ScrollTrigger.create({
      trigger: item.section,
      start: 'top 56%',
      end: 'bottom 56%',
      invalidateOnRefresh: true,
      onEnter: () => applyFlowTitleState(index),
      onEnterBack: () => applyFlowTitleState(index),
      onLeave: () => {
        if (isLast) {
          setFlowTitlesAfterLast();
        }
      },
      onLeaveBack: () => {
        if (isFirst) {
          setFlowTitlesBeforeFirst();
        }
      }
    });

    trigger._itemIndex = index;
    return trigger;
  }).filter(Boolean);

  const getRootScroll = ScrollTrigger.getScrollFunc(window);

  const syncFlowTitlesFromTriggerState = () => {
    const activeTrigger = flowTriggers.find((trigger) => trigger.isActive);
    if (activeTrigger) {
      applyFlowTitleState(activeTrigger._itemIndex);
      return;
    }

    if (getRootScroll() < flowTriggers[0].start) {
      setFlowTitlesBeforeFirst();
      return;
    }

    if (getRootScroll() >= flowTriggers[flowTriggers.length - 1].end) {
      setFlowTitlesAfterLast();
    }
  };

  ScrollTrigger.addEventListener('refresh', syncFlowTitlesFromTriggerState);
  window.addEventListener('load', syncFlowTitlesFromTriggerState, { once: true });
}

/* NAV SCROLL */
const navbar = document.getElementById('navbar');
if (navbar) {
  const syncNavbarState = (scrollY) => {
    navbar.classList.toggle('scrolled', scrollY > 60);
  };

  addScrollSubscriber(syncNavbarState, { immediate: true });
}

/* HERO ENTRANCE */
createLayeredTween('from', '.hero-tag', { opacity: 0, y: 30, duration: 1, delay: 1.9, ease: 'power3.out' });
createLayeredTween('from', '.hero-desc', { opacity: 0, y: 30, duration: 1, delay: 1.9, ease: 'power3.out' });
createLayeredTween('from', '.hero-actions', { opacity: 0, y: 20, duration: 0.8, delay: 1.9, ease: 'power3.out' });
createLayeredTween('from', '.hero-img-frame', { opacity: 0, x: 60, duration: 1.2, delay: 1.9, ease: 'power3.out' });

/* HERO VIDEO */
const playHeroVideoOnce = (() => {
  const video = document.getElementById('hero-video');
  if (!video) {
    return () => {};
  }

  const disabledOnSmallScreensQuery = window.matchMedia('(max-width: 425px)');
  let videoReady = false;
  let playbackRequested = false;
  let playbackStarted = false;

  const revealVideo = () => {
    video.style.willChange = 'opacity';
    video.classList.add('is-ready');
    video.addEventListener('transitionend', () => {
      video.style.removeProperty('will-change');
    }, { once: true });
  };

  const hideVideo = () => {
    video.classList.remove('is-ready');
    video.style.removeProperty('will-change');
  };

  const disableVideoPlayback = () => {
    playbackStarted = false;
    video.pause();
    hideVideo();
  };

  const attemptPlayback = () => {
    if (disabledOnSmallScreensQuery.matches || !videoReady || !playbackRequested || playbackStarted) {
      return;
    }

    playbackStarted = true;

    try {
      video.currentTime = 0;
    } catch (error) {
      // Ignore initial seek errors while media data settles.
    }

    const playback = video.play();
    if (!playback || typeof playback.catch !== 'function') {
      return;
    }

    playback.catch(() => {
      playbackStarted = false;
    });
  };

  const requestPlayback = () => {
    playbackRequested = true;
    if (disabledOnSmallScreensQuery.matches) {
      disableVideoPlayback();
      return;
    }
    attemptPlayback();
  };

  const handleReady = () => {
    videoReady = true;
    video.pause();

    if (disabledOnSmallScreensQuery.matches) {
      hideVideo();
      return;
    }

    revealVideo();
    attemptPlayback();
  };

  video.loop = false;

  if (video.readyState >= 2) {
    handleReady();
  } else {
    video.addEventListener('loadeddata', handleReady, { once: true });
  }

  video.addEventListener('ended', () => {
    video.pause();
  });

  const syncVideoStateForViewport = () => {
    if (disabledOnSmallScreensQuery.matches) {
      disableVideoPlayback();
      return;
    }

    if (videoReady) {
      revealVideo();
    }

    attemptPlayback();
  };

  if (typeof disabledOnSmallScreensQuery.addEventListener === 'function') {
    disabledOnSmallScreensQuery.addEventListener('change', syncVideoStateForViewport);
  } else if (typeof disabledOnSmallScreensQuery.addListener === 'function') {
    disabledOnSmallScreensQuery.addListener(syncVideoStateForViewport);
  }

  return requestPlayback;
})();

/* SCROLL REVEALS */
gsap.utils
  .toArray('.reveal')
  .filter((el) => !el.closest('#about') && !el.closest('#skills'))
  .forEach((el) => {
  gsap.from(el, {
    opacity: 0,
    y: 48,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true }
  });
});

/* SKILL REVEALS */
gsap.utils.toArray('#skills .skill-item').forEach((item) => {
  const fill = item.querySelector('.skill-bar-fill');

  gsap.from(item, {
    opacity: 0,
    y: 48,
    duration: 0.85,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: item,
      start: 'top 86%',
      once: true,
      onEnter: () => {
        if (fill) {
          fill.style.transform = `scaleX(${Number(item.dataset.level || 50) / 100})`;
        }
      }
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

  const heroTargets = [heroContent, heroImage, heroIndicator].filter(Boolean);
  const aboutAnimatedTargets = [aboutTransition, aboutLabel, aboutTitle, aboutGrid].filter(Boolean);
  const aboutCompositeTargets = [...heroTargets, ...aboutAnimatedTargets];

  const aboutHandoffTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: aboutSection,
      start: 'top bottom',
      end: 'top 44%',
      scrub: 1.15,
      invalidateOnRefresh: true,
      onToggle: (self) => {
        if (self.isActive) {
          setWillChange([...aboutCompositeTargets, aboutLine], 'transform, opacity');
          return;
        }

        clearWillChange([...aboutCompositeTargets, aboutLine]);
      }
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

  const createAboutWarpTrigger = (config) => {
    aboutWarpProgress = 0;
    aboutWarpDirection = 1;

    return ScrollTrigger.create({
      trigger: aboutSection,
      scrub: 1,
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
      },
      ...config
    });
  };

  const aboutWarpMedia = gsap.matchMedia();

  aboutWarpMedia.add('(max-width: 768px)', () => createAboutWarpTrigger({
    start: 'top bottom',
    end: 'bottom top'
  }));

  aboutWarpMedia.add('(min-width: 769px)', () => createAboutWarpTrigger({
    start: 'top 72%',
    end: 'bottom 22%'
  }));
}

/* CONTACT PARALLAX */
gsap.to('.contact-big', {
  y: -80,
  ease: 'none',
  scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'bottom top', scrub: true }
});

/* LOADER */
window.addEventListener('load', () => {
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true });
  } else {
    window.scrollTo(0, 0);
  }

  const loader = document.getElementById('loader');
  const bar = document.getElementById('loader-bar');
  const counter = document.getElementById('loader-counter');
  const name = document.getElementById('loader-name');

  gsap.to(name, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 });

  const loaderState = { progress: 0 };

  gsap.to(loaderState, {
    progress: 100,
    duration: performanceProfile.lowEnd ? 2.2 : 1.85,
    ease: 'power2.out',
    onUpdate: () => {
      const progress = Math.min(100, loaderState.progress);
      bar.style.transform = `scaleX(${progress / 100})`;
      counter.textContent = String(Math.floor(progress)).padStart(3, '0');
    },
    onComplete: () => {
      gsap.delayedCall(0.3, () => {
        gsap.to(loader, {
          yPercent: -100,
          duration: 0.9,
          ease: 'power4.inOut',
          onComplete: () => {
            loader.style.display = 'none';
            playHeroVideoOnce();
            heroTitleReady = true;
            animateTitleTogether(document.querySelector('.hero-title'));
          }
        });
      });
    }
  });
});

/* ABOUT STAR WARP */
(() => {
  const container = document.getElementById('about-star-container');
  const section = document.getElementById('about');
  if (!container || !section) {
    return;
  }

  const stars = [];
  let containerWidth = 0;
  let containerHeight = 0;
  let lastScrollY = window.scrollY;
  let active = false;
  let isVisible = false;
  let resizeObserver = null;

  function applyStarVisual(star, y, opacity) {
    star.el.style.transform = `translate3d(${star.x}px,${y}px,0)`;
    star.el.style.opacity = opacity;
  }

  function buildStars() {
    container.innerHTML = '';
    stars.length = 0;
    containerWidth = container.clientWidth;
    containerHeight = container.clientHeight;

    const count = performanceProfile.lowEnd
      ? (window.innerWidth < 1280 ? 18 : 28)
      : (window.innerWidth < 1280 ? 40 : 56);
    for (let i = 0; i < count; i += 1) {
      const star = document.createElement('div');
      star.className = 'about-star';

      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const isStatic = Math.random() < 0.3;
      const speed = isStatic ? 0 : 0.2 + Math.random() * 0.6;
      const size = isStatic ? 1 + Math.random() : 1 + Math.random() * 2;
      const xPx = (x / 100) * containerWidth;
      const yPx = (y / 100) * containerHeight;

      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.setProperty('--duration', `${2 + Math.random() * 4}s`);
      star.style.animationDelay = `${Math.random() * 5}s`;
      // Garante que o transform inicial já está no elemento antes de entrar na GPU layer
      star.style.transform = `translate3d(${xPx}px,${yPx}px,0)`;

      container.appendChild(star);
      stars.push({ el: star, initialY: y, speed, x: xPx });
      applyStarVisual({ el: star, x: xPx }, yPx, 0.8);
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
    const travelBoost = Math.max(0, Math.min(Math.abs(velocity) * 0.22 + aboutWarpProgress * 22, 40));
    const driftDirection = velocity === 0 ? -aboutWarpDirection : (velocity >= 0 ? -1 : 1);

    stars.forEach((star) => {
      if (star.speed === 0) {
        applyStarVisual(
          star,
          star.initialY / 100 * containerHeight,
          Math.min(1, 0.35 + Math.abs(velocity) * 0.02 + aboutWarpProgress * 0.25)
        );
        return;
      }

      let pos = (star.initialY - scroll * star.speed * (0.11 * progressBoost) + driftDirection * travelBoost * star.speed) % 100;
      if (pos < 0) {
        pos += 100;
      }

      applyStarVisual(
        star,
        pos / 100 * containerHeight,
        Math.min(1, 0.52 + Math.abs(velocity) * 0.05 + star.speed * 0.4 + aboutWarpProgress * 0.18)
      );
    });
  }

  const handleScroll = throttleWithAnimationFrame(() => {
    if (!active) {
      return;
    }
    updateStars();
  });

  function start() {
    if (active || document.hidden || window.innerWidth <= 900) {
      return;
    }

    active = true;
    section.classList.add('about-active');
    lastScrollY = window.scrollY;
    updateStars();
  }

  function stop() {
    active = false;
    section.classList.remove('about-active');
  }

  buildStars();
  const rebuildStars = throttleWithAnimationFrame(buildStars);

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(rebuildStars);
    resizeObserver.observe(container);
  } else {
    window.addEventListener('resize', rebuildStars, { passive: true });
  }
  addScrollSubscriber(handleScroll);

  const observer = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
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
    } else if (window.innerWidth > 900 && isVisible) {
      start();
    }
  });
})();
