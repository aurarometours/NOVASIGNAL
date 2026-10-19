/* D0 + D1: one renderer owns the sky, the clouds and the five-part prism.
   Everything is a pure function of the state passed in setState() (scroll-derived),
   so reverse scroll restores every pose. Only the forge intro and idle breathing use time. */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
const lerp = (a, b, t) => a + (b - a) * t;
const DEG = Math.PI / 180;
const FORGE_WHITE = new THREE.Color(0.75, 0.95, 1.0);

/* piece → card mapping (semantic): left pearl = Websites, crown = Brand, tail = Web app/SaaS, right pearl = Mobile.
   The gold core stays at the centre: strategy holds the system together. */
const PIECE_FOR_CARD = ["03_Left_Pearl_Terminal", "05_Technology_Teal_Tail", "01_Brand_Amber_Crown", "04_Right_Pearl_Terminal"];

const SKY_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`;
const SKY_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tDay;
uniform float uPhase, uTime, uAspect, uTexAspect, uDrift;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
vec2 coverUv(vec2 uv){
  vec2 s = vec2(1.0);
  if (uAspect > uTexAspect) s.y = uTexAspect / uAspect; else s.x = uAspect / uTexAspect;
  return (uv - 0.5) * s + 0.5;
}
void main(){
  vec2 uv = coverUv(vUv);
  uv.y = clamp(uv.y - uDrift, 0.0, 1.0);
  vec3 day = texture2D(tDay, uv).rgb;               /* raw sRGB values: we compose in display space */
  float lum = dot(day, vec3(0.299, 0.587, 0.114));
  float y = vUv.y;
  float hz = exp(-pow((y - 0.3) * 3.2, 2.0));       /* horizon band */
  vec3 sunset = day * vec3(1.16, 0.80, 0.64) + vec3(1.0, 0.45, 0.18) * hz * 0.30;
  sunset = mix(sunset, sunset * vec3(0.78, 0.66, 0.92), smoothstep(0.45, 1.0, y) * 0.55);
  vec3 twi = vec3(lum) * vec3(0.22, 0.27, 0.52) + mix(vec3(0.07, 0.09, 0.22), vec3(0.02, 0.03, 0.10), y);
  twi += vec3(1.0, 0.42, 0.32) * pow(hz, 3.0) * 0.16;
  vec3 space = mix(vec3(0.030, 0.052, 0.105), vec3(0.006, 0.008, 0.016), smoothstep(0.22, 0.95, y));
  space += vec3(lum) * vec3(0.035, 0.05, 0.09) * (1.0 - smoothstep(0.0, 0.42, y));
  space += vec3(0.35, 0.85, 1.0) * exp(-abs(y - 0.3) * 70.0) * 0.10;
  /* rare signal points, not a starfield */
  vec2 g = vUv * vec2(uAspect, 1.0) * 38.0;
  vec2 id = floor(g); vec2 f = fract(g) - 0.5;
  float h = hash(id);
  vec2 o = (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.6;
  float pt = step(0.986, h) * smoothstep(0.075, 0.0, length(f - o));
  pt *= 0.55 + 0.45 * sin(uTime * 1.1 + h * 50.0);
  pt *= smoothstep(0.34, 0.62, y);
  vec3 c;
  float p = uPhase;
  if (p < 1.0) c = mix(day, sunset, smoothstep(0.0, 1.0, p));
  else if (p < 2.0) c = mix(sunset, twi, smoothstep(0.0, 1.0, p - 1.0));
  else c = mix(twi, space, smoothstep(0.0, 1.0, p - 2.0));
  c += vec3(0.78, 0.96, 1.0) * pt * smoothstep(1.6, 2.6, p);
  gl_FragColor = vec4(c, 1.0);
}`;

