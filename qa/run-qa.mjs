/* Browser QA for NOVA / LIVING CINEMA. Usage: npm run build && npm run qa
   Starts `vite preview`, drives headless Chromium (SwiftShader WebGL), saves screenshots to qa/shots
   and a JSON report to qa/qa-report.json. Numbers are what this headless box measured, nothing more. */
import { chromium, devices } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
mkdirSync("qa/shots", { recursive: true });
const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 2500));

const report = { when: new Date().toISOString(), runs: {} };
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

async function open(name, ctxOpts, url = BASE) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message.slice(0, 200)));
  await page.addInitScript(() => {
    window.__vitals = { lcp: 0, cls: 0 };
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__vitals.lcp = e.startTime; window.__lcpEl = e.element ? (e.element.tagName + "." + (e.element.className || "")).slice(0, 60) : e.url; })).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__vitals.cls += e.value; })).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  return { ctx, page, errors, name };
}
const shot = (page, file) => page.screenshot({ path: `qa/shots/${file}.jpg`, type: "jpeg", quality: 70, timeout: 90000 });
const offsets = (page) => page.evaluate(() => {
  const t = (s) => document.querySelector(s).getBoundingClientRect().top + scrollY;
  const h = (s) => document.querySelector(s).offsetHeight;
  return { vh: innerHeight, hero: t("#hero"), heroH: h("#hero"), sol: t("#soluzioni"), solH: h("#soluzioni"), method: t("#metodo"), methodH: h("#metodo"), offers: t("#prezzi"), contact: t("#contatti"), max: document.documentElement.scrollHeight - innerHeight, cls: document.documentElement.className };
});
const scrollTo = async (page, y, wait = 900) => { await page.evaluate((v) => window.scrollTo(0, v), Math.round(y)); await page.waitForTimeout(wait); };

/* ---------- forge frozen at 45% (?forge=0.45) so the pulse can be inspected ---------- */
{
  const f = await open("forge", { viewport: { width: 1440, height: 900 } }, BASE + "?forge=0.45");
  await f.page.waitForFunction(() => document.documentElement.classList.contains("film-ready"), null, { timeout: 20000 }).catch(() => {});
  await f.page.waitForTimeout(2500);
  await shot(f.page, "d02_forge_pulse_frozen_at_45pct");
  await f.ctx.close();
}

