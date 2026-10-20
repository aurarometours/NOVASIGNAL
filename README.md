# NOVA / LIVING CINEMA — prototipo CK01 + CK02

Prototipo isolato della homepage NovaSignal. Non tocca il sito live.

```bash
npm install
npm run dev          # http://localhost:5173  (aggiungi ?debug per slider scena + fps)
npm run build        # dist/ statico, base relativa
npm run qa           # Playwright: screenshot in qa/shots, numeri in qa/qa-report.json
npm run preview:single   # un unico file HTML autosufficiente in preview-single/
```

Parametri URL utili: `?debug` (slider scena, fps, dpr), `?forge=0.45` (congela il forge per ispezionarlo),
`?static` (esperienza statica), `?nowebgl` (simula assenza di WebGL).

## Struttura
- `index.html` — tutto il contenuto vero in HTML semantico (H1, 4 card, metodo, 3 piani, add-on, contatti).
- `src/main.js` — unico proprietario della coreografia: legge lo scroll, scrive variabili CSS e stato del mondo.
- `src/world.js` — un solo renderer Three.js: cielo (shader giorno→tramonto→crepuscolo→spazio), nuvole, GLB a 5 mesh, forge, beam, dock; più il mini-renderer del logo agganciato.
- `src/style.css` — Optical Editorial UI; `.is-cinema` (WebGL + scene pinnate) e `.is-static` (reduced motion / no WebGL).
- `public/models/nova-glass.glb` — copiato byte per byte da `gh-pages-backup-v9` (39.200 byte).
- `public/img/` — cielo e nuvole dal sito pubblicato, ripuliti (vedi report).
