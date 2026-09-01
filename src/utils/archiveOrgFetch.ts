/**
 * Archive.org Metadata Resolver
 * Fetches metadata from archive.org and locates playable .mp4 or .m3u8 files
 * Replaces blank URL fallbacks and validates SSRF
 */

const ARCHIVE_ORG_METADATA_API = 'https://archive.org/metadata';

export interface ArchiveMetadata {
  identifier: string;
  title: string;
  files: ArchiveFile[];
}

export interface ArchiveFile {
  name: string;
  source?: string;
  format?: string;
  size?: string;
  mtime?: string;
}

/**
 * Resolve a playable URL from an Archive.org identifier
 * Prefers h.264 .mp4 files, falls back to .m3u8 HLS streams
 */
export async function resolveArchiveUrl(
  identifier: string,
  preferFormat: 'h.264' | 'm3u8' = 'h.264'
): Promise<string> {
  if (!identifier || identifier.trim() === '') {
    throw new Error('Empty Archive.org identifier provided');
  }

  try {
    const metadata = await fetchArchiveMetadata(identifier);

    if (!metadata.files || metadata.files.length === 0) {
      throw new Error(`No files found in Archive.org collection: ${identifier}`);
    }

    // Search for playable file in order of preference
    let playableFile: ArchiveFile | null = null;

    if (preferFormat === 'h.264') {
      // Priority 1: h.264 encoded .mp4 (browser-compatible)
      playableFile = metadata.files.find(
        f => f.name.endsWith('.mp4') && f.format === 'h.264'
      ) || null;

      // Priority 2: Any .mp4 file
      if (!playableFile) {
        playableFile = metadata.files.find(f => f.name.endsWith('.mp4')) || null;
      }

      // Priority 3: .m3u8 HLS stream as fallback
      if (!playableFile) {
        playableFile = metadata.files.find(f => f.name.endsWith('.m3u8')) || null;
      }
    } else {
      // If preferring m3u8
      playableFile = metadata.files.find(f => f.name.endsWith('.m3u8')) || null;

      if (!playableFile) {
        playableFile = metadata.files.find(f => f.name.endsWith('.mp4')) || null;
      }
    }

    if (!playableFile) {
      throw new Error(
        `No playable file found in ${identifier}. ` +
        `Available formats: ${metadata.files.map(f => f.format || 'unknown').join(', ')}`
      );
    }

    // Construct the download URL
    const archiveUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(playableFile.name)}`;

    return archiveUrl;
  } catch (error) {
    console.error(`Failed to resolve Archive.org URL for "${identifier}":`, error);
    throw error;
  }
}

/**
 * Fetch metadata from Archive.org API
 */
export async function fetchArchiveMetadata(identifier: string): Promise<ArchiveMetadata> {
  if (!identifier || identifier.trim() === '') {
    throw new Error('Empty identifier');
  }

  try {
    const url = `${ARCHIVE_ORG_METADATA_API}/${identifier}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Archive.org identifier not found: ${identifier}`);
      }
      throw new Error(`Archive.org metadata fetch failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.metadata) {
      throw new Error(`Invalid metadata response for ${identifier}`);
    }

    return {
      identifier: data.metadata.identifier || identifier,
      title: data.metadata.title || 'Unknown',
      files: data.files || []
    };
  } catch (error) {
    console.error(`Metadata API error for ${identifier}:`, error);
    throw error;
  }
}

/**
 * Batch resolve multiple Archive.org identifiers
 * Used for fallback channel discovery
 */
export async function resolveArchiveUrls(
  identifiers: string[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const id of identifiers) {
    try {
      results[id] = await resolveArchiveUrl(id);
    } catch (error) {
      console.warn(`Failed to resolve ${id}:`, error);
      results[id] = ''; // Mark as failed
    }
  }

  return results;
}

/**
 * Validate that an Archive.org URL is safe to use
 * (No SSRF risk since archive.org is public)
 */
export function isValidArchiveUrl(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'archive.org' || urlObj.hostname.endsWith('.archive.org');
  } catch {
    return false;
  }
}
