/* NOVA / LIVING CINEMA — choreography owner.
   Reads scroll once per frame, derives every scene value, writes CSS variables + world state.
   No scroll-jacking: the browser scrolls natively; pinned stages are plain position: sticky. */
import "./style.css";

const root = document.documentElement;
const cinema = root.classList.contains("is-cinema");
const q = new URLSearchParams(location.search);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const header = $(".hd");
const hero = $("#hero");
const heroCopy = $("[data-hero]");
const sol = $("#soluzioni");
const solStage = $(".sol__stage");
const method = $("#metodo");
const offers = $("#prezzi");
const contact = $("#contatti");
const cards = $$(".card");
const mini = $("[data-mini]");
const mq = matchMedia("(max-width: 899px)");
let mobile = mq.matches;

/* ---------------- menu ---------------- */
const burger = $(".hd__burger");
const menu = $("#menu");
const setMenu = (open) => {
  root.classList.toggle("menu-open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
  menu.hidden = !open;
  if (open) menu.querySelector("a").focus();
};
burger.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("menu-open")) { setMenu(false); burger.focus(); } });

/* ---------------- dialogs ---------------- */
$$("[data-open]").forEach((b) => b.addEventListener("click", () => {
  const d = document.getElementById(b.dataset.open);
  if (d && d.showModal) { d.showModal(); d.dataset.opener = b.dataset.open; }
}));
$$("dialog").forEach((d) => {
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
  d.querySelectorAll("[data-close]").forEach((a) => a.addEventListener("click", () => d.close()));
  d.addEventListener("close", () => { const b = document.querySelector(`[data-open="${d.id}"]`); b && b.focus({ preventScroll: true }); });
});

/* ---------------- micro demos ---------------- */
// SaaS: real state change on demo data
const saas = $(".demo-saas");
const DATA = { w: { k: [24, 9, 3], h: [0.35, 0.5, 0.42, 0.7, 0.55, 0.82, 0.64] }, m: { k: [96, 41, 12], h: [0.55, 0.62, 0.48, 0.74, 0.8, 0.68, 0.92] } };
const setRange = (r) => {
  saas.querySelectorAll("[data-range]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.range === r)));
  DATA[r].k.forEach((v, i) => { saas.querySelector(`[data-kpi="${i}"]`).textContent = v; });
  saas.querySelectorAll(".ds-chart i").forEach((bar, i) => bar.style.setProperty("--h", DATA[r].h[i]));
};
saas.querySelectorAll("[data-range]").forEach((b) => b.addEventListener("click", () => setRange(b.dataset.range)));
setRange("w");
// Mobile: three screens, dots + swipe
const mob = $(".demo-mob");
const track = mob.querySelector(".dm-track");
const dots = mob.querySelectorAll(".dm-dots button");
const setScreen = (i) => { i = (i + 3) % 3; track.style.setProperty("--s", i); dots.forEach((d, k) => d.setAttribute("aria-pressed", String(k === i))); track.dataset.screen = i; };
dots.forEach((d, i) => d.addEventListener("click", () => setScreen(i)));
let sx = null;
mob.querySelector(".dm-win").addEventListener("pointerdown", (e) => { sx = e.clientX; });
mob.querySelector(".dm-win").addEventListener("pointerup", (e) => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 18) setScreen(+track.dataset.screen + (dx < 0 ? 1 : -1)); });

/* ---------------- reveal: enter / exit / reverse ---------------- */
const rvs = $$(".rv");
const setupReveal = () => {
  if (!cinema) return;
  rvs.forEach((el) => { const sib = [...el.parentElement.children].filter((c) => c.classList.contains("rv")); el.style.setProperty("--d", Math.min(4, sib.indexOf(el))); });
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); e.target.classList.remove("out"); }
    else {
      e.target.classList.remove("in");
      /* leaving through the top = exit forward; through the bottom = reverse back to pre-entry */
      e.target.classList.toggle("out", e.boundingClientRect.top < 0);
    }
  }), { rootMargin: "-6% 0px -8% 0px", threshold: 0.08 });
  rvs.forEach((el) => io.observe(el));
  return io;
};
setupReveal();
// on phones the cards are in normal flow: they use the same reveal grammar
if (cinema) {
  const cardIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!mobile) return;
    e.target.classList.toggle("in", e.isIntersecting);
    e.target.classList.toggle("out", !e.isIntersecting && e.boundingClientRect.top < 0);
  }), { rootMargin: "-4% 0px -6% 0px", threshold: 0.12 });
  cards.forEach((c) => cardIO.observe(c));
}

