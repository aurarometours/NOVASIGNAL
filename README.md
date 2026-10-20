# NovaSignal nova5

Static build, no dependencies.

```
node src/build.mjs dist          # IT at dist/, EN at dist/en/
NOINDEX=1 node src/build.mjs dist  # preview builds
```

Copy in `src/copy.mjs`, styles `src/assets/site.css`, choreography `src/assets/site.js`.
Frames 123-198 (Higgsfield clip B) and images live in `static/`.
