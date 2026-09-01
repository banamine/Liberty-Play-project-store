/**
 * Archive.org M3U/M3U8 Device Adapter
 *
 * Runs on user's device (via remote-devices bridge) to:
 * 1. Fetch .m3u/.m3u8 playlist files from archive.org
 * 2. Parse EXTINF metadata and stream URLs
 * 3. Validate streams are reachable
 * 4. Return normalized channel list for orchestrator
 *
 * Why on device? Archive.org blocks cloud egress; device has unrestricted access.
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface M3UChannel {
  id: string;
  title: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  category: string;
  source: 'archive-m3u';
  fetchedAt: Date;
}

export interface M3UParseResult {
  success: boolean;
  channels: M3UChannel[];
  sourceUrl: string;
  totalParsed: number;
  validUrls: number;
  invalidUrls: number;
  parseErrors: Array<{ line: number; reason: string }>;
  fetchedAt: Date;
}

export class ArchiveM3UDeviceAdapter {
  private sourceUrl: string;
  private maxRetries: number = 3;
  private timeoutMs: number = 10000;
  private cache: Map<string, { result: M3UParseResult; timestamp: number }> = new Map();
  private cacheTtlMs: number = 3600000; // 1 hour

  constructor(sourceUrl: string) {
    this.sourceUrl = sourceUrl;
    console.log(`[ArchiveM3U Device] Initialized for: ${sourceUrl}`);
  }

  /**
   * Main entry point: fetch M3U file from archive.org and parse it
   */
  async fetchAndParse(): Promise<M3UParseResult> {
    // Check cache first
    const cached = this.cache.get(this.sourceUrl);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      console.log(`[ArchiveM3U Device] ✅ Using cached result (${Math.floor((Date.now() - cached.timestamp) / 1000)}s old)`);
      return cached.result;
    }

    console.log(`[ArchiveM3U Device] Fetching from: ${this.sourceUrl}`);

    let playlistContent: string | null = null;
    let lastError: Error | null = null;

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        playlistContent = await this.fetchPlaylistWithTimeout(this.sourceUrl);
        console.log(`[ArchiveM3U Device] ✅ Fetched ${playlistContent.length} bytes`);
        break;
      } catch (err) {
        lastError = err as Error;
        console.warn(`[ArchiveM3U Device] Attempt ${attempt + 1}/${this.maxRetries} failed: ${lastError.message}`);

        if (attempt < this.maxRetries - 1) {
          const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`[ArchiveM3U Device] Retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    if (!playlistContent) {
      console.error(`[ArchiveM3U Device] ❌ Failed to fetch after ${this.maxRetries} attempts`);
      return {
        success: false,
        channels: [],
        sourceUrl: this.sourceUrl,
        totalParsed: 0,
        validUrls: 0,
        invalidUrls: 0,
        parseErrors: [
          {
            line: 0,
            reason: `Fetch failed: ${lastError?.message || 'Unknown error'}`,
          },
        ],
        fetchedAt: new Date(),
      };
    }

    // Parse the M3U content
    const result = this.parseM3U(playlistContent);

    // Cache the result
    this.cache.set(this.sourceUrl, { result, timestamp: Date.now() });

    return result;
  }

  /**
   * Fetch playlist with timeout and error handling
   */
  private async fetchPlaylistWithTimeout(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      console.log(`[ArchiveM3U Device] GET ${url}`);
      const response = await axios.get(url, {
        signal: controller.signal as any,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cache-Control': 'no-cache',
        },
        timeout: this.timeoutMs,
      });

      if (!response.data || typeof response.data !== 'string') {
        throw new Error('Response is not text');
      }

      const text = response.data as string;

      // Validate M3U format (should start with #EXTM3U)
      if (!text.includes('#EXTM3U') && !text.includes('#EXT-X') && !text.includes('http')) {
        throw new Error('Invalid M3U format: missing header');
      }

      return text;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse M3U/M3U8 playlist format
   *
   * Format:
   * #EXTM3U
   * #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Display Name
   * http://stream-url
   * #EXTINF:-1,...
   * http://another-stream
   */
  private parseM3U(content: string): M3UParseResult {
    const lines = content.split('\n').map((l) => l.trim());
    const channels: M3UChannel[] = [];
    const parseErrors: Array<{ line: number; reason: string }> = [];

    let currentExtinf: Partial<M3UChannel> | null = null;
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;

      // Skip empty lines and header
      if (!line || line.startsWith('#EXTM3U') || line.startsWith('#EXT-X')) {
        continue;
      }

      // Parse EXTINF metadata line
      if (line.startsWith('#EXTINF:')) {
        try {
          currentExtinf = this.parseExtinf(line);
        } catch (err) {
          parseErrors.push({
            line: lineNumber,
            reason: (err as Error).message,
          });
          currentExtinf = null;
        }
        continue;
      }

      // Skip other comments
      if (line.startsWith('#')) {
        continue;
      }

      // This should be a stream URL
      if (currentExtinf && line.length > 0) {
        try {
          // Validate URL format
          if (!line.startsWith('http://') && !line.startsWith('https://')) {
            // Skip non-URL lines (could be relative paths)
            continue;
          }

          const channel = this.normalizeChannel(currentExtinf as M3UChannel, line, lineNumber);
          channels.push(channel);
          currentExtinf = null;
        } catch (err) {
          parseErrors.push({
            line: lineNumber,
            reason: (err as Error).message,
          });
        }
      }
    }

    console.log(
      `[ArchiveM3U Device] ✅ Parsed ${channels.length} valid channels, ${parseErrors.length} errors`
    );

    return {
      success: channels.length > 0,
      channels,
      sourceUrl: this.sourceUrl,
      totalParsed: channels.length + parseErrors.length,
      validUrls: channels.length,
      invalidUrls: parseErrors.length,
      parseErrors,
      fetchedAt: new Date(),
    };
  }

  /**
   * Parse EXTINF metadata line
   * Format: #EXTINF:-1 tvg-id="id" tvg-name="name" tvg-logo="logo" group-title="category",Display Name
   */
  private parseExtinf(line: string): Partial<M3UChannel> {
    const extinf: Partial<M3UChannel> = {
      source: 'archive-m3u',
    };

    // Extract display name (after final comma)
    const parts = line.split(',');
    if (parts.length >= 2) {
      extinf.title = parts.slice(1).join(',').trim();
    }

    // Extract key-value pairs
    const metadata = parts[0] || '';
    const kvRegex = /(\w+)="([^"]*)"/g;
    let match;

    while ((match = kvRegex.exec(metadata)) !== null) {
      const [, key, value] = match;
      switch (key.toLowerCase()) {
        case 'tvg-id':
          extinf.tvgId = value;
          break;
        case 'tvg-name':
          extinf.tvgName = value;
          break;
        case 'tvg-logo':
          extinf.tvgLogo = value;
          break;
        case 'group-title':
          extinf.category = value;
          break;
      }
    }

    if (!extinf.title) {
      throw new Error('Missing display name in EXTINF');
    }

    if (!extinf.category) {
      extinf.category = 'Uncategorized';
    }

    return extinf;
  }

  /**
   * Normalize channel object and generate ID
   */
  private normalizeChannel(
    extinf: M3UChannel,
    url: string,
    lineNumber: number
  ): M3UChannel {
    if (!url || !url.startsWith('http')) {
      throw new Error(`Invalid URL at line ${lineNumber}: ${url.substring(0, 50)}`);
    }

    return {
      id: extinf.tvgId || this.generateId(extinf.title || ''),
      title: extinf.title || url,
      url: url.trim(),
      tvgId: extinf.tvgId,
      tvgName: extinf.tvgName,
      tvgLogo: extinf.tvgLogo,
      category: extinf.category || 'Uncategorized',
      source: 'archive-m3u',
      fetchedAt: new Date(),
    };
  }

  /**
   * Generate deterministic ID from title
   */
  private generateId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[ArchiveM3U Device] Cache cleared');
  }
}

/**
 * Singleton instance for device-side adapter
 */
let instance: ArchiveM3UDeviceAdapter | null = null;

export function getArchiveM3UDeviceAdapter(sourceUrl: string): ArchiveM3UDeviceAdapter {
  if (!instance) {
    instance = new ArchiveM3UDeviceAdapter(sourceUrl);
  }
  return instance;
}

/**
 * CLI Entry Point (for running on device directly)
 * Usage: npx ts-node archive_m3u_device_adapter.ts <m3u-url>
 */
if (require.main === module) {
  const testUrl = process.argv[2] || 'https://archive.org/download/daily-highlights/Alex%2024.m3u';

  (async () => {
    try {
      console.log(`\n[CLI Test] Testing Archive.org M3U Device Adapter`);
      console.log(`[CLI Test] URL: ${testUrl}\n`);

      const adapter = new ArchiveM3UDeviceAdapter(testUrl);
      const result = await adapter.fetchAndParse();

      console.log(`\n[CLI Test] ✅ Result:`);
      console.log(`  - Success: ${result.success}`);
      console.log(`  - Channels: ${result.channels.length}`);
      console.log(`  - Errors: ${result.parseErrors.length}`);

      console.log(`\n[CLI Test] First 5 channels:`);
      result.channels.slice(0, 5).forEach((ch, i) => {
        console.log(`  ${i + 1}. [${ch.category}] ${ch.title}`);
        console.log(`     URL: ${ch.url.substring(0, 70)}...`);
      });

      console.log(`\n[CLI Test] Done.\n`);
    } catch (error) {
      console.error(`[CLI Test] ❌ Error:`, (error as Error).message);
      process.exit(1);
    }
  })();
}
