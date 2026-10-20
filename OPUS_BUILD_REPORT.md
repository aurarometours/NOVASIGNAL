# OPUS_BUILD_REPORT — NOVA / LIVING CINEMA, checkpoint CK01 + CK02 (+ scaffold CK03/CK04)

**Data:** 19 ottobre 2026, sera (Europe/Rome).
**Repo sorgente letto (sola lettura):** `aurarometours/NOVASIGNAL` — `gh-pages` @ `f5acc63cea4404927000c7f501200413bc0ce301`, `gh-pages-backup-v9` @ `08bc5252921ff9de46bfb555cdec835f65d391fd`.
**Dove vive il prototipo:** cartella isolata `nova-living-cinema/` (questo pacchetto); branch Git separato `prototype/nova-living-cinema` (orfano, senza storia comune con `gh-pages`, non pubblicato da nessun workflow).
**Avvio:** `npm install && npm run dev` · build `npm run build` · QA `npm run qa` · file unico `npm run preview:single`.
**Produzione:** nessun push su `gh-pages`, nessuna modifica a `site-bundle.txt`, nessun dispatch del workflow. Prezzi e contatti copiati dal live senza modifiche.

## Asset di origine
- **Logo 3D:** `gh-pages-backup-v9:assets/nova-glass.glb`, 39.200 byte, header `glTF`, 5 mesh (`01_Brand_Amber_Crown`, `02_Strategy_Gold_Core`, `03_Left_Pearl_Terminal`, `04_Right_Pearl_Terminal`, `05_Technology_Teal_Tail`) sotto `NS_Logo_Rig`, extras `rest_position` / `explode_offset` usati direttamente per forge e split. Geometria intatta.
- **Calibrazione materiali (solo materiali):** i volumi del GLB sono tarati per Cycles; in tempo reale l'assorbimento cortissimo rendeva l'arancio color mattone e il teal viola. Ho applicato tinte NovaSpectrum per pezzo + un gradiente verticale per piano (come nel marchio originale), trasmissione ridotta, perla sinistra bianca opaca. Documentato in `src/world.js`.
- **Fallback 2D:** `public/img/nova-mark.svg`, tracciato dai `svg_contour` presenti negli extras del GLB (non ridisegnato a mano).
- **Cielo e nuvole:** `sky-d/sky-m/cloud-a/cloud-b.webp` dal branch `gh-pages`. Il cielo pubblicato contiene già un logo renderizzato in alto a destra (era lo sfondo delle sezioni): l'ho rimosso con un fill locale, altrimenti appariva un secondo logo dietro quello 3D. Alle nuvole ho aggiunto bordi sfumati (i ritagli avevano bordi rettangolari visibili) e le ho ridotte a 1000 px.

## Skill e agenti
Lette e applicate dal pacchetto: `CLAUDE.md`, decisioni 19/10, `OPUS_TASK_001`, `ACCEPTANCE_QA`, spec creativa, 6 scene, motion matrix, brand tokens, source of truth, GLB recovery, skill `novasignal-brand-physics` e `novasignal-web-3d`. **Nessun subagente avviato**: lavoro sequenziale in un'unica sessione.

## Evidenza funzionale (screenshot in `qa/shots/`)
| Scena | Cosa fa | Screenshot |
|---|---|---|
| Prima pittura | H1 "Siti web, app, software e identità…", lead, 3 CTA in HTML prima di qualsiasi 3D; poster del cielo finché il GLB non è pronto | `d01`, `m01` |
| 01 Forge | 5 pezzi convergono dagli `explode_offset`, flash bianco→ciano che vira nel colore proprio di ogni pezzo, anello d'urto unico, aura intrinseca | `d02` (congelato al 45% con `?forge=0.45`), `d03` |
| 02 Spin/ascent | 260° legati allo scroll + 3/4 di riposo e ±6°/±4° sul puntatore; H1 resta ferma finché si legge, poi esce in z | `d04` |
| 03 Split → 4 card | il prisma si apre (offset GLB ×2.3), 4 beam di energia partono da 4 pezzi verso la posizione di riposo di ciascuna card; le card entrano da z −130 lungo il proprio beam, sfalsate; il nucleo oro resta al centro. Mappa semantica: perla bianca → Siti, coda teal → Web app/SaaS, corona ambra → Brand, perla destra → App | `d05`, `d06` |
| Card interattive | WEB scrolla la mini pagina su hover/focus · SAAS cambia davvero stato 7g/30g (24→96 nel test) · BRAND griglia→segno→palette→biglietto · MOBILE 3 schermate con pallini o swipe · "Scopri" apre un dialog con chiusura Esc/×, focus restituito | `d06`, `d07` |
| Uscita + dock | le card escono in profondità, i pezzi si ricompongono, il logo rimpicciolisce e si aggancia nello slot top-right (35×44 px, tra nav e CTA, nessuna sovrapposizione misurata); poi passa a un mini-renderer che reagisce di pochi gradi al puntatore/focus | `d08`, `d09` |
| 04 Atmosfera | shader del cielo giorno → tramonto → crepuscolo → spazio con punti-segnale rari (niente starfield), nuvole tinte e attenuate; header passa a testo chiaro | `d10`, `d11` |
| 05 Offerte | Signal / Nova / Supernova con anteprime diverse per livello di prodotto + Orbit/Pulse/Care compatti; prezzi identici al live | `d12` |
| 06 Transmit | linea d'energia che si disegna verso i contatti reali (WhatsApp, email, telefono) | `d13` |
| Reverse | tornando su: card ricomposte, logo sgancia e torna nell'hero, H1 di nuovo visibile (`--hx` = 0, `docked` = false) | `d14`, `d15` |

