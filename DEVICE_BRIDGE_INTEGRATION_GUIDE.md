# Device Bridge Integration Guide

## Overview

The device bridge solves the **egress problem**: Cloud environments block direct access to archive.org, causing M3U fetch to fail and the app to display demo/fallback content. The device bridge runs on **your local machine** with unrestricted archive.org access.

**Flow:**
```
Liberty Play App (cloud/local)
    ↓ (POST /api/device-m3u-fetch)
Device Bridge Server (your machine, port 3000)
    ↓ (unrestricted access)
archive.org/download/daily-highlights/
    ↓ (parses .m3u playlist)
Real channels (500+ streams per file)
    ↓ (returns JSON)
UI displays real Archive.org content
```

---

## Part 1: Set Up Device Bridge Server (on your machine)

### Step 1: Create Device Bridge Directory

```bash
# On your machine (Windows, macOS, or Linux)
mkdir -p ~/Projects/ajn-device-bridge
cd ~/Projects/ajn-device-bridge
```

### Step 2: Copy Files from This Repo

From the Liberty Play project root, copy these three files:

1. `archive_m3u_device_adapter.ts`
2. `device_bridge_server.ts`
3. Create `package.json` (see below)

### Step 3: Create package.json

```json
{
  "name": "ajn-device-bridge",
  "version": "1.0.0",
  "description": "Local device bridge for Archive.org M3U fetching",
  "main": "device_bridge_server.ts",
  "scripts": {
    "start": "ts-node device_bridge_server.ts",
    "test": "ts-node archive_m3u_device_adapter.ts 'https://archive.org/download/daily-highlights/Alex%2024.m3u'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.4.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.0.0"
  }
}
```

### Step 4: Install and Start

```bash
cd ~/Projects/ajn-device-bridge
npm install
npm start
```

You should see:
```
[Device Bridge Server] 🚀 Started on port 3000
[Device Bridge Server] Endpoint: http://localhost:3000/api/device-m3u-fetch
[Device Bridge Server] Health: http://localhost:3000/api/device-m3u-fetch/health
[Device Bridge Server] Ready to fetch Archive.org M3U files...
```

### Step 5: Test the Device Bridge (Optional)

In another terminal:

```bash
curl -X POST http://localhost:3000/api/device-m3u-fetch \
  -H "Content-Type: application/json" \
  -d '{"m3uUrl":"https://archive.org/download/daily-highlights/Alex%2024.m3u"}'
```

Should return:
```json
{
  "success": true,
  "channels": [
    {
      "id": "channel-1",
      "title": "Channel Name",
      "url": "https://ia800000.us.archive.org/...",
      "category": "News",
      "source": "archive-m3u",
      "fetchedAt": "2026-09-01T..."
    }
  ],
  "sourceUrl": "...",
  "totalParsed": 42,
  "validUrls": 42,
  "invalidUrls": 0,
  "parseErrors": [],
  "fetchedAt": "2026-09-01T..."
}
```

---

## Part 2: Configure Liberty Play App

### Step 1: Update .env

In your Liberty Play project, create or update `.env`:

```bash
# Device bridge endpoint (keep device bridge server running)
VITE_DEVICE_BRIDGE_ENDPOINT="http://localhost:3000/api/device-m3u-fetch"

# Archive.org M3U URL to fetch
# Choose one from: https://archive.org/download/daily-highlights/
# Examples:
# - Alex 24.m3u (4.2M) — Alex Jones archive
# - Liberty_Express_Live (3).m3u (3.3M) — Liberty Express broadcast
# - Super Alex Jones Archive.m3u (516.9K) — Compact archive
VITE_ARCHIVE_M3U_URL="https://archive.org/download/daily-highlights/Alex%2024.m3u"

# RSS feeds
VITE_RSS_FEEDS="https://rss.alexjones.media/"

# (Optional) Gemini API key for other features
GEMINI_API_KEY="YOUR_KEY_HERE"
```

### Step 2: Verify Changes in Code

The orchestrator has been updated to:
1. Read `VITE_DEVICE_BRIDGE_ENDPOINT` from `.env`
2. Call the device bridge POST endpoint instead of local M3U adapter
3. Fallback to local adapter if device bridge unavailable
4. Log all fetch attempts for debugging

Check `src/services/ajn_fetch_pipeline_orchestrator.ts` line ~307 to see the new `fetchArchiveM3U()` implementation.

### Step 3: Start Liberty Play

```bash
cd ~/Projects/Liberty-Play-project-store
npm install  # if needed
npm run dev
```

Should see in console:
```
[Orchestrator] Fetching Archive M3U from device bridge: http://localhost:3000/api/device-m3u-fetch
[Orchestrator] ✅ Device bridge returned 42 channels
```

---

## Part 3: Verify It Works

### Checklist