const GLOW_FRAG = /* glsl */ `
precision highp float; varying vec2 vUv; uniform float uI; uniform vec3 uC;
void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.2) * uI; gl_FragColor = vec4(uC * a, a); }`;
const RING_FRAG = /* glsl */ `
precision highp float; varying vec2 vUv; uniform float uI;
void main(){ float d = length(vUv - 0.5) * 2.0; float r = exp(-pow((d - 0.82) * 14.0, 2.0)); float core = exp(-d * d * 9.0) * 0.4;
  vec3 c = mix(vec3(1.0), vec3(0.0, 0.81, 1.0), smoothstep(0.5, 1.0, d)); float a = (r + core) * uI; gl_FragColor = vec4(c * a, a); }`;
const BEAM_FRAG = /* glsl */ `
precision highp float; varying vec2 vUv; uniform float uI, uT, uSeed;
void main(){
  float across = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 3.0) * 1.6;
  float pulse = exp(-pow((fract(vUv.x * 0.9 - uT * 0.55 + uSeed) - 0.5) * 9.0, 2.0));
  float ends = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
  float a = across * (0.6 + pulse * 1.2) * ends * uI;
  vec3 c = mix(vec3(1.0), vec3(0.0, 0.81, 1.0), smoothstep(0.0, 0.7, vUv.x));
  c = mix(c, vec3(1.0), pulse * 0.6);
  gl_FragColor = vec4(c, clamp(a, 0.0, 1.0));
}`;

