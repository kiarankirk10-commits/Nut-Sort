# Installing Nut Sort on your iPhone

Nut Sort is a web app (PWA). Your iPhone needs to load it **once over HTTPS**; after that it lives on
your Home Screen and works forever offline (airplane mode included). No App Store, no ads, no account
inside the game.

You do the hosting part once (about 10 minutes), then never again unless you want updates.

---

## Step 1 — Put the game online once (free HTTPS)

### Recommended: GitHub Pages (free, automatic updates)

1. Make a free account at **github.com** (skip if you have one).
2. Click **+ → New repository**. Name it `nut-sort`. Choose **Public** (free GitHub Pages needs a public
   repo — see the privacy note below). Don't add a README. Click **Create repository**.
3. On your Mac, open Terminal in the game folder and push the project (GitHub shows these exact commands
   on the empty repo page; replace `YOUR-NAME`):
   ```bash
   cd "$HOME/Library/Mobile Documents/com~apple~CloudDocs/Bolt Sorting Game"
   git remote add origin https://github.com/YOUR-NAME/nut-sort.git
   git push -u origin main
   ```
   (If it asks for a password, use a GitHub *personal access token* or sign in with GitHub Desktop.)
4. On GitHub open the repo → **Settings → Pages** → under *Build and deployment* set **Source: GitHub
   Actions**.
5. Open the **Actions** tab. The "Deploy Nut Sort" workflow runs the tests, checks every level, stamps
   the offline cache and publishes the `app/` folder. When it shows a green tick (1–2 minutes) your game
   is at:
   **`https://YOUR-NAME.github.io/nut-sort/`**

**Privacy note:** a public repo means the code is visible on GitHub, including the names and birthdays
in `app/js/config.js` (Kiaran 15 March, Flynn 19 October). Your *progress* is never uploaded anywhere —
it stays on your phone. If you'd rather not publish the code, use the alternative below (the game files
are still reachable by anyone who knows the URL, as with any website, but the URL isn't advertised).

### Alternative: Netlify Drop (no Git needed)
1. Go to **app.netlify.com/drop** and sign in (free).
2. On your Mac run `node tools/stamp-sw.js` in the game folder first (refreshes the offline cache list).
3. Drag the **`app`** folder onto the page. You get an `https://something.netlify.app` address.
4. To update later: run `node tools/stamp-sw.js` again and drag the `app` folder onto your site's
   **Deploys** page.

---

## Step 2 — Install on the iPhone

1. Open **Safari** (must be Safari, not Chrome) and go to your address, e.g.
   `https://YOUR-NAME.github.io/nut-sort/`.
2. Wait until the home screen of the game appears (gold NUT SORT title).
3. Tap the **Share** button (square with an arrow) → scroll down → **Add to Home Screen** → keep the name
   "Nut Sort" → **Add**.
4. Open **Nut Sort from the Home Screen icon** once while still online and leave it open for ~5 seconds.
   That's when it saves every file and all levels for offline play.
5. Test it: turn on **Airplane Mode**, close the app (swipe it away), open it again from the icon.
   It should load normally. 🎉

It now runs full-screen like a normal app, with no Safari bars.

---

## Updates

When the game changes (new levels, fixes, ideas):
1. Push to GitHub (`git push`) — the Action republishes automatically. (Netlify: stamp + drag again.)
2. On the iPhone, open Nut Sort while online. It quietly downloads the new version in the background.
3. Close the app fully (swipe up from the app switcher) and open it again → you're on the new version.

Your progress, stars, themes and streak are never touched by updates.

---

## Backups (do this now and then)

Your progress is stored on the phone, inside the app. If you ever delete the app or clear Safari's website
data, it's gone — so keep a backup:

- **Settings → Back up my progress → EXPORT** saves a `nut-sort-backup-YYYY-MM-DD.json` file. Choose
  **Save to Files** (iCloud Drive is perfect).
- To restore: **Settings → Restore a backup → IMPORT** and pick the file.

---

## Playing on the Mac (for testing)

```bash
node tools/serve.js
```
Then open http://localhost:8080 in Safari or Chrome. You can also open `http://<your-mac's-ip>:8080` on
the iPhone over Wi-Fi to try things quickly, but that plain-http address can't be installed for offline
use — offline needs the HTTPS address from Step 1.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| No "Add to Home Screen" option | You're not in Safari. Copy the link into Safari. |
| Blank screen in Airplane Mode | Open it once online from the Home Screen icon and wait a few seconds (Step 2.4). |
| Old version still showing | Fully close the app and reopen it (online). Do it twice if needed. |
| Progress vanished | Settings → Restore a backup. (Happens if Safari website data was cleared.) |
| No sound | Check the silent switch; tap once (iPhone only allows sound after a touch); Settings → Sound effects. |
| Daily didn't change | It changes at midnight on the phone's clock. Pull the app closed and reopen. |
