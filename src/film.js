/* D1 film: the Higgsfield mirror-prism sequence (clip A: the porcelain square opens into the logo,
   clip B: the logo splits with golden light). Frames are scrubbed by scroll, drawn "cover" on one canvas.
   Frames 0-123 = A, 124-198 = B. Same graded frames as the live v12 site. */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const A_END = 123;
export const B_START = 124;
export const B_END = 198;
const TOTAL = 199;

export function createFilm({ canvas, mobile, onFirst }) {
  const SET = mobile ? "m" : "d";
  const FW = mobile ? 720 : 1680;
  const FH = mobile ? 960 : 946;
  /* bbox of the whole logo in frame 123 (from the background-removed cut-out), in frame pixels */
  const LOGO = mobile ? { x: 58.3, y: 0, w: 604.4, h: 935.6 } : { x: 543, y: 0, w: 595, h: 922 };
  const ctx = canvas.getContext("2d", { alpha: false });
  const frames = new Array(TOTAL);
  const url = (i) => `./frames/${SET}/${String(i).padStart(3, "0")}.webp`;

  /* progressive loading: a sparse pass over the whole film first, then fill the gaps */
  const order = [];
  const seen = new Uint8Array(TOTAL);
  [24, 12, 6, 3, 1].forEach((step) => { for (let i = 0; i < TOTAL; i += step) if (!seen[i]) { seen[i] = 1; order.push(i); } });
  [A_END, B_START, B_END].forEach((i) => { if (!seen[i]) order.splice(1, 0, i); });
  let qi = 0, inflight = 0, loaded = 0, first = false, dirty = true;
  const FIRST = 14;
  const pump = () => {
    while (inflight < 6 && qi < order.length) {
      const i = order[qi++];
      inflight++;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { frames[i] = img; inflight--; loaded++; dirty = true; if (!first && loaded >= FIRST) { first = true; onFirst && onFirst(); } pump(); };
      img.onerror = () => { inflight--; loaded++; pump(); };
      img.src = url(i);
    }
  };
  pump();

  let W = 1, H = 1, dpr = 1;
  const resize = () => {
    W = innerWidth; H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, mobile ? 2 : 1.6);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    dirty = true;
  };
  resize();

  /* cover transform (shared by canvas drawing and the logo rectangle) */
  const cover = () => {
    const s = Math.max(W / FW, H / FH);
    return { s, x: (W - FW * s) / 2, y: (H - FH * s) / 2 };
  };
  const nearest = (i) => {
    if (frames[i]) return frames[i];
    for (let d = 1; d < 40; d++) { if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; }
    return null;
  };

  let target = 0, cur = 0, drawn = -1;
  const setFrame = (f) => { target = clamp(f, 0, TOTAL - 1); };
  const tick = () => {
    if (Math.abs(target - cur) > 20) cur = target; /* jumps never scrub through unrelated frames */
    cur += (target - cur) * 0.25;
    if (Math.abs(target - cur) < 0.02) cur = target;
    const idx = Math.round(cur);
    if (idx === drawn && !dirty) return;
    const img = nearest(idx);
    if (!img) return;
    const c = cover();
    ctx.drawImage(img, c.x * dpr, c.y * dpr, FW * c.s * dpr, FH * c.s * dpr);
    drawn = frames[idx] ? idx : -1;
    dirty = false;
  };

  /* the logo's rectangle on screen right now (frame 123/124 composition) */
  const logoRect = () => {
    const c = cover();
    return { x: c.x + LOGO.x * c.s, y: c.y + LOGO.y * c.s, w: LOGO.w * c.s, h: LOGO.h * c.s };
  };

  return { setFrame, tick, resize, logoRect, get index() { return Math.round(cur); }, get loaded() { return loaded; } };
}

/* sparse "signal points" for the night sky: drawn once per resize, faded by CSS */
export function drawStars(canvas) {
  const W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = W * dpr; canvas.height = H * dpr;
  const c = canvas.getContext("2d");
  c.scale(dpr, dpr);
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const n = Math.round((W * H) / 9000);
  for (let i = 0; i < n; i++) {
    const x = rnd() * W, y = rnd() * H * 0.72, r = rnd() < 0.08 ? 1.4 : 0.7;
    const a = 0.25 + rnd() * 0.6;
    c.fillStyle = rnd() < 0.2 ? `rgba(0,207,255,${a})` : `rgba(235,250,255,${a})`;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
}
