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
if (!cinema) {
  header.style.setProperty("--hd-glass", 1);
  const darkAt = () => { const r = method.getBoundingClientRect(); header.classList.toggle("hd--dark", r.top < 60); };
  addEventListener("scroll", darkAt, { passive: true }); darkAt();
} else {
  startCinema();
}

async function startCinema() {
  const { createFilm, drawStars, A_END, B_START, B_END } = await import("./film.js");
  const canvas = $(".film");
  const poster = $(".film-poster");
  const dockLogo = $(".dock-logo");
  const stars = $(".sky-stars");
  const film = createFilm({ canvas, mobile, onFirst: () => root.classList.add("film-ready") });

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
    /* each card is born from the split in the middle of the screen: vector card → centre */
    const sr = solStage.getBoundingClientRect();
    cards.forEach((c) => {
      c.style.transform = "none";
      const r = c.getBoundingClientRect();
      c.style.transform = "";
      c.style.setProperty("--cx", `${(sr.left + sr.width / 2) - (r.left + r.width / 2)}px`);
      c.style.setProperty("--cy", `${(sr.top + sr.height * 0.48) - (r.top + r.height / 2)}px`);
    });
    film.resize();
    drawStars(stars);
  };

  /* mini Nova: a few degrees of 3D tilt towards the pointer / on focus */
  mini.addEventListener("pointermove", (e) => { const r = mini.getBoundingClientRect(); mini.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 2 - 1).toFixed(2)); mini.style.setProperty("--my", ((e.clientY - r.top) / r.height * 2 - 1).toFixed(2)); });
  mini.addEventListener("pointerleave", () => { mini.style.setProperty("--mx", 0); mini.style.setProperty("--my", 0); });

  const cardState = cards.map(() => ({ e: 0, x: 0, live: null }));
  let docked = false, dark = null;
  const lerp = (a, b, t) => a + (b - a) * t;

  const tick = () => {
    requestAnimationFrame(tick);
    const y = scrollY;
    let frame, dock, pH, pS = 0;

    if (!mobile) {
      pH = clamp((y - heroTop) / Math.max(1, heroH - vh));
      pS = clamp((y - solTop) / Math.max(1, solH - vh));
      /* 01-02  A: the porcelain square opens and becomes the mirror logo */
      frame = clamp((pH - 0.04) / 0.92) * A_END;
      if (pS > 0) {
        const split = clamp(pS / 0.28);            /* 03  B: the logo splits, the light inside creates the cards */
        const lock = clamp((pS - 0.72) / 0.14);    /*     B reversed: the halves lock back together */
        frame = lock > 0 ? B_END - lock * (B_END - B_START) : B_START + split * (B_END - B_START);
      }
      dock = smooth((pS - 0.86) / 0.14);
    } else {
      pH = clamp((y - heroTop) / (vh * 0.9));
      const sr = sol.getBoundingClientRect();
      const split = clamp((vh - sr.top) / (vh * 0.75));
      const lock = clamp((vh - sr.bottom) / (vh * 0.4));
      frame = pH * A_END;
      if (split > 0) frame = lock > 0 ? B_END - lock * (B_END - B_START) : B_START + split * (B_END - B_START);
      dock = smooth((vh * 0.6 - sr.bottom) / (vh * 0.45));
    }
    film.setFrame(frame);
    film.tick();

    /* hero copy: stable while read, exits once the visitor commits to scrolling */
    const hx = mobile ? smooth((pH - 0.3) / 0.5) : smooth((pH - 0.18) / 0.5);
    heroCopy.style.setProperty("--hx", hx.toFixed(3));
    hero.style.setProperty("--hx", hx.toFixed(3));

    /* 03: cards enter from the split (staggered) → stable → exit while the logo locks; reverse is the same function */
    if (!mobile) {
      cards.forEach((c, i) => {
        const s = cardState[i];
        s.e = smooth((pS - 0.12 - i * 0.04) / 0.17);
        s.x = smooth((pS - 0.7 - (3 - i) * 0.025) / 0.12);
        c.style.setProperty("--e", s.e.toFixed(3));
        c.style.setProperty("--x", s.x.toFixed(3));
        const live = s.e > 0.9 && s.x < 0.15 ? "1" : "0";
        if (live !== s.live) { s.live = live; c.dataset.live = live; }
      });
      solStage.style.setProperty("--sh", (smooth((pS - 0.05) / 0.15) * (1 - smooth((pS - 0.8) / 0.12))).toFixed(3));
      /* golden light of the split, echoed by a soft glow behind the cards */
      solStage.style.setProperty("--glow", (smooth(pS / 0.28) * (1 - smooth((pS - 0.72) / 0.14))).toFixed(3));
    }

    /* dock: the cut-out of the same mirror logo leaves the film and flies to the header slot */
    const mr = mini.getBoundingClientRect();
    if (dock > 0 && dock < 1) {
      const a = film.logoRect();
      const bh = mr.height * 0.92, bw = bh * (520 / 806);
      const b = { x: mr.left + (mr.width - bw) / 2, y: mr.top + (mr.height - bh) / 2, w: bw, h: bh };
      const k = dock;
      const x = lerp(a.x, b.x, k), yy = lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * vh * 0.06, w = lerp(a.w, b.w, k), h = lerp(a.h, b.h, k);
      dockLogo.style.transform = `translate3d(${x}px, ${yy}px, 0) rotateY(${(k * 360).toFixed(1)}deg)`;
      dockLogo.style.width = `${w}px`; dockLogo.style.height = `${h}px`;
      dockLogo.style.opacity = 1;
    } else {
      dockLogo.style.opacity = 0;
    }
    canvas.style.opacity = (1 - smooth(dock / 0.55)).toFixed(3);
    poster.style.opacity = root.classList.contains("film-ready") ? 0 : 1;
    const nowDocked = dock >= 1;
    if (nowDocked !== docked) { docked = nowDocked; root.classList.toggle("docked", docked); }

    /* 04: atmosphere — day → sunset → twilight → space, continuous and reversible */
    const mStart = methodTop - vh * 0.85;
    const phase = clamp((y - mStart) / Math.max(1, methodH + vh * 0.35), 0, 1) * 2 + clamp((y - (offersTop - vh * 0.4)) / Math.max(1, offersH * 0.75), 0, 1);
    root.style.setProperty("--p1", clamp(phase).toFixed(3));
    root.style.setProperty("--p2", clamp(phase - 1).toFixed(3));
    root.style.setProperty("--p3", clamp(phase - 2).toFixed(3));

    /* 06: transmit line draws as contact arrives */
    contact.style.setProperty("--tx", smooth((y - (contactTop - vh * 0.9)) / (vh * 0.6)).toFixed(3));

    header.style.setProperty("--hd-glass", (smooth((y - vh * 0.6) / (vh * 0.4))).toFixed(3));
    const isDark = phase > 1.25;
    if (isDark !== dark) { dark = isDark; header.classList.toggle("hd--dark", dark); }

    if (dbgOut) dbgOut.textContent = `pH ${pH.toFixed(2)} · pS ${pS.toFixed(2)} · frame ${film.index} · loaded ${film.loaded}/199 · sky ${phase.toFixed(2)} · dock ${dock.toFixed(2)}`;
  };

  /* ---------------- debug: scene slider without scrolling by hand ---------------- */
  let dbgOut = null;
  if (root.classList.contains("debug")) {
    const panel = $(".dbg"); panel.hidden = false;
    const range = $("[data-dbg-range]"); dbgOut = $("[data-dbg-out]");
    range.addEventListener("input", () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      scrollTo(0, (range.value / 1000) * max);
    });
  }
  window.__novaFilm = () => ({ frame: film.index, loaded: film.loaded });

  /* keyboard: tabbing into a card brings the scene to its stable state instead of leaving it invisible */
  sol.addEventListener("focusin", () => {
    if (mobile) return;
    const p = (scrollY - solTop) / Math.max(1, solH - vh);
    if (p < 0.36 || p > 0.66) scrollTo({ top: solTop + 0.5 * (solH - vh), behavior: "instant" });
  });

  measure();
  addEventListener("resize", measure);
  mq.addEventListener("change", () => location.reload());
  if (document.fonts) document.fonts.ready.then(measure);
  addEventListener("load", measure);
  requestAnimationFrame(tick);
}
