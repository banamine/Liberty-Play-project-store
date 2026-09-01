# Liberty Play - Stream Vault Integration Update

## What's Changed

Liberty Play's orchestrator has been updated to call **Stream Vault's cloud-based M3U parser endpoint** instead of relying on a local device bridge.

### Key Changes

1. **New Environment Variable**: `VITE_STREAM_VAULT_URL`
   - Points to your deployed Stream Vault instance on Vercel
   - Example: `https://your-stream-vault-vercel-url.vercel.app`

2. **Updated fetchArchiveM3U() Method**
   - Now calls `Stream Vault URL/api/v1/parse-m3u` instead of local adapter
   - Fallback to local adapter if Stream Vault is unavailable
   - Graceful error handling with detailed logging

3. **New OrchestratorConfig Property**
   - `streamVaultUrl?: string` — Cloud backend URL for M3U parsing

### Benefits

✅ **No local device bridge needed** — Works as a pure web app  
✅ **Cloud-based parsing** — Archive.org M3U files fetched from Vercel  
✅ **Resilient fallback** — Falls back to local adapter if Stream Vault is down  
✅ **Real Archive.org channels** — Replaces demo content with actual data  

---

## How to Apply This Update via GitHub Web Interface

### Step 1: Update the Orchestrator File

#### 1a. Navigate to the orchestrator file
- Go to: https://github.com/banamine/Liberty-Play-project-store
- Navigate to: `src/services/ajn_fetch_pipeline_orchestrator.ts`
- Click the **Edit** button (pencil icon)

#### 1b. Replace the entire fetchArchiveM3U() method

Find the section starting with:
```typescript
private async fetchArchiveM3U(): Promise<NormalizedChannel[]> {
```

Replace the entire method with this updated version:

```typescript
  private async fetchArchiveM3U(): Promise<NormalizedChannel[]> {
    try {
      // NEW: Call Stream Vault's cloud-based M3U parser instead of local adapter
      if (this.config.streamVaultUrl && this.config.m3uPlaylistUrl) {
        try {
          const response = await fetch(`${this.config.streamVaultUrl}/api/v1/parse-m3u`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ m3uUrl: this.config.m3uPlaylistUrl }),
          });

          if (!response.ok) {
            throw new Error(`Stream Vault responded with status ${response.status}`);
          }

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error || 'M3U parsing failed');
          }

          return result.channels.map((channel: any) => ({
            id: channel.id,
            title: channel.title,
            url: channel.url,
            category: channel.category || 'Archive.org',
            logo: channel.logo,
            source: 'archive-m3u' as const,
            fetchedAt: new Date(channel.fetchedAt),
            hash: channel.id, // Stream Vault provides hash as ID
          }));
        } catch (svErr) {
          // Fallback to local adapter if Stream Vault fails
          console.warn('Stream Vault M3U parser failed, falling back to local adapter:', svErr);
          const result = await this.m3uAdapter.fetchAndParse();
          return result.streams.map((stream) => ({
            id: stream.id,
            title: stream.tvgName || stream.title,
            url: stream.url,
            category: stream.groupTitle || 'Archive.org Movies',
            logo: stream.tvgLogo,
            source: 'archive-m3u' as const,
            fetchedAt: stream.fetchedAt,
            hash: stream.hash,
          }));
        }
      }

      // Fallback: Use local M3U adapter if Stream Vault URL not configured
      const result = await this.m3uAdapter.fetchAndParse();
      return result.streams.map((stream) => ({
        id: stream.id,
        title: stream.tvgName || stream.title,
        url: stream.url,
        category: stream.groupTitle || 'Archive.org Movies',
        logo: stream.tvgLogo,
        source: 'archive-m3u' as const,
        fetchedAt: stream.fetchedAt,
        hash: stream.hash,
      }));
    } catch (err) {
      throw new Error(`ArchiveM3U fetch failed: ${(err as Error).message}`);
    }
  }
```

#### 1c. Find and update the OrchestratorConfig interface

Find the line:
```typescript
export interface OrchestratorConfig {
```

Add this new line after `m3uPlaylistUrl?: string;`:
```typescript
streamVaultUrl?: string; // NEW: Cloud backend for M3U parsing
```

#### 1d. Find and update the constructor

Find the line in the constructor:
```typescript
const envM3u = (typeof window !== 'undefined' ? (import.meta as any)?.env?.VITE_ARCHIVE_M3U_URL : undefined) ||
               (typeof process !== 'undefined' ? (process.env?.ARCHIVE_M3U_URL || process.env?.VITE_ARCHIVE_M3U_URL) : undefined);
```

Add these lines AFTER it:
```typescript
    const envStreamVault = (typeof window !== 'undefined' ? (import.meta as any)?.env?.VITE_STREAM_VAULT_URL : undefined) ||
                           (typeof process !== 'undefined' ? (process.env?.STREAM_VAULT_URL || process.env?.VITE_STREAM_VAULT_URL) : undefined);
```

