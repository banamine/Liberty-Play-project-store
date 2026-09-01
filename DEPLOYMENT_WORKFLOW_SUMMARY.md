# Complete Deployment Workflow: Stream Vault + Liberty Play

## Architecture Overview

```
Liberty Play (Web UI)
        ↓
   fetchArchiveM3U()
        ↓
Stream Vault API (Cloud Backend)
        ↓
   /api/v1/parse-m3u
        ↓
Archive.org M3U Playlist
        ↓
Parsed Channels + Metadata
        ↓
Real Video Streams (no more demo content!)
```

---

## What You Need to Do (Step-by-Step)

### STEP 1️⃣: Add M3U Parser Endpoint to Stream Vault

**Time**: ~10 minutes (5 min edits + 5 min deploy)

**File**: `stream-vault/server.ts`  
**Location**: Before the `async function startServer()` line  
**Action**: Add the M3U parser endpoint code (provided in `STREAM_VAULT_UPDATE_INSTRUCTIONS.md`)

**What happens**:
- GitHub Actions automatically rebuilds Stream Vault
- New `/api/v1/parse-m3u` endpoint becomes available
- Stream Vault can now parse M3U playlists from Archive.org

---

### STEP 2️⃣: Update Liberty Play Orchestrator

**Time**: ~5 minutes (edits only, GitHub has built-in CI/CD)

**Files to update**:
1. `src/services/ajn_fetch_pipeline_orchestrator.ts`
   - Add `streamVaultUrl` to OrchestratorConfig
   - Add environment variable read in constructor
   - Update `fetchArchiveM3U()` to call Stream Vault endpoint

2. `.env.example`
   - Add `VITE_STREAM_VAULT_URL` environment variable

**What happens**:
- GitHub Actions automatically rebuilds Liberty Play
- Liberty Play now calls Stream Vault's M3U parser instead of local device bridge
- Falls back to local adapter if Stream Vault is unavailable

---

### STEP 3️⃣: Configure Stream Vault URL in Liberty Play

**Time**: ~2 minutes

**Where**: Vercel project settings

**Steps**:
1. Go to: https://vercel.com/banamines-projects
2. Click Liberty Play project
3. Click **Settings** → **Environment Variables**
4. Add: `VITE_STREAM_VAULT_URL` = `https://your-stream-vault-url.vercel.app`
5. Redeploy

**What happens**:
- Liberty Play learns where Stream Vault is deployed
- Orchestrator can now successfully call Stream Vault's endpoint
- M3U parsing moves from local device to cloud backend

---

### STEP 4️⃣: Verify Real Channels Load

**Time**: ~5 minutes (observational)

**Checklist**:
- [ ] Open Liberty Play in browser
- [ ] Sidebar should show 5+ real Archive.org channels (not "Big Buck Bunny")
- [ ] Example channels: "Archive.org Movies", "Live Broadcasts", "Documentaries"
- [ ] Click a channel
- [ ] Player should load WITHOUT "Playback Interrupted" error
- [ ] DevTools Network tab shows successful `/api/v1/parse-m3u` call

---

## Files Provided

### 1. STREAM_VAULT_UPDATE_INSTRUCTIONS.md
- Step-by-step guide to add M3U parser endpoint to Stream Vault
- Includes full code block (copy & paste ready)
- Explains architecture and benefits

### 2. ajn_fetch_pipeline_orchestrator.ts
- Updated orchestrator file with Stream Vault integration
- Shows all changes needed (reference file, not a replacement)

### 3. LIBERTY_PLAY_UPDATE_INSTRUCTIONS.md
- Step-by-step guide to update Liberty Play
- Covers orchestrator method update, env var setup, configuration
- Includes troubleshooting section

### 4. This summary document
- High-level overview of complete workflow

---

## Timeline

