# Decisions

Every default from the build prompt / PDFs, plus every deviation and why. Newest at the bottom of each section.

## Decided defaults (from Kiaran / v2 PDF p18)

| Topic | Decision |
|---|---|
| Group moves | Always move the maximum that fits: `min(run, free slots)`. Player can't choose fewer. Counts as 1 move. |
| Mystery undo | Undo re-hides any nut the move revealed (no peeking via move + undo). |
| Mystery stars | 3 stars at 150% of par, 2 stars at 200%. Par assumes full information. |
| Hints | 3 per level, 1 on mystery levels, free. Hint move counts as a normal move. |
| Streak freeze | Earn 1 each time the streak reaches a multiple of 7; hold max 2. |
| Daily stars | 3× (3, 6 or 9) + streak bonus, capped +10. |
| Birthday | Kiaran 15 Mar and Flynn 19 Oct: daily pays 2× on top. |
| Themes | Free: Black & Gold (default) + Cosmic Purple. 24 paid, 40–1200 stars. |
| Spare bolts | Never fewer than 2 (enforced in generator, verify-all and tests). |
| Extra bolts | 2 free per level. |
| Star thresholds | 120% / 160% of par. |
| Name | "Nut Sort" (`APP_NAME` in `app/js/config.js`). |

## Deviations / interpretations

1. **Star rounding = floor, not ceil.** The prompt says `ceil(1.2*par)` but also "match PDF numbers". The PDF numbers only work with floor: par 24 → 28 / 38 (ceil gives 29 / 39); Hard L11 par 62 → 74 / 99; mystery par 36 → 54 / 72. Floor matches all of them. Tested in `tests/rules.test.js`.
2. **Tutorial par is 5, not 7.** The tutorial board is the exact v1 p4 board. Its "≤8 / ≤11" targets came from v1 (single-nut moves). With v2 group moves the solver proves the optimum is 5 moves, so targets are ≤6 / ≤8 via the same formula. Keeps one consistent rule.
3. **Streak bonus = days already in the streak before today** (`min(newStreak − 1, 10)`). PDF p5 shows a 5-day streak (after the win) paying "+4". On the very first day the bonus is 0.
4. **Birthday 2× applies to the whole daily reward**: `(3× stars + streak bonus) × 2`. Only on the real birthday, not in Settings preview (preview is for looking, not farming stars).
5. **Star balance vs lifetime.** Home and Themes show the *available balance* (earned − spent). Stats shows *lifetime earned* plus spent. Replaying a level only earns the improvement over your previous best (so stars can't be farmed by replaying).
6. **Perfect solve** = finishing a level/daily with 3 stars (i.e. within the 3-star threshold). Counted once per level (first time you hit 3 stars on it), every time for dailies (one per day max).
7. **Levels solved** = distinct ladder levels solved at least once (Easy + Medium + Hard). Dailies are counted separately as "dailies beaten". Nuts sorted counts every win, including replays and dailies.
8. **Extra bolt is not a move and isn't undone by Undo.** It's a free helper; once added it stays for that attempt. Restart removes it and refunds nothing (the counter resets to 2 on restart since it is a fresh attempt — "no penalties").
9. **Restart** resets moves, undo history, hints and extra bolts to the level's start (fresh attempt).
10. **"No moves left"** appears when no legal move exists at all. Note a legal move almost always exists while an empty bolt is on the board, so the overlay mainly appears when every bolt is full or blocked — same as the original game.
11. **Unlimited levels**: 300 verified boards ship per difficulty (configurable). Level 301+ is generated on the phone *without solving*: a verified plateau board (same mystery cadence) is recoloured with a seeded colour permutation and its coloured bolts reordered; par and the stored solution are remapped, so it stays verified. Same level number → same board.
12. **Daily pool = 365 boards** (a full year, ~133 KB) instead of the minimum 70. Board for a date = `days since 1970-01-01 (local date) mod 365`.
13. **Mystery hints use only visible information.** The worker samples several "determinizations" (fills the hidden nuts with random colours consistent with what's left), solves each quickly, and picks the first move that most samples agree on. It never reads the real hidden colours. On non-mystery levels the hint follows the stored solution if you are still on it, otherwise re-solves in a Web Worker.
14. **Mystery solvability**: every mystery board is verified solvable with full information (that's what par means). Hidden nuts only hide information; with unlimited undo + extra bolts any board can still be finished.
15. **One unfinished game per slot** (tutorial, easy, medium, hard, daily). Home's CONTINUE resumes the most recently played one. Difficulty cards show RESUME for their own slot.
16. **Date chip on first launch** shows the gold dot (today's daily not done) like the PDF; streak flame hidden while the streak is 0.
17. **Generator shapes**: packed / balanced / tall per rung cycle; Hard tall uses ≥8 stacks; all coloured bolts start full; boards with a finished bolt (or a near-finished run) at the start are binned as "boring".
18. **Level 1 is the tutorial board** the first time only; Easy level 1 follows it.
19. **Daily replay** after beating it is allowed for fun but pays no extra stars and doesn't change the streak.
20. **Service worker update flow**: a new version precaches in the background and activates on the next launch (no `skipWaiting` mid-game). Progress lives in localStorage and is never touched by updates.
21. **Two theme colours nudged for contrast** (the contrast test is mandatory): Cosmic Purple's main-button text is dark `#140A38` instead of white (white on `#9B6BFF` is only 3.5:1); Sapphire's gradient partner is `#2E52E0` instead of `#1E3FCC` so button text stays readable across the gradient.
22. **Contrast test thresholds**: text on panel ≥ 4.5:1, muted text ≥ 3:1, accent (outline buttons) ≥ 3:1, button text ≥ 4.5:1 on `--accent` and ≥ 3:1 on `--accent-2`, every nut's lit face ≥ 2:1 against the board background (nuts also have dark side faces, white bases and symbols).
23. **Tutorial stars** go into the star balance once (first completion only) but don't count toward any difficulty's progress.
24. **A level counts as "in progress" as soon as it's opened**, so Home shows CONTINUE even before the first move.
25. **Board rendering = DOM `<img>` per nut** (SVG art rasterised once per colour, moved with `transform` via WAAPI). Measured 60fps with 108 nuts in Chrome; no canvas needed.
26. **Hidden-nut art**: grey `#4C5059` nut with a "?" (matches PDF). The real colour image sits underneath and cross-fades in on reveal (180ms).
27. **Daily replay after midnight**: an unfinished daily from yesterday can't be continued (its slot is discarded) — the daily is "the same all day, resets at midnight".
28. **Service worker in the repo stays in "dev" mode** (network-first, so edits show while developing). `tools/stamp-sw.js` (run automatically by the GitHub Pages workflow and `npm run smoke`) switches it to cache-first with a content-hashed cache name for deploys.
29. **Birthday decorations push screen content down 16px** so the bunting never covers the top bar.
