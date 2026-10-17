/* NovaSignal: scroll-driven frame film + chapters + sky dissolve. No dependencies. */
(() => {
  const N = window.NOVA;
  const R = N.root;
  const M = N.frames;
  const root = document.documentElement;
  const body = document.body;
  root.classList.add("js");

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 760px)").matches;
  const SET = mobile ? "m" : "d";
  const TOTAL = M.total;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };

  const film = document.querySelector("[data-film]");
  const stage = film.querySelector(".film__stage");
  const canvas = film.querySelector(".film__canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const chapters = [...film.querySelectorAll(".ch")];
  const railLabel = document.querySelector("[data-rail]");
  const railBar = document.querySelector("[data-rail-bar]");
  const loader = document.querySelector(".loader");
  const loadNum = document.querySelector("[data-load]");
  const method = document.querySelector("[data-method]");
  const contact = document.getElementById("contatti");
  const skyImg = document.querySelector(".sky img");

  /* ---------- split titles into words (text stays in the DOM) ---------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(" "); return; }
            const s = document.createElement("span");
            s.className = "w";
            s.style.setProperty("--i", i++);
            s.textContent = part;
            frag.append(s);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
  });

  /* ---------- reveal on view (content sections) ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- mobile menu ---------- */
  const burger = document.querySelector(".hd__burger");
  const menu = document.getElementById("menu");
  const setMenu = (open) => {
    root.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    if (open) menu.removeAttribute("inert"); else menu.setAttribute("inert", "");
  };
  burger.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- frames ---------- */
  const frames = new Array(TOTAL);
  let loadedCount = 0;
  const url = (i) => `${R}assets/frames/${SET}/${String(i).padStart(3, "0")}.webp`;
  const order = [];
  const seen = new Uint8Array(TOTAL);
  [16, 8, 4, 2, 1].forEach((step) => { for (let i = 0; i < TOTAL; i += step) if (!seen[i]) { seen[i] = 1; order.push(i); } });
  if (!seen[TOTAL - 1]) order.push(TOTAL - 1);
  let qi = 0;
  let inflight = 0;
  let dirty = true;
  const FIRST = Math.min(order.length, 26);
  const pump = () => {
    while (inflight < 6 && qi < order.length) {
      const i = order[qi++];
      inflight++;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => { frames[i] = img; inflight--; loadedCount++; dirty = true; progress(); pump(); };
      img.onerror = () => { inflight--; loadedCount++; progress(); pump(); };
      img.src = url(i);
    }
  };

  let ready = false;
  const progress = () => {
    const p = Math.min(1, loadedCount / FIRST);
    if (loadNum) loadNum.textContent = String(Math.round(p * 100));
    if (loader) loader.style.setProperty("--lp", p);
    if (!ready && p >= 1) start();
  };

  let sky = null;
  const skySrc = skyImg ? (skyImg.currentSrc || skyImg.src) : null;
  const loadSky = () => {
    const s = new Image();
    s.decoding = "async";
    s.onload = () => { sky = s; dirty = true; };
    s.src = (skyImg && (skyImg.currentSrc || skyImg.src)) || skySrc;
  };

  /* ---------- timeline (in viewport heights) ---------- */
  const L = M.legs;
  const off = [0];
  for (let i = 1; i < L.length; i++) off[i] = off[i - 1] + L[i - 1];
  const endOf = (i) => off[i] + L[i] - 1;
  const SEG = [
    { t: "hold", f: 0, vh: 0.75, ch: 0 },
    { t: "leg", i: 0, vh: 2.1 },
    { t: "hold", f: endOf(0), vh: 1.0, ch: 1 },
    { t: "leg", i: 1, vh: 2.1 },
    { t: "hold", f: endOf(1), vh: 1.0, ch: 2 },
    { t: "leg", i: 2, vh: 2.1 },
    { t: "hold", f: endOf(2), vh: 1.0, ch: 3 },
    { t: "dissolve", vh: 1.4 },
  ];
  let vh = innerHeight;
  let filmTop = 0;
  let filmLen = 0;
  const layout = () => {
    vh = innerHeight;
    let acc = 0;
    SEG.forEach((s) => { s.a = acc; acc += s.vh * vh; s.b = acc; });
    filmLen = acc;
    film.style.height = `${filmLen + vh}px`;
    filmTop = film.getBoundingClientRect().top + scrollY;
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 2 : 1.6);
    canvas.width = Math.round(stage.clientWidth * dpr);
    canvas.height = Math.round(stage.clientHeight * dpr);
    buildBlocks();
    lastCanvasFor = -1;
    dirty = true;
  };

  /* ---------- drawing ---------- */
  const cover = (img, W, H) => {
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = W / H;
    let w, h;
    if (ir > cr) { h = H; w = H * ir; } else { w = W; h = W / ir; }
    return [(W - w) / 2, (H - h) / 2, w, h];
  };
  const nearest = (i) => {
    if (frames[i]) return frames[i];
    for (let d = 1; d < 40; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  };
  const drawImg = (img, c = ctx, W = canvas.width, H = canvas.height) => {
    const [x, y, w, h] = cover(img, W, H);
    c.drawImage(img, x, y, w, h);
  };

  /* dissolve: the final frame breaks into blocks that drift away, revealing the sky */
  let blocks = [];
  let BS = 16;
  const lastC = document.createElement("canvas");
  const lastX = lastC.getContext("2d");
  let lastCanvasFor = -1;
  function buildBlocks() {
    BS = Math.round((mobile ? 22 : 16) * Math.min(devicePixelRatio || 1, 1.6));
    const cols = Math.ceil(canvas.width / BS);
    const rows = Math.ceil(canvas.height / BS);
    const cx = cols / 2;
    const cy = rows / 2;
    const maxD = Math.hypot(cx, cy);
    blocks = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot(x - cx, y - cy) / maxD;
      blocks.push({ x: x * BS, y: y * BS, n: Math.random() * 0.55 + d * 0.45, ang: Math.atan2(y - cy, x - cx) });
    }
    lastC.width = canvas.width;
    lastC.height = canvas.height;
  }
  const drawDissolve = (t) => {
    if (sky) {
      const [x, y, w, h] = cover(sky, canvas.width, canvas.height);
      const k = 1.1;
      ctx.drawImage(sky, x - (w * (k - 1)) / 2, y - (h * (k - 1)) / 2, w * k, h * k);
    } else { ctx.fillStyle = "#9cbde0"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    const last = frames[TOTAL - 1] || nearest(TOTAL - 1);
    if (!last) return;
    if (lastCanvasFor !== TOTAL - 1) { drawImg(last, lastX, lastC.width, lastC.height); lastCanvasFor = TOTAL - 1; }
    const T = t * 1.12;
    const EDGE = 0.1;
    for (const b of blocks) {
      if (b.n < T) continue;
      const e = b.n - T;
      if (e > EDGE) { ctx.globalAlpha = 1; ctx.drawImage(lastC, b.x, b.y, BS, BS, b.x, b.y, BS, BS); continue; }
      const k = 1 - e / EDGE;
      ctx.globalAlpha = 1 - k;
      const dx = Math.cos(b.ang) * k * BS * 2.2;
      const dy = Math.sin(b.ang) * k * BS * 2.2 - k * BS * 1.5;
      const s = BS * (1 - k * 0.55);
      ctx.drawImage(lastC, b.x, b.y, BS, BS, b.x + dx, b.y + dy, s, s);
    }
    ctx.globalAlpha = 1;
  };

  /* ---------- state per scroll ---------- */
  let targetF = 0;
  let curF = 0;
  let dissolveT = -1;
  let lastDrawn = -2;
  let lastDissolve = -1;
  let pastFilm = false;
  let nearEnd = false;
  let filmOn = true;
  let heroIntro = 0;

  const chapterRange = (k) => {
    const s = SEG.find((x) => x.ch === k);
    return [s.a, s.b];
  };

  const update = () => {
    const y = scrollY - filmTop;
    const fp = clamp(y / filmLen);
    stage.style.setProperty("--fp", fp.toFixed(4));

    let seg = SEG[SEG.length - 1];
    for (const s of SEG) if (y < s.b) { seg = s; break; }
    if (y < 0) seg = SEG[0];
    const local = clamp((y - seg.a) / (seg.b - seg.a));
    dissolveT = -1;
    if (seg.t === "hold") targetF = seg.f;
    else if (seg.t === "leg") targetF = off[seg.i] + local * (L[seg.i] - 1);
    else { targetF = TOTAL - 1; dissolveT = local; }

    // chapters: fade in around their hold, fade out after
    let active = 0;
    chapters.forEach((el, k) => {
      const [a, b] = chapterRange(k);
      const fadeIn = 0.5 * vh;
      const fadeOut = 0.55 * vh;
      let A = k === 0 ? heroIntro : smooth((y - (a - fadeIn)) / fadeIn);
      const O = smooth((y - (b - 0.15 * vh)) / fadeOut);
      if (k === 0 && y > 0) A = Math.max(A, heroIntro);
      el.style.setProperty("--a", A.toFixed(3));
      el.style.setProperty("--o", O.toFixed(3));
      const on = A - O > 0.5;
      el.dataset.on = on ? "1" : "0";
      el.setAttribute("aria-hidden", on ? "false" : "true");
      if (y >= a - fadeIn) active = k;
    });
    if (railLabel && railLabel.textContent !== N.rail[active]) railLabel.textContent = N.rail[active];
    if (railBar) railBar.style.setProperty("--rp", fp.toFixed(3));

    // shade fades during the dissolve so the sky reads clean
    stage.style.setProperty("--shade", (1 - (dissolveT > 0 ? smooth(dissolveT) : 0)).toFixed(3));

    const past = y > filmLen - vh * 0.1;
    if (past !== pastFilm) { pastFilm = past; root.classList.toggle("past-film", past); }
    const near = contact ? contact.getBoundingClientRect().top < vh * 0.85 : false;
    if (near !== nearEnd) { nearEnd = near; root.classList.toggle("near-end", near); }
    if (skyImg) { const rest = Math.max(1, document.documentElement.scrollHeight - innerHeight - (filmTop + filmLen)); skyImg.style.setProperty("--sky-f", clamp((scrollY - filmTop - filmLen) / rest).toFixed(4)); }

    if (method) {
      const r = method.getBoundingClientRect();
      const p = clamp((vh * 0.78 - r.top) / (r.height * 0.75));
      method.querySelector(".steps").style.setProperty("--p", p.toFixed(3));
      method.querySelectorAll(".step").forEach((s, i, all) => s.classList.toggle("on", p >= i / (all.length - 1) - 0.02));
    }
  };

  const tick = () => {
    requestAnimationFrame(tick);
    curF += (targetF - curF) * (reduce ? 1 : 0.2);
    if (Math.abs(targetF - curF) < 0.01) curF = targetF;
    if (dissolveT >= 0) {
      if (dirty || Math.abs(dissolveT - lastDissolve) > 0.001) { drawDissolve(dissolveT); lastDissolve = dissolveT; lastDrawn = -2; dirty = false; }
      return;
    }
    lastDissolve = -1;
    const idx = Math.round(curF);
    if (idx !== lastDrawn || dirty) {
      const img = nearest(idx);
      if (img) { drawImg(img); lastDrawn = frames[idx] ? idx : -2; if (!root.classList.contains("canvas-live")) root.classList.add("canvas-live"); }
      dirty = false;
    }
  };

  function start() {
    ready = true;
    root.classList.add("is-ready");
    const t0 = performance.now();
    const intro = (now) => {
      heroIntro = smooth((now - t0 - 350) / 1500);
      update();
      if (heroIntro < 1) requestAnimationFrame(intro);
    };
    requestAnimationFrame(intro);
  }

  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", () => { layout(); update(); });

  if (reduce) {
    root.classList.add("is-ready");
    chapters.forEach((el) => { el.style.setProperty("--a", 1); el.style.setProperty("--o", 0); el.dataset.on = "1"; });
    const onScroll = () => {
      const past = scrollY > film.offsetHeight - innerHeight * 0.5;
      root.classList.toggle("past-film", past);
    };
    addEventListener("scroll", onScroll, { passive: true });
    return;
  }

  layout();
  update();
  pump();
  loadSky();
  requestAnimationFrame(tick);
  setTimeout(() => { if (!ready) start(); }, 4500);
})();
