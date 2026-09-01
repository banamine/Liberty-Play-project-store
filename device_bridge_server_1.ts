/**
 * Device Bridge Server
 *
 * Runs on user's local machine (or edge)
 * Exposes POST /api/device-m3u-fetch endpoint
 * Calls ArchiveM3UDeviceAdapter with unrestricted archive.org egress
 *
 * Usage:
 * 1. Place archive_m3u_device_adapter.ts in same directory
 * 2. npm install express axios
 * 3. npx ts-node device_bridge_server.ts
 * 4. Endpoint available at http://localhost:3000/api/device-m3u-fetch
 */

import express, { Request, Response } from 'express';
import { ArchiveM3UDeviceAdapter } from './archive_m3u_device_adapter';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize adapter (singleton)
let adapter: ArchiveM3UDeviceAdapter | null = null;

/**
 * POST /api/device-m3u-fetch
 *
 * Request body:
 * {
 *   "m3uUrl": "https://archive.org/download/daily-highlights/Alex%2024.m3u"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "channels": [
 *     {
 *       "id": "...",
 *       "title": "...",
 *       "url": "https://...",
 *       "category": "...",
 *       "source": "archive-m3u",
 *       "fetchedAt": "2026-09-01T..."
 *     }
 *   ],
 *   "sourceUrl": "https://archive.org/download/daily-highlights/Alex%2024.m3u",
 *   "totalParsed": 42,
 *   "validUrls": 42,
 *   "invalidUrls": 0,
 *   "parseErrors": [],
 *   "fetchedAt": "2026-09-01T..."
 * }
 */
app.post('/api/device-m3u-fetch', async (req: Request, res: Response) => {
  try {
    const { m3uUrl } = req.body;

    if (!m3uUrl || typeof m3uUrl !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid m3uUrl parameter' });
    }

    console.log(`[Device Bridge] Received request for: ${m3uUrl}`);

    // Initialize adapter for this URL
    adapter = new ArchiveM3UDeviceAdapter(m3uUrl);

    // Fetch and parse
    const result = await adapter.fetchAndParse();

    console.log(`[Device Bridge] ✅ Returning ${result.channels.length} channels`);

    res.json(result);
  } catch (error) {
    console.error(`[Device Bridge] ❌ Error:`, (error as Error).message);
    res.status(500).json({
      error: (error as Error).message,
      success: false,
      channels: [],
    });
  }
});

/**
 * GET /api/device-m3u-fetch/health
 * Health check endpoint
 */
app.get('/api/device-m3u-fetch/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'device-bridge',
    timestamp: new Date().toISOString(),
    cacheStatus: adapter ? 'initialized' : 'uninitialized',
  });
});

/**
 * GET /api/device-m3u-fetch/clear-cache
 * Manually clear cache
 */
app.get('/api/device-m3u-fetch/clear-cache', (req: Request, res: Response) => {
  if (adapter) {
    adapter.clearCache();
    res.json({ status: 'cache cleared' });
  } else {
    res.json({ status: 'adapter not initialized' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n[Device Bridge Server] 🚀 Started on port ${PORT}`);
  console.log(`[Device Bridge Server] Endpoint: http://localhost:${PORT}/api/device-m3u-fetch`);
  console.log(`[Device Bridge Server] Health: http://localhost:${PORT}/api/device-m3u-fetch/health`);
  console.log(`[Device Bridge Server] Ready to fetch Archive.org M3U files...\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Device Bridge Server] Shutting down gracefully...');
  process.exit(0);
});