/* ---------- desktop 1440x900 ---------- */
{
  const { page, errors, ctx } = await open("desktop", { viewport: { width: 1440, height: 900 } });
  await page.waitForTimeout(250);
  await shot(page, "d01_first-paint_250ms");
  await page.waitForFunction(() => document.documentElement.classList.contains("film-ready"), null, { timeout: 20000 }).catch(() => {});

  await page.waitForTimeout(2200);
  await shot(page, "d03_forged_rest");
  const o = await offsets(page);
  await scrollTo(page, o.hero + (o.heroH - o.vh) * 0.55);
  await shot(page, "d04_spin_ascent");
  await scrollTo(page, o.sol + (o.solH - o.vh) * 0.16);
  await shot(page, "d05_split_beams");
  await scrollTo(page, o.sol + (o.solH - o.vh) * 0.5, 1400);
  await shot(page, "d06_four_cards_stable");
  // interactions inside the stable card scene
  const kpiBefore = await page.textContent('[data-kpi="0"]');
  await page.click('.ds-tabs [data-range="m"]');
  const kpiAfter = await page.textContent('[data-kpi="0"]');
  await page.click('[data-open="d-web"]');
  await page.waitForTimeout(1800);
  await shot(page, "d07_card_dialog");
  await page.keyboard.press("Escape");
  const dialogClosed = await page.evaluate(() => !document.getElementById("d-web").open);
  await scrollTo(page, o.sol + (o.solH - o.vh) * 0.8);
  await shot(page, "d08_cards_exit_rejoin");
  await scrollTo(page, o.sol + (o.solH - o.vh) * 1.0 + 40, 1200);
  await shot(page, "d09_docked_mini");
  const dock = await page.evaluate(() => ({ docked: document.documentElement.classList.contains("docked"), mini: (() => { const r = document.querySelector("[data-mini]").getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })(), cta: (() => { const r = document.querySelector(".hd__cta").getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })(), nav: (() => { const r = document.querySelector(".hd__nav").getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })() }));
  await scrollTo(page, o.method + o.methodH * 0.35, 1200);
  await shot(page, "d10_sunset_method");
  await scrollTo(page, o.offers - o.vh * 0.1, 1200);
  await shot(page, "d11_twilight_offers_top");
  await scrollTo(page, o.offers + o.vh * 0.45, 1200);
  await shot(page, "d12_space_pricing");
  await scrollTo(page, o.max, 1400);
  await shot(page, "d13_contact");
  // reverse: back to the split and to the top
  await scrollTo(page, o.sol + (o.solH - o.vh) * 0.5, 1400);
  await shot(page, "d14_reverse_cards");
  await scrollTo(page, 0, 1500);
  await shot(page, "d15_reverse_top");
  const reverse = await page.evaluate(() => ({ docked: document.documentElement.classList.contains("docked"), hx: getComputedStyle(document.querySelector("[data-hero]")).getPropertyValue("--hx") }));
  const stats = await page.evaluate(() => window.__novaStats && window.__novaStats());
  // FPS during a scripted scroll through the cinematic part
  const fps = await page.evaluate(async (o) => {
    const frames = []; let last = performance.now();
    await new Promise((res) => {
      const t0 = performance.now(); const end = o.sol + o.solH;
      const step = (now) => { frames.push(now - last); last = now; const k = (now - t0) / 4000; scrollTo(0, Math.min(1, k) * end); if (k < 1) requestAnimationFrame(step); else res(); };
      requestAnimationFrame(step);
    });
    const a = frames.slice(2); const avg = a.reduce((s, v) => s + v, 0) / a.length;
    a.sort((x, y) => x - y);
    return { avgFps: +(1000 / avg).toFixed(1), p95FrameMs: +a[Math.floor(a.length * 0.95)].toFixed(1), frames: a.length };
  }, o);
  const net = await page.evaluate(() => { const r = performance.getEntriesByType("resource"); const nav = performance.getEntriesByType("navigation")[0]; const sum = r.reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0) + (nav ? nav.transferSize : 0); return { requests: r.length + 1, transferKB: Math.round(sum / 1024), largest: r.map((e) => [e.name.split("/").pop(), Math.round((e.transferSize || e.encodedBodySize) / 1024)]).sort((a, b) => b[1] - a[1]).slice(0, 6) }; });
  const vitals = await page.evaluate(() => window.__vitals);
  const mem = await page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
  const links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")));
  const anchorsOk = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].every((a) => a.getAttribute("href") === "#" || document.querySelector(a.getAttribute("href"))));
  report.runs.desktop = { offsets: o, errors, kpi: { before: kpiBefore, after: kpiAfter }, dialogClosed, dock, reverse, stats, fps, net, vitals, jsHeapMB: mem, links: { total: links.length, whatsapp: links.filter((l) => l.startsWith("https://wa.me/393206891014")).length, mailto: links.filter((l) => l.startsWith("mailto:studio@novasignal.it")).length, tel: links.filter((l) => l.startsWith("tel:+393206891014")).length, anchorsOk, other: links.filter((l) => !/^(#|https:\/\/wa\.me|mailto:|tel:)/.test(l)) } };
  // keyboard path: Tab from top reaches the hero CTA in the first stops
  await scrollTo(page, 0, 300);
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); });
  await page.mouse.click(5, 300);
  const tabs = [];
  for (let i = 0; i < 9; i++) { await page.keyboard.press("Tab"); tabs.push(await page.evaluate(() => (document.activeElement.textContent || document.activeElement.getAttribute("aria-label") || "").trim().slice(0, 40))); }
  report.runs.desktop.tabOrder = tabs;
  await ctx.close();
}

