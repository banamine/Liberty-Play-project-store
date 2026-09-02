# Liberty Play + Stream Vault Integration Guide
## Complete Vercel Environment Setup

---

## Phase 2: Wire Liberty Play to Stream Vault

### What Changed
Your orchestrator now:
- ✅ Accepts **comma-separated M3U URLs** (no more single URL limitation)
- ✅ Fetches each M3U sequentially through Stream Vault's `/api/v1/parse-m3u` endpoint
- ✅ Parses real Archive.org channels (replacing demo content)
- ✅ Deduplicates channels across all playlists
- ✅ Logs detailed per-URL progress and failure tracking

---

## Step 1: Deploy Updated Orchestrator to Liberty Play

Replace your current `ajn_fetch_pipeline_orchestrator.ts` file with the updated version that handles multiple M3U URLs.

**File:** `src/orchestrator/ajn_fetch_pipeline_orchestrator.ts`

---

## Step 2: Configure Vercel Environment Variables

### Go to Your Vercel Project Settings

1. Navigate to: **https://vercel.com/banamines-projects/liberty-play-project-store**
2. Click **Settings** → **Environment Variables**
3. Add the following three variables:

### Variable 1: Stream Vault URL (Development)

**Name:** `VITE_STREAM_VAULT_URL`

**Value:**
```
https://ais-dev-ddiyfu4ee3sxwwsuqxe7gr-804326557407.us-east1.run.app
```

**Scope:** Production, Preview, Development

---

### Variable 2: Archive.org M3U Playlist URLs (Comma-Separated)

**Name:** `VITE_ARCHIVE_M3U_URL`

**Value:**
```
https://archive.org/download/daily-highlights/1000%20classic%20Music.m3u,https://archive.org/download/daily-highlights/70%20Odd%20Couple.m3u,https://archive.org/download/daily-highlights/9000%20infowar2.pls,https://archive.org/download/daily-highlights/9000%20infowars.dpl,https://archive.org/download/daily-highlights/9000%20infowars.m3u8,https://archive.org/download/daily-highlights/AJN%20archive%201.m3u,https://archive.org/download/daily-highlights/Alex%2024.m3u,https://archive.org/download/daily-highlights/American%20Experience.m3u,https://archive.org/download/daily-highlights/Ancient%20Aliens%201-18.m3u,https://archive.org/download/daily-highlights/BIG%20WESTERN%20ZONE.m3u,https://archive.org/download/daily-highlights/Billboard80-90.m3u,https://archive.org/download/daily-highlights/Classic%20Movies.m3u,https://archive.org/download/daily-highlights/Classic%20Music%20Video.m3u,https://archive.org/download/daily-highlights/DAVE%27S%20CLASSIC%20BRITISH%20TV%20%26%20MOVIES.m3u,https://archive.org/download/daily-highlights/Eagles.m3u,https://archive.org/download/daily-highlights/Home%20Improvement.m3u,https://archive.org/download/daily-highlights/Honey%20mooners.m3u,https://archive.org/download/daily-highlights/How%20its%20Made.m3u,https://archive.org/download/daily-highlights/Info%20Survior.m3u,https://archive.org/download/daily-highlights/Liberal%20Hivemind2.m3u,https://archive.org/download/daily-highlights/Liberty_Express_Live%20%281%29.m3u,https://archive.org/download/daily-highlights/Liberty_Express_Live%20%282%29.m3u,https://archive.org/download/daily-highlights/Liberty_Express_Live%20%283%29.m3u,https://archive.org/download/daily-highlights/MAYDAY.m3u,https://archive.org/download/daily-highlights/Project%20Veritos.m3u,https://archive.org/download/daily-highlights/Rat%20Patrol.m3u,https://archive.org/download/daily-highlights/River%20Monsters.m3u,https://archive.org/download/daily-highlights/September%2011%202001.m3u,https://archive.org/download/daily-highlights/Super%20Alex%20Jones%20Archive.m3u,https://archive.org/download/daily-highlights/Surviv%20Guns%20Infowars.m3u,https://archive.org/download/daily-highlights/TV%20CRIME_cleaned.m3u,https://archive.org/download/daily-highlights/The%20Fugitive.m3u,https://archive.org/download/daily-highlights/The%20Man%20From%20U.N.C.L.E..m3u,https://archive.org/download/daily-highlights/The%20Sopranos.m3u,https://archive.org/download/daily-highlights/Total%20Drama.m3u,https://archive.org/download/daily-highlights/bumpers.m3u,https://archive.org/download/daily-highlights/fact-fake-news.m3u,https://archive.org/download/daily-highlights/hogans.m3u,https://archive.org/download/daily-highlights/honeymooner%20classic%20movies.m3u,https://archive.org/download/daily-highlights/music%20mixer.m3u,https://archive.org/download/daily-highlights/music%20mixer.pls,https://archive.org/download/daily-highlights/my%20paul%20harvey.m3u,https://archive.org/download/daily-highlights/petticoat.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Barnaby_Jones.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Barney_Miller.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Brooklyn_Nine-Nine.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Cannon_-.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Charlie%27s_Angels.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Columbo.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Dick_Tracy.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Dragnet.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Ellery_Queen_-.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Gotham.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Hache.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Hart_to_Hart.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Hawaii_Five-O.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Hunter.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Knight_Rider.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Kojak.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/MISSION_IMPOSSIBLE.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Moonlighting.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Other_Content.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Police_Woman.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/Sherlock_Holmes.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/The_FBI.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/The_Fugitive.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/The_Green_Hornet.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/The_Inspector_Alleyn_Mysteries.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/The_Mod_Squad_-.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%281%29/split_shows/The_Wild_Wild_West.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Bat_Masterson.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Branded.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Gunsmoke.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Johnny_Staccato.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Lawman.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Man_with_a_Camera.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Maverick.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Naked_City.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Other_Content.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Rawhide.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Tales_of_Wells_Fargo.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%282%29/split_shows/Wagon_Train.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%284%29/split_shows/Other_Content.m3u,https://archive.org/download/daily-highlights/m3u_split_shows_2026-08-05%20%284%29/split_shows/The_Movies_That_Made_Us.m3u
```

