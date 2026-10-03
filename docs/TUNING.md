# Tuning

Every number here is a **starting point, to be tuned after Kiaran plays**. Almost everything lives in
[`app/js/config.js`](../app/js/config.js) — change it there, reload, done. Level-shape numbers need a
level rebuild (`node tools/build-levels.js --all`, then `node tools/verify-all.js`).

## Stars (`config.js` → `STARS`)
| Setting | Value | Notes |
|---|---|---|
| 3 stars | moves ≤ floor(1.2 × par) | `STARS.normal.three` |
| 2 stars | moves ≤ floor(1.6 × par) | `STARS.normal.two` |
| Mystery 3 / 2 stars | 150% / 200% of par | `STARS.mystery` |
| Daily multiplier | ×3 (3, 6 or 9) | `STARS.dailyMultiplier` |
| Streak bonus cap | +10 (bonus = days already in the streak) | `STARS.streakBonusCap` |
| Birthday daily multiplier | ×2 on the whole daily reward | `STARS.birthdayDailyMultiplier` |

## Per level (`config.js`)
| Setting | Value | Constant |
|---|---|---|
| Hints per level | 3 | `HINTS_PER_LEVEL` |
| Hints on mystery levels | 1 | `HINTS_PER_MYSTERY_LEVEL` |
| Extra (free) bolts per level | 2 | `EXTRA_BOLTS_PER_LEVEL` |
| Min spare bolts | 2 | `MIN_SPARES` |

## Streaks (`config.js` → `STREAK`)
| Setting | Value |
|---|---|
| Earn a freeze every | 7 streak days (`freezeEvery`) |
| Max freezes held | 2 (`freezeMax`) |

## Motion, ms (`config.js` → `MOTION`)
| Setting | Value |
|---|---|
| Lift / glide / drop+settle | 120 / 180 / 120 (≈0.42 s per nut) |
| Extra nut in a run starts | +40 |
| Finished-bolt gold pulse | 250 (CSS `.slot.pulse` uses 250ms too) |
| Mystery reveal | 180 |
| Confetti | 1500 |
| Reduce-motion fade | 120 |
| Theme crossfade | 300 |
Easing curves are at the top of `app/js/renderer.js`. Sounds (pitch/volume/length) are in `app/js/audio.js`.

## Board / screen
| Setting | Value | Where |
|---|---|---|
| Min / max nut width | 31 / 62 px | `MIN_NUT_PX`, `MAX_NUT_PX` |
| Max bolts per height | 3–5 → 35, 6–7 → 28, 8–10 → 21, 12 → 14 | `MAX_BOLTS_BY_HEIGHT` |
| Column width, gaps, lift height | in units of nut width | `M` in `app/js/layout.js` |
| Nut proportions | top face 30, body 44 (per 100 wide) | `NUT` in `app/js/art.js` |

## Difficulty bands (`config.js` → `BANDS`, plus `tools/ladders.js`)
| | Easy | Medium | Hard | Daily |
|---|---|---|---|---|
| Colours | 6–12 | 6–15 | 8–18 | — |
| Height | 3–5 | 3–7 | 4–9 | 5–9 |
| Bolts | 9–14 | 8–17 | 10–20 | ≤21 |
| Par band | 14–36 | 26–49 | 48–86 | 75–108 |
| Mystery | none | every 5th from L10 (half the bolts) | every 3rd from L6 (every bolt) | 2 of 5 shapes |
- First 30 targets per ladder: `LADDER_TARGETS` in `tools/ladders.js` (read off the PDF chart).
- Plateau after level 30: `PLATEAU` (Easy 26–36, Medium 38–49, Hard 64–84).
- Shape heights per class: `SHAPE_HEIGHTS`. Anchors (Easy 13 par 24, Hard 11 par 62): `ANCHORS`.
- Mystery cadence: `mysteryModeFor()` in `config.js`.
- Ladder size: `DEFAULT_COUNT = 300` in `tools/build-levels.js`; daily pool `DEFAULT_DAILY_COUNT = 365` in `tools/build-daily.js`; daily shapes `DAILY_SHAPES`.

## Hints solver on the phone (`config.js` → `HINT_SOLVER`)
| Setting | Value |
|---|---|
| Background re-solve budget | 4000 ms |
| Mystery samples | 6 (budget 4000 ms total) |

## Themes / economy (`app/js/themes.js`)
Prices: Classic 40–90, Luxe 120–200, Spectacular 260–450, Legendary 600–1200.
Economy check: a perfect player earns ≤3 stars per ladder level (900 levels ≈ 2,700) plus up to 19 per
daily (9 + 10 streak bonus; 38 on a birthday), i.e. a few hundred stars a month of regular play. Classic
themes come within the first day or two; Legendary ones are long-term goals (weeks to months). If that
feels too slow/fast after playing, change the `price` fields — nothing else depends on them.

## Feature flags (`config.js` → `FEATURES`)
`mystery, hints, extraBolt, daily, themes, birthday, music, levelSelect` — switch features off without
deleting code.
