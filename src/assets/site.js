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


  /* ---------- solutions switcher: featured world + edge lenses ---------- */
  const sw = $("[data-sw]");
  if (sw) {
    const data = JSON.parse($("#sw-data").textContent);
    const N = data.length, DUR = 9000;
    const vids = $$(".sw__bg video", sw);
    const lensL = $('[data-lens="l"]', sw), lensR = $('[data-lens="r"]', sw);
    const dots = $$("[data-dot]", sw);
    const out = { eye: $("[data-sw-eye]", sw), title: $("[data-sw-title]", sw), lede: $("[data-sw-lede]", sw), tags: $("[data-sw-tags]", sw), price: $("[data-sw-price]", sw), more: $("[data-sw-more]", sw), wa: $("[data-sw-wa]", sw) };
    let cur = -1, visible = false, timer = 0, paused = false;
    sw.style.setProperty("--sw-dur", DUR / 1000 + "s");
    const arm = (v) => { if (!v.src && !reduced) { v.src = mobile ? v.dataset.m : v.dataset.d; if (mobile) v.poster = v.dataset.pm; } };
    const play = () => { vids.forEach((v, k) => { if (k === cur && visible && !reduced) { arm(v); const p = v.play(); p && p.catch(() => {}); } else v.pause(); }); };
    const pad = (n) => String(n).padStart(2, "0");
    const show = (i, user) => {
      i = (i + N) % N; if (i === cur) return; cur = i;
      const d = data[i], l = (i - 1 + N) % N, r = (i + 1) % N;
      vids.forEach((v, k) => v.classList.toggle("is-on", k === i));
      if (mobile && !reduced) vids[i].poster = vids[i].dataset.pm;
      $$("img", lensL).forEach((im) => im.classList.toggle("is-on", +im.dataset.k === l));
      $$("img", lensR).forEach((im) => im.classList.toggle("is-on", +im.dataset.k === r));
      $("[data-lens-lbl]", lensL).textContent = data[l].name; lensL.setAttribute("aria-label", data[l].name);
      $("[data-lens-lbl]", lensR).textContent = data[r].name; lensR.setAttribute("aria-label", data[r].name);
      out.eye.textContent = `${pad(i + 1)} / ${pad(N)} · ${d.name}`;
      out.title.innerHTML = d.title;
      out.lede.textContent = d.body;
      out.tags.innerHTML = d.tags.map((t) => `<li>${t}</li>`).join("");
      out.price.textContent = d.price;
      out.wa.href = d.wa;
      out.more.dataset.target = "d-" + d.id;
      dots.forEach((b, k) => b.setAttribute("aria-selected", String(k === i)));
      sw.classList.remove("go"); void sw.offsetWidth; sw.classList.add("go");
      play(); restart();
      if (user) { arm(vids[r]); }
    };
    const restart = () => { clearTimeout(timer); if (!reduced && visible && !paused) timer = setTimeout(() => show(cur + 1), DUR); };
    const setPaused = (p) => { paused = p; sw.classList.toggle("is-paused", p); restart(); };
    lensL.addEventListener("click", () => show(cur - 1, true));
    lensR.addEventListener("click", () => show(cur + 1, true));
    [lensL, lensR].forEach((b, s) => ["pointerenter", "focus"].forEach((ev) => b.addEventListener(ev, () => arm(vids[(cur + (s ? 1 : -1) + N) % N]))));
    dots.forEach((b) => b.addEventListener("click", () => show(+b.dataset.dot, true)));
    out.more.addEventListener("click", () => { const dl = document.getElementById(out.more.dataset.target); if (dl && dl.showModal) { dl.showModal(); dl.addEventListener("close", () => out.more.focus({ preventScroll: true }), { once: true }); } });
    sw.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { show(cur + 1, true); e.preventDefault(); } else if (e.key === "ArrowLeft") { show(cur - 1, true); e.preventDefault(); } });
    sw.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") setPaused(true); });
    sw.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") setPaused(false); });
    sw.addEventListener("focusin", () => setPaused(true));
    sw.addEventListener("focusout", (e) => { if (!sw.contains(e.relatedTarget)) setPaused(false); });
    let sx = 0, sy = 0;
    sw.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    sw.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) show(cur + (dx < 0 ? 1 : -1), true); }, { passive: true });
    show(0);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) sw.classList.add("seen"); play(); restart(); }, { threshold: 0.25 }).observe(sw);
    } else { visible = true; sw.classList.add("seen"); play(); }
    document.addEventListener("visibilitychange", () => { visible = !document.hidden && sw.getBoundingClientRect().top < innerHeight && sw.getBoundingClientRect().bottom > 0; play(); restart(); });
  }

  /* ---------- pricing: entrance, card light, live quote ---------- */
  const pricing = $("[data-pricing]");
  if (pricing) {
    if (reduced || !("IntersectionObserver" in window)) pricing.classList.add("in");
    else new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) pricing.classList.add("in");
      else if (e.boundingClientRect.top > 0) pricing.classList.remove("in");
    }), { threshold: 0.12 }).observe(pricing);
    $$(".pc", pricing).forEach((c) => {
      c.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`); c.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
        c.style.setProperty("--ry", `${((x - 0.5) * 6).toFixed(2)}deg`); c.style.setProperty("--rx", `${((0.5 - y) * 5).toFixed(2)}deg`);
      });
      c.addEventListener("pointerleave", () => { c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); });
    });
    const cfg = $("[data-cfg]");
    const nums = cfg.dataset.nums.split(",").map(Number), gnums = cfg.dataset.gnums.split(",").map(Number);
    const names = cfg.dataset.names.split(","), gnames = cfg.dataset.gnames.split("|");
    const fmt = new Intl.NumberFormat(cfg.dataset.locale, { maximumFractionDigits: 0 });
    const money = (v) => cfg.dataset.cur === "$" ? `$${fmt.format(v)}` : `€${fmt.format(v)}`;
    const segs = $$("[data-seg]", cfg), toggles = $$("[data-g]", cfg);
    const outOnce = $("[data-out-once]", cfg), outFrom = $("[data-out-from]", cfg), outMonth = $("[data-out-month]", cfg), outWa = $("[data-out-wa]", cfg);
    let plan = segs.findIndex((b) => b.getAttribute("aria-checked") === "true"); if (plan < 0) plan = 1;
    let shown = nums[plan], raf = 0;
    const animateTo = (v) => {
      cancelAnimationFrame(raf);
      const from = shown, t0 = performance.now(), dur = reduced ? 0 : 650;
      const step = (now) => { const k = dur ? Math.min(1, (now - t0) / dur) : 1; const e = 1 - Math.pow(1 - k, 3); shown = Math.round(from + (v - from) * e); outOnce.textContent = money(shown); if (k < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    };
    const update = () => {
      segs.forEach((b, i) => b.setAttribute("aria-checked", String(i === plan)));
      $$(".pc", pricing).forEach((c, i) => c.classList.toggle("is-picked", i === plan));
      outFrom.textContent = plan === 2 ? cfg.dataset.from : "";
      animateTo(nums[plan]);
      const picked = toggles.filter((t) => t.checked).map((t) => +t.dataset.g);
      const month = picked.reduce((s, i) => s + gnums[i], 0);
      outMonth.classList.toggle("is-none", !picked.length);
      outMonth.textContent = picked.length ? `+ ${money(month)}${cfg.dataset.monthly}` : outMonth.dataset.none;
      const lines = [`${cfg.dataset.intro}`, `• ${names[plan]} — ${plan === 2 ? cfg.dataset.from + " " : ""}${money(nums[plan])} ${cfg.dataset.once}`, ...picked.map((i) => `• ${gnames[i]} — ${money(gnums[i])}${cfg.dataset.monthly}`)];
      outWa.href = cfg.dataset.wa + encodeURIComponent(lines.join("\n"));
    };
    segs.forEach((b, i) => b.addEventListener("click", () => { plan = i; update(); }));
    segs.forEach((b, i) => b.addEventListener("keydown", (e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { plan = (plan + (e.key === "ArrowRight" ? 1 : 2)) % 3; update(); segs[plan].focus(); e.preventDefault(); } }));
    toggles.forEach((t) => t.addEventListener("change", update));
    $$("[data-pick]", pricing).forEach((b) => b.addEventListener("click", () => { plan = +b.dataset.pick; update(); cfg.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }); }));
    update();
    addEventListener("pointermove", (e) => { pricing.style.setProperty("--mx", (e.clientX / innerWidth * 2 - 1).toFixed(3)); }, { passive: true });
  }

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
    const h = mobile ? Math.min(H * 0.37, W * 0.9) : H * 0.72;
    const w = h * (520 / 806);
    return { x: (W - w) / 2, y: mobile ? H * 0.115 : H * 0.11, w, h };
  };
  const fitMark = () => {
    mark.style.setProperty("--mark-size", "100px");
    const widest = mobile ? $(".mark__b", mark).getBoundingClientRect().width : mark.getBoundingClientRect().width;
    const target = mobile ? W * 0.9 : W * 0.95;
    const size = 100 * target / Math.max(1, widest);
    mark.style.setProperty("--mark-size", `${size.toFixed(1)}px`);
    const hr = heroRect();
    mark.style.setProperty("--mark-y", `${(hr.y + hr.h * (mobile ? 1.0 : 0.68)).toFixed(0)}px`);
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
    if (pricing) { const r = pricing.getBoundingClientRect(); if (r.top < H && r.bottom > 0) pricing.style.setProperty("--pp", clamp((H - r.top) / (H + r.height)).toFixed(3)); }

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
