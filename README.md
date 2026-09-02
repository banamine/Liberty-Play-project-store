# Liberty Play - Google Cloud Run Only (Simplified)

## Architecture
- **No device bridge** - removed
- **No ngrok tunnel** - removed  
- **No local servers** - removed
- **One backend**: Cloud Run API that fetches M3U directly from Archive.org
- **One frontend**: Simple React app on Vercel
- **CORS proxy**: Built into Cloud Run backend

## What Changed

### Removed Files
- `device_bridge_server.ts` ❌
- `archive_m3u_device_adapter.ts` ❌
- `orchestrator_device_bridge.ts` ❌
- All device bridge configuration ❌

### New Files
- `server/api/m3u-fetch.ts` - Cloud Run endpoint that fetches M3U from Archive.org
- `server/api/stream-proxy.ts` - CORS proxy for video streams
- `.env.cloud` - Google Cloud configuration only
- `vercel.json` - Simplified Vercel deployment config

## Deployment (3 Steps)

### Step 1: Deploy Backend to Cloud Run
```bash
cd server
gcloud run deploy liberty-play-api \
  --source . \
  --region us-east1 \
  --allow-unauthenticated
```

Note the URL it returns (e.g., https://liberty-play-api-xxxxx.run.app)

### Step 2: Add to Vercel Environment
Go to Vercel → Settings → Environment Variables:
```
VITE_CLOUD_RUN_URL=https://liberty-play-api-xxxxx.run.app
VITE_ARCHIVE_M3U_URL=https://archive.org/download/daily-highlights/Alex%2024.m3u
VITE_RSS_FEEDS=https://rss.alexjones.media/
```

### Step 3: Deploy Frontend
```bash
git push
# Vercel auto-deploys
```

Done. That's it.

## How It Works

**Old (Overcomplicated):**
```
Browser → Vercel → ngrok tunnel → local device bridge → Archive.org
                       (fragile, needs you to run locally)
```

**New (Simple):**
```
Browser → Vercel → Cloud Run API → Archive.org
                  (all in cloud, always running)
```

## API Endpoints

### GET /api/m3u-fetch
Fetches M3U playlist from Archive.org
```
Response: M3U playlist with real video URLs
```

### GET /api/stream-proxy?url=...
Bypasses CORS for video streams
```
Query: url=https://archive.org/download/...mp4
Response: Video stream with CORS headers
```

## Benefits
✅ No local servers to run
✅ No device bridge complexity
✅ No ngrok tunnel management
✅ Works from anywhere
✅ Always available (Cloud Run is always running)
✅ Scales automatically
✅ One-time setup, then it just works

## Testing

```bash
# Test the API directly
curl https://liberty-play-api-xxxxx.run.app/api/m3u-fetch

# Should return M3U playlist with real video URLs
```

Open your Liberty Play app → should load real Archive.org streams now.
