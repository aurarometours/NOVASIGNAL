/* Static build: node src/build.mjs dist  →  dist/index.html (IT), dist/en/index.html (EN), assets copied. */
import { mkdirSync, writeFileSync, cpSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { copy, wa, PHONE, TEL, EMAIL } from "./copy.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || join(here, "..", "dist");
const NOINDEX = process.env.NOINDEX === "1";
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "en"), { recursive: true });
cpSync(join(here, "..", "static"), join(out, "assets"), { recursive: true });
cpSync(join(here, "assets", "site.css"), join(out, "assets", "site.css"));
cpSync(join(here, "assets", "site.js"), join(out, "assets", "site.js"));
const ver = Date.now().toString(36);

const ARROW = `<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>`;
const WAICO = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 3.2 17.1L2 22l5-1.3A11 11 0 0 0 20.5 3.5ZM12 20a8.9 8.9 0 0 1-4.6-1.3l-.3-.2-3 .8.8-2.9-.2-.3A9 9 0 1 1 12 20Zm4.9-6.7c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.3 7.3 0 0 1-3.6-3.2c-.3-.5.3-.4.8-1.4a.5.5 0 0 0 0-.5l-.8-2c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3Z"/></svg>`;

const page = (t) => {
  const en = t.lang === "en";
  const R = en ? "../" : "./";
  const other = en ? "../" : "./en/";
  const letters = (word, side) => [...word].map((ch, i) => `<span class="mark__l" style="--i:${side === "a" ? i : i + 4}">${ch}</span>`).join("");
  const KEY = { web: "web", brand: "brand", software: "soft", app: "app" };
  const svc = t.services.items.map((s, i) => `
        <article class="tile tile--${s.id} rv" aria-labelledby="t-${s.id}">
          <div class="tile__media"><picture><source media="(max-width: 760px)" srcset="${R}assets/img/${s.img}-s.webp"><img src="${R}assets/img/${s.img}.webp" alt="" loading="lazy" decoding="async" width="1400" height="788"></picture></div>
          <div class="tile__body">
            <p class="tile__k"><span>${s.n}</span>${s.name}</p>
            <h3 class="tile__t" id="t-${s.id}">${s.title}</h3>
            <p class="tile__d">${s.body}</p>
            <ul class="tile__tags">${s.tags.map((x) => `<li>${x}</li>`).join("")}</ul>
            <div class="tile__foot"><span class="tile__price">${s.price}</span><button class="link-btn" type="button" data-open="d-${s.id}">${t.services.more}${ARROW}</button></div>
          </div>
        </article>`).join("");
  const dialogs = t.services.items.map((s) => `
<dialog class="dlg" id="d-${s.id}" aria-labelledby="d-${s.id}-t">
  <div class="dlg__media"><img src="${R}assets/img/${s.img}-s.webp" alt="" loading="lazy" width="760" height="428"></div>
  <form method="dialog"><button class="dlg__x" aria-label="${t.close}">×</button></form>
  <p class="kicker"><span></span>${s.n} · ${s.name}</p>
  <h3 id="d-${s.id}-t">${s.title}</h3>
  <p>${s.detail}</p>
  <p class="dlg__price">${s.price}</p>
  <a class="btn btn--ink" href="${wa(s.msg)}" target="_blank" rel="noopener noreferrer">${WAICO}<span>${t.contact.wa}</span></a>
</dialog>`).join("");
  const steps = t.method.steps.map(([time, title, body], i) => `
          <li class="step" style="--i:${i}"><span class="step__n">0${i + 1}</span><span class="step__time">${time}</span><h3 class="step__t">${title}</h3><p class="step__d">${body}</p></li>`).join("");
  const CHECK = `<svg class="ico ico--check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"/></svg>`;
  const plans = t.pricing.plans.map((p, i) => `
        <article class="pc${p.featured ? " pc--featured" : ""}" style="--i:${i}" data-plan="${i}" aria-labelledby="p-${p.name}">
          <i class="pc__glow" aria-hidden="true"></i>
          <header class="pc__head">
            <p class="pc__tier">${p.for}</p>
            ${p.featured ? `<span class="pc__badge">${t.pricing.featured}</span>` : ""}
          </header>
          <h3 class="pc__name" id="p-${p.name}">${p.name}</h3>
          <p class="pc__price">${p.from ? `<small>${p.from}</small>` : ""}<strong>${p.price}</strong><span>${p.unit}</span></p>
          <ul class="pc__list">${p.features.map((f) => `<li>${CHECK}<span>${f}</span></li>`).join("")}</ul>
          <div class="pc__foot">
            <a class="btn ${p.featured ? "btn--light" : "btn--glass"} pc__cta" href="${wa(p.msg)}" target="_blank" rel="noopener noreferrer"><span>${p.cta}</span>${ARROW}</a>
            <button class="pc__pick" type="button" data-pick="${i}" aria-label="${t.pricing.cfg.plan}: ${p.name}">${t.pricing.cfg.plan === "Progetto" ? "Componi" : "Configure"}</button>
          </div>
        </article>`).join("");
  const cfgPlans = t.pricing.plans.map((p, i) => `<button type="button" class="seg__b" role="radio" aria-checked="${p.featured ? "true" : "false"}" data-seg="${i}"><b>${p.name}</b><span>${p.from ? p.from + " " : ""}${p.price}</span></button>`).join("");
  const cfgGrowth = t.pricing.growth.map(([n, what, d, p, u], i) => `<label class="tg"><input type="checkbox" data-g="${i}"><span class="tg__sw" aria-hidden="true"><i></i></span><span class="tg__txt"><b>${n}</b> ${what}</span><em>+${p}<small>${u}</small></em></label>`).join("");
  const growth = t.pricing.growth.map(([n, what, d, p, u]) => `<li><b>${n}</b><span><strong>${what}</strong> ${d}</span><em>${p}<small>${u}</small></em></li>`).join("");
  const faq = t.faq.items.map(([q, a]) => `
        <details class="qa rv"><summary><span>${q}</span><i aria-hidden="true"></i></summary><p>${a}</p></details>`).join("");
  const reachPlans = t.services.reach.plans.map(([n, w, p, u]) => `<li><b>${n}</b><span>${w}</span><em>${p}<small>${u}</small></em></li>`).join("");

  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t.title}</title>
