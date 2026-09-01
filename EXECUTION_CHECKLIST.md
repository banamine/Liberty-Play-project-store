# Execution Checklist: Stream Vault + Liberty Play Deployment

**Goal**: Replace demo channels with real Archive.org content by wiring Liberty Play to Stream Vault's cloud M3U parser

**Time Estimate**: 20-30 minutes (mostly automated CI/CD)

---

## 📋 Pre-Deployment Checklist

- [ ] You have GitHub access to both repositories
  - [ ] https://github.com/banamine/stream-vault
  - [ ] https://github.com/banamine/Liberty-Play-project-store
- [ ] You have Vercel access to both deployments
  - [ ] https://vercel.com/banamines-projects
- [ ] You have the update instruction documents
  - [ ] STREAM_VAULT_UPDATE_INSTRUCTIONS.md
  - [ ] LIBERTY_PLAY_UPDATE_INSTRUCTIONS.md
  - [ ] DEPLOYMENT_WORKFLOW_SUMMARY.md

---

## ✅ Phase 1: Stream Vault M3U Parser Endpoint (10 minutes)

### Edit Stream Vault on GitHub

- [ ] Go to https://github.com/banamine/stream-vault
- [ ] Open `server.ts` file
- [ ] Click **Edit** button (pencil icon)
- [ ] Find: `async function startServer() {`
- [ ] Insert the M3U parser code block BEFORE that line
  - [ ] Code comes from: STREAM_VAULT_UPDATE_INSTRUCTIONS.md
  - [ ] Include: `app.post('/api/v1/parse-m3u', ...)`
  - [ ] Include: `function parseM3U(...)`
  - [ ] Include: `function isValidUrl(...)`
  - [ ] Include: `function hashUrl(...)`

### Commit the Changes

- [ ] Scroll to **Commit changes** section
- [ ] Enter commit message: `Add M3U playlist parser endpoint to Stream Vault`
- [ ] Click **Commit changes** button

### Monitor GitHub Actions

- [ ] Wait for GitHub Actions to start (should be ~30 seconds)
- [ ] Go to: https://github.com/banamine/stream-vault/actions
- [ ] Watch the latest run
- [ ] Wait for: ✅ lint → ✅ build → ✅ deploy
- [ ] Expected time: 2-3 minutes
- [ ] **DO NOT proceed until green checkmark appears**

### Verify Stream Vault Deployment

- [ ] Go to Vercel: https://vercel.com/banamines-projects
- [ ] Click `stream-vault` project
- [ ] Confirm **Deployment Status** = "Ready"
- [ ] Copy the deployment URL (e.g., `https://stream-vault-abc123.vercel.app`)
- [ ] **SAVE THIS URL** — you'll need it for Liberty Play config

### Test the M3U Parser Endpoint (Optional)

```bash
# Test command (run in terminal or use curl)
curl -X POST https://your-stream-vault-url/api/v1/parse-m3u \
  -H "Content-Type: application/json" \
  -d '{"m3uUrl":"https://archive.org/download/liberty-play-playlist/archive_movies.m3u"}'

# Expected response:
{
  "success": true,
  "channels": [...],
  "sourceUrl": "...",
  "totalParsed": 5,
  "fetchedAt": "2026-09-01T..."
}
```

- [ ] Response shows `"success": true`
- [ ] `totalParsed` > 0 (should be 5+ channels)

---

## ✅ Phase 2: Liberty Play Orchestrator Update (5 minutes)

### Edit Liberty Play Orchestrator

- [ ] Go to https://github.com/banamine/Liberty-Play-project-store
- [ ] Open `src/services/ajn_fetch_pipeline_orchestrator.ts`
- [ ] Click **Edit** button

### Update OrchestratorConfig Interface

Find this section:
```typescript
export interface OrchestratorConfig {
  ...
  m3uPlaylistUrl?: string;
  ...
}
```

Add this line after `m3uPlaylistUrl?: string;`:
```typescript
streamVaultUrl?: string; // NEW: Cloud backend for M3U parsing
```

- [ ] Line added to OrchestratorConfig

### Update Constructor

Find this section:
```typescript
const envM3u = (typeof window !== 'undefined' ? ...
```

Add these lines immediately AFTER the `envM3u` definition:
```typescript
const envStreamVault = (typeof window !== 'undefined' ? (import.meta as any)?.env?.VITE_STREAM_VAULT_URL : undefined) ||
                       (typeof process !== 'undefined' ? (process.env?.STREAM_VAULT_URL || process.env?.VITE_STREAM_VAULT_URL) : undefined);
```

- [ ] Lines added to constructor

Then find this line in the config object:
```typescript
m3uPlaylistUrl: config.m3uPlaylistUrl || envM3u,
```

Add this line immediately AFTER it:
```typescript
streamVaultUrl: config.streamVaultUrl || envStreamVault,
```

- [ ] Line added to config initialization

### Replace fetchArchiveM3U() Method

Find this method (starts around line 307):
```typescript
private async fetchArchiveM3U(): Promise<NormalizedChannel[]> {
```

