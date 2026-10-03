# Nut Sort — project memory

**Read `docs/PROGRESS.md` first** (what's done / what's next), then `docs/SPEC.md` and `docs/DECISIONS.md`.

Personal offline nuts-and-bolts sorting game (PWA) for Kiaran. No ads, no analytics, no accounts, no network at runtime. Spec PDFs in this folder (`Nut_Sort_Pitch_v2.pdf` wins on conflict). Ignore `_ref_tmp/`.

## Stack
Vanilla HTML/CSS/JS ES modules, zero runtime deps. Node ≥ 20 for tools/tests. `package.json` has `"type": "module"`.
Playwright (dev only) lives in `node_modules.nosync` (symlinked as `node_modules`) so iCloud doesn't sync it.

## Commands
- `node tools/serve.js` — local dev server → http://localhost:8080 (serves `app/`)
- `npm test` — unit tests (`node --test "tests/*.test.js"`)
- `node tools/verify-all.js` — re-solve and check every shipped board (`--quick` = no re-solve)
- `node tools/build-levels.js --difficulty hard --count 500` / `--all` — regenerate ladders
- `node tools/build-daily.js --count 365` — regenerate the daily pool
- `node tools/calibrate.js` — re-measure mean par per board shape (feeds the ladder builder)
- `node tools/stamp-sw.js` — refresh the service-worker precache list + bump cache version (run before every deploy)
- `npm run smoke` — Playwright smoke test (iPhone 390×844)

## Folder map
- `app/` shippable PWA. `app/js/`:
  - pure, shared with Node: `engine.js` (rules), `solver.js`, `config.js` (ALL tunables + feature flags), `stars.js`, `streak.js`, `dates.js`, `birthday.js`, `save.js` (save model + migrations), `levels.js`, `rng.js`, `colors.js`, `themes.js` (data)
  - browser: `main.js` (boot + router), `game.js` (session controller: undo, hints, autosave), `renderer.js` (board DOM + animations), `layout.js`, `storage.js` (localStorage + backup), `audio.js`, `fx.js` (theme effects), `theme-apply.js`, `ui.js` (helpers), `icons.js`, `confetti.js`, `birthday-fx.js`, `hint-worker.js`, `screens/*.js`
  - `data/` generated level JSON (committed)
- `tools/` Node build scripts (generator, ladders, builders, verify, serve, pool workers)
- `tests/` unit tests + `tests/smoke/` Playwright
- `docs/` SPEC, DECISIONS, PROGRESS, IDEAS, TUNING, INSTALL_IPHONE, LEVEL_STATS

## Rules summary
Group moves (max that fits), mystery nuts (reveal when top, undo re-hides), ≥2 spares, stars 120/160% (mystery 150/200%, floor), daily 3× + streak bonus ≤ +10, birthdays 2× daily. See SPEC.md.

## Conventions
- Rules/solver code must stay pure (no DOM) — it runs in Node and in the hint Web Worker.
- Every new tunable goes in `config.js` and `docs/TUNING.md`. Every new default/deviation goes in `docs/DECISIONS.md`.
- Save schema changes: bump `SCHEMA_VERSION`, append a migration in `save.js`.
- Before deploying: `npm test && node tools/verify-all.js --quick && node tools/stamp-sw.js`.