/* ---------------- static experience ends here ---------------- */
const mini2d = () => root.classList.add("no-mini-gl");
if (!cinema) {
  mini2d();
  header.style.setProperty("--hd-glass", 1);
  const darkAt = () => { const r = method.getBoundingClientRect(); header.classList.toggle("hd--dark", r.top < 60); };
  addEventListener("scroll", darkAt, { passive: true }); darkAt();
} else {
  startCinema();
}

async function startCinema() {
  const { createWorld, createMini } = await import("./world.js");
  let world = null, miniGL = null;
  const poster = $(".world-static");
  world = createWorld({
    canvas: $(".world"),
    mobile,
    onReady: () => {
      root.classList.add("world-ready");
      poster.style.setProperty("--poster", 0);
      if (!miniGL) {
        miniGL = createMini({ canvas: $(".mini__gl"), source: world.model() });
        if (!miniGL) mini2d();
      }
    },
    onFail: () => { root.classList.add("world-failed"); mini2d(); poster.style.setProperty("--poster", 1); },
  });
  if (!world) { root.classList.replace("is-cinema", "is-static"); mini2d(); return; }
  /* the poster stays until the first frame with the GLB is drawn: no blank first paint */

  /* measurement cache */
  let vh = innerHeight, heroTop = 0, heroH = 1, solTop = 0, solH = 1, methodTop = 0, methodH = 1, offersTop = 0, offersH = 1, contactTop = 0;
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  const measure = () => {
    vh = innerHeight; mobile = mq.matches;
    heroTop = top(hero); heroH = hero.offsetHeight;
    solTop = top(sol); solH = sol.offsetHeight;
    methodTop = top(method); methodH = method.offsetHeight;
    offersTop = top(offers); offersH = offers.offsetHeight;
    contactTop = top(contact);
    // vector from each card to the stage centre (cards are born from the prism)
    const sr = solStage.getBoundingClientRect();
    cards.forEach((c) => {
      c.style.transform = "none";
      const r = c.getBoundingClientRect();
      c.style.transform = "";
      c.style.setProperty("--cx", `${(sr.left + sr.width / 2) - (r.left + r.width / 2)}px`);
      c.style.setProperty("--cy", `${(sr.top + sr.height / 2) - (r.top + r.height / 2)}px`);
      // resting anchor (card edge nearest the prism), relative to the pinned stage
      const left = (r.left + r.width / 2) < (sr.left + sr.width / 2);
      c._rest = { ax: (left ? r.right : r.left) - sr.left, top: r.top - sr.top, bottom: r.bottom - sr.top };
    });
    if (miniGL) miniGL.resize();
  };

  let px = 0, py = 0;
  addEventListener("pointermove", (e) => { px = e.clientX / innerWidth * 2 - 1; py = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  mini.addEventListener("pointermove", (e) => { const r = mini.getBoundingClientRect(); miniGL && miniGL.point((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1); });
  mini.addEventListener("pointerleave", () => miniGL && miniGL.point(0, 0));
  mini.addEventListener("focus", () => miniGL && miniGL.point(0.7, -0.4));
  mini.addEventListener("blur", () => miniGL && miniGL.point(0, 0));

  const cardState = cards.map(() => ({ e: 0, x: 0, beam: 0, ax: 0, ay: 0, live: null }));
  let docked = false, dark = null;

  const tick = () => {
    requestAnimationFrame(tick);
    const y = scrollY;
    /* scene progress values */
    const pH = mobile ? clamp((y - heroTop) / (vh * 0.95)) : clamp((y - heroTop) / Math.max(1, heroH - vh));
    const pS = mobile ? 0 : clamp((y - solTop) / Math.max(1, solH - vh));

    /* hero copy: stable while read, exits (z +30, light rotate) once the visitor commits to scrolling */
    const hx = mobile ? smooth((pH - 0.3) / 0.5) : smooth((pH - 0.18) / 0.5);
    heroCopy.style.setProperty("--hx", hx.toFixed(3));
    hero.style.setProperty("--hx", hx.toFixed(3));

    /* 03: cards: enter (staggered, from the prism) → stable → exit; reverse is the same function */
    if (!mobile) {
      const sr = solStage.getBoundingClientRect();
      const cxs = sr.left + sr.width / 2, cys = sr.top + sr.height / 2;
      cards.forEach((c, i) => {
        const s = cardState[i];
        s.e = smooth((pS - 0.1 - i * 0.04) / 0.17);
        s.x = smooth((pS - 0.7 - (3 - i) * 0.025) / 0.12);
        const arrive = smooth((pS - 0.05 - i * 0.04) / 0.08);
        const settle = 1 - smooth((pS - 0.3 - i * 0.04) / 0.1) * 0.6;
        s.beam = arrive * settle * (1 - s.x);
        c.style.setProperty("--e", s.e.toFixed(3));
        c.style.setProperty("--x", s.x.toFixed(3));
        const live = s.e > 0.9 && s.x < 0.15 ? "1" : "0";
        if (live !== s.live) { s.live = live; c.dataset.live = live; }
        // beam target = where the card is going to rest: the card travels along its own beam
        const rest = c._rest || { ax: 0, top: 0, bottom: 0 };
        s.ax = sr.left + rest.ax;
        s.ay = sr.top + Math.min(rest.bottom - 24, Math.max(rest.top + 24, cys - sr.top));
      });
      solStage.style.setProperty("--sh", (smooth((pS - 0.05) / 0.15) * (1 - smooth((pS - 0.8) / 0.12))).toFixed(3));
    }

    /* 04: atmosphere — day → sunset → twilight → space, continuous and reversible */
    const mStart = methodTop - vh * 0.85;
    const phase = clamp((y - mStart) / Math.max(1, methodH + vh * 0.35), 0, 1) * 2 + clamp((y - (offersTop - vh * 0.4)) / Math.max(1, offersH * 0.75), 0, 1);
    const drift = clamp(y / Math.max(1, document.documentElement.scrollHeight - vh)) * 0.08;

    /* 06: transmit line draws as contact arrives */
    contact.style.setProperty("--tx", smooth((y - (contactTop - vh * 0.9)) / (vh * 0.6)).toFixed(3));

    /* mini slot geometry */
    const mr = mini.getBoundingClientRect();
    world.setState({ pH, pS, phase, drift, px, py, cards: cardState, slot: { x: mr.left + mr.width / 2, y: mr.top + mr.height / 2, h: mr.height }, forceDock: dbgDock, forgeAt: forgeAt });

    const dock = world.out.dock;
    mini.style.setProperty("--dock", dock >= 0.999 ? 1 : 0);
    const nowDocked = dock >= 0.999;
    if (nowDocked !== docked) { docked = nowDocked; root.classList.toggle("docked", docked); miniGL && miniGL.setActive(docked); }

    /* header: glass once we leave the hero, light text when the world gets dark */
    header.style.setProperty("--hd-glass", (smooth((y - vh * 0.6) / (vh * 0.4))).toFixed(3));
    const isDark = phase > 1.25;
    if (isDark !== dark) { dark = isDark; header.classList.toggle("hd--dark", dark); }

    if (dbgOut) dbgOut.textContent = `pH ${pH.toFixed(2)} · pS ${pS.toFixed(2)} · sky ${phase.toFixed(2)} · dock ${dock.toFixed(2)} · ${world.stats().fps.toFixed(0)}fps dpr ${world.stats().dpr}`;
  };

  /* ---------------- debug: scene slider without scrolling by hand ---------------- */
  let dbgOut = null, dbgDock = false;
  const forgeAt = q.has("forge") ? clamp(parseFloat(q.get("forge")) || 0) : null;
  if (root.classList.contains("debug")) {
    const panel = $(".dbg"); panel.hidden = false;
    const range = $("[data-dbg-range]"); dbgOut = $("[data-dbg-out]");
    range.addEventListener("input", () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      scrollTo(0, (range.value / 1000) * max);
    });
    window.__nova = { world, measure };
  }
  window.__novaStats = () => world.stats();
  /* a modal covers the world: stop rendering it (saves GPU, keeps the dialog animation smooth) */
  $$("dialog").forEach((d) => {
    new MutationObserver(() => world.pause(d.open)).observe(d, { attributes: true, attributeFilter: ["open"] });
  });

  /* keyboard: tabbing into a card brings the scene to its stable state instead of leaving it invisible */
  sol.addEventListener("focusin", () => {
    if (mobile) return;
    const pS = (scrollY - solTop) / Math.max(1, solH - vh);
    if (pS < 0.36 || pS > 0.66) scrollTo({ top: solTop + 0.5 * (solH - vh), behavior: "instant" });
  });

  measure();
  addEventListener("resize", () => { world.resize(); measure(); });
  mq.addEventListener("change", () => location.reload());
  if (document.fonts) document.fonts.ready.then(measure);
  addEventListener("load", measure);
  requestAnimationFrame(tick);
}
