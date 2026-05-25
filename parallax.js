/* ============================================================
   IREAL · PARALLAX + REVEAL ENGINE
   ============================================================ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----- PARALLAX -----
  const items = [...document.querySelectorAll('[data-parallax]')];
  // Pre-parse data attributes for perf
  items.forEach(el => {
    el._speed = parseFloat(el.dataset.speed || '0.6');
    el._dy = parseFloat(el.dataset.dy || '1');
    el._dx = parseFloat(el.dataset.dx || '0');
    el._rot = parseFloat(el.dataset.rot || '0');
    // Preserve any existing base transform from inline style/CSS
    const cs = getComputedStyle(el);
    el._baseTransform = cs.transform === 'none' ? '' : cs.transform;
  });

  let ticking = false;
  let lastY = window.scrollY;

  function updateParallax() {
    ticking = false;
    if (reduced) return;
    const vh = window.innerHeight;
    const vhalf = vh / 2;

    items.forEach(el => {
      const rect = el.getBoundingClientRect();
      // Only update elements within ±1.5vh of viewport
      if (rect.bottom < -vh * 0.5 || rect.top > vh * 1.5) return;

      const center = rect.top + rect.height / 2;
      const offset = (center - vhalf);
      const factor = (1 - el._speed);

      const ty = -offset * factor * el._dy;
      const tx = -offset * factor * el._dx;
      const rot = -offset * factor * el._rot * 0.02;

      // Compose with base transform (so original CSS rotate/translate is preserved)
      el.style.transform = `${el._baseTransform} translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) rotate(${rot.toFixed(3)}deg)`;
    });
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateParallax);
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', () => {
    // recompute base transforms on resize
    items.forEach(el => {
      el.style.transform = '';
      const cs = getComputedStyle(el);
      el._baseTransform = cs.transform === 'none' ? '' : cs.transform;
    });
    requestUpdate();
  });

  // ----- REVEAL ON SCROLL -----
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  reveals.forEach(el => io.observe(el));

  // ----- PROGRESS RAIL -----
  const railFill = document.getElementById('rail-fill');
  function updateRail() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
    if (railFill) railFill.style.width = (p * 100).toFixed(2) + '%';
  }
  window.addEventListener('scroll', updateRail, { passive: true });
  updateRail();

  // ----- NAV HIDE ON SCROLL DOWN -----
  const nav = document.getElementById('nav');
  let lastScroll = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 200 && y > lastScroll + 4) {
      nav?.classList.add('up');
    } else if (y < lastScroll - 4 || y < 100) {
      nav?.classList.remove('up');
    }
    lastScroll = y;
  }, { passive: true });

  // ----- BUILD MINI CALENDAR (rhythm feature) -----
  function buildCalendar() {
    const grid = document.querySelector('.cal-grid-mini');
    if (!grid) return;
    // Weekday header
    const wd = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    wd.forEach(d => {
      const e = document.createElement('div');
      e.className = 'day';
      e.style.background = 'transparent';
      e.style.border = '0';
      e.style.color = 'var(--mute)';
      e.style.fontSize = '8px';
      e.style.textAlign = 'center';
      e.style.padding = '2px';
      e.style.aspectRatio = 'auto';
      e.textContent = d;
      grid.appendChild(e);
    });
    // 28 days, mark some as published
    const pub = new Set([2, 5, 8, 11, 14, 17, 20, 23, 26]);
    for (let i = 1; i <= 28; i++) {
      const e = document.createElement('div');
      e.className = 'day' + (pub.has(i) ? ' pub' : '');
      e.textContent = String(i).padStart(2, '0');
      grid.appendChild(e);
    }
  }
  buildCalendar();

  // ----- HERO MAGNETIC TILT (subtle) -----
  const collage = document.querySelector('.hero .collage');
  if (collage && !reduced) {
    const targets = collage.querySelectorAll('.sticky, .app-tile, .book-stack');
    let mouseX = 0, mouseY = 0;
    collage.addEventListener('mousemove', (e) => {
      const rect = collage.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top) / rect.height - 0.5;
      targets.forEach((el, i) => {
        const depth = (i % 3 + 1) * 6;
        // Use CSS variable so parallax engine doesn't fight us
        el.style.setProperty('--mx', `${mouseX * depth}px`);
        el.style.setProperty('--my', `${mouseY * depth}px`);
      });
    });
    collage.addEventListener('mouseleave', () => {
      targets.forEach(el => {
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
      });
    });
  }

  // ----- INITIAL TICK -----
  updateParallax();

})();