- [ ] Device bridge running: `npm start` (port 3000)
- [ ] `.env` configured with `VITE_DEVICE_BRIDGE_ENDPOINT` and `VITE_ARCHIVE_M3U_URL`
- [ ] Liberty Play started: `npm run dev` (port 5173)
- [ ] Browser console shows: `[Orchestrator] ✅ Device bridge returned 42 channels`
- [ ] Sidebar displays real Archive.org streams (NOT demo content like Big Buck Bunny)
- [ ] Player shows real .mp4 URLs, not test-streams.mux.dev
- [ ] Click a stream and attempt playback

### Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Connection refused" on device bridge | Device bridge not running | Run `npm start` in device-bridge dir |
| "ECONNREFUSED 127.0.0.1:3000" in browser console | Port 3000 in use or bridge not started | Kill process on port 3000, restart bridge |
| Device bridge says "Failed to fetch" | Network blocked to archive.org | Check firewall, try manual curl to archive.org |
| Still showing demo channels (Big Buck Bunny, Sintel, etc.) | Device bridge call failed, fell back to demo | Check orchestrator logs, verify endpoint in .env |
| "Invalid M3U format" error | M3U file is corrupted or URL wrong | Try different M3U file from https://archive.org/download/daily-highlights/ |

---

## Available M3U Playlist Files

All files are at `https://archive.org/download/daily-highlights/`:

| File | Size | Content |
|------|------|---------|
| Alex 24.m3u | 4.2M | **Alex Jones Archive (largest)** |
| Liberty_Express_Live (3).m3u | 3.3M | Liberty Express Live Broadcasts |
| Super Alex Jones Archive.m3u | 516.9K | Compact Alex Jones archive |
| TV CRIME_cleaned.m3u | 918.6K | Crime TV shows |
| Info Survior.m3u | 1.3M | Info Survivor content |
| AJN archive 1.m3u | 105.8K | AJN Compact archive |

---

## Architecture Details

### Device Bridge Request/Response

**Request (from cloud app):**
```json
POST http://localhost:3000/api/device-m3u-fetch
Content-Type: application/json

{
  "m3uUrl": "https://archive.org/download/daily-highlights/Alex%2024.m3u"
}
```

**Response:**
```json
{
  "success": true,
  "channels": [
    {
      "id": "channel-id",
      "title": "Channel Title",
      "url": "https://ia800000.us.archive.org/.../file.mp4",
      "category": "News",
      "logo": "https://archive.org/services/img/...",
      "source": "archive-m3u",
      "fetchedAt": "2026-09-01T12:34:56.000Z"
    }
  ],
  "sourceUrl": "https://archive.org/download/daily-highlights/Alex%2024.m3u",
  "totalParsed": 42,
  "validUrls": 42,
  "invalidUrls": 0,
  "parseErrors": [],
  "fetchedAt": "2026-09-01T12:34:56.000Z"
}
```

### Caching

Device bridge caches results **per M3U URL** for **1 hour**:
- First request: Fetches from archive.org, parses, returns (5–10 seconds)
- Subsequent requests (within 1 hour): Returns cached result (< 100ms)
- Cache is in-memory and cleared on server restart

Clear cache manually:
```bash
curl http://localhost:3000/api/device-m3u-fetch/clear-cache
```

### Deduplication

Orchestrator deduplicates channels across all 4 sources using URL hash:
- If two sources return the same stream URL, only one appears in final list
- Preserves metadata (title, category, logo) from first occurrence

---

## Known Limitations

1. **Device bridge must stay running** — If it stops, app falls back to demo content (graceful degradation)
2. **One M3U file at a time** — Currently fetches single `.m3u` file (could be extended for parallel multi-file fetch)
3. **In-memory caching** — Cache is lost on server restart (could use Redis for persistent cache)
4. **No authentication** — Device bridge endpoint has no auth (add JWT if exposed to internet)
5. **Large playlists** — 4M+ files may take 10–15 seconds to parse (consider pagination)

---

## Production Deployment

For production use, consider:

1. **Dedicated Machine** — Run device bridge on stable, always-on machine (NAS, server, home PC)
2. **Auto-Restart** — Use systemd/launchd/Task Scheduler to restart on crash
3. **Monitoring** — Log output to file and monitor for errors
4. **Network** — Ensure reliable internet connection to archive.org
5. **Tunneling** — If cloud app is on different network, use SSH tunnel or Cloudflare Tunnel:
   ```bash
   ssh -L 3000:localhost:3000 user@bridge-machine
   ```
6. **Redis Cache** — Replace in-memory cache with Redis for distributed caching
7. **Authentication** — Add JWT or API key to device bridge endpoint

---

## Next Steps

1. Set up device bridge on your machine (Part 1 above)
2. Configure Liberty Play app with `.env` (Part 2)
3. Start both services
4. Verify real channels appear in sidebar
5. Test playback with one of the Archive.org streams
6. Monitor console logs for any errors

If you encounter issues, check the troubleshooting section above or review the orchestrator logs in browser DevTools.