Replace the ENTIRE method with the updated version from LIBERTY_PLAY_UPDATE_INSTRUCTIONS.md

The new version should:
- [ ] Call `${this.config.streamVaultUrl}/api/v1/parse-m3u` endpoint
- [ ] Include SSRF protection checks
- [ ] Have fallback to local adapter
- [ ] Include detailed error handling

### Update .env.example

- [ ] Go to `.env.example` file in repository root
- [ ] Click **Edit**
- [ ] Add these lines before `VITE_ARCHIVE_M3U_URL`:

```bash
# VITE_STREAM_VAULT_URL: Cloud-based Stream Vault backend for M3U parsing
VITE_STREAM_VAULT_URL="https://your-stream-vault-vercel-url.vercel.app"
```

- [ ] Environment variable added

### Commit All Changes

- [ ] Scroll to **Commit changes**
- [ ] Enter commit message:
```
Wire Liberty Play to Stream Vault M3U parser endpoint

- Updated fetchArchiveM3U() to call Stream Vault's cloud-based parser
- Added streamVaultUrl configuration option
- Fallback to local adapter if Stream Vault is unavailable
- Added VITE_STREAM_VAULT_URL environment variable
- This enables pure web-app deployment without device bridge
```
- [ ] Click **Commit changes**

### Monitor GitHub Actions

- [ ] Go to: https://github.com/banamine/Liberty-Play-project-store/actions
- [ ] Watch the latest run (should start immediately)
- [ ] Wait for: ✅ lint → ✅ build → ✅ deploy
- [ ] Expected time: 2-3 minutes
- [ ] **DO NOT proceed until green checkmark appears**

---

## ✅ Phase 3: Configure Stream Vault URL (2 minutes)

### Set Environment Variable in Vercel

- [ ] Go to Vercel: https://vercel.com/banamines-projects
- [ ] Click **Liberty Play** project
- [ ] Click **Settings** tab
- [ ] Click **Environment Variables** in left sidebar
- [ ] Click **Add New...**
- [ ] Enter:
  - **Name**: `VITE_STREAM_VAULT_URL`
  - **Value**: `https://your-stream-vault-url.vercel.app` (from Phase 1)
- [ ] Click **Add**
- [ ] Confirm it appears in the list
- [ ] Click **Save**

- [ ] Environment variable configured

### Trigger Redeployment

- [ ] Still in Liberty Play Vercel project settings
- [ ] Scroll up to **Deployments** section or go to **Deployments** tab
- [ ] Click **...** (three dots) on latest deployment
- [ ] Select **Redeploy**
- [ ] Confirm: **Redeploy**

- [ ] Redeployment triggered (wait 2-3 minutes)
- [ ] Confirm status changes to **Ready** ✅

---

## ✅ Phase 4: Verification (5 minutes)

### Open Liberty Play in Browser

- [ ] Go to: https://liberty-play-project-store.vercel.app
- [ ] **Wait 5 seconds** for page to load
- [ ] Sidebar should show channels (check left side of screen)

### Check Sidebar Channels

- [ ] Sidebar shows 5+ channels
- [ ] **NOT** showing "Big Buck Bunny", "Sintel", or "Tears of Steel"
- [ ] **IS** showing real Archive.org titles like:
  - [ ] "Archive.org Movies"
  - [ ] "Live Broadcasts"
  - [ ] "Documentaries"
  - [ ] etc.

If sidebar still shows demo content:
- [ ] Try **hard refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- [ ] Wait 10 more seconds
- [ ] If still demo content after hard refresh, check troubleshooting section

### Test Video Playback

- [ ] Click on any channel in the sidebar
- [ ] Player loads (center of screen)
- [ ] Do NOT see "Playback Interrupted" error
- [ ] Video starts playing OR shows pause button

If "Playback Interrupted" appears:
- [ ] This means M3U was parsed but video streams are broken
- [ ] Check browser console for specific error
- [ ] May need to use `/api/stream-proxy` for CORS issues

### Check Browser Console (DevTools)

- [ ] Press `F12` to open DevTools
- [ ] Click **Console** tab
- [ ] Look for errors (red text)
- [ ] Should NOT see errors related to:
  - [ ] "Failed to parse M3U"
  - [ ] "Cannot reach Stream Vault"
  - [ ] "Orchestrator failed"

### Check Network Requests (DevTools)

- [ ] Still in DevTools
- [ ] Click **Network** tab
- [ ] Reload the page
- [ ] Look for request to: `/api/v1/parse-m3u`
- [ ] Confirm it returns **200** status (not 404 or 500)
- [ ] Click on it to view response
- [ ] Should see `"success": true` and channel data

---

## 📊 Success Criteria

✅ **Complete Success** (All checks passed):
- [ ] Stream Vault GitHub Actions shows ✅ green checkmark
- [ ] Liberty Play GitHub Actions shows ✅ green checkmark
- [ ] Vercel shows "Ready" for both deployments
- [ ] Liberty Play sidebar shows real Archive.org channels
- [ ] Clicking a channel loads player without error
- [ ] DevTools Network shows successful `/api/v1/parse-m3u` call
- [ ] DevTools Console shows no errors

