/* Builds ONE self-contained HTML file (JS, CSS, GLB and images inlined) for sharing a preview
   without a server: npm run preview:single → preview-single/nova-living-cinema.html */
import { build } from "vite";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const out = "preview-single/.tmp";
await build({ logLevel: "warn", base: "./", build: { outDir: out, emptyOutDir: true, assetsInlineLimit: 0, rollupOptions: { output: { inlineDynamicImports: true } } } });

let html = readFileSync(join(out, "index.html"), "utf8");
const assets = readdirSync(join(out, "assets"));
const js = assets.find((f) => f.endsWith(".js"));
const css = assets.find((f) => f.endsWith(".css"));
const b64 = (p, type) => `data:${type};base64,${readFileSync(p).toString("base64")}`;
const MAP = {
  "./img/sky-d.webp": b64("public/img/sky-d.webp", "image/webp"),
  "./img/sky-m.webp": b64("public/img/sky-m.webp", "image/webp"),
  "./img/cloud-a.webp": b64("public/img/cloud-a.webp", "image/webp"),
  "./img/cloud-b.webp": b64("public/img/cloud-b.webp", "image/webp"),
  "./img/nova-mark.svg": b64("public/img/nova-mark.svg", "image/svg+xml"),
  "./models/nova-glass.glb": b64("public/models/nova-glass.glb", "model/gltf-binary"),
};
const swap = (s) => {
  for (const [k, v] of Object.entries(MAP)) {
    s = s.split(k.replace("./", "../")).join(v);
    s = s.split(k).join(v);
    s = s.split(k.replace("./", "/")).join(v);
  }
  return s;
};
let jsSrc = swap(readFileSync(join(out, "assets", js), "utf8"));
let cssSrc = swap(readFileSync(join(out, "assets", css), "utf8"));
html = html.replace(/<script type="module" crossorigin src="[^"]+"><\/script>/, "");
html = html.replace(/<link rel="stylesheet" crossorigin href="[^"]+">/, () => `<style>${cssSrc}</style>`);
html = html.replace(/<link rel="preload"[^>]+>/g, "");
html = swap(html);
html = html.replace("</body>", () => `<script type="module">${jsSrc.replace(/<\/script/g, "<\\/script")}</script>\n</body>`);
mkdirSync("preview-single", { recursive: true });
writeFileSync("preview-single/nova-living-cinema.html", html);
console.log("preview-single/nova-living-cinema.html", Math.round(html.length / 1024), "KB");

/* artifact variant: the host adds doctype/html/head/body, so emit head content + body content only */
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.slice(html.indexOf("<body>") + 6, html.lastIndexOf("</body>"));
const art = head.replace(/<title>[^<]*<\/title>/, "<title>NovaSignal Living Cinema</title>").replace(/<meta charset[^>]*>\s*/, "").replace(/<meta name="viewport"[^>]*>\s*/, "") + "\n" + body;
writeFileSync("preview-single/artifact.html", art);
console.log("preview-single/artifact.html", Math.round(art.length / 1024), "KB");