/* ---------- LCP / CLS on an untouched load (no scrolling, which would extend LCP) ---------- */
for (const [name, opts] of [["desktop", { viewport: { width: 1440, height: 900 } }], ["mobile", { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } }]]) {
  const { page, ctx } = await open("lcp-" + name, opts);
  await page.waitForTimeout(6000);
  const v = await page.evaluate(() => { const l = performance.getEntriesByType("largest-contentful-paint"); return { ...window.__vitals, lcpElement: (() => { const e = window.__lcpEl; return e || null; })(), fcp: (performance.getEntriesByName("first-contentful-paint")[0] || {}).startTime }; });
  report.runs["vitals-" + name] = v;
  await ctx.close();
}

/* ---------- mobile 390x844 ---------- */
{
  const { page, errors, ctx } = await open("mobile", { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } });
  await page.waitForTimeout(250);
  await shot(page, "m01_first-paint");
  await page.waitForFunction(() => document.documentElement.classList.contains("film-ready"), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2600);
  await shot(page, "m02_forged");
  const o = await offsets(page);
  await scrollTo(page, o.vh * 0.45, 1000);
  await shot(page, "m03_spin_dock");
  await scrollTo(page, o.sol + 40, 1200);
  await shot(page, "m04_cards");
  await scrollTo(page, o.offers + o.vh * 0.2, 1200);
  await shot(page, "m05_pricing");
  await page.tap(".hd__burger");
  await page.waitForTimeout(500);
  await shot(page, "m06_menu");
  const menuOpen = await page.evaluate(() => !document.getElementById("menu").hidden);
  const ox = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const vitals = await page.evaluate(() => window.__vitals);
  const net = await page.evaluate(() => { const r = performance.getEntriesByType("resource"); const nav = performance.getEntriesByType("navigation")[0]; return Math.round((r.reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0) + (nav ? nav.transferSize : 0)) / 1024); });
  report.runs.mobile = { offsets: o, errors, menuOpen, overflowX: ox, vitals, transferKB: net };
  await ctx.close();
}

/* ---------- tablet 768x1024 ---------- */
{
  const { page, errors, ctx } = await open("tablet", { viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true });
  await page.waitForFunction(() => document.documentElement.classList.contains("film-ready"), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2600);
  await shot(page, "t01_hero");
  const o = await offsets(page);
  await scrollTo(page, o.sol + 40, 1200);
  await shot(page, "t02_cards");
  const ox = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  report.runs.tablet = { errors, overflowX: ox };
  await ctx.close();
}

/* ---------- reduced motion ---------- */
{
  const { page, errors, ctx } = await open("reduced", { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await page.waitForTimeout(800);
  await shot(page, "r01_reduced_top");
  const o = await offsets(page);
  await scrollTo(page, o.sol, 400);
  await shot(page, "r02_reduced_cards");
  await scrollTo(page, o.offers, 400);
  await shot(page, "r03_reduced_pricing");
  report.runs.reduced = { errors, classes: o.cls, pageHeightVh: +((o.max + o.vh) / o.vh).toFixed(2) };
  await ctx.close();
}

/* ---------- no WebGL ---------- */
{
  const { page, errors, ctx } = await open("nowebgl", { viewport: { width: 1440, height: 900 } }, BASE + "?nowebgl");
  await page.waitForTimeout(800);
  await shot(page, "n01_nowebgl_top");
  const o = await offsets(page);
  await scrollTo(page, o.sol, 400);
  await shot(page, "n02_nowebgl_cards");
  report.runs.nowebgl = { errors, classes: o.cls };
  await ctx.close();
}

await browser.close();
server.kill();
writeFileSync("qa/qa-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 1).slice(0, 6000));
