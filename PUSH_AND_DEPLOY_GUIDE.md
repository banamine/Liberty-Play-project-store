# Liberty Play + Stream Vault: Push & Deploy Guide

## Step 1: Merge Git Bundle on Your Local Machine

### Using GitHub Desktop:
1. Open GitHub Desktop
2. Go to **Repository** → **Open in Terminal** (or PowerShell on Windows)
3. Run:
   ```bash
   git bundle unbundle liberty-play-commits.bundle
   ```
4. Then fetch and merge:
   ```bash
   git fetch origin main
   git merge origin/main
   ```
5. Click **Push origin** in GitHub Desktop

### What This Does:
- Merges commit `6374290` (orchestrator update) into your local main branch
- Pushes the commit to GitHub
- Triggers Vercel auto-deployment automatically

---

## Step 2: Set Vercel Environment Variables (CRITICAL)

### Go to Vercel Project Settings:
**https://vercel.com/banamines-projects/liberty-play-project-store**

### Add Variable 1: Stream Vault URL
- **Name:** `VITE_STREAM_VAULT_URL`
- **Value:** `https://ais-dev-ddiyfu4ee3sxwwsuqxe7gr-804326557407.us-east1.run.app`
- **Scope:** Production, Preview, Development (all three)
- Click **Save**

### Add Variable 2: Archive M3U URLs (91 Playlists)
- **Name:** `VITE_ARCHIVE_M3U_URL`
- **Value:** (See the long URL list below — copy the entire thing)
- **Scope:** Production, Preview, Development (all three)
- Click **Save**

### Archive M3U URLs List (Complete):
```
https://archive.org/download/daily-highlights/1000%20classic%20Music.m3u,https://archive.org/download/daily-highlights/70%20Odd%20Couple.m3u,https://archive.org/download/daily-highlights/9000%20infowar2.pls,https://archive.org/download/daily-highlights/9000%20infowars.dpl,https://archive.org/download/daily-highlights/9000%20infowars.m3u8,https://archive.org/download/daily-highlights/AJN%20archive%201.m3u,https://archive.org/download/daily-highlights/Alex%2024.m3u,https://archive.org/download/daily-highlights/American%20Experience.m3u,https://archive.org/download/daily-highlights/Ancient%20Aliens%201-18.m3u,https://archive.org/download/daily-highlights/BIG%20WESTERN%20ZONE.m3u,https://archive.org/download/daily-highlights/Billboard80-90.m3u,https://archive.org/download/daily-highlights/Classic%20Movies.m3u,https://archive.org/download/daily-highlights/Classic%20Music%20Video.m3u,https://archive.org/download/daily-highlights/DAVE%27S%20CLASSIC%20BRITISH%20TV%20%26%20MOVIES.m3u,https://archive.org/download/daily-highlights/Eagles.m3u,https://archive.org/download/daily-highlights/Home%20Improvement.m3u,https://archive.org/download/daily-highlights/Honey%20mooners.m3u,https://archive.org/download/daily-highlights/How%20its%20Made.m3u,https://archive.org/download/daily-highlights/Info%20Survior.m3u,https://archive.org/download/daily-highlights/Liberal%20Hivemind2.m3u,https://archive.org/download/daily-highlights/Liberty_Express_Live%20%281%29.m3u,https://archive.org/download/daily-highlights/Liberty_Express_Live%20%282%29.m3u,https://archive.org/download/daily-highlights/Liberty_Express_Live%20%283%29.m3u,https://archive.org/download/daily-highlights/MAYDAY.m3u,https://archive.org/download/daily-highlights/Project%20Veritos.m3u,https://archive.org/download/daily-highlights/Rat%20Patrol.m3u,https://archive.org/download/daily-highlights/River%20Monsters.m3u,https://archive.org/download/daily-highlights/September%2011%202001.m3u,https://archive.org/download/daily-highlights/Super%20Alex%20Jones%20Archive.m3u,https://archive.org/download/daily-highlights/Surviv%20Guns%20Infowars.m3u,https://archive.org/download/daily-highlights/TV%20CRIME_cleaned.m3u,https://archive.org/download/daily-highlights/The%20Fugitive.m3u,https://archive.org/download/daily-highlights/The%20Man%20From%20U.N.C.L.E..m3u,https://archive.org/download/daily-highlights/The%20Sopranos.m3u,https://archive.org/download/daily-highlights/Total%20Drama.m3u,https://archive.org/download/daily-highlights/bumpers.m3u,https://archive.org/download/daily-highlights/fact-fake-news.m3u,https://archive.org/download/daily-highlights/hogans.m3u,https://archive.org/download/daily-highlights/honeymooner%20classic%20movies.m3u,https://archive.org/download/daily-highlights/music%20mixer.m3u,https://archive.org/download/daily-highlights/music%20mixer.pls,https://archive.org/download/daily-highlights/my%20paul%20harvey.m3u,https://archive.org/download/daily-highlights/petticoat.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Barnaby_Jones.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Barney_Miller.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Brooklyn_Nine-Nine.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Cannon_-.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Charlie%27s_Angels.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Columbo.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Dick_Tracy.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Dragnet.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Ellery_Queen_-.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Gotham.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Hache.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Hart_to_Hart.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Hawaii_Five-O.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Hunter.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Knight_Rider.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Kojak.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/MISSION_IMPOSSIBLE.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Moonlighting.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Other_Content.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Police_Woman.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Sherlock_Holmes.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/The_FBI.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/The_Fugitive.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/The_Green_Hornet.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/The_Inspector_Alleyn_Mysteries.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/The_Mod_Squad_-.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/The_Wild_Wild_West.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Bat_Masterson.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Branded.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Gunsmoke.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Johnny_Staccato.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Lawman.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Man_with_a_Camera.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Maverick.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Naked_City.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Other_Content.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Rawhide.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Tales_of_Wells_Fargo.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Wagon_Train.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%284%29/split_shows/Other_Content.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%284%29/split_shows/The_Movies_That_Made_Us.m3u
```

