# Builder Integration Guide

**For:** AJN Media Console Builder  
**Date:** August 31, 2026  
**Status:** ✅ READY TO BUILD  

---

## Quick Start

You have **2 packages** to integrate:

1. **New App Base** (Already extracted)
   - Located at: `N:\Projects\ajn-archive-&-claude-power\` (original)
   - New version: `untitled_ajn_new.zip` (extracted version)

2. **Phase 1 Patches & Utilities**
   - All files in this package directory
   - Ready to copy and integrate

---

## Build Steps

### Step 1: Backup Current Source (5 min)
```bash
# Create backup of current source
cp -r N:\Projects\ajn-archive-&-claude-power N:\Projects\ajn-archive-&-claude-power.backup
```

### Step 2: Replace with New App (2 min)
```bash
# Use the simplified new app as base
# Extract untitled_ajn_new.zip to working directory
unzip untitled_ajn_new.zip -d /working/new-app
```

### Step 3: Copy Phase 1 Utilities (1 min)
```bash
# Copy new utilities to src/utils/
cp builder-package/ajnFetchPipeline.ts src/utils/
cp builder-package/archiveOrgFetch.ts src/utils/
cp builder-package/urlValidator.ts src/utils/
cp builder-package/urlValidator.test.ts src/utils/__tests__/
```

### Step 4: Apply Patches (10 min)

**File 1: src/components/VideoPlayer.tsx**

Search for: `video.src = channel.url`

Add before it:
```typescript
import { validatePlaybackUrl } from '../utils/urlValidator';

// In playback function:
const validUrl = validatePlaybackUrl(channel.url);
if (!validUrl) {
  console.error('Invalid playback URL');
  return; // Skip playback
}
video.src = validUrl;
```

**File 2: src/App.tsx**

Add import at top:
```typescript
import { fetchAJNChannels } from './utils/ajnFetchPipeline';
```

Add useEffect after line 37 (after playlists setState):
```typescript
// Load real AJN channels on startup
useEffect(() => {
  fetchAJNChannels()
    .then(channels => {
      if (channels.length > 0) {
        setPlaylists(prev => [
          { ...prev[0], channels }, // Replace default playlist
          ...prev.slice(1)
        ]);
      }
    })
    .catch(err => console.error('Failed to load AJN channels:', err));
}, []);
```

### Step 5: Verify Build (5 min)
```bash
# TypeScript check
npx tsc --noEmit

# Build
npm run build

# Tests
npm test -- src/utils/__tests__/urlValidator.test.ts
```

### Step 6: Deploy (Varies)
```bash
# To staging
VITE_API_URL=https://staging-api.run.app npm run build

