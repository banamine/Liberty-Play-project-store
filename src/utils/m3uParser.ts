import { Channel } from '../types';

export function parseM3U(content: string): Channel[] {
  const lines = content.split(/\r?\n{1,}/);
  const channels: Channel[] = [];
  
  let currentGroup = 'Uncategorized';
  let currentLogo = '';
  let currentTvgId = '';
  let currentTvgName = '';
  let currentName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Parse attributes in EXTINF
      // Example: #EXTINF:-1 tvg-id="CNN" tvg-logo="http://..." group-title="News",CNN HD
      const infoMatch = line.match(/#EXTINF:?-?[0-9]*(.*),(.*)$/);
      if (infoMatch) {
        const attrsStr = infoMatch[1];
        currentName = infoMatch[2].trim();

        const groupMatch = attrsStr.match(/group-title="([^"]*)"/i);
        currentGroup = groupMatch ? groupMatch[1] : 'General';

        const logoMatch = attrsStr.match(/tvg-logo="([^"]*)"/i);
        currentLogo = logoMatch ? logoMatch[1] : '';

        const tvgIdMatch = attrsStr.match(/tvg-id="([^"]*)"/i);
        currentTvgId = tvgIdMatch ? tvgIdMatch[1] : '';

        const tvgNameMatch = attrsStr.match(/tvg-name="([^"]*)"/i);
        currentTvgName = tvgNameMatch ? tvgNameMatch[1] : currentName;
      }
    } else if (line.startsWith('#')) {
      // Other tags like #EXTGRP
      if (line.startsWith('#EXTGRP:')) {
        currentGroup = line.replace('#EXTGRP:', '').trim();
      }
    } else if (!line.startsWith('#')) {
      // This is the stream URL
      const url = line;
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('rtmp://') || url.startsWith('mms://'))) {
        channels.push({
          id: `ch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: currentName || `Channel ${channels.length + 1}`,
          url,
          group: currentGroup || 'General',
          logo: currentLogo || undefined,
          tvgId: currentTvgId || undefined,
          tvgName: currentTvgName || undefined,
          isFavorite: false,
        });

        // Reset metadata
        currentGroup = 'General';
        currentLogo = '';
        currentTvgId = '';
        currentTvgName = '';
        currentName = '';
      }
    }
  }

  return channels;
}