<meta name="description" content="${t.description}">
${NOINDEX ? '<meta name="robots" content="noindex">\n' : ""}<meta name="theme-color" content="#0a1d44">
<link rel="alternate" hreflang="it" href="${en ? "../" : "./"}">
<link rel="alternate" hreflang="en" href="${en ? "./" : "./en/"}">
<meta property="og:title" content="${t.title}">
<meta property="og:description" content="${t.description}">
<meta property="og:image" content="${R}assets/img/og.jpg">
<meta property="og:type" content="website">
<link rel="icon" href="${R}assets/img/logo-cut.webp" type="image/webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,300..900;1,62..125,300..900&family=JetBrains+Mono:wght@400;500&display=swap" media="print" onload="this.media='all'">
<link rel="preload" as="image" href="${R}assets/img/plate-d.webp" media="(min-width: 761px)">
<link rel="preload" as="image" href="${R}assets/img/plate-m.webp" media="(max-width: 760px)">
<link rel="preload" as="image" href="${R}assets/img/logo-cut.webp">
<link rel="stylesheet" href="${R}assets/site.css?v=${ver}">
<script>(function(){var d=document.documentElement;d.classList.add("js");if(matchMedia("(prefers-reduced-motion: reduce)").matches||/[?&]static/.test(location.search))d.classList.add("reduced");})();</script>
</head>
<body>
<a class="skip" href="#soluzioni">${t.skip}</a>

