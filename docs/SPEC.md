# Nut Sort — condensed spec

Source of truth: `Nut_Sort_Pitch_v2.pdf` (18 pages, wins on conflict) and `Nut_Sort_App_Screens.pdf` (v1, layout detail), plus `NUT_SORT_CLAUDE_CODE_PROMPT.txt`. This page is the short version. Deviations are in `DECISIONS.md`, numbers in `TUNING.md`.

## Product
- Personal, offline, ad-free nuts-and-bolts colour sorting game for Kiaran. Zero ads, tracking, accounts or runtime network calls.
- PWA installed on iPhone via Safari "Add to Home Screen". Standalone, works in airplane mode after first load.
- "Created by Kiaran" on Home (foot) and in Settings (Credits, with "Funded by F. Roughan" + version).

## Rules
- Bolts hold `H` nuts; each colour has exactly `H` nuts; ≥2 empty spare bolts.
- Tap a bolt → its top same-colour run lifts, legal targets glow gold. Tap a target to drop; tap source/elsewhere to cancel.
- Legal target: empty bolt, or same colour on top, with room. **Group move**: whole visible top run moves, `min(run, room)`; 1 move.
- Win: every non-empty bolt full and single-coloured. Finished bolt gets a gold check + 250ms gold pulse.
- **Mystery nuts**: grey "?" nuts reveal (180ms) when they become the top. Hidden nuts never join a group; a nut revealed by a move doesn't join it. Undo re-hides. Medium: every 5th level from 10 (half the bolts). Hard: every 3rd from 6 (every bolt).
- **Tall bolts**: colours 4–18, height 3–9. Max bolts on screen: H3–5 → 35, 6–7 → 28, 8–10 → 21, 12 → 14. Nuts ≥31px wide. ≤90 nuts on ladders, ≤108 daily.
- Controls: Undo (unlimited), Hint (badge), Restart, Extra bolt (badge, 2/level). No timer, no penalties. "No moves left" overlay appears automatically.

## Difficulty (v2 p10)
| | Easy | Medium | Hard | Daily |
|---|---|---|---|---|
| Colours | 6–12 | 6–15 | 8–18 | 12–18 |
| Nuts per bolt | 3–5 | 3–7 | 4–9 | 5–9 |
| Bolts | 9–14 | 8–17 | 10–20 | ≤21 |
| Spares | 2–3 | 2 | 2 | 2 |
| Mystery | none | 1 in 5 (from L10) | 1 in 3 (from L6) | 2 of 5 shapes |
| Par | 14–36 | 26–49 | 48–86 | 75–108 |

Ladders: 30 hand-shaped rungs (targets from the PDF chart), then a plateau cycling packed / balanced / tall at the top of the band. Anchors: Easy 13 = 10 colours, 12 bolts, par 24; Hard 11 = 8×9 tall, par 62.

## Stars
- 3★ ≤ floor(1.2×par), 2★ ≤ floor(1.6×par), 1★ any finish. Mystery: 150% / 200%.
- Undo removes the move from the count; hint moves count normally.
- Daily: stars ×3 + streak bonus (+1 per streak day, max +10); ×2 on a birthday.
- Best stars kept per level; stars are spendable on themes (balance = earned − spent).

## Daily + streaks
- One board per local date (resets at local midnight). Five rotating shapes: packed, wide-and-tall, mystery, giant tall (12×9 = 108 nuts, 14 bolts), tall mystery.
- Streak = consecutive days beaten. Freeze: earn 1 per 7-day streak, hold 2. Missing exactly one day auto-uses a freeze ("Streak saved"); missing 2+ resets to 0.

## Birthdays
- Kiaran 15 March, Flynn 19 October (config list). Bunting, balloons, party hat on lifted nut, confetti on every level complete, once-a-day greeting "Happy Birthday, <name>!" + jingle. Daily pays 2×. Layers over the equipped theme; nut colours unchanged. Settings → Preview birthday theme (pick person).

## Themes
- Data in `app/js/themes.js`; CSS custom-property tokens; change chrome/background/buttons/glow only, never nut colours. 300ms crossfade. Optional fx layer (disabled under Reduce Motion).
- Free: Black & Gold (default), Cosmic Purple. Paid tiers: Classic 40–90, Luxe 120–200, Spectacular 260–450, Legendary 600–1200.
- Contrast: text ≥ 4.5:1 on panel; every nut colour distinguishable on the board background (tested).

## Screens (v2 p17 navigation)
Home → (NEW GAME) Difficulty → Level intro → Playing → Complete → Stars → Next level intro. CONTINUE → Playing. Date chip → Daily → Result (→ Streak saved). Settings from gear and Pause. Stats from star total; Themes one tap from Stats. Birthday greeting once on the day. Pause, No moves, Hint bubble while playing. Autosave after every move.

## Motion & sound
Lift 120ms, glide 180ms, drop+settle 120ms (≈0.42s), +40ms stagger per extra nut. Bolt pulse 250ms, reveal 180ms, confetti ≈1.5s. Input never blocked. Reduce motion → quick fades. Web Audio synth only: click (lift), clunk (drop), chime (finished bolt), fanfare (win), birthday jingle.

## Design
Black #09090B, Panel #161411, Gold #EABA3C, Light gold #FFECA8, Ivory #F7F1E2, Muted #AAA086. Poppins Bold (headings/buttons) + Medium (rest), self-hosted. Gold gradient pill for main action, gold outline for others. 3D hex nuts with symbols; silver threaded bolts on white round bases.

### The 18 nut colours (sampled from v1 p9 swatches)
| # | Colour | Front | Symbol |
|---|---|---|---|
| 0 | red | #D43B44 | heart |
| 1 | light grey | #C9D4D0 | star |
| 2 | purple | #9E3FAE | moon |
| 3 | blue | #2975DD | drop |
| 4 | sky blue | #4DBEED | diamond |
| 5 | indigo | #654ECA | play triangle |
| 6 | orange | #EA8C22 | lightning |
| 7 | brown | #A65436 | cloud |
| 8 | yellow | #EEBC2F | sun |
| 9 | green | #42A247 | plus |
| 10 | teal | #1C867D | ring |
| 11 | pink | #E776A5 | crown |
| 12 | charcoal | #525B68 | square |
| 13 | peach | #E0AF8C | flower |
| 14 | lime | #A4C63C | hexagon |
| 15 | magenta | #C856D6 | arrow up |
| 16 | mint | #80C8BE | music note |
| 17 | salmon | #F38570 | triangle |
