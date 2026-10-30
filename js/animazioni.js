/* Caricamento, scroll fluido, animazioni allo scroll, cursore, terminale, testata. */
(() => {
  const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouseFine = matchMedia('(pointer: fine)').matches;
  const isMobile = () => innerWidth < 860;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const libs = window.gsap && window.ScrollTrigger;
  const top = $('.top');

  /* ---------- Toast e copia ---------- */
  const toast = $('#toast'); let toastTimer;
  function mostra(msg) { toast.textContent = msg; toast.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('on'), 2600); }
  $('#copy-ig').addEventListener('click', async () => {
    const testo = $('#ig').textContent;
    try { await navigator.clipboard.writeText(testo); mostra('Copiato: ' + testo); }
    catch (err) { const sel = getSelection(), r = document.createRange(); r.selectNodeContents($('#ig')); sel.removeAllRanges(); sel.addRange(r); mostra('Selezionato: premi Copia sulla tastiera'); }
  });

  /* ---------- Titolo diviso in lettere ---------- */
  $$('.hero h1 .ln').forEach((ln) => { ln.innerHTML = ln.textContent.trim().split(' ').map((w) => `<span class="wd">${[...w].map((c) => `<span class="ch">${c}</span>`).join('')}</span>`).join(' '); });

  /* ---------- Terminale che scrive da solo ---------- */
  const term = $('#term');
  const righe = [
    ['p', '$ ', 'u', 'claude'],
    ['dim', '  Claude Code · progetto okay-bari'],
    [],
    ['p', '> ', 'u', 'il menu deve scorrere in orizzontale mentre scendo con la pagina. su telefono no.'],
    [],
    ['c', '● ', 'u', 'Leggo src/components/Menu.jsx'],
    ['c', '● ', 'u', 'Aggiungo ScrollTrigger con pin solo sopra 860px'],
    ['c', '● ', 'u', 'Scrivo 3 test Playwright (desktop, telefono, tastiera)'],
    [],
    ['p', '$ ', 'u', 'npm test'],
    ['ok', '  ✓ 21 test passati'],
    ['p', '$ ', 'u', 'git push && gh pr create'],
    ['ok', '  ✓ Pull request aperta · deploy di anteprima su Vercel'],
  ];
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function rigaHTML(r, n) {
    let out = '', left = n;
    for (let i = 0; i < r.length; i += 2) { const t = r[i + 1]; const part = left >= t.length ? t : t.slice(0, Math.max(left, 0)); left -= t.length; out += `<span class="${r[i]}">${esc(part)}</span>`; }
    return out;
  }
  let termOn = false, termStarted = false;
  function scrivi() {
    if (termStarted) return; termStarted = true;
    let li = 0, ch = 0, done = [];
    (function step() {
      if (li >= righe.length) { term.innerHTML = done.join('\n') + '\n<span class="caret"></span>'; setTimeout(() => { termStarted = false; if (termOn) scrivi(); }, 5000); return; }
      const r = righe[li], len = r.filter((_, i) => i % 2).join('').length;
      const tipo = r[0] === 'p' && li > 0;
      ch += tipo ? 2 : len;
      term.innerHTML = done.concat(rigaHTML(r, ch)).join('\n') + '<span class="caret"></span>';
      if (ch >= len) { done.push(rigaHTML(r, len)); li++; ch = 0; setTimeout(step, tipo ? 380 : 260); }
      else setTimeout(step, 22);
    })();
  }
  if (ridotto) term.innerHTML = righe.map((r) => rigaHTML(r, 999)).join('\n');
  else new IntersectionObserver((es) => es.forEach((e) => { termOn = e.isIntersecting; if (termOn) scrivi(); }), { threshold: .3 }).observe(term);


  /* Stato dell'oggetto 3D, definito in scena.js */
  const { state, boot } = window.Scena || { state: {}, boot: {} };

  /* ---------- Cursore, magneti, inclinazioni, anteprima indice ---------- */
  if (mouseFine && !ridotto) {
    const cur = $('.cur'); let cx = -100, cy = -100;
    addEventListener('pointermove', (e) => { cx = e.clientX; cy = e.clientY; cur.style.transform = `translate(${cx}px,${cy}px)`; document.documentElement.classList.add('has-cursor'); }, { passive: true });
    document.addEventListener('pointerleave', () => document.documentElement.classList.remove('has-cursor'));
    addEventListener('pointerdown', () => cur.classList.add('down')); addEventListener('pointerup', () => cur.classList.remove('down'));
    $$('a, button, .chip, .shot').forEach((el) => { el.addEventListener('pointerenter', () => cur.classList.add('big')); el.addEventListener('pointerleave', () => cur.classList.remove('big')); });

    $$('.magnetico').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => { const r = btn.getBoundingClientRect(); btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .3}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`; });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
    $$('.tilt').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
        el.style.transform = `perspective(1000px) rotateY(${(px - .5) * 8}deg) rotateX(${(.5 - py) * 8}deg)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    // Anteprima che segue il mouse sull'indice dei progetti
    const peek = $('.peek'), art = $('.peek .art'); let px = 0, py = 0, tx = 0, ty = 0, peekImg = null;
    $$('.index a').forEach((a) => {
      a.addEventListener('pointerenter', () => {
        peek.style.setProperty('--c1', a.dataset.c1); peek.style.setProperty('--c2', a.dataset.c2); art.textContent = a.dataset.word;
        if (peekImg) peekImg.remove();
        peekImg = new Image(); peekImg.alt = ''; peekImg.onerror = () => peekImg && peekImg.remove(); peekImg.src = a.dataset.img; peek.append(peekImg);
        peek.classList.add('on');
      });
      a.addEventListener('pointerleave', () => peek.classList.remove('on'));
    });
    addEventListener('pointermove', (e) => { tx = e.clientX + 24; ty = e.clientY - 110; }, { passive: true });
    (function loop() { px += (tx - px) * .14; py += (ty - py) * .14; peek.style.left = px + 'px'; peek.style.top = py + 'px'; requestAnimationFrame(loop); })();
  }

  /* ---------- Carosello dei progetti su telefono: contatore e barra ---------- */
  const cases = $('.cases'), caseN = $('#case-n'), caseBar = $('.cases-bar i');
  cases.addEventListener('scroll', () => {
    const cards = $$('.case', cases), step = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : 1;
    const i = Math.min(cards.length - 1, Math.round(cases.scrollLeft / step));
    caseN.textContent = String(i + 1).padStart(2, '0');
    caseBar.style.transform = `translateX(${i * 100}%)`;
  }, { passive: true });

  /* ---------- Menu mobile ---------- */
  const menu = $('#menu'), menuBtn = $('.menu-btn');
  function apriMenu(on) {
    menuBtn.setAttribute('aria-expanded', on);
    menuBtn.querySelector('.sr').textContent = on ? 'Chiudi il menu' : 'Apri il menu';
    document.documentElement.classList.toggle('menu-open', on);
    if (on) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('on')); window.__lenis && window.__lenis.stop(); document.body.style.overflow = 'hidden'; }
    else { menu.classList.remove('on'); setTimeout(() => { if (!menu.classList.contains('on')) menu.hidden = true; }, 400); window.__lenis && window.__lenis.start(); document.body.style.overflow = ''; }
  }
  menuBtn.addEventListener('click', () => apriMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $$('#menu a').forEach((a) => a.addEventListener('click', () => apriMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { apriMenu(false); menuBtn.focus(); } });
  addEventListener('resize', () => { if (!isMobile() && menuBtn.getAttribute('aria-expanded') === 'true') apriMenu(false); });

  /* ---------- HUD e testata ---------- */
  const hudSec = $('#hud-sec'), hudScr = $('#hud-scr'), secs = $$('[data-sec]'), navLinks = $$('.top nav a');
  function hud() {
    const max = document.documentElement.scrollHeight - innerHeight;
    hudScr.textContent = String(Math.round(scrollY / Math.max(max, 1) * 100)).padStart(3, '0');
    let cur = secs[0]; secs.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * .5) cur = s; });
    hudSec.textContent = cur.dataset.sec;
    navLinks.forEach((a) => a.classList.toggle('on', !!cur.id && a.getAttribute('href') === '#' + cur.id));
  }
  let lastY = 0;
  function header() { const y = scrollY, dy = y - lastY; if (Math.abs(dy) < 6) return; top.classList.toggle('hide', y > 300 && dy > 0); lastY = y; }
  addEventListener('scroll', () => { hud(); header(); }, { passive: true });
  hud();

  const loader = $('.loader');
  if (!libs || ridotto) { loader.remove(); top.classList.add('in'); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Scroll fluido ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); if (id.length < 2) return; const t = $(id); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: id === '#top' ? 0 : (isMobile() ? -84 : -20) });
    }));
  }

  /* ---------- Intro ---------- */
  lenis && lenis.stop();
  const count = $('.loader .count'), c = { v: 0 };
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to(c, { v: 100, duration: isMobile() ? .7 : 1.1, ease: 'power2.inOut', onUpdate: () => (count.textContent = Math.round(c.v)) })
    .to('.loader .bar', { scaleX: 1, duration: isMobile() ? .7 : 1.1, ease: 'power2.inOut' }, 0)
    .to(loader, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '+=.1')
    .from(boot, { s: .2, d: 1.2, duration: 2.2 }, '-=.7')
    .from('.hero h1 .ch', { yPercent: 115, rotate: 8, duration: 1.3, stagger: .02 }, '<.1')
    .from('.reveal-hero', { y: 24, opacity: 0, duration: 1, stagger: .08 }, '<.5')
    .add(() => top.classList.add('in'), '<')
    .add(() => { loader.remove(); lenis && lenis.start(); });

  /* ---------- Pose dell'oggetto 3D per sezione ---------- */
  const tweens = [
    ['#lavori', { x: 2.3, y: 1.15, s: .42, d: .3, rot: 1.2, mix: .2, ring: 1.8, a: 1 }],
    ['#metodo', { x: -1.5, y: -.2, s: .95, d: .42, rot: 1.8, mix: 1, ring: 1, a: .3 }],
    ['#stack', { x: 2.2, y: 1, s: .55, d: .36, rot: 2.4, mix: .5, ring: 1.3, a: .7 }],
    ['#chi-sono', { x: 1.5, y: 0, s: 1, d: .45, rot: 2.8, mix: .1, ring: .9, a: .3 }],
    ['#contatti', { x: 0, y: 0, s: 1.45, d: .55, rot: 3.2, mix: .3, ring: 1.25, a: .32 }],
  ];
  const base = { ...state }, keys = Object.keys(base);
  const poses = tweens.map(([sel, to]) => ({ to, st: ScrollTrigger.create({ trigger: sel, start: 'top bottom', end: 'top 20%' }) }));
  const ease = gsap.parseEase('power2.inOut');
  gsap.ticker.add(() => {
    const target = { ...base };
    poses.forEach(({ to, st }) => { const e = ease(st.progress); keys.forEach((kk) => { if (kk in to) target[kk] += (to[kk] - target[kk]) * e; }); });
    keys.forEach((kk) => { state[kk] += (target[kk] - state[kk]) * .06; });
  });

  /* ---------- Card dei lavori che si impilano ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1061px)', () => {
    const cards = $$('.case');
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      gsap.to(card, { scale: .93, '--dim': .7, ease: 'none',
        scrollTrigger: { trigger: cards[i + 1], start: 'top 75%', end: () => 'top ' + (88 + (i + 1) * 14) + 'px', scrub: true } });
    });
  });
  mm.add('(min-width: 861px)', () => {
    $$('.shot').forEach((s) => gsap.from(s, { y: 80, rotateX: 14, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 88%' } }));
  });
  // Su telefono le card del carosello entrano da destra, una dopo l'altra
  mm.add('(max-width: 860px)', () => {
    gsap.from('.case', { x: 120, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.cases', start: 'top 85%' } });
  });

  /* ---------- Marquee con velocità ---------- */
  const traccia = $('.marquee .traccia'), gruppo = $('.marquee .gruppo');
  traccia.append(gruppo.cloneNode(true));
  let mx = 0, vel = 0;
  gsap.ticker.add(() => {
    const w = gruppo.offsetWidth, v = lenis ? lenis.velocity : 0; vel += (v - vel) * .1;
    mx -= .9 + Math.abs(vel) * .35; if (mx <= -w) mx += w;
    gsap.set(traccia, { x: mx, skewX: gsap.utils.clamp(-12, 12, -vel * .6) });
  });

  /* ---------- Entrate ---------- */
  $$('.reveal').forEach((el) => gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  gsap.from('.index a', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.index', start: 'top 85%' } });
  gsap.from('.stack-card', { y: 80, opacity: 0, rotateX: -10, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.stack', start: 'top 82%' } });
  gsap.to('.steps .prog', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 65%', end: 'bottom 55%', scrub: true } });
  $$('.steps li').forEach((li) => {
    ScrollTrigger.create({ trigger: li, start: 'top 60%', end: '+=99999', onToggle: (s) => li.classList.toggle('on', s.isActive) });
    gsap.from(li, { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: li, start: 'top 88%' } });
  });
  gsap.to('.hero h1', { yPercent: -18, opacity: .15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