Then find the line:
```typescript
      m3uPlaylistUrl: config.m3uPlaylistUrl || envM3u,
```

Add this line AFTER it:
```typescript
      streamVaultUrl: config.streamVaultUrl || envStreamVault,
```

### Step 2: Update .env.example

- Go to: `.env.example` file in the repository root
- Click **Edit**
- Add this new environment variable before the existing `VITE_ARCHIVE_M3U_URL` line:

```bash
# VITE_STREAM_VAULT_URL: Cloud-based Stream Vault backend for M3U parsing
# This enables Liberty Play to call Stream Vault's /api/v1/parse-m3u endpoint
# instead of requiring a local device bridge. Must be a public HTTPS URL.
VITE_STREAM_VAULT_URL="https://your-stream-vault-vercel-url.vercel.app"
```

### Step 3: Commit the Changes

1. Scroll to the bottom and enter commit message:
```
Wire Liberty Play to Stream Vault M3U parser endpoint

- Updated fetchArchiveM3U() to call Stream Vault's cloud-based parser
- Added streamVaultUrl configuration option
- Fallback to local adapter if Stream Vault is unavailable
- Added VITE_STREAM_VAULT_URL environment variable
- This enables pure web-app deployment without device bridge
```

2. Click **Commit changes**

---

## Configuration: Set the Stream Vault URL

After both Stream Vault and Liberty Play are deployed, you need to configure Liberty Play with the Stream Vault URL.

### Option A: Via Vercel Environment Variables (Recommended)

1. Go to your Liberty Play Vercel project: https://vercel.com/banamines-projects
2. Click **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `VITE_STREAM_VAULT_URL`
   - **Value**: `https://your-stream-vault-vercel-url.vercel.app` (the actual Stream Vault URL)
4. Click **Add** then **Save**
5. Redeploy Liberty Play for the variable to take effect

### Option B: Via Vercel CLI

```bash
vercel env add VITE_STREAM_VAULT_URL
# Enter the Stream Vault URL when prompted
vercel redeploy
```

### Option C: Hardcode in .env (Development Only)

Create a `.env.local` file in your Liberty Play repository root:
```bash
VITE_STREAM_VAULT_URL="https://your-stream-vault-vercel-url.vercel.app"
```

---

## Verification Checklist

After applying these changes and redeploying:

- [ ] GitHub Actions completes successfully (green checkmark)
- [ ] Liberty Play redeploys to Vercel
- [ ] Open Liberty Play in browser
- [ ] Sidebar shows real Archive.org channels (not "Big Buck Bunny" demo)
- [ ] Click a channel → player loads without "Playback Interrupted" error
- [ ] Browser DevTools Console shows no errors
- [ ] Network tab shows successful call to Stream Vault's `/api/v1/parse-m3u`

---

## Troubleshooting

### "Still showing demo channels / Big Buck Bunny"

**Cause**: `VITE_STREAM_VAULT_URL` not set or set incorrectly  
**Fix**: 
1. Verify Stream Vault is deployed and has the M3U parser endpoint
2. Get the correct Stream Vault Vercel URL
3. Set `VITE_STREAM_VAULT_URL` in Vercel environment variables
4. Redeploy Liberty Play

### "Network error: Unable to load stream segments"

**Cause**: Stream Vault endpoint is failing or Stream Vault URL is wrong  
**Fix**:
1. Test Stream Vault's M3U parser endpoint manually:
   ```bash
   curl -X POST https://your-stream-vault-url/api/v1/parse-m3u \
     -H "Content-Type: application/json" \
     -d '{"m3uUrl":"https://archive.org/download/liberty-play-playlist/archive_movies.m3u"}'
   ```
2. If that fails, Stream Vault M3U parser wasn't deployed successfully
3. Check Stream Vault's GitHub Actions deployment logs

### "Loading spinner appears but channels don't show"

**Cause**: M3U parsing taking too long or returning empty results  
**Fix**:
1. Check browser DevTools Network tab for `/api/v1/parse-m3u` request
2. Look at response to see if channels were actually parsed
3. Verify `VITE_ARCHIVE_M3U_URL` is pointing to a valid M3U file

---

## Quick Reference

| Item | URL/Value |
|------|-----------|
| Liberty Play | https://liberty-play-project-store.vercel.app |
| Stream Vault | `https://your-stream-vault-vercel-url.vercel.app` |
| M3U Parser Endpoint | `{VITE_STREAM_VAULT_URL}/api/v1/parse-m3u` |
| Test Archive.org M3U | https://archive.org/download/liberty-play-playlist/archive_movies.m3u |

---

## Summary

✅ Stream Vault: M3U parser endpoint added  
✅ Liberty Play: Orchestrator updated to call Stream Vault  
✅ Environment: Configuration in place  
❓ Verification: Waiting for you to apply changes and verify channels load

**Next Step**: Apply these changes to Liberty Play, then verify real Archive.org channels appear.
