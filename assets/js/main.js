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

  const isProjectsTitle = Boolean(title.closest('#projects'));

  title.dataset.lettersReady = 'true';

  if (isProjectsTitle) {
    title.classList.remove('title-motion');
    titleCharsMap.set(title, []);
    return;
  }

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
let projectsStackTriggerRef = null;
let applyFlowTitleStateRef = null;

document.querySelectorAll('.hero-title, .section-title').forEach((title) => {
  const isHeroTitle = title.classList.contains('hero-title');
  const isSkillsTitle = Boolean(title.closest('#skills'));
  const isProjectsTitle = Boolean(title.closest('#projects'));
  const isContactTitle = Boolean(title.closest('#contact'));
  const trigger = title.closest('section, div[id]') || title;

  const chars = titleCharsMap.get(title) || [];

  if (isProjectsTitle) {
    title.classList.remove('title-motion');
    title.removeAttribute('data-title-state');
    title.style.removeProperty('opacity');
    title.style.removeProperty('transform');
    title.style.removeProperty('will-change');
    return;
  }

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

  applyFlowTitleStateRef = applyFlowTitleState;

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
    const isProjects = item.section.id === 'projects';

    // Projects title is controlled by stackTrigger callbacks directly
    if (isProjects) {
      return null;
    }

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
  const syncNavbarState = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };

  const syncNavbarStateThrottled = throttleWithAnimationFrame(syncNavbarState);

  window.addEventListener('scroll', syncNavbarStateThrottled, { passive: true });
  window.addEventListener('load', syncNavbarState, { once: true });
}

/* HERO ENTRANCE */
createLayeredTween('from', '.hero-tag', { opacity: 0, y: 30, duration: 1, delay: 1.9, ease: 'power3.out' });
createLayeredTween('from', '.hero-desc', { opacity: 0, y: 30, duration: 1, delay: 1.9, ease: 'power3.out' });
createLayeredTween('from', '.hero-actions', { opacity: 0, y: 20, duration: 0.8, delay: 1.9, ease: 'power3.out' });
createLayeredTween('from', '.hero-img-frame', { opacity: 0, x: 60, duration: 1.2, delay: 1.9, ease: 'power3.out' });

/* SCROLL REVEALS */
gsap.utils
  .toArray('.reveal')
  .filter((el) => !el.closest('#about') && (!el.closest('#projects') || window.innerWidth <= 900))
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
      fill.style.transform = `scaleX(${Number(item.dataset.level || 50) / 100})`;
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
  const aboutAnimatedTargets = [aboutTransition, aboutLabel, aboutTitle, aboutGrid].filter(Boolean);
  const aboutCompositeTargets = [...heroTargets, ...heroBackgroundTargets, ...aboutAnimatedTargets];

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

