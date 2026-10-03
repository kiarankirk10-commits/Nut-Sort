# Progress

Update after every milestone so a future session can resume.

## Milestones
- [x] M1 scaffold: folders, git, CLAUDE.md, docs, config, fonts (Poppins 500/700 woff2, OFL)
- [x] M2 rules engine (`app/js/engine.js`) + tests (group moves, mystery reveal/undo, win, no-moves)
- [x] M3 solver (anytime weighted A*, admissible group-move heuristic, canonical hashing), generator, calibration, ladders (300 per difficulty), daily pool (365), verify-all, stats in `docs/LEVEL_STATS.md`
- [x] M4 board renderer (DOM + WAAPI transforms), layout engine (rows, ≥31px nuts), lift/glide/drop with stagger, interruptible animations, mystery reveal, gold checks + pulse
- [x] M5 all screens + navigation (router in `main.js`), autosave after every move, CONTINUE / RESUME
- [x] M6 stars + result screen, hints (stored path → Web Worker re-solve → mystery sampling), extra bolt, undo, no-moves overlay
- [x] M7 daily challenge, streaks, freeze (earn/hold/auto-use), date chip, week dots, Streak saved screen
- [x] M8 stats, 26 themes (2 free + 24 paid) with fx layers + contrast test, star spending, settings, backup/restore, in-app reset confirm
- [x] M9 birthdays (Kiaran 15 Mar, Flynn 19 Oct): bunting, balloons, party hat, confetti, greeting once/day, 2× daily, Settings preview; credits section + credits sheet
- [x] M10 Web Audio synth sounds + optional ambient music, reduce motion (setting + iOS setting), icons (generated from the game art)
- [x] M11 PWA: manifest, cache-first service worker with stamped precache, offline verified, GitHub Pages workflow, `docs/INSTALL_IPHONE.md`
- [x] M12 full test pass: 69 unit tests, verify-all (1,265 boards re-solved), Playwright smoke test on 390×844

## Status (2026-10-03)
All features in the v2 PDF are built. Next session: tune with Kiaran on the phone.

## To tune together after Kiaran plays (see docs/TUNING.md)
- Animation timings (lift/glide/drop, stagger) and sound volumes/pitches.
- Star thresholds (120/160%, mystery 150/200%).
- Ladder difficulty curve (`tools/ladders.js` targets) and plateau ranges.
- Theme prices vs how fast stars come in.
- Nut size limits / board spacing on his exact iPhone model.

## Known limitations
- Haptics: iOS Safari has no vibration API, so none.
- Sounds only play after the first tap (iOS rule); the birthday jingle plays on the first tap of the greeting if needed.
- Progress lives on the phone. Clearing Safari website data or deleting the app loses it — use Settings → Backup.
- Levels 301+ are verified plateau boards recoloured and reshuffled (still solvable, same par), so a very dedicated player may recognise layouts eventually. Build more with `node tools/build-levels.js --difficulty hard --count 1000`.
- Daily pool repeats yearly (365 boards). Rebuild with a different count/seed key for new ones.
- Par is the solver's best solution; all 1,265 shipped boards are proven optimal under group moves, but future bigger boards may only be near-optimal (the stats file says how many).
- Mystery hints sample possibilities, so on rare boards the suggested move can turn out sub-optimal once nuts are revealed (it's always legal).
- Desktop browsers show a phone-width column (for testing only).
