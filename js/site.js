/* Portfolio — shared behaviour (no dependencies).
   Theme and language are independent:
   - language lives in the URL (/ and /ua/), never in storage;
   - theme lives in localStorage ("theme" + "darkTheme") and is applied in <head> before paint. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var THEMES = ['classic', 'cyber', 'golden'];
  var DARK = ['golden', 'cyber'];
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) { return localStorage.getItem(k); } localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- Theme (light / dark + dark palette) ---------- */
  var modeBtns = $$('.theme-seg__btn');
  var paletteBtn = $('#palette-btn');
  function syncAug(name) {
    $$('[data-aug]').forEach(function (el) {
      if (name === 'cyber') { el.setAttribute('data-augmented-ui', el.getAttribute('data-aug')); }
      else { el.removeAttribute('data-augmented-ui'); }
    });
  }
  function paletteLabel(name) {
    if (!paletteBtn) { return; }
    var names = {}; try { names = JSON.parse(paletteBtn.getAttribute('data-names')); } catch (e) {}
    var next = name === 'cyber' ? 'golden' : 'cyber';
    paletteBtn.setAttribute('aria-label', (paletteBtn.getAttribute('data-tpl') || '{cur} / {next}')
      .replace('{cur}', names[name] || name).replace('{next}', names[next] || next));
  }
  function applyTheme(name, persist, animate) {
    if (THEMES.indexOf(name) < 0) { name = 'classic'; }
    if (animate && !reduce) { root.classList.add('theme-anim'); setTimeout(function () { root.classList.remove('theme-anim'); }, 480); }
    root.setAttribute('data-theme', name);
    syncAug(name);
    var dark = name !== 'classic';
    modeBtns.forEach(function (b) { b.setAttribute('aria-pressed', (b.getAttribute('data-mode') === 'dark') === dark ? 'true' : 'false'); });
    if (dark) { paletteLabel(name); }
    if (persist) { store('theme', name); if (dark) { store('darkTheme', name); } }
  }
  modeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var wantDark = b.getAttribute('data-mode') === 'dark';
      var last = store('darkTheme'); if (DARK.indexOf(last) < 0) { last = 'golden'; }
      applyTheme(wantDark ? last : 'classic', true, true);
    });
  });
  if (paletteBtn) {
    paletteBtn.addEventListener('click', function () {
      applyTheme(root.getAttribute('data-theme') === 'cyber' ? 'golden' : 'cyber', true, true);
    });
  }
  window.addEventListener('storage', function (e) { if (e.key === 'theme' && e.newValue) { applyTheme(e.newValue, false, true); } });
  var initial = root.getAttribute('data-theme');
  applyTheme(THEMES.indexOf(initial) < 0 ? 'classic' : initial, false, false);

  /* ---------- Language links keep the current hash (e.g. a case-study tab) ---------- */
  var langLinks = $$('.lang-btn[data-base]');
  function syncLangHash() { langLinks.forEach(function (a) { a.href = a.getAttribute('data-base') + (location.hash || ''); }); }
  syncLangHash(); window.addEventListener('hashchange', syncLangHash);

  /* ---------- Mobile menu ---------- */
  var burger = $('#burger-btn'), menu = $('#mobile-menu');
  if (burger && menu) {
    var closeMenu = function () { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', burger.getAttribute('data-open')); };
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', burger.getAttribute(open ? 'data-close' : 'data-open'));
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); burger.focus(); } });
  }

  /* ---------- Accordion ---------- */
  $$('.accordion-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var acc = btn.closest('.accordion');
      var open = acc.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- Scroll reveal + count-up ---------- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    if (isNaN(to) || reduce) { return; }
    var prefix = el.getAttribute('data-prefix') || '', suffix = el.getAttribute('data-suffix') || '';
    var t0 = null, dur = 1400;
    function step(t) {
      if (t0 === null) { t0 = t; }
      var p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.firstChild.nodeValue = prefix + Math.round(to * eased) + suffix;
      if (p < 1) { requestAnimationFrame(step); }
    }
    el.firstChild.nodeValue = prefix + '0' + suffix;
    requestAnimationFrame(step);
  }
  var reveal = $$('.fade-up');
  if (!('IntersectionObserver' in window)) {
    reveal.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        en.target.classList.add('visible');
        $$('[data-count]', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveal.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Active section in nav ---------- */
  var navLinks = $$('[data-nav]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var map = {}; navLinks.forEach(function (a) { var id = a.getAttribute('data-nav'); (map[id] = map[id] || []).push(a); });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
          (map[en.target.id] || []).forEach(function (a) { a.setAttribute('aria-current', 'true'); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) { spy.observe(s); } });
  }

  /* ---------- Tabs (generic: any [data-tabs]) ---------- */
  $$('[data-tabs]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box), panels = $$('[role="tabpanel"]', box);
    var list = $('[role="tablist"]', box), useHash = box.hasAttribute('data-hash'), progress = box.hasAttribute('data-progress');
    var idOf = function (t) { return t.getAttribute('data-tab-id'); };
    function activate(i, opts) {
      opts = opts || {};
      i = Math.max(0, Math.min(tabs.length - 1, i));
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle('is-done', k < i);
      });
      panels.forEach(function (p, k) {
        var on = k === i;
        if (on && p.hidden) { p.hidden = false; if (!reduce) { p.classList.add('enter'); p.addEventListener('animationend', function h() { p.classList.remove('enter'); p.removeEventListener('animationend', h); }); } }
        else if (!on) { p.hidden = true; }
      });
      if (progress && list) { list.style.setProperty('--p', tabs.length > 1 ? i / (tabs.length - 1) : 0); }
      $$('[data-tab-go]', box).forEach(function (b) { var prev = b.getAttribute('data-tab-go') === 'prev'; b.disabled = prev ? i === 0 : i === tabs.length - 1; });
      if (opts.focus) { tabs[i].focus(); }
      if (list && list.scrollWidth > list.clientWidth) { tabs[i].scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); }
      if (useHash && opts.hash !== false) { try { history.replaceState(null, '', '#' + idOf(tabs[i])); } catch (e) {} syncLangHash(); }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { activate(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.indexOf(t), to = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') { to = (n + 1) % tabs.length; }
        else if (k === 'ArrowLeft' || k === 'ArrowUp') { to = (n - 1 + tabs.length) % tabs.length; }
        else if (k === 'Home') { to = 0; } else if (k === 'End') { to = tabs.length - 1; }
        if (to !== null) { e.preventDefault(); activate(to, { focus: true }); }
      });
    });
    $$('[data-tab-go]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var cur = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
        var dir = b.getAttribute('data-tab-go');
        activate(cur + (dir === 'next' ? 1 : -1));
        if (useHash) { box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
        else {                                   /* keep keyboard focus inside the now-visible stage card */
          var vis = panels.filter(function (p) { return !p.hidden; })[0];
          var same = vis && vis.querySelector('[data-tab-go="' + dir + '"]:not(:disabled)'), other = vis && vis.querySelector('[data-tab-go]:not(:disabled)');
          (same || other || tabs[tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; })]).focus();
        }
      });
    });
    function fromHash() {
      var h = location.hash.replace('#', ''), i = tabs.findIndex(function (t) { return idOf(t) === h; });
      return i;
    }
    var start = useHash ? fromHash() : -1;
    activate(start >= 0 ? start : 0, { hash: false });
    if (useHash) {
      if (start > 0) { setTimeout(function () { box.scrollIntoView({ block: 'start' }); }, 50); }
      window.addEventListener('hashchange', function () { var i = fromHash(); if (i >= 0) { activate(i, { hash: false }); } });
    }
  });

  /* ---------- Fade-in text rotator ([data-rotator]) — swaps every data-interval ms while visible ---------- */
  $$('[data-rotator]').forEach(function (box) {
    var items = $$('.rotator__item', box), n = 0, every = parseInt(box.getAttribute('data-interval'), 10) || 16000, timer = 0, swap = 0, seen = false;
    if (items.length < 2) { return; }
    function show(k) {
      n = k;
      items.forEach(function (it, i) { var on = i === k; it.classList.toggle('is-active', on); it.setAttribute('aria-hidden', on ? 'false' : 'true'); if (!on) { it.classList.remove('is-in'); } });
      var cur = items[k]; cur.classList.remove('is-in'); void cur.offsetWidth; cur.classList.add('is-in');
    }
    function next() {
      var k = (n + 1) % items.length;
      if (reduce) { show(k); return; }
      items[n].classList.remove('is-active'); items[n].classList.remove('is-in');          /* fade the current one out, then bring the next in */
      swap = setTimeout(function () { show(k); }, 520);
    }
    function start() { if (!timer) { timer = setInterval(next, every); } }
    function stop() { clearInterval(timer); timer = 0; clearTimeout(swap); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { if (!seen) { seen = true; show(0); } start(); } else { stop(); }
      }, { threshold: 0.3 }).observe(box);
    } else { show(0); start(); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) { stop(); } else if (seen) { start(); } });
  });

  /* ---------- Skill-card tilt (fine pointers only) ---------- */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.scard').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', ((x - 0.5) * 8).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
        c.style.setProperty('--mx', (x * 100).toFixed(0) + '%'); c.style.setProperty('--my', (y * 100).toFixed(0) + '%');
      });
      c.addEventListener('pointerleave', function () { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- Lightbox for device screens ---------- */
  var lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = $('img', lb), lastTrigger = null;
    $$('[data-lightbox]').forEach(function (b) {
      b.addEventListener('click', function () {
        lastTrigger = b; lbImg.src = b.getAttribute('data-lightbox'); lbImg.alt = b.getAttribute('data-alt') || ''; lb.showModal();
      });
    });
    $('.lightbox__close', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lightbox__inner')) { lb.close(); } });
    lb.addEventListener('close', function () { if (lastTrigger) { lastTrigger.focus(); } });
  }

  /* ---------- Back to top ---------- */
  var top = $('#backToTop');
  if (top) {
    window.addEventListener('scroll', function () { top.classList.toggle('show', window.scrollY > 400); }, { passive: true });
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  }

  /* ---------- Animated icons (animateicons.in) play on hover/focus of their host ---------- */
  var HOSTS = '.btn, .accordion-trigger, .btn-to-top, .tg-fab__btn, [data-icon-host]';
  function run(host, m) { $$('animate-icons', host).forEach(function (i) { if (typeof i[m] === 'function') { i[m](); } }); }
  $$(HOSTS).forEach(function (h) {
    if (!$('animate-icons', h)) { return; }
    h.addEventListener('pointerenter', function () { run(h, 'startAnimation'); });
    h.addEventListener('pointerleave', function () { run(h, 'stopAnimation'); });
    h.addEventListener('focusin', function (e) { try { if (e.target.matches(':focus-visible')) { run(h, 'startAnimation'); } } catch (x) {} });
    h.addEventListener('focusout', function () { run(h, 'stopAnimation'); });
  });
})();