❌ **Partial Success** (Some checks failed):
- [ ] Liberty Play still shows demo content → Check VITE_STREAM_VAULT_URL is set correctly
- [ ] "Playback Interrupted" error → Video stream URL may be broken, check Archive.org sources
- [ ] DevTools shows 404 or 500 → Stream Vault M3U parser endpoint may not have deployed

✅ **Graceful Fallback** (Acceptable state):
- [ ] Stream Vault deployment failed
- [ ] Liberty Play falls back to local M3U adapter
- [ ] Channels still load (may be demo or older cached)
- [ ] No user-facing outage

---

## 🆘 Troubleshooting

### Problem: Sidebar still shows "Big Buck Bunny" (demo content)

**Possible Causes**:
1. `VITE_STREAM_VAULT_URL` not set in Vercel
2. Liberty Play redeploy hasn't completed yet (wait 5 min)
3. Browser cache (try hard refresh: Ctrl+Shift+R)

**Steps**:
```
1. Verify VITE_STREAM_VAULT_URL in Vercel Settings
   → https://vercel.com/banamines-projects → Liberty Play → Settings → Env Vars
2. Check if Vercel deployment is "Ready" (not "Building")
3. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Wait 10 seconds, refresh again
5. If still demo content, check DevTools Console for errors
```

### Problem: "Playback Interrupted - Network error"

**Possible Causes**:
1. M3U was parsed successfully (good!)
2. But video stream URLs are blocked by CORS
3. Or Archive.org video source is unavailable

**Steps**:
```
1. Check DevTools Console for specific error message
2. If CORS error: this is expected, need to use /api/stream-proxy
3. Check if Archive.org M3U source is still valid
4. Try a different Archive.org M3U URL
```

### Problem: DevTools shows 404 error on /api/v1/parse-m3u

**Possible Causes**:
1. Stream Vault M3U parser endpoint wasn't added
2. Stream Vault deployment failed
3. Wrong Stream Vault URL in `VITE_STREAM_VAULT_URL`

**Steps**:
```
1. Check Stream Vault GitHub Actions: https://github.com/banamine/stream-vault/actions
   → Should show ✅ green checkmark on latest commit
2. Go to Stream Vault Vercel: https://vercel.com/banamines-projects/stream-vault
   → Should show "Ready"
3. Verify VITE_STREAM_VAULT_URL matches the Vercel deployment URL
4. Test M3U parser endpoint manually with curl command (see Phase 1)
```

### Problem: DevTools Console shows red errors

**Common Errors**:

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot reach Stream Vault` | Network issue or wrong URL | Verify VITE_STREAM_VAULT_URL |
| `M3U parsing failed` | Invalid M3U source | Check VITE_ARCHIVE_M3U_URL is valid |
| `Undefined is not a function` | Code didn't deploy correctly | Verify GitHub Actions completed |
| `CORS error` | Browser security blocking stream | Use /api/stream-proxy endpoint |

---

## ✨ Success Example Output

### Browser Console (Good)
```
Library loaded successfully
Orchestrator initialized with 4 sources
Fetching from Stream Vault M3U parser...
M3U parsing succeeded: 12 channels parsed
Archive collection fetch succeeded: 8 channels
RSS feed fetch succeeded: 3 channels
Total channels in sidebar: 23
```

### Network Tab (Good)
```
POST /api/v1/parse-m3u  200  OK  JSON
{
  "success": true,
  "channels": [
    {
      "id": "abc123def456",
      "title": "Archive.org Public Domain Films",
      "url": "https://...",
      "category": "Archive.org",
      "fetchedAt": "2026-09-01T..."
    },
    ...
  ],
  "totalParsed": 12,
  "validUrls": 12
}
```

### Sidebar Display (Good)
```
📺 Channels (23)
├─ Archive.org Public Domain Films
├─ Classic Movies Collection
├─ Documentary Archive
├─ Public TV Broadcasts
├─ Live News Feeds
├─ Educational Content
└─ (17 more channels)
```

---

## 📝 When You're Done

After all steps are complete and verified:

1. ✅ Mark all checkboxes above as complete
2. ✅ Verify real Archive.org channels are loading
3. ✅ Take a screenshot (optional, but helps for documentation)
4. ✅ You're done! Liberty Play now uses cloud-based M3U parsing

**Result**: 
- Demo content removed ✅
- Real Archive.org channels loading ✅
- Pure web app (no device bridge) ✅
- Cloud-based backend (Stream Vault) ✅
- Graceful fallback if Stream Vault is down ✅

---

**Questions?** Check the troubleshooting section above or review the instruction documents.

**Ready to start?** Begin with Phase 1: STREAM_VAULT_UPDATE_INSTRUCTIONS.md

Time to execute: ~20-30 minutes  
Complexity: Low (mostly copy & paste, GitHub automation handles building)  
Risk: Very Low (graceful fallback, easy rollback)

Good luck! 🚀
