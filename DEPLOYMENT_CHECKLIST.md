# Liberty Play + Stream Vault Deployment Checklist

## Phase 1: Code Deployment ✅ READY

- [x] Updated orchestrator (`ajn_fetch_pipeline_orchestrator.ts`) committed locally
- [x] Commit includes Stream Vault `/api/v1/parse-m3u` endpoint integration
- [x] Comma-separated M3U URL parsing implemented
- [x] Deduplication logic across 91 playlists in place
- [x] Git bundle created and ready for push

**Action:** Push the bundle from your local machine via GitHub Desktop

---

## Phase 2: Environment Configuration (YOU DO THIS NEXT)

### Vercel Project: https://vercel.com/banamines-projects/liberty-play-project-store/settings/environment-variables

**Variable 1: VITE_STREAM_VAULT_URL**
- [ ] Name: `VITE_STREAM_VAULT_URL`
- [ ] Value: `https://ais-dev-ddiyfu4ee3sxwwsuqxe7gr-804326557407.us-east1.run.app`
- [ ] Scope: Production, Preview, Development (all three boxes)
- [ ] Saved

**Variable 2: VITE_ARCHIVE_M3U_URL**
- [ ] Name: `VITE_ARCHIVE_M3U_URL`
- [ ] Value: 91-URL comma-separated list (see PUSH_AND_DEPLOY_GUIDE.md)
- [ ] Scope: Production, Preview, Development (all three boxes)
- [ ] Saved

### Expected Result:
Both variables should appear in Vercel's Environment Variables list with:
- **Scope:** Production, Preview, Development

---

## Phase 3: Git Push & Auto-Deployment

**Action:** From your local machine (GitHub Desktop):
1. Open GitHub Desktop
2. Go to **Repository** → **Open in Terminal**
3. Run: `git bundle unbundle liberty-play-commits.bundle`
4. Then: `git fetch origin main && git merge origin/main`
5. Click **Push origin**

**Expected Result:**
- Commit appears on GitHub
- Vercel detects the push
- New deployment starts automatically
- Deployment completes within 5 minutes (green checkmark)

**Watch Here:** https://vercel.com/banamines-projects/liberty-play-project-store/deployments

---

## Phase 4: Live Testing

### Once Deployment is Green ✅

**Open Your App:**
https://liberty-play-project-store.vercel.app/

### Check 1: Channel Sidebar Loads
- [ ] Sidebar shows channel list (not loading spinner)
- [ ] Real Archive.org channels visible (Columbo, Barnaby Jones, etc.)
- [ ] No "demo" placeholder content
- [ ] Categories organized (Drama, Music, News, etc.)

### Check 2: Click a Channel
- [ ] Channel title updates in player
- [ ] HLS stream starts loading
- [ ] Video player appears
- [ ] No immediate playback errors

### Check 3: Browser Console (F12)
- [ ] No critical errors (red text)
- [ ] See logs like:
  ```
  [ArchiveM3U] Processing 91 M3U playlists
  [ArchiveM3U] [1/91] Fetching: https://archive.org/download/...
  [ArchiveM3U] [1/91] ✅ Parsed X channels
  ```
- [ ] Summary line shows: `[ArchiveM3U] Summary: XXXX total channels, 0 failed URLs`

### Check 4: Playback
- [ ] Click "Play" on a channel
- [ ] Video starts (or loads with HLS playback)
- [ ] Duration/timeline visible
- [ ] Controls (play, pause, seek, volume) work

---

## Phase 5: Troubleshooting (If Needed)

### ❌ Channels don't load (sidebar empty)

**Check 1: Environment Variables**
- Go to Vercel: Settings → Environment Variables
- Verify both VITE_STREAM_VAULT_URL and VITE_ARCHIVE_M3U_URL exist
- Verify scope is Production, Preview, Development
- **Fix:** Add them if missing or update scope

**Check 2: Deployment Logs**
- Go to Vercel: Deployments → Latest → Runtime Logs
- Search for `[ArchiveM3U]` or error keywords
- Look for HTTP errors or timeout messages
- **Fix:** Redeploy if logs show issues

**Check 3: Stream Vault Health**
- Visit: https://ais-dev-ddiyfu4ee3sxwwsuqxe7gr-804326557407.us-east1.run.app/health
- Should return JSON with `"status": "ok"`
- **Fix:** If returns error, Stream Vault backend needs restart

---

### ❌ Some channels fail (partial list)

**Expected Behavior:**
- Stream Vault processes all 91 URLs sequentially
- Some may timeout or be temporarily unavailable
- Failed URLs log: `Failed: HTTP 404` or `Failed: Timeout`
- Successful channels still load and play

**Fix:** Wait 5 minutes and refresh — Archive.org services may be temporarily down

---

### ❌ Video plays but stops (playback interrupted)

**Check Browser Console:**
- Look for HLS errors: `Failed to load segment`, `CORS blocked`, etc.
- Check if Stream Vault's `/api/stream-proxy` endpoint is responding

**Possible Fixes:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try a different channel (to isolate if it's one URL or systemic)
3. Check Vercel logs for backend errors
4. Verify VITE_STREAM_VAULT_URL is correct (no typos, still accessible)

---

## Summary

| Component | Status | Endpoint |
|-----------|--------|----------|
| **Orchestrator** | Ready | `src/services/ajn_fetch_pipeline_orchestrator.ts` |
| **Stream Vault API** | Deployed | `https://ais-dev-ddiyfu4ee3sxwwsuqxe7gr-804326557407.us-east1.run.app` |
| **M3U Parser** | Deployed | `/api/v1/parse-m3u` endpoint |
| **Liberty Play Frontend** | Ready to Deploy | https://liberty-play-project-store.vercel.app |
| **Archive.org Sources** | Configured | 91 M3U playlists (comma-separated) |

---

## Next Steps

1. **NOW:** Push git bundle from local machine
2. **THEN:** Set Vercel environment variables (VITE_STREAM_VAULT_URL, VITE_ARCHIVE_M3U_URL)
3. **WAIT:** Vercel auto-deploys (5 minutes max)
4. **TEST:** Open Liberty Play, verify channels load and play
5. **DEBUG:** Use browser console + Vercel logs if issues arise

**You've got this.** Stream Vault is ready. The orchestrator is committed. Just push, configure env vars, and test.
