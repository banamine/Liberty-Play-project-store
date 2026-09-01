# Stream Vault M3U Parser Endpoint - Manual Update Guide

## What's Changed

The Stream Vault `server.ts` file has been updated with a new M3U playlist parser endpoint that will allow Liberty Play to fetch real Archive.org channels from the cloud.

### New Endpoint Added
- **POST /api/v1/parse-m3u** — Parses M3U/M3U8 playlists and extracts channels with metadata

### Key Features
✅ SSRF protection (blocks private/local network access)  
✅ 30-second timeout for M3U fetch operations  
✅ Extracts channel titles, URLs, categories, logos from EXTINF metadata  
✅ URL validation and ID generation via hashing  
✅ Returns structured channel data ready for Liberty Play  

---

## How to Apply This Change via GitHub Web Interface

### Step 1: Open server.ts on GitHub
1. Go to: https://github.com/banamine/stream-vault
2. Click on the `server.ts` file
3. Click the **Edit** button (pencil icon) in the top-right

### Step 2: Find the insertion point
In the editor, use `Ctrl+F` (or `Cmd+F` on Mac) to search for:
```
async function startServer() {
```

You should land on **line 454** (approximately). This is where you need to insert the new code.

### Step 3: Insert the M3U Parser Code
**BEFORE** the `async function startServer() {` line, add this code block:

```typescript
// M3U Playlist Parser Endpoint
// POST /api/v1/parse-m3u - Parse M3U/M3U8 playlists and extract channels
app.post('/api/v1/parse-m3u', async (req: Request, res: Response) => {
  const parseM3uSchema = z.object({
    m3uUrl: z.string().url('Invalid URL format'),
  });

  const result = parseM3uSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request: ' + result.error.format()
    });
  }

  const { m3uUrl } = result.data;

  // Security: Block private/local URLs to prevent SSRF
  try {
    const url = new URL(m3uUrl);
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.') ||
      hostname === 'internal' ||
      hostname.endsWith('.internal')
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access to private networks is blocked (SSRF prevention)'
      });
    }
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid URL format' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(m3uUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        error: `Failed to fetch M3U playlist: ${response.statusText}`
      });
    }

    const text = await response.text();
    const channels = parseM3U(text, m3uUrl);

    return res.json({
      success: true,
      channels,
      sourceUrl: m3uUrl,
      totalParsed: channels.length,
      validUrls: channels.filter(c => isValidUrl(c.url)).length,
      invalidUrls: channels.filter(c => !isValidUrl(c.url)).length,
      parseErrors: [],
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: 'Failed to parse M3U playlist: ' + errorMsg
    });
  }
});

// Helper: Parse M3U playlist format
function parseM3U(text: string, baseUrl: string): Array<{
  id: string;
  title: string;
  url: string;
  category?: string;
  logo?: string;
  fetchedAt: string;
}> {
  const channels = [];
  const lines = text.split('\n');
  let currentTitle = '';
  let currentCategory = '';
  let currentLogo = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('#EXTINF:')) {
      // Parse EXTINF line: #EXTINF:-1 tvg-id="id" tvg-name="name" tvg-logo="logo" group-title="category", Title
      const match = trimmed.match(/tvg-name="([^"]+)"|,(.+)$/);
      currentTitle = match ? (match[1] || match[2]?.trim() || 'Unknown') : 'Unknown';

      const categoryMatch = trimmed.match(/group-title="([^"]+)"/);
      currentCategory = categoryMatch ? categoryMatch[1] : 'Other';

      const logoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
      currentLogo = logoMatch ? logoMatch[1] : '';
    } else if (!trimmed.startsWith('#') && trimmed && currentTitle) {
      // This is a URL line following an EXTINF
      let url = trimmed;
      if (!url.startsWith('http')) {
        try {
          url = new URL(url, baseUrl).toString();
        } catch {
          // Skip invalid URLs
          currentTitle = '';
          continue;
        }
      }

      channels.push({
        id: hashUrl(url),
        title: currentTitle,
        url,
        category: currentCategory,
        logo: currentLogo || undefined,
        fetchedAt: new Date().toISOString()
      });

      currentTitle = '';
    }
  }

  return channels;
}

// Helper: Validate URL format
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

// Helper: Hash URL for ID generation
function hashUrl(url: string): string {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
}


```

### Step 4: Commit the change
1. Scroll down to the **Commit changes** section at the bottom
2. Enter commit message:
```
Add M3U playlist parser endpoint to Stream Vault
```
3. Click **Commit changes** button
4. GitHub will automatically rebuild and redeploy to Vercel ✅

---

## What Happens Next

Once this change is committed:

1. **GitHub Actions runs** (~2-3 minutes) — Builds and deploys to Vercel
2. **Stream Vault gets the new endpoint** at `https://your-stream-vault-url/api/v1/parse-m3u`
3. **Liberty Play gets updated** to call Stream Vault's endpoint instead of the device bridge
4. **Real Archive.org channels load** instead of demo content

---

## Verification

After the commit, verify the endpoint is working:

```bash
# Test the M3U parser endpoint
curl -X POST https://your-stream-vault-url/api/v1/parse-m3u \
  -H "Content-Type: application/json" \
  -d '{"m3uUrl":"https://example.com/playlist.m3u8"}'

# Expected response:
{
  "success": true,
  "channels": [...],
  "sourceUrl": "...",
  "totalParsed": 10,
  "fetchedAt": "2026-09-01T..."
}
```

---

## Next Step

After this commit succeeds, I'll update Liberty Play's orchestrator to call Stream Vault's M3U parser endpoint, then redeploy Liberty Play so real Archive.org channels load instead of demo content.

**Status:** Stream Vault endpoint code ✅ Ready for upload  
**Next:** Update Liberty Play orchestrator → redeploy → verify real channels load