| Step | Action | Duration | Automatic? |
|------|--------|----------|-----------|
| 1 | Add M3U endpoint to Stream Vault | ~10 min | ✅ Yes (GHA) |
| 2 | Update Liberty Play orchestrator | ~5 min | ✅ Yes (GHA) |
| 3 | Configure Stream Vault URL | ~2 min | ✅ Yes (Vercel) |
| 4 | Verify channels load | ~5 min | ❌ Manual check |
| **Total** | | **~22 min** | **Mostly automated** |

---

## Expected Result

### Before
- Liberty Play shows demo channels: "Big Buck Bunny", "Sintel", etc.
- "Playback Interrupted" error on all streams
- Device bridge required for M3U parsing (rejected architecture)

### After ✅
- Liberty Play shows real Archive.org channels
- Videos play successfully
- Pure web app (no device bridge)
- Cloud-based M3U parsing via Stream Vault
- Graceful fallback if Stream Vault is unavailable

---

## Deployment Architecture

```
GitHub (Source of Truth)
├─ Liberty Play repo (banamine/Liberty-Play-project-store)
│  ├─ Push changes
│  └─ GitHub Actions builds & deploys to Vercel
│
├─ Stream Vault repo (banamine/stream-vault)
│  ├─ Push changes
│  └─ GitHub Actions builds & deploys to Vercel
│
Vercel (Live Deployment)
├─ Liberty Play (https://liberty-play-project-store.vercel.app)
│  └─ Env var: VITE_STREAM_VAULT_URL
│
├─ Stream Vault (https://your-stream-vault-url.vercel.app)
│  └─ Endpoint: /api/v1/parse-m3u
│
Archive.org (External Data Source)
└─ M3U Playlists (movies, broadcasts, etc.)
```

---

## Security Notes

✅ **Stream Vault M3U Parser Protections**
- SSRF prevention: Blocks private/local network access
- 30-second timeout on M3U fetch operations
- URL validation before parsing
- Zod schema validation on incoming requests

✅ **Liberty Play Resilience**
- Fallback to local adapter if Stream Vault is down
- Detailed error logging for debugging
- Environment variable configuration (no hardcoded URLs)

---

## Rollback Plan

If something goes wrong:

1. **Stream Vault broken?**
   - Liberty Play automatically falls back to local M3U adapter
   - Demo channels continue working
   - No user-facing outage

2. **Liberty Play broken?**
   - Revert the GitHub commit
   - Vercel automatically redeploys previous version
   - Takes ~2-3 minutes

3. **Both broken?**
   - Deploy v1 of both (previous known-good state)
   - Both apps have CI/CD, so rollback is automatic

---

## Questions & Support

### "What if Stream Vault M3U parser endpoint fails?"
→ Liberty Play automatically falls back to local M3U adapter  
→ No user outage, just slower M3U parsing

### "Can I test locally first?"
→ Yes: Set `VITE_STREAM_VAULT_URL=http://localhost:3000` in `.env.local`  
→ Run Stream Vault locally, test locally first

### "How do I know when deployment is complete?"
→ Check Vercel project page:  
→ Green checkmark = deployment successful  
→ Takes ~2-3 minutes per app

### "What's the M3U parser endpoint URL?"
→ `https://{STREAM_VAULT_URL}/api/v1/parse-m3u`  
→ POST with JSON body: `{"m3uUrl": "https://archive.org/..."}`  
→ Returns structured channel data

---

## Next Steps (After You Apply Changes)

1. ✅ Apply Stream Vault update (add M3U endpoint)
2. ✅ Apply Liberty Play update (wire orchestrator)
3. ✅ Set VITE_STREAM_VAULT_URL in Vercel
4. 🔍 Open https://liberty-play-project-store.vercel.app
5. 🎬 Verify real channels load (not demo content)
6. ▶️ Click a channel and verify video plays
7. 🧪 Check browser DevTools for success

---

**Status**: Ready to deploy  
**Ownership**: You apply changes via GitHub web interface  
**Timeline**: ~22 minutes total (mostly automated)  
**Risk**: Low (graceful fallback, automatic CI/CD, easy rollback)

Ready? Start with **Step 1**: STREAM_VAULT_UPDATE_INSTRUCTIONS.md