export function createWorld({ canvas, mobile, onReady, onFail }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) { onFail && onFail(e); return null; }
  let dprMax = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  let dpr = dprMax;
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 6);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key = new THREE.DirectionalLight(0xfff4e6, 2.2); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fefff, 1.6); rim.position.set(4, -1, -2); scene.add(rim);

  /* ---- sky (opaque mesh so the glass transmission pass refracts it) ---- */
  const loader = new THREE.TextureLoader();
  let skyOk = false, modelOk = false, readyInfo = null;
  const maybeReady = () => { if (skyOk && modelOk && onReady) { onReady(readyInfo); onReady = null; } };
  const skyTex = loader.load(mobile ? "./img/sky-m.webp" : "./img/sky-d.webp", (t) => { skyU.uTexAspect.value = t.image.width / t.image.height; skyOk = true; maybeReady(); });
  skyTex.colorSpace = THREE.NoColorSpace;
  const skyU = { tDay: { value: skyTex }, uPhase: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 1 }, uTexAspect: { value: mobile ? 0.75 : 2400 / 1357 }, uDrift: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, depthWrite: false, toneMapped: false }));
  sky.position.z = -30; sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  /* ---- clouds: two real cut-outs from the site's own sky, at two depths ---- */
  const cloudDefs = [
    { src: "./img/cloud-a.webp", z: -9, y: -2.6, x: -2.2, w: 13, speed: 0.6, flip: false },
    { src: "./img/cloud-b.webp", z: -4.2, y: -2.15, x: 1.6, w: 8.5, speed: 1.15, flip: true },
  ];
  const clouds = cloudDefs.map((d) => {
    const tex = loader.load(d.src, (t) => { m.scale.set(d.w * (d.flip ? -1 : 1), d.w * t.image.height / t.image.width, 1); });
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.9 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.position.set(d.x, d.y, d.z); m.renderOrder = -5; m.userData = d;
    m.scale.set(d.w, d.w * 0.4, 1);
    scene.add(m);
    return m;
  });

  /* ---- prism halo + forge ring ---- */
  const quadVert = SKY_VERT;
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: { uI: { value: 0 }, uC: { value: new THREE.Color(0.75, 0.95, 1.0) } }, vertexShader: quadVert, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: { uI: { value: 0 } }, vertexShader: quadVert, fragmentShader: RING_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  glow.renderOrder = ring.renderOrder = 5;
  scene.add(glow, ring);

  /* ---- beams: energy transferred from four pieces to four DOM cards ---- */
  const beams = [0, 1, 2, 3].map((i) => {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: { uI: { value: 0 }, uT: { value: 0 }, uSeed: { value: i * 0.27 } }, vertexShader: quadVert, fragmentShader: BEAM_FRAG, transparent: true, depthWrite: false, toneMapped: false }));
    b.renderOrder = 6; b.visible = false; scene.add(b); return b;
  });

  /* ---- the real GLB ---- */
  const prism = new THREE.Group();
  scene.add(prism);
  const pieces = {};
  let model = null;
  let ready = false;
  let forgeT0 = -1;
  const MODEL_H = 0.2425;

  new GLTFLoader().load("./models/nova-glass.glb", (gltf) => {
    model = gltf.scene;
    const rig = model.getObjectByName("NS_Logo_Rig") || model;
    rig.children.slice().forEach((node) => {
      const ex = node.userData && node.userData.explode_offset ? node.userData.explode_offset : [0, 0, 0];
      pieces[node.name] = { node, rest: node.position.clone(), ex: new THREE.Vector3(ex[0], ex[1], ex[2]) };
      node.traverse((o) => {
        if (!o.isMesh) return;
        const m = o.material;
        m.envMapIntensity = 1.7;
        m.emissive = new THREE.Color(0.75, 0.95, 1.0);
        m.emissiveIntensity = 0;
        /* calibration (materials only, geometry untouched). The GLB volumes were tuned for Cycles:
           in real time their very short attenuation distance turns orange→brick and teal→violet.
           Brand-true NovaSpectrum tints + a lighter absorption keep the mark recognisable. */
        const BRAND = { "01_Brand_Amber_Crown": 0xff8a3d, "02_Strategy_Gold_Core": 0xffc15e, "05_Technology_Teal_Tail": 0x2fd6c9, "04_Right_Pearl_Terminal": 0x7ff0e6, "03_Left_Pearl_Terminal": 0xf8feff };
        const brand = new THREE.Color(BRAND[node.name] || 0xffffff);
        m.userData.brand = brand.clone();
        if (/Left_Pearl/.test(node.name)) {
          m.transmission = 0.18; m.roughness = 0.2; m.color = new THREE.Color(0.97, 0.99, 1.0); m.attenuationDistance = Infinity;
        } else {
          m.transmission = /Right_Pearl/.test(node.name) ? 0.3 : 0.38;
          m.roughness = 0.05;
          m.color = brand.clone();
          m.attenuationColor = brand.clone();
          m.attenuationDistance = 0.025;
          m.thickness = 0.03;
          m.ior = 1.45;
        }
        m.clearcoat = 1; m.clearcoatRoughness = 0.05;
        m.specularIntensity = 1;
        /* the original mark is not flat colour: each plane carries its own NovaSpectrum gradient */
        const GRAD = { "01_Brand_Amber_Crown": [0xff7a2e, 0xffc070], "02_Strategy_Gold_Core": [0x8fdc8a, 0xffc15e], "05_Technology_Teal_Tail": [0x00cfff, 0x5fd99a], "04_Right_Pearl_Terminal": [0x2fd6c9, 0x9ff6ee], "03_Left_Pearl_Terminal": [0xe9f3ff, 0xffffff] };
        const gr = GRAD[node.name];
        if (gr) {
          o.geometry.computeBoundingBox();
          const bb = o.geometry.boundingBox;
          const u = { uGA: { value: new THREE.Color(gr[0]) }, uGB: { value: new THREE.Color(gr[1]) }, uY0: { value: bb.min.y }, uY1: { value: bb.max.y } };
          m.color = new THREE.Color(1, 1, 1);
          m.onBeforeCompile = (sh) => {
            Object.assign(sh.uniforms, u);
            sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying float vGy;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvGy = position.y;");
            sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uY0; uniform float uY1;");
            sh.vertexShader = sh.vertexShader.replace("vGy = position.y;", "vGy = clamp((position.y - uY0) / max(1e-5, uY1 - uY0), 0.0, 1.0);");
            sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vGy; uniform vec3 uGA; uniform vec3 uGB;").replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= mix(uGA, uGB, smoothstep(0.0, 1.0, vGy));");
          };
          m.customProgramCacheKey = () => node.name;
          if (m.attenuationColor) m.attenuationColor.lerp(new THREE.Color(1, 1, 1), 0.15);
        }
        m.needsUpdate = true;
      });
    });
    const box = new THREE.Box3().setFromObject(rig);
    const c = box.getCenter(new THREE.Vector3());
    rig.position.sub(c);
    prism.add(model);
    ready = true;
    forgeT0 = performance.now();
    modelOk = true; readyInfo = { meshes: Object.keys(pieces) }; maybeReady();
  }, undefined, (err) => { onFail && onFail(err); });

  /* ---- sizing ---- */
  let W = 1, H = 1;
  const visH = () => 2 * Math.tan((camera.fov * DEG) / 2) * camera.position.z;
  const resize = () => {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    const d = camera.position.z - sky.position.z;
    const h = 2 * Math.tan((camera.fov * DEG) / 2) * d * 1.04;
    sky.scale.set(h * camera.aspect, h, 1);
    skyU.uAspect.value = camera.aspect;
  };
  resize();

  /* screen px → world point on plane z = 0 */
  const toWorld = (px, py) => {
    const vh = visH();
    return new THREE.Vector3((px / W - 0.5) * vh * camera.aspect, -(py / H - 0.5) * vh, 0);
  };

  /* ---- state ---- */
  const S = { pH: 0, pS: 0, phase: 0, drift: 0, cards: [], slot: null, px: 0, py: 0 };
  let tiltX = 0, tiltY = 0;
  const setState = (s) => Object.assign(S, s);

  const tmp = new THREE.Vector3();
  const anchor = new THREE.Vector3();
  const out = { dock: 0, forge: 0, split: 0 };

  /* ---- adaptive quality ---- */
  let acc = 0, n = 0;
  const adapt = (dt) => {
    acc += dt; n++;
    if (n < 90) return;
    const avg = acc / n; acc = 0; n = 0;
    if (avg > 24 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); }
    else if (avg < 12 && dpr < dprMax) { dpr = Math.min(dprMax, dpr + 0.25); renderer.setPixelRatio(dpr); resize(); }
  };

  let last = performance.now();
  let running = true;
  const frameTimes = [];

  const frame = (now) => {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(64, now - last); last = now;
    frameTimes.push(dt); if (frameTimes.length > 240) frameTimes.shift();
    adapt(dt);
    const t = now / 1000;
    skyU.uTime.value = t;
    skyU.uPhase.value = S.phase;
    skyU.uDrift.value = S.drift;

    /* clouds: parallax with scroll + slow drift, tinted by the hour */
    const tint = cloudTint(S.phase);
    clouds.forEach((m) => {
      const d = m.userData;
      m.position.y = d.y + S.drift * 9 * d.speed + (S.pS + S.pH) * 0.35 * d.speed;
      m.position.x = d.x + Math.sin(t * 0.03 * d.speed + d.z) * 0.25;
      m.material.color.setRGB(tint[0], tint[1], tint[2]);
      m.material.opacity = tint[3];
    });

    if (ready) {
      const vh = visH();
      const vw = vh * camera.aspect;
      const f = S.forgeAt != null ? S.forgeAt : (forgeT0 < 0 ? 0 : clamp((now - forgeT0) / 1900));
      const fe = easeOut(f);
      out.forge = f;

      /* pointer response: a few degrees only */
      tiltY += (S.px * 6 * DEG - tiltY) * 0.06;
      tiltX += (S.py * 4 * DEG - tiltX) * 0.06;

      /* model base size */
      const baseH = mobile ? vh * 0.28 : vh * 0.44;
      let scale = (baseH / MODEL_H) * (0.72 + 0.28 * fe);

      /* 01-02: hero pose → ascent */
      const pH = S.pH;
      let x = mobile ? 0 : lerp(vw * 0.23, 0, smooth(pH * 1.1));
      let y = mobile ? vh * 0.2 : lerp(-0.045 * vh, 0.02 * vh, smooth(pH));
      let rotY = (-40 * DEG) * (1 - fe) - 28 * DEG + 260 * DEG * smooth(pH);
      let rotX = 9 * DEG * (1 - out.dock);

      /* 03: split → cards (desktop) */
      const pS = mobile ? 0 : S.pS;
      const into = smooth(pS / 0.3);
      const rejoin = smooth((pS - 0.74) / 0.14);
      const split = into * (1 - rejoin);
      out.split = split;
      rotY += 100 * DEG * into;
      if (!mobile) { y = lerp(y, -0.035 * vh, smooth(pS / 0.2)); scale *= lerp(1, 0.6, smooth(pS / 0.25)); }

      /* dock: to the mini slot in the header */
      let dock = mobile ? smooth((pH - 0.42) / 0.5) : smooth((pS - 0.84) / 0.16);
      if (S.forceDock) dock = 1;
      out.dock = dock;
      if (S.slot && dock > 0) {
        const p = toWorld(S.slot.x, S.slot.y);
        const slotScale = ((S.slot.h / H) * vh * 0.82) / MODEL_H;
        const k = smooth(dock);
        x = lerp(x, p.x, k); y = lerp(y, p.y, k);
        scale = lerp(scale, slotScale, k * k * (3 - 2 * k) * 0.6 + k * 0.4);
        const full = Math.round(rotY / (2 * Math.PI)) * 2 * Math.PI;
        rotY = lerp(rotY, full, k);
      }
      prism.visible = dock < 0.999;
      prism.position.set(x, y, 0);
      prism.scale.setScalar(scale);
      prism.rotation.set(rotX + tiltX * (1 - dock) + Math.sin(t * 0.7) * 0.02 * (1 - dock), rotY + tiltY * (1 - dock), 0);

      /* pieces: forge convergence + split (explode offsets from the GLB extras, amplified) */
      const forgeSpread = 7 * Math.pow(1 - fe, 2);
      const spread = forgeSpread + split * 2.3;
      Object.values(pieces).forEach((pc, i) => {
        pc.node.position.copy(pc.rest).addScaledVector(pc.ex, spread);
        pc.node.position.z += split * Math.sin(t * 0.8 + i) * 0.002;
        pc.node.traverse((o) => {
          if (!o.isMesh) return;
          const m = o.material;
          const flash = 2.6 * Math.pow(1 - f, 2);
          /* white-cyan at the forge, then the piece's own NovaSpectrum colour glows from within */
          if (m.userData.brand) m.emissive.copy(FORGE_WHITE).lerp(m.userData.brand, clamp(f * 1.4)).multiplyScalar(1);
          m.emissiveIntensity = flash + 0.16 + split * 0.2;
        });
      });

      /* aura: intrinsic white→cyan, strongest at the forge */
      glow.position.set(x, y, -0.4);
      const gs = scale * MODEL_H * 2.6;
      glow.scale.set(gs, gs, 1);
      glow.material.uniforms.uI.value = ((0.9 * (1 - fe) + 0.28 + 0.05 * Math.sin(t * 1.4)) + split * 0.25) * (1 - dock) * (S.phase > 1.5 ? 1.3 : 1);
      ring.position.set(x, y, 0.2);
      const rf = clamp((f - 0.35) / 0.6);
      const rs = scale * MODEL_H * (0.6 + rf * 3.6);
      ring.scale.set(rs, rs, 1);
      ring.material.uniforms.uI.value = rf > 0 && rf < 1 ? Math.sin(rf * Math.PI) * 0.85 : 0;

      /* beams */
      beams.forEach((b, i) => {
        const card = S.cards[i];
        const pc = pieces[PIECE_FOR_CARD[i]];
        const I = card ? card.beam : 0;
        b.visible = !mobile && I > 0.01 && !!pc;
        if (!b.visible) return;
        pc.node.getWorldPosition(tmp);
        anchor.copy(toWorld(card.ax, card.ay));
        const dx = anchor.x - tmp.x, dy = anchor.y - tmp.y;
        const len = Math.hypot(dx, dy);
        b.position.set((tmp.x + anchor.x) / 2, (tmp.y + anchor.y) / 2, 0.05);
        b.rotation.z = Math.atan2(dy, dx);
        b.scale.set(len, vh * 0.024, 1);
        b.material.uniforms.uI.value = I;
        b.material.uniforms.uT.value = t;
      });
    }
    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);

  let paused = false;
  const setRunning = () => {
    const want = !document.hidden && !paused;
    if (want && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    else if (!want) running = false;
  };
  document.addEventListener("visibilitychange", setRunning);
  const pause = (v) => { paused = v; setRunning(); };

  const stats = () => {
    const a = frameTimes.slice(-120);
    const avg = a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
    return { fps: avg ? 1000 / avg : 0, dpr, info: renderer.info.render, mem: renderer.info.memory };
  };

  return { pause, beams, camera, setState, resize, out, stats, get ready() { return ready; }, model: () => model, pieces };
}

