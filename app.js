/* =========================================================
   Arterra — app.js (v2)
   Чистый JS: меню, ревилы/стаггер, параллакс, магнитные кнопки,
   счётчики, маркиза, год и канвас-плейсхолдер.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // ---------- 0) Helpers ----------
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  // ---------- 1) Sticky header ----------
  const header = document.querySelector('.site-header');
  let lastY = 0;
  const onScrollHeader = () => {
    const y = window.scrollY || 0;
    if (y > 12 && y > lastY) header?.classList.add('scrolled');
    else if (y < 12) header?.classList.remove('scrolled');
    lastY = y;
  };
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  // ---------- 2) Mobile menu ----------
  const menuBtn = document.getElementById('menuToggle');
  const drawer = document.getElementById('mobileDrawer');
  if (menuBtn && drawer) {
    const toggle = (open) => {
      const willOpen = open ?? drawer.hidden;
      drawer.hidden = !willOpen;
      menuBtn.setAttribute('aria-expanded', String(willOpen));
      document.body.classList.toggle('menu-open', willOpen);
    };
    menuBtn.addEventListener('click', () => toggle());
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));
  }

  // ---------- 3) Stagger: проставим задержки детям заранее ----------
  document.querySelectorAll('[data-stagger]').forEach(container => {
    const base = parseFloat(container.dataset.delay || 0);
    const step = 0.08;
    Array.from(container.children).forEach((el, i) => {
      el.dataset.delay = (base + i * step).toFixed(2);
      el.setAttribute('data-reveal', '');
    });
  });

  // ---------- 4) Reveal (IntersectionObserver) ----------
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const delay = parseFloat(el.dataset.delay || 0);
      el.style.transition = `opacity .8s cubic-bezier(.16,1,.3,1) ${delay}s, transform .8s cubic-bezier(.16,1,.3,1) ${delay}s`;
      el.style.opacity = '1';
      el.style.transform = 'none';
      revealer.unobserve(el);
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('[data-reveal]').forEach(el => revealer.observe(el));

  // ---------- 5) Parallax ----------
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length) {
    let ticking = false;
    const apply = () => {
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.speed || 0.15);
        const rect = el.getBoundingClientRect();
        const offset = rect.top + rect.height / 2 - window.innerHeight / 2;
        el.style.transform = `translate3d(0, ${offset * clamp(speed, -1, 1)}px, 0)`;
      });
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    apply();
  }

  // ---------- 6) Magnetic ----------
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    const strength = 0.25; // 0..1
    const radius = 120;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      }
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  // ---------- 7) CountUp ----------
  const counters = document.querySelectorAll('[data-countup]');
  const ioCount = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const to = parseFloat(el.dataset.to || '0');
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      const start = performance.now();
      const tick = (t) => {
        const p = clamp((t - start) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(to * eased);
        el.textContent = `${val}${suffix}`;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      ioCount.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(el => ioCount.observe(el));

  // ---------- 8) Marquee ----------
  document.querySelectorAll('[data-marquee]').forEach(mq => {
    const speed = parseFloat(mq.dataset.speed || '60'); // px/s
    const tracks = mq.querySelectorAll('.marquee__track');
    if (!tracks.length) return;
    let x = 0;
    const half = () => (tracks[0].scrollWidth || 1);
    const step = () => {
      x -= speed / 60;
      const w = half();
      if (x <= -w) x = 0;
      tracks.forEach(tr => tr.style.transform = `translate3d(${x}px,0,0)`);
      requestAnimationFrame(step);
    };
    step();
  });

  // ---------- 9) Footer year ----------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- 10) Canvas placeholder (под 3D-боб) ----------
  const beanCanvas = document.getElementById('beanCanvas');
  if (beanCanvas) {
    const ctx = beanCanvas.getContext('2d');
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      beanCanvas.width = Math.floor(beanCanvas.clientWidth * dpr);
      beanCanvas.height = Math.floor(beanCanvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); window.addEventListener('resize', resize);

    let t = 0;
    const loop = () => {
      const w = beanCanvas.clientWidth;
      const h = beanCanvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // мягкое свечение как заглушка 3D
      const r = 90 + Math.sin(t) * 12;
      const grad = ctx.createRadialGradient(w * 0.55, h * 0.45, 0, w * 0.5, h * 0.5, r);
      grad.addColorStop(0, 'rgba(110,224,255,0.16)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      t += 0.02;
      requestAnimationFrame(loop);
    };
    loop();
  }
});