<header class="hd" data-hd>
  <a class="hd__brand" href="#top" aria-label="NovaSignal"><img src="${R}assets/img/logo-cut.webp" alt="" width="520" height="806"><span>NovaSignal</span></a>
  <nav class="hd__nav" aria-label="${en ? "Main" : "Principale"}">${t.nav.map(([h, l]) => `<a href="${h}">${l}</a>`).join("")}</nav>
  <div class="hd__end">
    <a class="hd__lang" href="${other}" hreflang="${en ? "it" : "en"}" lang="${en ? "it" : "en"}">${en ? "IT" : "EN"}</a>
    <a class="btn btn--light hd__cta" href="${wa(t.ctaMsg)}" target="_blank" rel="noopener noreferrer"><span>${t.cta}</span>${ARROW}</a>
    <button class="hd__burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="${t.menu}"><i></i><i></i></button>
  </div>
  <div class="menu" id="menu" hidden>
    ${t.nav.map(([h, l], i) => `<a href="${h}" style="--i:${i}">${l}</a>`).join("")}
    <a class="btn btn--ink" href="${wa(t.ctaMsg)}" target="_blank" rel="noopener noreferrer">${WAICO}<span>${t.cta}</span></a>
    <a class="menu__lang" href="${other}">${t.footer.lang}</a>
  </div>
</header>

