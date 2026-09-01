# Patch: SmartVideoEngine.tsx - URL Validation Gate

**File:** `src/components/SmartVideoEngine.tsx`  
**Purpose:** Add URL validation before playback to prevent blank/invalid URLs from crashing player  
**Audit Finding:** Critical #1 - Blank playback URLs

---

## Changes Required

### 1. Add Import at Top of File

```typescript
// Add after existing imports (around line 4)
import { validatePlaybackUrl, enforceUrlValidation } from '../utils/urlValidator';
```

### 2. Add URL Validation Helper Function

Add this helper function inside the SmartVideoEngine component (after state declarations, around line 54):

```typescript
/**
 * Validate URL before playback attempt
 * Returns validated URL or triggers error UI
 */
const validateAndPrepareUrl = (urlToCheck: string | null): string | null => {
  if (!urlToCheck) {
    const errorMsg = 'No source available: Stream URL is empty';
    console.error(`[SmartVideoEngine] ${errorMsg}`);
    triggerError(errorMsg);
    return null;
  }

  const validation = validatePlaybackUrl(urlToCheck);
  
  if (!validation.valid) {
    const errorMsg = validation.error || 'Invalid stream URL';
    console.error(`[SmartVideoEngine] ${errorMsg}`);
    triggerError(errorMsg);
    return null;
  }

  return urlToCheck;
};
```

### 3. Patch Playback Entry Point 1 (~Line 368)

**BEFORE:**
```typescript
hls.loadSource(targetStream);
```

**AFTER:**
```typescript
// Validate URL before HLS loading
const validStreamUrl = validateAndPrepareUrl(targetStream);
if (!validStreamUrl) return; // Exit if validation fails

hls.loadSource(validStreamUrl);
```

### 4. Patch Playback Entry Point 2 (~Line 388)

**BEFORE:**
```typescript
video.src = targetStream;
```

**AFTER:**
```typescript
// Validate URL before native playback
const validStreamUrl = validateAndPrepareUrl(targetStream);
if (!validStreamUrl) return; // Exit if validation fails

video.src = validStreamUrl;
```

### 5. Add Early Return in fetchM3u (~Line 90)

**BEFORE:**
```typescript
const fetchM3u = async () => {
  // If it ends with .m3u, we fetch and parse it as a playlist
  if (activeUrl.toLowerCase().endsWith('.m3u')) {
    setStatus('PARSING PLAYLIST...');
```

**AFTER:**
```typescript
const fetchM3u = async () => {
  // Validate active URL first
  if (!validatePlaybackUrl(activeUrl).valid) {
    setStatus('NO SOURCE AVAILABLE');
    triggerError('Invalid or empty playlist URL');
    return;
  }

  // If it ends with .m3u, we fetch and parse it as a playlist
  if (activeUrl.toLowerCase().endsWith('.m3u')) {
    setStatus('PARSING PLAYLIST...');
```

---

## Testing Checklist

After applying patch:

- [ ] Build succeeds: `npm run build`
- [ ] TypeScript check passes: `npx tsc --noEmit`
- [ ] Select a channel with empty URL
  - Expected: UI shows "No source available" (not crash)
  - Console: "[SmartVideoEngine] No source available: Stream URL is empty"
- [ ] Select a channel with valid .mp4 URL
  - Expected: Playback starts normally
- [ ] Select a channel with valid .m3u8 HLS stream
  - Expected: Playlist parses and plays first item
- [ ] Select a Rumble embed channel
  - Expected: No validation error (embeds are detected)

---

## Console Output Expected

**Valid URL:**
```
[SmartVideoEngine] Playing stream: https://archive.org/download/.../video.mp4
```

**Invalid/Blank URL:**
```
[SmartVideoEngine] No source available: Stream URL is empty
ERROR: No source available: Stream URL is empty
```

**Rumble Embed (No Error):**
```
[SmartVideoEngine] Detected Rumble embed, skipping HLS validation
Playing via iframe
```

---

## Reference

- **Validator Source:** `src/utils/urlValidator.ts`
- **Test Suite:** `src/utils/__tests__/urlValidator.test.ts`
- **Audit Finding:** Critical Issue #1 - "Built-in virtual-channel templates use empty media URLs"
- **Expected Impact:** Telemetry metric "blank_url_playback_attempts" should drop to 0

---

## Rollback

If issues arise, simply remove the validator calls:
- Delete the `validateAndPrepareUrl()` helper
- Revert the three patched sections to original code
- No config changes required

---

**Patch Version:** 1.0  
**Date:** 2026-08-31  
**Author:** Claude Code Audit System