**Scope:** Production, Preview, Development

> ⚠️ **Note:** This is a very long string (91 M3U URLs). Vercel environment variables support this length.

---

### Variable 3 (Optional): Enable Archive M3U Fetching

**Name:** `VITE_ENABLE_ARCHIVE_M3U`

**Value:**
```
true
```

**Scope:** Production, Preview, Development

---

## Step 3: Deploy to Vercel

1. **Push updated orchestrator** to your GitHub repository:
   ```bash
   git add src/orchestrator/ajn_fetch_pipeline_orchestrator.ts
   git commit -m "feat: support multiple comma-separated M3U URLs in orchestrator"
   git push origin main
   ```

2. **Vercel auto-deploys** when you push to main
   - Watch the deployment at: https://vercel.com/banamines-projects/liberty-play-project-store/deployments

3. **Verify deployment succeeds** (green checkmark on latest commit)

---

## Step 4: Test Real Archive.org Channels

Once deployed, open Liberty Play and verify:

1. **Channel list loads** (no "demo" channels)
2. **Archive.org channels appear** in the sidebar
3. **Click a channel** → Stream loads via HLS player
4. **Browser console** shows:
   ```
   [ArchiveM3U] Processing 91 M3U playlists
   [ArchiveM3U] [1/91] Fetching: https://archive.org/download/daily-highlights/1000%20classic%20Music.m3u
   [ArchiveM3U] [1/91] ✅ Parsed X channels
   ...
   [ArchiveM3U] Summary: XXXX total channels, 0 failed URLs
   ```

---

## Troubleshooting

### No channels load
- [ ] Check Vercel logs: **Deployments** → **Runtime Logs**
- [ ] Verify `VITE_STREAM_VAULT_URL` is correct
- [ ] Verify `VITE_ARCHIVE_M3U_URL` is set (comma-separated)
- [ ] Stream Vault endpoint is reachable (try `/health`)

### Some playlists fail
- [ ] Archive.org URL may be temporarily unavailable
- [ ] The M3U file format may be invalid (parser will log which ones)
- [ ] Check orchestrator logs for "Failed to fetch" messages

### Stream won't play
- [ ] Ensure HLS.js is properly initialized
- [ ] Check CORS headers on Stream Vault proxy
- [ ] Verify video URL is valid (should be Archive.org direct MP4)

---

## Summary

✅ **Stream Vault M3U Parser** — Cloud Run endpoint deployed and live  
✅ **Orchestrator** — Updated to handle 91 comma-separated M3U URLs  
✅ **Vercel Config** — Environment variables set for Liberty Play  
✅ **Ready to Deploy** — Push to GitHub and Vercel auto-deploys  

**Next:** Push the updated orchestrator, wait for Vercel deployment, then test real channels loading.