# To production
VITE_API_URL=https://prod-api.run.app npm run build
```

---

## File Locations & Purpose

### New Utilities (Copy to `src/utils/`)

**ajnFetchPipeline.ts** (195 lines)
- Fetches live AJN channels from RSS feeds
- Includes fallback to Rumble embeds
- **Used by:** App.tsx startup

**archiveOrgFetch.ts** (165 lines)
- Resolves Archive.org metadata to .mp4/.m3u8 URLs
- Used for VOD content discovery
- **Used by:** Optional, can enhance playlist loading

**urlValidator.ts** (140 lines) ⭐ CRITICAL
- Validates URLs before playback
- Prevents blank/invalid URLs from crashing
- **Used by:** VideoPlayer component

**urlValidator.test.ts** (180 lines)
- 25+ regression test cases
- Run with: `npm test`

### Documentation (Reference Only)

**NEW_APP_AUDIT_REPORT.md**
- Pre-deployment audit of new app
- Compatibility analysis
- Risk assessment

**IMPLEMENTATION_CHECKLIST.md**
- Detailed step-by-step guide
- Testing procedures
- Telemetry monitoring

**DEMO_VIDEO_REMOVAL_PLAN.md**
- Architecture & strategy
- Backend API requirements
- Phase 1 vs Phase 2 breakdown

**PATCH_SmartVideoEngine_URL_Validation.md**
- Exact code patches (may differ slightly due to VideoPlayer rename)
- Before/after examples

---

## Integration Checklist

- [ ] Extract new app (untitled_ajn_new.zip)
- [ ] Copy utilities to src/utils/
- [ ] Update src/components/VideoPlayer.tsx (3 lines)
- [ ] Update src/App.tsx (6 lines)
- [ ] Run TypeScript check
- [ ] Run build
- [ ] Run tests
- [ ] Test playback locally
- [ ] Deploy to staging
- [ ] Monitor telemetry
- [ ] Deploy to production

---

## Expected Behavior After Build

### Before Deploy
```
User opens app
→ Sees 8 demo channels (NASA TV, France 24, etc.)
→ All from hardcoded seed list
→ No real AJN channels
```

### After Deploy
```
User opens app
→ Sees real AJN channels (Live, War Room, Hourly, etc.)
→ Fetched from RSS feeds automatically
→ Demo channels gone
→ Fallback to Rumble if RSS fails
```

### URL Validation
```
Before: Empty URL → Crash / Stuck State
After:  Empty URL → "No source available" UI
```

---

## Backend Requirements

For **full functionality**, these API endpoints must exist:

### 1. GET `/api/rss/fetch?url=<rss-url>`
**Purpose:** Proxy RSS feeds, avoid CORS issues  
**Response:**
```json
{
  "entries": [
    {
      "title": "Episode Title",
      "link": "https://...",
      "mediaUrl": "https://archive.org/download/...",
      "duration": 3600
    }
  ]
}
```

### 2. GET `/api/ajn/archive/<channelId>`
**Purpose:** Resolve channel URLs from backend DB  
**Response:**
```json
{
  "url": "https://archive.org/download/.../video.mp4"
}
```

### 3. GET `/api/stream-proxy?url=<stream-url>` (Already Exists)
**Purpose:** SSRF-protected stream proxy  
**Status:** Should already be in server.ts

**If any endpoint is missing:**
- Implement in `server.ts` (see DEMO_VIDEO_REMOVAL_PLAN.md)
- Or Phase 1 gracefully falls back to hardcoded demo seed

---

## Testing After Build

### Manual Tests (Required Before Prod)

**Test 1: Real Channel Loads**
- [ ] Start app
- [ ] Check channel list
- [ ] Verify AJN channels appear (not demo)
- [ ] Console: "✅ Loaded N real AJN channels"

**Test 2: Playback Works**
- [ ] Select a real channel
- [ ] Click play
- [ ] Video loads within 3 seconds
- [ ] No errors in console

**Test 3: Blank URL Rejection**
- [ ] Force a blank URL somehow (or use dev tools)
- [ ] Try to play
- [ ] UI shows "No source available"
- [ ] No crash, no errors

**Test 4: Archive.org Resolution**
- [ ] Select Archive channel
- [ ] Should resolve to .mp4 or .m3u8
- [ ] Playback starts

**Test 5: Rumble Fallback**
- [ ] Select AJN Live (Rumble embed)
- [ ] Rumble player renders
- [ ] No URL validation error

---

## Troubleshooting

### Build Fails: "Cannot find module ajnFetchPipeline"
**Fix:** Verify utilities copied to `src/utils/` with correct names

### Build Fails: "Property 'validatePlaybackUrl' not found"
**Fix:** Verify urlValidator.ts copied to `src/utils/`

### Playback Fails: "No stream available"
**Cause:** Backend API endpoints missing  
**Fix:** Check server.ts for `/api/rss/fetch` and `/api/ajn/archive/*`

### Tests Fail: "FAIL urlValidator.test.ts"
**Cause:** Test framework not installed  
**Fix:** Run `npm install --save-dev vitest`

### Blank URL Shows in Console
**Expected behavior:** This is good! Validation is working  
**Action:** Monitor telemetry to ensure count is 0 in production

---

## Deployment Pipeline

### Staging (UAT)
```bash
VITE_API_URL=https://staging-api.run.app npm run build
# Test all 5 scenarios
# Monitor for 24 hours
```

### Production (Live)
```bash
VITE_API_URL=https://prod-api.run.app npm run build
# Deploy to Cloud Run
# Monitor telemetry
```

---

## Metrics to Monitor Post-Deploy

**Should Increase (Good Sign):**
- AJN channel loads
- Archive.org metadata API calls
- Successful .mp4/.m3u8 resolutions

**Should Drop to 0 (Critical):**
- Blank URL playback attempts
- Demo channel loads

**Should Stay Same:**
- Rumble embed plays
- M3U parser performance

---

## Support & Questions

- **Architecture Questions:** See DEMO_VIDEO_REMOVAL_PLAN.md
- **Integration Questions:** See IMPLEMENTATION_CHECKLIST.md
- **Type Issues:** See NEW_APP_AUDIT_REPORT.md
- **Code Patches:** See individual patch documents

---

## Files Included in This Package

```
✅ ajnFetchPipeline.ts              → Copy to src/utils/
✅ archiveOrgFetch.ts               → Copy to src/utils/
✅ urlValidator.ts                  → Copy to src/utils/
✅ urlValidator.test.ts             → Copy to src/utils/__tests__/

📄 BUILDER_INTEGRATION_GUIDE.md     ← You are here
📄 NEW_APP_AUDIT_REPORT.md          (Audit & compatibility)
📄 IMPLEMENTATION_CHECKLIST.md      (Detailed guide)
📄 DEMO_VIDEO_REMOVAL_PLAN.md       (Architecture & strategy)
📄 PATCH_SmartVideoEngine_URL_Validation.md (Reference patches)
```

---

## Next Phases (Post-Phase 1)

### Phase 2: SSRF Hardening
- DNS-aware validation
- Reject IPv6 private ranges
- Redirect validation

### Phase 3: Time-Unit Fixes
- Fix milliseconds vs. seconds chaos
- EPG scheduling accuracy

### Phase 4: Deterministic IDs
- Seeded shuffle for channel IDs
- Cache key stability

---

**Build Ready:** YES ✅  
**Risk Level:** LOW  
**Estimated Build Time:** 2-3 hours  
**Estimated Test Time:** 2-4 hours  
**Estimated Deploy Time:** 1-2 hours  

**Total Time to Production:** 5-9 hours

---

*Prepared by: Claude Code Audit System*  
*Date: August 31, 2026*  
*Version: 1.0*
