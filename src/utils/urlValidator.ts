/**
 * URL Validator Gate
 * Prevents blank/invalid URLs from reaching the video player
 * Critical blocker for audit finding: "blank playback URLs"
 */

/**
 * Validate a URL before attempting playback
 * Returns { valid: boolean, error: string | null, isEmbed: boolean }
 */
export function validatePlaybackUrl(url: string | null | undefined): {
  valid: boolean;
  error: string | null;
  isEmbed: boolean;
} {
  // Check for null/undefined/empty
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return {
      valid: false,
      error: 'No source available: URL is empty',
      isEmbed: false
    };
  }

  const trimmedUrl = url.trim();

  // Check for common demo/placeholder URLs
  if (
    trimmedUrl === '' ||
    trimmedUrl === 'undefined' ||
    trimmedUrl === 'null' ||
    trimmedUrl === 'demo://' ||
    trimmedUrl.startsWith('mock://')
  ) {
    return {
      valid: false,
      error: 'No source available: Invalid or demo URL',
      isEmbed: false
    };
  }

  // Detect embed URLs (Rumble, YouTube)
  const isRumbleEmbed = trimmedUrl.includes('rumble.com/embed') || trimmedUrl.includes('rumble.com');
  const isYouTubeEmbed =
    trimmedUrl.includes('youtube.com/embed') ||
    trimmedUrl.includes('youtu.be');

  if (isRumbleEmbed || isYouTubeEmbed) {
    return {
      valid: true,
      error: null,
      isEmbed: true
    };
  }

  // Try parsing as URL
  try {
    const urlObj = new URL(trimmedUrl);

    // Reject obviously invalid protocols
    if (!['http:', 'https:', 'blob:', 'data:'].includes(urlObj.protocol)) {
      return {
        valid: false,
        error: `Invalid protocol: ${urlObj.protocol}`,
        isEmbed: false
      };
    }

    // Warn on data: URLs (could be large)
    if (urlObj.protocol === 'data:') {
      console.warn('Using data: URL for playback — verify size before commit');
    }

    return {
      valid: true,
      error: null,
      isEmbed: false
    };
  } catch (parseError) {
    return {
      valid: false,
      error: `Invalid URL format: ${String(parseError).substring(0, 50)}`,
      isEmbed: false
    };
  }
}

/**
 * Guard wrapper for playback attempts
 * Use this before calling video.src = url or player.load(url)
 */
export function enforceUrlValidation(
  url: string | null | undefined,
  fallbackErrorHandler?: (error: string) => void
): string | null {
  const validation = validatePlaybackUrl(url);

  if (!validation.valid) {
    const errorMsg = validation.error || 'Unknown URL validation error';
    console.error(`[URLValidator] ${errorMsg}`);

    if (fallbackErrorHandler) {
      fallbackErrorHandler(errorMsg);
    }

    return null; // Reject playback
  }

  return url as string; // Safe to proceed
}

/**
 * Bulk validate multiple URLs (for playlists)
 */
export function validatePlaylistUrls(urls: string[]): {
  valid: string[];
  invalid: { url: string; error: string }[];
} {
  const valid: string[] = [];
  const invalid: { url: string; error: string }[] = [];

  for (const url of urls) {
    const validation = validatePlaybackUrl(url);
    if (validation.valid) {
      valid.push(url);
    } else {
      invalid.push({
        url,
        error: validation.error || 'Unknown error'
      });
    }
  }

  return { valid, invalid };
}

/**
 * Check if URL is a valid media file extension
 */
export function hasMediaExtension(url: string): boolean {
  const mediaExtensions = [
    '.mp4', '.webm', '.ogv', '.mov', '.m4v',
    '.m3u8', '.ts', '.mkv', '.flv', '.wmv',
    '.avi', '.mpg', '.mpeg', '.3gp'
  ];

  const normalized = url.toLowerCase().split('?')[0]; // Remove query params
  return mediaExtensions.some(ext => normalized.endsWith(ext));
}