function cloudTint(p) {
  /* rgb + opacity for day, sunset, twilight, space */
  const K = [[1, 1, 1, 0.92], [1.0, 0.78, 0.62, 0.9], [0.34, 0.38, 0.62, 0.7], [0.07, 0.09, 0.16, 0.45]];
  const i = Math.min(2, Math.floor(p));
  const t = smooth(p - i);
  return K[i].map((v, k) => lerp(v, K[i + 1][k], t));
}

/* Mini Nova: a tiny second renderer for the docked logo (opaque glass-like look, cheap). */
export function createMini({ canvas, source }) {
  let r;
  try { r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return null; }
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(r);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
  cam.position.set(0, 0, 0.62);
  const clone = source.clone(true);
  clone.traverse((o) => {
    if (!o.isMesh) return;
    const src = o.material;
    const att = src.attenuationColor ? src.attenuationColor.clone() : new THREE.Color(1, 1, 1);
    const white = /Left_Pearl/.test(o.parent ? o.parent.name : "") || /Left_Pearl/.test(o.name);
    o.material = new THREE.MeshPhysicalMaterial({ color: white ? new THREE.Color(0.96, 0.98, 1) : att, roughness: 0.18, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.06, emissive: white ? new THREE.Color(0.1, 0.12, 0.14) : att.clone().multiplyScalar(0.18), envMapIntensity: 1.3 });
  });
  /* reset any split offsets on the clone */
  clone.traverse((o) => { if (o.userData && o.userData.rest_position) { const p = o.userData.rest_position; o.position.set(p[0], p[1], p[2]); } });
  const g = new THREE.Group(); g.add(clone); scene.add(g);
  const resize = () => { const w = canvas.clientWidth || 36, h = canvas.clientHeight || 44; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  resize();
  let tx = 0, ty = 0, cx = 0, cy = 0, on = false, alive = true;
  const loop = (now) => {
    if (!alive) return;
    requestAnimationFrame(loop);
    if (!on || document.hidden) return;
    cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
    const t = now / 1000;
    g.rotation.set(cy * 4 * DEG, cx * 6 * DEG + Math.sin(t * 0.6) * 3 * DEG, 0);
    g.position.y = Math.sin(t * 1.2) * 0.004;
    r.render(scene, cam);
  };
  requestAnimationFrame(loop);
  return {
    resize,
    setActive(v) { on = v; },
    point(x, y) { tx = clamp(x, -1, 1); ty = clamp(y, -1, 1); },
    destroy() { alive = false; r.dispose(); },
  };
}
