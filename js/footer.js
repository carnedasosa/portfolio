/* Footer a mezzetinte: la parola enorme, tagliata dal bordo, stampata come un campo di punti.
   Ogni punto è grande quanto la lettera copre la sua cella. Il puntatore li sposta su molle
   e li scalda di colore; un clic manda un'onda d'urto. Porting fedele del componente React. */
(() => {
  const root = document.getElementById('footer'); if (!root) return;
  const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d'); if (!ctx) return;
  const o = { colors: { background: '#060709', ink: '#eceef2', warm: '#e9e3d5' }, dotGap: 6, radius: 80, crop: 0.2, grain: 0.5, interactive: true,
              fontFamily: '"Geist", "Segoe UI", system-ui, sans-serif', fontWeight: 600, wordmark: 'alessio' };

  const hex = (h) => { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((h || '').trim()); if (!m) return null; const s = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1]; return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; };
  const radiusOf = (cov, gap) => Math.sqrt(Math.max(0, Math.min(1, cov))) * gap * 0.56;
  function step(x, y, vx, vy, hx, hy, px, py, r) {
    const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
    if (r > 0 && d2 < r * r) { const d = Math.sqrt(d2) + 0.001, f = (1 - d / r) * 2.6; vx += (dx / d) * f; vy += (dy / d) * f; }
    vx = (vx + (hx - x) * 0.05) * 0.84; vy = (vy + (hy - y) * 0.05) * 0.84;
    return [x + vx, y + vy, vx, vy];
  }
  const warmth = (x, y, hx, hy, span) => span > 0 ? Math.min(1, Math.hypot(x - hx, y - hy) / span) : 0;
  const fitSize = (measured, width) => measured > 0 ? (width / measured) * 100 : 0;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, dpr = 1, px = -1e5, py = -1e5, raf = 0, visible = true, awake = true;
  let ring = { x: 0, y: 0, t: -1 }, dots = new Float32Array(0), count = 0, grainTile = null;
  const ink = hex(o.colors.ink), warm = hex(o.colors.warm);

  function layout() {
    const rect = root.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width)); h = Math.max(1, Math.round(rect.height));
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const mask = document.createElement('canvas'); mask.width = w; mask.height = h;
    const m = mask.getContext('2d', { willReadFrequently: true }); if (!m) return;
    m.font = o.fontWeight + ' 100px ' + o.fontFamily;
    const fit = fitSize(m.measureText(o.wordmark).width, w * 1.02);
    m.font = o.fontWeight + ' ' + fit + 'px ' + o.fontFamily;
    const box = m.measureText(o.wordmark), cap = box.actualBoundingBoxAscent || fit * 0.72;
    m.fillStyle = '#000'; m.textBaseline = 'alphabetic';
    m.fillText(o.wordmark, (w - box.width) / 2, h + cap * Math.max(0, Math.min(0.6, o.crop)));
    const img = m.getImageData(0, 0, w, h).data;
    const gap = Math.max(3, o.dotGap), cols = Math.ceil(w / gap), rows = Math.ceil(h / gap), tmp = [];
    for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) {
      let sum = 0;
      for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
        const x = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3)), y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3));
        sum += img[(y * w + x) * 4 + 3];
      }
      const cov = sum / (9 * 255); if (cov < 0.06) continue;
      const hx = gx * gap + gap / 2, hy = gy * gap + gap / 2;
      tmp.push(hx, hy, 0, 0, hx, hy, radiusOf(cov, gap));
    }
    dots = new Float32Array(tmp); count = tmp.length / 7;
    grainTile = document.createElement('canvas'); grainTile.width = grainTile.height = 256;
    const g = grainTile.getContext('2d');
    if (g) { const id = g.createImageData(256, 256); for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = Math.random() < 0.5 ? 0 : 255; } g.putImageData(id, 0, 0); }
    awake = true;
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = o.colors.background; ctx.fillRect(0, 0, w, h);
    const r = o.interactive && !reduced ? o.radius : 0, ringAge = ring.t < 0 ? 1e9 : now - ring.t, ringR = ringAge * 0.9;
    let moving = false;
    for (let i = 0; i < count; i++) {
      const j = i * 7; let x = dots[j], y = dots[j + 1], vx = dots[j + 2], vy = dots[j + 3]; const hx = dots[j + 4], hy = dots[j + 5];
      if (!reduced) {
        if (ringAge < 900) {
          const dx = hx - ring.x, dy = hy - ring.y, d = Math.sqrt(dx * dx + dy * dy) + 0.001, band = 1 - Math.min(1, Math.abs(d - ringR) / 26);
          if (band > 0) { const f = band * 3.2 * (1 - ringAge / 900); vx += (dx / d) * f; vy += (dy / d) * f; }
        }
        [x, y, vx, vy] = step(x, y, vx, vy, hx, hy, px, py, r);
        if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) moving = true;
        else { x = hx; y = hy; vx = 0; vy = 0; }
        dots[j] = x; dots[j + 1] = y; dots[j + 2] = vx; dots[j + 3] = vy;
      }
      const k = warmth(x, y, hx, hy, 28);
      ctx.fillStyle = k > 0.02 ? `rgb(${Math.round(ink[0] + (warm[0] - ink[0]) * k)},${Math.round(ink[1] + (warm[1] - ink[1]) * k)},${Math.round(ink[2] + (warm[2] - ink[2]) * k)})` : o.colors.ink;
      ctx.beginPath(); ctx.arc(x, y, dots[j + 6], 0, 6.2832); ctx.fill();
    }
    if (grainTile && o.grain > 0) {
      ctx.globalAlpha = Math.min(1, o.grain) * 0.09; ctx.globalCompositeOperation = 'overlay';
      const pattern = ctx.createPattern(grainTile, 'repeat'); if (pattern) { ctx.fillStyle = pattern; ctx.fillRect(0, 0, w, h); }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    awake = moving || ringAge < 900 || px > -1e4;
  }
  function loop(now) { raf = 0; if (!visible) return; draw(now); if (awake) raf = requestAnimationFrame(loop); }
  function wake() { awake = true; if (!raf && visible) raf = requestAnimationFrame(loop); }
  const local = (e) => { const b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };

  layout(); draw(performance.now()); wake();
  root.addEventListener('pointermove', (e) => { [px, py] = local(e); wake(); });
  root.addEventListener('pointerleave', () => { px = py = -1e5; wake(); });
  root.addEventListener('pointerdown', (e) => {
    if (reduced || e.target.closest('a,button')) return;
    const p = local(e); ring = { x: p[0], y: p[1], t: performance.now() }; wake();
  });
  new ResizeObserver(() => { layout(); wake(); }).observe(root);
  new IntersectionObserver((es) => { visible = es[0] ? es[0].isIntersecting : true; if (visible) wake(); }).observe(root);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); wake(); });

  root.querySelector('.hwf-up').addEventListener('click', () => { if (window.__lenis) window.__lenis.scrollTo(0); else scrollTo({ top: 0, behavior: 'smooth' }); });
})();