<main id="top">
  <section class="intro" data-intro aria-labelledby="h1">
    <div class="intro__stage">
      <div class="intro__plate"><picture><source media="(max-width: 760px)" srcset="${R}assets/img/plate-m.webp"><img src="${R}assets/img/plate-d.webp" alt="" fetchpriority="high" width="1680" height="946"></picture></div>
      <canvas class="intro__film" aria-hidden="true"></canvas>
      <h1 class="mark" id="h1"><span class="sr">NovaSignal — ${t.title.split("—")[1].trim()}</span><span class="mark__a" aria-hidden="true">${letters("NOVA", "a")}</span><span class="mark__b" aria-hidden="true">${letters("SIGNAL", "b")}</span></h1>
      <div class="prism" aria-hidden="true"><div class="prism__in"><img src="${R}assets/img/logo-cut.webp" alt="" width="520" height="806"><i class="prism__sweep"></i></div></div>
      <ul class="intro__meta" aria-hidden="true">${t.hero.meta.map((m) => `<li>${m}</li>`).join("")}</ul>
      <div class="intro__foot">
        <p class="intro__line">${t.hero.line}</p>
        <div class="intro__ctas">
          <a class="btn btn--light" href="${wa(t.ctaMsg)}" target="_blank" rel="noopener noreferrer">${WAICO}<span>${t.hero.primary}</span></a>
          <a class="btn btn--glass" href="#soluzioni"><span>${t.hero.secondary}</span></a>
        </div>
      </div>
      <p class="intro__cue" aria-hidden="true"><i></i>${t.hero.scroll}</p>
      <div class="intro__split">
        <p class="kicker"><span></span>${t.split.kicker}</p>
        <h2 class="intro__h2">${t.split.title}</h2>
        <p class="intro__p">${t.split.body}</p>
      </div>
      <div class="intro__light" aria-hidden="true"></div>
    </div>
  </section>

  <section class="svc" id="soluzioni" data-theme="light" aria-labelledby="svc-t">
    <header class="head rv">
      <p class="kicker"><span></span>${t.services.kicker}</p>
      <h2 class="head__t" id="svc-t">${t.services.title}</h2>
      <p class="head__lead">${t.services.lead}</p>
    </header>
  </section>

  <section class="sw" data-sw data-theme="dark" aria-roledescription="carousel" aria-label="${t.services.kicker}">
    <div class="sw__bg" aria-hidden="true">${t.services.items.map((x, i) => `<video data-k="${i}" muted loop playsinline preload="none" poster="${R}assets/img/sv-${KEY[x.id]}.webp" data-d="${R}assets/video/${KEY[x.id]}-d.mp4" data-m="${R}assets/video/${KEY[x.id]}-m.mp4" data-pm="${R}assets/img/sv-${KEY[x.id]}-m.webp"></video>`).join("")}</div>
    <div class="sw__shade" aria-hidden="true"></div>
    <div class="sw__copy" aria-live="polite">
      <p class="sw__eye"><span class="msk"><span class="ln" data-sw-eye></span></span></p>
      <h3 class="sw__title"><span class="msk"><span class="ln" data-sw-title></span></span></h3>
      <i class="sw__rule" aria-hidden="true"></i>
      <p class="sw__lede" data-sw-lede></p>
      <ul class="sw__tags" data-sw-tags></ul>
      <div class="sw__ctas">
        <span class="sw__price" data-sw-price></span>
        <button class="btn btn--light" type="button" data-sw-more><span>${t.services.more}</span>${ARROW}</button>
        <a class="btn btn--glass" data-sw-wa href="${wa(t.ctaMsg)}" target="_blank" rel="noopener noreferrer">${WAICO}<span>WhatsApp</span></a>
      </div>
    </div>
    ${["l", "r"].map((side) => `<button class="lens lens--${side}" type="button" data-lens="${side}" aria-label="">${t.services.items.map((x, i) => `<img data-k="${i}" src="${R}assets/img/lens-${KEY[x.id]}.webp" alt="" width="520" height="520" loading="lazy">`).join("")}<span class="lens__lbl" data-lens-lbl></span></button>`).join("")}
    <div class="sw__dots" role="tablist">${t.services.items.map((x, i) => `<button type="button" role="tab" data-dot="${i}" aria-label="${x.name}"><span>${x.n}</span><i></i></button>`).join("")}</div>
    <script type="application/json" id="sw-data">${JSON.stringify(t.services.items.map((x) => ({ id: x.id, n: x.n, name: x.name, title: x.title, body: x.body, tags: x.tags, price: x.price, wa: wa(x.msg) }))).replace(/</g, "\\u003c")}</script>
  </section>

  <section class="reach" data-theme="dark" aria-labelledby="reach-t">
    <div class="reach__media" aria-hidden="true"><picture><source media="(max-width: 760px)" srcset="${R}assets/img/f478-m.webp"><img src="${R}assets/img/f478.webp" alt="" loading="lazy" width="1400" height="788"></picture></div>
    <div class="reach__in rv">
      <p class="kicker"><span></span>${t.services.reach.kicker}</p>
      <h2 class="big" id="reach-t">${t.services.reach.title}</h2>
      <p class="reach__p">${t.services.reach.body}</p>
      <ul class="reach__plans">${reachPlans}</ul>
    </div>
  </section>

  <section class="method" id="metodo" data-theme="dark" data-method aria-labelledby="m-t">
    <div class="method__stage">
      <div class="method__bg" aria-hidden="true"><img src="${R}assets/img/f420.webp" alt="" loading="lazy" width="1400" height="788"></div>
      <header class="method__head">
        <p class="kicker"><span></span>${t.method.kicker}</p>
        <h2 class="big" id="m-t">${t.method.title}</h2>
      </header>
      <ol class="track" data-track>${steps}
      </ol>
      <div class="method__bar" aria-hidden="true"><i></i></div>
    </div>
  </section>

  <section class="pricing" id="prezzi" data-theme="dark" data-pricing aria-labelledby="p-t">
    <div class="pricing__sky" aria-hidden="true"><img src="${R}assets/img/f300.webp" alt="" loading="lazy" width="1400" height="788"></div>
    <div class="pricing__stage">
      <p class="pricing__word" aria-hidden="true">${[...t.pricing.word.toUpperCase()].map((c, i) => `<span style="--i:${i}">${c}</span>`).join("")}</p>
      <div class="pricing__prism" aria-hidden="true"><img src="${R}assets/img/logo-cut.webp" alt="" loading="lazy" width="520" height="806"></div>
      <header class="pricing__head">
        <h2 class="pricing__t" id="p-t">${t.pricing.title}</h2>
        <p class="pricing__lead">${t.pricing.lead}</p>
      </header>
      <div class="pcs">${plans}
      </div>
    </div>

    <div class="cfg rv" data-cfg data-cur="${t.pricing.cur}" data-locale="${t.pricing.locale}" data-nums="${t.pricing.nums.join(",")}" data-gnums="${t.pricing.gnums.join(",")}" data-names="${t.pricing.plans.map((p) => p.name).join(",")}" data-gnames="${t.pricing.growth.map((g) => g[0] + " (" + g[1] + ")").join("|")}" data-from="${t.pricing.cfg.from}" data-once="${t.pricing.cfg.once}" data-monthly="${t.pricing.cfg.monthly}" data-intro="${t.pricing.cfg.intro}" data-wa="https://wa.me/393206891014?text=">
      <div class="cfg__left">
        <h3 class="cfg__t">${t.pricing.cfg.title}</h3>
        <p class="cfg__lbl">${t.pricing.cfg.plan}</p>
        <div class="seg" role="radiogroup" aria-label="${t.pricing.cfg.plan}">${cfgPlans}</div>
        <p class="cfg__lbl">${t.pricing.cfg.growth}</p>
        <div class="tgs">${cfgGrowth}</div>
      </div>
      <div class="cfg__right">
        <p class="cfg__lbl">${t.pricing.cfg.total}</p>
        <p class="cfg__total" aria-live="polite"><small data-out-from></small><strong data-out-once>—</strong><span>${t.pricing.cfg.once}</span></p>
        <p class="cfg__month" data-out-month data-none="${t.pricing.cfg.none}">${t.pricing.cfg.none}</p>
        <a class="btn btn--light btn--lg cfg__cta" data-out-wa href="${wa(t.ctaMsg)}" target="_blank" rel="noopener noreferrer">${WAICO}<span>${t.pricing.cfg.cta}</span></a>
        <p class="cfg__note">${t.pricing.cfg.note}</p>
      </div>
    </div>
  </section>

  <section class="faq" id="faq" data-theme="light" aria-labelledby="f-t">
    <header class="head rv">
      <p class="kicker"><span></span>${t.faq.kicker}</p>
      <h2 class="head__t" id="f-t">${t.faq.title}</h2>
    </header>
    <div class="qas">${faq}
    </div>
  </section>

  <section class="contact" id="contatti" data-theme="dark" aria-labelledby="c-t">
    <div class="contact__media" aria-hidden="true"><picture><source media="(max-width: 760px)" srcset="${R}assets/img/plate-m.webp"><img src="${R}assets/img/plate-d.webp" alt="" loading="lazy" width="1680" height="946"></picture></div>
    <div class="contact__in">
      <p class="kicker rv"><span></span>${t.contact.kicker}</p>
      <h2 class="contact__t rv" id="c-t">${t.contact.title}</h2>
      <p class="contact__lead rv">${t.contact.lead}</p>
      <div class="contact__ctas rv">
        <a class="btn btn--light btn--lg" href="${wa(t.contact.msg)}" target="_blank" rel="noopener noreferrer">${WAICO}<span>${t.contact.wa}</span></a>
        <a class="btn btn--glass" href="mailto:${EMAIL}"><span>${EMAIL}</span></a>
        <a class="btn btn--glass" href="tel:${TEL}"><span>${t.contact.call} ${PHONE}</span></a>
      </div>
    </div>
    <footer class="ft">
      <div class="ft__brand"><img src="${R}assets/img/logo-cut.webp" alt="" width="520" height="806" loading="lazy"><span>NovaSignal</span></div>
      <p>${t.footer.tag}</p>
      <p><a href="mailto:${EMAIL}">${EMAIL}</a> · <a href="tel:${TEL}">${PHONE}</a> · <a href="${other}">${t.footer.lang}</a></p>
      <p>${t.footer.rights}</p>
    </footer>
  </section>
</main>

<a class="mbar" href="${wa(t.ctaMsg)}" target="_blank" rel="noopener noreferrer">${WAICO}<span><b>${t.bar.title}</b><small>${t.bar.sub}</small></span>${ARROW}</a>
${dialogs}
<script>window.NOVA={root:"${R}"};</script>
<script src="${R}assets/site.js?v=${ver}" defer></script>
</body>
</html>
`;
};

writeFileSync(join(out, "index.html"), page(copy.it));
writeFileSync(join(out, "en", "index.html"), page(copy.en));
writeFileSync(join(out, ".nojekyll"), "");
console.log("built", out);
