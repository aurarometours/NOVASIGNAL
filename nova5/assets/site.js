/* NovaSignal nova5 — choreography. No dependencies.
   Intro: plate + wordmark + Higgsfield prism → prism aligns onto the film → split frames (B) → push into the light.
   Everything is a function of scroll position, so scrolling back reverses every state. */
(() => {
  const R = (window.NOVA && window.NOVA.root) || "./";
  const root = document.documentElement;
  const reduced = root.classList.contains("reduced");
  const mqM = matchMedia("(max-width: 760px)");
  let mobile = mqM.matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- menu ---------- */
  const burger = $(".hd__burger");
  const menu = $("#menu");
  const setMenu = (open) => {
    root.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) menu.querySelector("a").focus();
  };
  burger.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("menu-open")) { setMenu(false); burger.focus(); } });

  /* ---------- dialogs ---------- */
  $$("[data-open]").forEach((b) => b.addEventListener("click", () => { const d = document.getElementById(b.dataset.open); if (d && d.showModal) d.showModal(); }));
  $$("dialog").forEach((d) => {
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    d.addEventListener("close", () => { const b = document.querySelector(`[data-open="${d.id}"]`); b && b.focus({ preventScroll: true }); });
  });

  /* ---------- reveal: enter, and reverse when scrolled back above ---------- */
  const rvs = $$(".rv");
  rvs.forEach((el) => { const sib = [...el.parentElement.children].filter((c) => c.classList.contains("rv")); el.style.setProperty("--d", Math.min(5, sib.indexOf(el))); });
  if (!reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("in");
      else if (e.boundingClientRect.top > 0) e.target.classList.remove("in");
    }), { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    rvs.forEach((el) => io.observe(el));
  } else rvs.forEach((el) => el.classList.add("in"));

  /* ---------- intro elements ---------- */
  const intro = $("[data-intro]");
  const stage = $(".intro__stage");
  const plateImg = $(".intro__plate img");
  const canvas = $(".intro__film");
  const ctx = canvas.getContext("2d", { alpha: false });
  const mark = $(".mark");
  const prism = $(".prism");
  const prismImg = $(".prism img");
  const hd = $("[data-hd]");
  prism.style.setProperty("--cut", `url("${new URL(R + "assets/img/logo-cut.webp", location.href).href}")`);

  const start = () => requestAnimationFrame(() => root.classList.add("is-in"));
  if (plateImg.complete) start(); else { plateImg.addEventListener("load", start, { once: true }); setTimeout(start, 1500); }

  /* film frames 123..198: frame 123 = the whole logo, 124..198 = the split (Higgsfield clip B) */
  const F0 = 123, F1 = 198, N = F1 - F0 + 1;
  const SET = mobile ? "m" : "d";
  const FW = mobile ? 720 : 1680, FH = mobile ? 960 : 946;
  const LOGO = mobile ? { x: 58.3, y: 0, w: 604.4, h: 935.6 } : { x: 543, y: 0, w: 595, h: 922 };
  const GAP = mobile ? { x: 0.5, y: 0.37 } : { x: 0.512, y: 0.37 }; /* golden light of the split, in frame fractions */
  const frames = new Array(N);
  let loaded = 0, dirty = true;
  const loadFrames = () => {
    const order = []; const seen = new Uint8Array(N);
    [8, 4, 2, 1].forEach((st) => { for (let i = 0; i < N; i += st) if (!seen[i]) { seen[i] = 1; order.push(i); } });
    if (!seen[N - 1]) order.push(N - 1);
    let q = 0, inflight = 0;
    const pump = () => {
      while (inflight < 5 && q < order.length) {
        const i = order[q++]; inflight++;
        const im = new Image(); im.decoding = "async";
        im.onload = () => { frames[i] = im; inflight--; loaded++; dirty = true; pump(); };
        im.onerror = () => { inflight--; pump(); };
        im.src = `${R}assets/frames/${SET}/${String(F0 + i).padStart(3, "0")}.webp`;
      }
    };
    pump();
  };
  const nearest = (i) => { if (frames[i]) return frames[i]; for (let d = 1; d < N; d++) { if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; } return null; };

  /* ---------- geometry ---------- */
  let W = innerWidth, H = innerHeight, dpr = 1, introTop = 0, introLen = 1;
  const cover = () => { const s = Math.max(W / FW, H / FH); return { s, x: (W - FW * s) / 2, y: (H - FH * s) / 2 }; };
  const logoRect = () => { const c = cover(); return { x: c.x + LOGO.x * c.s, y: c.y + LOGO.y * c.s, w: LOGO.w * c.s, h: LOGO.h * c.s }; };
  const heroRect = () => {
    const h = mobile ? Math.min(H * 0.4, W * 0.95) : H * 0.72;
    const w = h * (520 / 806);
    return { x: (W - w) / 2, y: mobile ? H * 0.1 : H * 0.11, w, h };
  };
  const fitMark = () => {
    mark.style.setProperty("--mark-size", "100px");
    const widest = mobile ? $(".mark__b", mark).getBoundingClientRect().width : mark.getBoundingClientRect().width;
    const target = mobile ? W * 0.9 : W * 0.95;
    const size = 100 * target / Math.max(1, widest);
    mark.style.setProperty("--mark-size", `${size.toFixed(1)}px`);
    const hr = heroRect();
    mark.style.setProperty("--mark-y", `${(hr.y + hr.h * (mobile ? 1.04 : 0.68)).toFixed(0)}px`);
  };
  const layout = () => {
    W = innerWidth; H = innerHeight; mobile = mqM.matches;
    dpr = Math.min(devicePixelRatio || 1, mobile ? 2 : 1.6);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    introTop = intro.getBoundingClientRect().top + scrollY;
    introLen = Math.max(1, intro.offsetHeight - H);
    const c = cover();
    stage.style.setProperty("--ox", `${((c.x + GAP.x * FW * c.s) / W * 100).toFixed(2)}%`);
    stage.style.setProperty("--oy", `${((c.y + GAP.y * FH * c.s) / H * 100).toFixed(2)}%`);
    fitMark();
    dirty = true;
  };

  /* ---------- pointer (depth) ---------- */
  let tpx = 0, tpy = 0, px = 0, py = 0;
  addEventListener("pointermove", (e) => { if (e.pointerType === "touch") return; tpx = e.clientX / W * 2 - 1; tpy = e.clientY / H * 2 - 1; }, { passive: true });

  /* ---------- sections driven by scroll ---------- */
  const method = $("[data-method]");
  const track = $("[data-track]");
  const reach = $(".reach");
  const contact = $(".contact");
  const themed = $$("[data-theme]");

  let drawn = -1, curF = 0, lastP = -1;
  const draw = (idx) => {
    const im = nearest(idx);
    if (!im) return;
    const c = cover();
    ctx.drawImage(im, c.x * dpr, c.y * dpr, FW * c.s * dpr, FH * c.s * dpr);
    drawn = frames[idx] ? idx : -1;
  };

  const tick = (now) => {
    requestAnimationFrame(tick);
    px += (tpx - px) * 0.06; py += (tpy - py) * 0.06;
    const y = scrollY;
    const p = reduced ? 0 : clamp((y - introTop) / introLen);

    /* intro */
    if (y < introTop + introLen + H) {
      const align = smooth(p / 0.1);
      const ws = smooth((p - 0.01) / 0.14);
      const fx = smooth(p / 0.08);
      stage.style.setProperty("--ws", ws.toFixed(3));
      stage.style.setProperty("--fx", fx.toFixed(3));
      const k = 1 - align;
      stage.style.setProperty("--px", (px * k).toFixed(3));
      stage.style.setProperty("--py", (py * k).toFixed(3));
      prism.style.setProperty("--float", (Math.sin(now / 1100) * 6 * k).toFixed(2));
      const a = heroRect(), b = logoRect();
      prism.style.width = `${lerp(a.w, b.w, align)}px`;
      prism.style.height = `${lerp(a.h, b.h, align)}px`;
      prism.style.transform = `translate3d(${lerp(a.x, b.x, align)}px, ${lerp(a.y, b.y, align)}px, 0)`;
      const filmOn = smooth((p - 0.07) / 0.04);
      canvas.style.opacity = filmOn.toFixed(3);
      prism.style.opacity = (1 - smooth((p - 0.115) / 0.03)).toFixed(3);
      /* split frames */
      const target = clamp((p - 0.11) / 0.32) * (N - 1);
      curF += (target - curF) * 0.3; if (Math.abs(target - curF) < 0.05) curF = target;
      const idx = Math.round(curF);
      if (filmOn > 0 && (idx !== drawn || dirty)) { draw(idx); dirty = false; }
      /* split copy, then into the light */
      stage.style.setProperty("--sa", smooth((p - 0.34) / 0.1).toFixed(3));
      stage.style.setProperty("--sb", smooth((p - 0.62) / 0.08).toFixed(3));
      const push = smooth((p - 0.62) / 0.36);
      canvas.style.transform = push > 0 ? `scale(${(1 + push * 2.6).toFixed(4)})` : "";
      stage.style.setProperty("--light", Math.pow(clamp((p - 0.7) / 0.27), 1.2).toFixed(3));
      lastP = p;
    }

    /* method: horizontal track */
    if (method && !mobile && !reduced) {
      const r = method.getBoundingClientRect();
      const mp = clamp(-r.top / Math.max(1, method.offsetHeight - H));
      const over = Math.max(0, track.scrollWidth - (W - 2 * parseFloat(getComputedStyle(track.parentElement).paddingLeft)));
      method.style.setProperty("--tx", (mp * over).toFixed(1));
      method.style.setProperty("--mp", mp.toFixed(3));
    }
    if (reach) { const r = reach.getBoundingClientRect(); reach.style.setProperty("--par", clamp((H - r.top) / (H + r.height)).toFixed(3)); }
    if (contact) { const r = contact.getBoundingClientRect(); contact.style.setProperty("--cp", clamp((H - r.top) / H).toFixed(3)); }

    /* header theme */
    let light = false, solid = y > 30;
    if (y < introTop + introLen) { light = lastP > 0.86; solid = lastP > 0.1 && lastP < 0.62 ? false : lastP >= 0.86; }
    else for (const s of themed) { const r = s.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) { light = s.dataset.theme === "light"; break; } }
    hd.classList.toggle("is-light", light);
    hd.classList.toggle("is-solid", solid);
    root.classList.toggle("show-bar", y > introTop + introLen * 0.9 && y < document.documentElement.scrollHeight - H * 1.6);
  };

  layout();
  addEventListener("resize", layout);
  /* the webfont arrives late (non-blocking stylesheet): re-fit the wordmark whenever a font finishes loading */
  if (document.fonts) {
    document.fonts.ready.then(layout);
    document.fonts.addEventListener && document.fonts.addEventListener("loadingdone", layout);
    document.fonts.load('900 100px "Archivo"').then(layout).catch(() => {});
  }
  if ("ResizeObserver" in window) { let lw = 0; new ResizeObserver(() => { const w = Math.round($(".mark__b", mark).getBoundingClientRect().width); if (Math.abs(w - lw) > 2) { lw = w; } }).observe(mark); }
  addEventListener("load", layout);
  mqM.addEventListener("change", () => location.reload());
  /* frames are only needed once the visitor scrolls: don't compete with the first paint */
  if (!reduced) {
    let started = false;
    const go = () => { if (started) return; started = true; loadFrames(); };
    addEventListener("scroll", go, { once: true, passive: true });
    addEventListener("load", () => setTimeout(go, 1800));
  }
  requestAnimationFrame(tick);
})();