/* PROJECTS STACK */
(() => {
  const section = document.getElementById('projects');
  const content = section?.querySelector('.projects-content');
  const grid = section?.querySelector('.projects-grid');
  const cards = grid ? Array.from(grid.querySelectorAll('.project-card')) : [];
  if (!section || !content || !grid || cards.length < 2) {
    return;
  }

  const stackGap = 18;
  const stackScaleStep = 0.06;
  const stackOpacityStep = 0.15;
  const stackTopInset = 12;
  const minScale = 0.72;
  const minOpacity = 0.12;
  const maxRotate = 3.5; // degrees alternating
  const maxXOffset = 14; // px alternating horizontal drift
  const maxBlur = 4; // px blur on back cards
  const maxOrder = cards.length - 1;
  const getStackStickyTop = () => Math.max(96, Math.min(148, window.innerHeight * 0.14));
  const getStackLeadIn = () => Math.max(64, Math.min(96, window.innerHeight * 0.085));
  const getStackLeadOut = () => Math.max(140, Math.min(220, window.innerHeight * 0.22));
  const getStackScrollStep = () => Math.max(190, Math.min(260, window.innerHeight * 0.26));
  const setters = cards.map((card) => ({
    y: gsap.quickSetter(card, 'y', 'px'),
    x: gsap.quickSetter(card, 'x', 'px'),
    scale: gsap.quickSetter(card, 'scale'),
    rotate: gsap.quickSetter(card, 'rotate', 'deg'),
    opacity: gsap.quickSetter(card, 'opacity'),
    filter: (v) => { card.style.filter = v > 0 ? `blur(${v.toFixed(2)}px)` : ''; }
  }));

  const getOrder = (index, frontIndex) => (
    (index - frontIndex + cards.length) % cards.length
  );

  const getInterpolatedOrder = (index, baseIndex, mix) => {
    const currentOrder = getOrder(index, baseIndex);

    if (baseIndex >= maxOrder) {
      return currentOrder;
    }

    if (currentOrder === 0) {
      return mix * maxOrder;
    }

    return currentOrder - mix;
  };

  const getStackTotalDistance = () => (
    getStackLeadIn() + (getStackScrollStep() * maxOrder) + getStackLeadOut()
  );

  const syncStackMetrics = () => {
    const tallestCard = cards.reduce(
      (currentMax, card) => Math.max(currentMax, card.offsetHeight),
      0
    );

    const stageHeight = Math.ceil(tallestCard + stackTopInset + maxOrder * stackGap + 16);

    grid.style.height = `${stageHeight}px`;
    section.style.setProperty('--projects-stack-stage-height', `${stageHeight}px`);
    section.style.setProperty('--projects-stack-scroll-distance', `${Math.ceil(getStackTotalDistance())}px`);
    section.style.setProperty('--projects-stack-sticky-top', `${Math.round(getStackStickyTop())}px`);
  };

  // Stack UI elements
  const stackUI = section.querySelector('.stack-ui');
  const stackCurrentEl = section.querySelector('.stack-current');
  const stackTotalEl = section.querySelector('.stack-total');
  const stackDotsEl = section.querySelector('.stack-dots');

  const syncFrontCard = (orders) => {
    let frontIndex = 0;
    let smallestOrder = Number.POSITIVE_INFINITY;

    orders.forEach((order, index) => {
      if (order < smallestOrder) {
        smallestOrder = order;
        frontIndex = index;
      }
    });

    cards.forEach((card, index) => {
      const isFront = index === frontIndex;
      card.classList.toggle('is-front', isFront);
      card.setAttribute('aria-hidden', isFront ? 'false' : 'true');
      card.style.zIndex = String(1000 - Math.round(orders[index] * 100));
    });

    // Update counter and dots
    if (stackCurrentEl) {
      stackCurrentEl.textContent = String(frontIndex + 1).padStart(2, '0');
    }
    if (stackDotsEl) {
      stackDotsEl.querySelectorAll('.stack-dot').forEach((dot, i) => {
        dot.classList.toggle('is-active', i === frontIndex);
      });
    }
  };

  const renderStack = (progress = 0) => {
    const virtualIndex = progress * maxOrder;
    const baseIndex = Math.floor(virtualIndex);
    const mix = Math.min(1, virtualIndex - baseIndex);
    const orders = [];

    cards.forEach((card, index) => {
      const order = getInterpolatedOrder(index, baseIndex, mix);
      const y = stackTopInset + order * stackGap;
      const scale = Math.max(minScale, 1 - order * stackScaleStep);
      const opacity = Math.max(minOpacity, 1 - order * stackOpacityStep);

      // Alternating rotation: odd cards lean right, even lean left
      const rotateDir = (index % 2 === 0 ? 1 : -1);
      const rotate = order === 0 ? 0 : Math.min(order * 1.2, maxRotate) * rotateDir;

      // Alternating horizontal drift
      const xDir = (index % 2 === 0 ? 1 : -1);
      const x = order === 0 ? 0 : Math.min(order * 4, maxXOffset) * xDir;

      // Blur increases with distance
      const blur = order === 0 ? 0 : Math.min(order * 1.2, maxBlur);

      orders[index] = order;
      setters[index].y(y);
      setters[index].x(x);
      setters[index].scale(scale);
      setters[index].rotate(rotate);
      setters[index].opacity(opacity);
      setters[index].filter(blur);
    });

    syncFrontCard(orders);
  };

  const getStackProgress = (triggerProgress) => {
    const leadIn = getStackLeadIn();
    const leadOut = getStackLeadOut();
    const travel = getStackScrollStep() * maxOrder;
    const total = leadIn + travel + leadOut;
    const start = leadIn / total;
    const end = (leadIn + travel) / total;

    if (triggerProgress <= start) {
      return 0;
    }

    if (triggerProgress >= end) {
      return 1;
    }

    return (triggerProgress - start) / (end - start);
  };

  const projectsStackMedia = gsap.matchMedia();

  projectsStackMedia.add('(min-width: 901px)', () => {
    section.classList.add('projects-stack');
    syncStackMetrics();

    gsap.set(cards, {
      xPercent: 0,
      x: 0,
      rotate: 0,
      transformOrigin: '50% 0%',
      force3D: true
    });

    // Init stack UI
    if (stackTotalEl) stackTotalEl.textContent = String(cards.length).padStart(2, '0');
    if (stackDotsEl) {
      stackDotsEl.innerHTML = '';
      cards.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'stack-dot' + (i === 0 ? ' is-active' : '');
        stackDotsEl.appendChild(dot);
      });
    }

    renderStack(0);

    let stackTrigger = null;

    stackTrigger = ScrollTrigger.create({
      trigger: section,
      start: () => `top top`,
      end: () => `+=${getStackTotalDistance()}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.22,
      invalidateOnRefresh: true,
      onRefreshInit: syncStackMetrics,
      onRefresh: () => renderStack(getStackProgress(stackTrigger ? stackTrigger.progress : 0)),
      onToggle: (self) => {
        if (self.isActive) {
          setWillChange(cards, 'transform, opacity');
          return;
        }

        clearWillChange(cards);
      },
      onUpdate: (self) => renderStack(getStackProgress(self.progress))
    });

    projectsStackTriggerRef = stackTrigger;
    ScrollTrigger.refresh();

    return () => {
      stackTrigger?.kill();
      projectsStackTriggerRef = null;
      section.classList.remove('projects-stack');
      section.style.removeProperty('--projects-stack-stage-height');
      section.style.removeProperty('--projects-stack-scroll-distance');
      section.style.removeProperty('--projects-stack-sticky-top');
      grid.style.removeProperty('height');
      cards.forEach((card) => {
        card.classList.remove('is-front');
        card.removeAttribute('aria-hidden');
        card.style.removeProperty('z-index');
      });
      clearWillChange(cards);
      gsap.set(cards, { clearProps: 'xPercent,x,y,scale,opacity,rotate,transformOrigin,filter' });
      cards.forEach((card) => { card.style.filter = ''; });
    };
  });
})();

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
    bar.style.transform = `scaleX(${progress / 100})`;
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

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) {
    return;
  }

  let width;
  let height;
  let dpr = 1;
  let dots = [];
  let isActive = false;
  let isVisible = false;
  let rafId = null;
  let currentConfig = null;
  const hue = 230;

  function getHeroBgConfig() {
    if (performanceProfile.lowEnd) {
      if (window.innerWidth <= 768) {
        return {
          maxDots: 6,
          maxWidth: 6,
          minWidth: 1.2,
          hueDifference: 20,
          glow: 3,
          maxSpeed: 0.1,
          minSpeed: 0.02,
          glowOpacity: 0.9,
          satMid: 54,
          lightMid: 54
        };
      }

      return {
        maxDots: 14,
        maxWidth: 10,
        minWidth: 1.6,
        hueDifference: 34,
        glow: 4,
        maxSpeed: 0.18,
        minSpeed: 0.03,
        glowOpacity: 0.64,
        satMid: 62,
        lightMid: 58
      };
    }

    if (window.innerWidth <= 768) {
      return {
        maxDots: 10,
        maxWidth: 8,
        minWidth: 1.5,
        hueDifference: 24,
        glow: 5,
        maxSpeed: 0.14,
        minSpeed: 0.025,
        glowOpacity: 1.42,
        satMid: 58,
        lightMid: 56
      };
    }

    return {
      maxDots: 28,
      maxWidth: 12,
      minWidth: 2,
      hueDifference: 50,
      glow: 6,
      maxSpeed: 0.24,
      minSpeed: 0.04,
      glowOpacity: 0.8,
      satMid: 70,
      lightMid: 60
    };
  }

  function createDotSprite(dot, config) {
    const padding = config.glow * 4;
    const drawWidth = dot.w + padding * 2;
    const drawHeight = dot.h + padding * 2;
    const buffer = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(Math.ceil(drawWidth * dpr), Math.ceil(drawHeight * dpr))
      : document.createElement('canvas');

    buffer.width = Math.ceil(drawWidth * dpr);
    buffer.height = Math.ceil(drawHeight * dpr);

    const bufferCtx = buffer.getContext('2d');
    if (!bufferCtx) {
      return {
        image: buffer,
        drawWidth,
        drawHeight,
        offsetX: padding,
        offsetY: padding
      };
    }

    bufferCtx.scale(dpr, dpr);

    const gradient = bufferCtx.createLinearGradient(padding, padding, padding + dot.w, padding + dot.h);
    gradient.addColorStop(0, `hsla(${dot.c},50%,50%,0)`);
    gradient.addColorStop(0.2, `hsla(${dot.c + 20},50%,50%,.32)`);
    gradient.addColorStop(0.5, `hsla(${dot.c + 50},${config.satMid}%,${config.lightMid}%,.52)`);
    gradient.addColorStop(0.8, `hsla(${dot.c + 80},50%,50%,.32)`);
    gradient.addColorStop(1, `hsla(${dot.c + 100},50%,50%,0)`);

    bufferCtx.shadowBlur = config.glow;
    bufferCtx.shadowColor = `hsla(${dot.c},50%,50%,.65)`;
    bufferCtx.fillStyle = gradient;
    bufferCtx.fillRect(padding, padding, dot.w, dot.h);

    return {
      image: buffer,
      drawWidth,
      drawHeight,
      offsetX: padding,
      offsetY: padding
    };
  }

  function resize() {
    currentConfig = getHeroBgConfig();
    width = section.clientWidth;
    height = Math.round(section.getBoundingClientRect().height || window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, performanceProfile.lowEnd ? 1 : 1.5);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    dots = [];
    pushDots(currentConfig);
    bgGlow.style.background = `radial-gradient(ellipse at center, hsla(${hue},50%,50%,${currentConfig.glowOpacity}) 0%,rgba(0,0,0,0) 100%)`;
  }

  function pushDots(config) {
    for (let i = 1; i < config.maxDots; i += 1) {
      const dot = {
        x: Math.random() * width,
        y: (Math.random() * height) / 2,
        h: Math.random() * (height * 0.9 - height * 0.5) + height * 0.5,
        w: Math.random() * (config.maxWidth - config.minWidth) + config.minWidth,
        c: Math.random() * (config.hueDifference * 2) + (hue - config.hueDifference),
        m: Math.random() * (config.maxSpeed - config.minSpeed) + config.minSpeed
      };

      dot.sprite = createDotSprite(dot, config);
      dots.push(dot);
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
      ctx.drawImage(
        dot.sprite.image,
        dot.x - dot.sprite.offsetX,
        dot.y - dot.sprite.offsetY,
        dot.sprite.drawWidth,
        dot.sprite.drawHeight
      );
      dot.x += dot.m;

      if (dot.x > width + currentConfig.maxWidth) {
        dot.x = -currentConfig.maxWidth;
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

  const syncCanvasSize = throttleWithAnimationFrame(resize);

  resize();

  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(syncCanvasSize);
    resizeObserver.observe(section);
  } else {
    window.addEventListener('resize', syncCanvasSize, { passive: true });
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
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
    } else if (isVisible) {
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
  let containerWidth = 0;
  let containerHeight = 0;
  let lastScrollY = window.scrollY;
  let active = false;
  let isVisible = false;
  let resizeObserver = null;

  function applyStarVisual(star, y, opacity) {
    star.el.style.setProperty('--star-x', `${star.x}px`);
    star.el.style.setProperty('--star-y', `${y}px`);
    star.el.style.opacity = `${opacity}`;
  }

  function buildStars() {
    container.innerHTML = '';
    stars.length = 0;
    containerWidth = container.clientWidth;
    containerHeight = container.clientHeight;

    const count = performanceProfile.lowEnd
      ? (window.innerWidth < 1280 ? 24 : 36)
      : (window.innerWidth < 1280 ? 56 : 80);
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
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(throttleWithAnimationFrame(buildStars));
    resizeObserver.observe(container);
  } else {
    window.addEventListener('resize', throttleWithAnimationFrame(buildStars), { passive: true });
  }
  window.addEventListener('scroll', handleScroll, { passive: true });

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