**Lunghezza:** parte cinematografica (hero + soluzioni) = **4,2 viewport** su desktop (prima ~18). Prezzi a 5,7 vh, pagina intera 8 vh. Su mobile nessuna scena pinnata: scroll naturale.

## Test eseguiti
Strumento: Playwright 1.56 + Chromium 141 headless con **SwiftShader** (rendering WebGL software), `vite preview` della build.

| Test | Esito | Evidenza |
|---|---|---|
| `npm run build` | **Pass**, 0 errori (avviso solo sulla dimensione del chunk three) | log build |
| 1440×900 | **Pass** | `d01`–`d15` |
| 768×1024 | **Pass**, overflow-x 0 | `t01`, `t02` |
| 390×844 (iPhone 13) | **Pass**, overflow-x 0, menu apre/chiude | `m01`–`m06` |
| Reduced motion | **Pass**: niente pin, niente WebGL, logo SVG, tutto leggibile, CTA attive | `r01`–`r03` |
| No WebGL (`?nowebgl`) | **Pass**: stessa esperienza statica | `n01`, `n02` |
| Tastiera | **Pass** parziale: Tab raggiunge CTA hero → card → demo → dialog; entrando con Tab nelle card la scena salta allo stato stabile; Esc chiude dialog e menu | `tabOrder` in `qa-report.json` |
| Touch | **Parziale**: tap su burger verificato; swipe della demo mobile implementato ma non simulato | — |
| Link | 34 link: 15 WhatsApp (+39 320 689 1014), 1 mailto studio@novasignal.it, 1 tel, tutte le ancore interne esistono, 0 link esterni sconosciuti | `links` |
| CLS | **0** desktop e mobile | `vitals-*` |
| Transfer | desktop **396 KB** (11 richieste; three.js 146 KB gz, nuvole 133 KB, cielo 59 KB, GLB 39 KB); mobile **350 KB**. Font Google esclusi: bloccati dal proxy di questa macchina | `net` |
| JS heap | ~10 MB | `jsHeapMB` |
| FPS | **Non misurabile qui**: SwiftShader rende su CPU (1,5–17 fps a 1440×900 con trasmissione). Da misurare su GPU reale | `fps`, `stats` |
| LCP | 84–124 ms in locale, ma senza font e su localhost: **non rappresentativo** | `vitals-*` |

## Problemi noti
1. **Prestazioni GPU reali non misurate.** Il vetro trasmissivo fa un passaggio di rendering in più; c'è un DPR adattivo (scende se il frame supera 24 ms) ma va verificato su iPhone e Android di fascia media.
2. **three.js pesa 146 KB gz**, importato per intero. Si può ridurre importando solo i moduli usati.
3. Look del vetro tarato a occhio su SwiftShader: su GPU vera riflessi e trasmissione saranno diversi; serve una sessione di taratura su un Mac/iPhone reale.
4. Solo italiano; la versione EN non c'è ancora.
5. Su mobile niente beam: le card entrano con la reveal 3D standard. Scelta voluta, da rivalutare.
6. Il cielo "pulito" è un ritocco del vecchio render, non un nuovo asset: un cielo generato senza logo sarebbe più pulito a 4K.
7. Il dialog "Scopri" va bene per il prototipo; per SEO servirà una pagina di dettaglio vera per ogni servizio.

## Prossimi 3 ticket
1. **CK05-PERF-GPU:** misurare FPS/INP/LCP/memoria su GPU reale (Chrome desktop + iPhone Safari + Android medio) con `?debug`; tree-shaking di three, `KTX2` per le nuvole, tetto di trasmissione su mobile. Accettazione: 60 fps desktop, ≥40 fps iPhone 12, LCP <2,5 s su 4G simulato.
2. **CK03-SKY-POLISH + EN:** asset cielo nuovo senza logo (2K/4K), taratura del vetro su GPU reale, versione `/en/` con hreflang, contrasto WCAG misurato su tramonto e notte.
3. **CK06-RELEASE-PLAN:** decidere con te come portarlo live: build → zip → `site-bundle.txt` (la pipeline già esistente) su un URL di staging prima di `gh-pages`, più una pagina di dettaglio per ciascuna delle 4 soluzioni.

## Sicurezza
Nessun push o deploy in produzione. L'unica scrittura su GitHub è il branch isolato `prototype/nova-living-cinema`.