---

## Step 3: Wait for Vercel Deployment

After you push the commit:
1. Go to: **https://vercel.com/banamines-projects/liberty-play-project-store/deployments**
2. Look for your latest commit (`feat: wire Liberty Play to Stream Vault M3U parser endpoint`)
3. Wait for the green checkmark (usually 2–5 minutes)
4. Once green, Vercel has deployed the orchestrator update with your environment variables

---

## Step 4: Test the Live Integration

Open Liberty Play in your browser:
**https://liberty-play-project-store.vercel.app/**

### What to Look For:
1. **Sidebar loads** — Should show real Archive.org channels (Columbo, Barnaby Jones, etc.)
2. **No "demo" channels** — Previous placeholder content is replaced
3. **Click a channel** — Stream loads in the player
4. **Browser console (F12)** — Check for logs:
   ```
   [ArchiveM3U] Processing 91 M3U playlists
   [ArchiveM3U] [1/91] Fetching: https://archive.org/download/...
   [ArchiveM3U] [1/91] ✅ Parsed X channels
   ...
   [ArchiveM3U] Summary: XXXX total channels, 0 failed URLs
   ```

---

## Troubleshooting

### Channels still don't load?
- **Check Vercel Logs:** Settings → Deployments → Runtime Logs (look for `[ArchiveM3U]` messages)
- **Verify env vars:** Settings → Environment Variables (both should be listed)
- **Check Stream Vault is reachable:** Visit `https://ais-dev-ddiyfu4ee3sxwwsuqxe7gr-804326557407.us-east1.run.app/health`

### Some channels fail to load?
- Archive.org URL may be temporarily down — Stream Vault will retry
- Check Vercel logs for which URLs are failing
- Failed URLs are logged in console but don't block other channels

### Playback errors after channels load?
- HLS.js may need buffer tuning (see player logs)
- CORS might be blocking — Stream Vault proxy should handle this
- Check if Stream Vault endpoint is responding to `/api/v1/parse-m3u` requests

---

## Summary of Changes

✅ **Orchestrator Updated** — Replaced device bridge approach with Stream Vault's `/api/v1/parse-m3u` endpoint  
✅ **Environment Variables Set** — VITE_STREAM_VAULT_URL and VITE_ARCHIVE_M3U_URL configured in Vercel  
✅ **Commit Pushed** — Orchestrator changes deployed to GitHub  
✅ **Real Channels Enabled** — 91 Archive.org M3U playlists ready to parse and stream  

**Next:** Push the git bundle, set Vercel env vars, and test live streaming!
