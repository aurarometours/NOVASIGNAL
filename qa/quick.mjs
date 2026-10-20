/* quick visual loop: node qa/quick.mjs <name> <url-suffix> <w> <h> <fractions of named section...> */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
const [name, suffix = "", w = "1440", h = "900", ...marks] = process.argv.slice(2);
const server = spawn("npx", ["vite", "preview", "--port", "4180", "--strictPort"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 2200));
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await (await b.newContext({ viewport: { width: +w, height: +h } })).newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://localhost:4180/" + suffix);
await p.waitForFunction(() => document.documentElement.classList.contains("film-ready"), null, { timeout: 20000 }).catch(() => errs.push("no film-ready"));
await p.waitForTimeout(3000);
let k = 0;
for (const m of marks.length ? marks : ["hero:0"]) {
  const [sec, f] = m.split(":");
  await p.evaluate(([sec, f]) => { const el = document.querySelector("#" + sec); const top = el.getBoundingClientRect().top + scrollY; scrollTo(0, top + (el.offsetHeight - innerHeight) * +f); }, [sec, f]);
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `/tmp/q-${name}-${k++}.jpg`, type: "jpeg", quality: 70 });
}
console.log(name, errs);
await b.close(); server.kill();
