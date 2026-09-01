/**
 * AJN Real Fetch Pipeline - PRODUCTION ADAPTER
 * Bridges legacy fetchAJNChannels to AJNFetchPipelineOrchestrator with 4-source merging
 */

import { Channel } from "../types";
import { getOrchestrator } from "../services/ajn_fetch_pipeline_orchestrator";

export async function fetchAJNChannels(): Promise<Channel[]> {
  try {
    console.log('🔄 [AJN Pipeline] Fetching via production 4-source orchestrator...');
    const orchestrator = getOrchestrator();
    let result = orchestrator.getLastResult();
    if (!result) {
      result = await orchestrator.fetchAndMerge();
    }
    
    if (result && result.channels.length > 0) {
      console.log(`✅ [AJN Pipeline] Successfully loaded ${result.channels.length} channels from orchestrator`);
      return result.channels.map(ch => ({
        id: ch.id,
        name: ch.title,
        url: ch.url,
        group: ch.category,
        logo: ch.logo || 'https://archive.org/download/daily-highlights/ajn-logo.png',
        tvgId: ch.id,
        tvgName: ch.title,
        isFavorite: ch.id === 'nasa-tv' || ch.id === 'ajn-live'
      }));
    }
    return [];
  } catch (error) {
    console.error('❌ [AJN Pipeline] Fatal error fetching AJN channels:', error);
    return [];
  }
}

export async function fetchRSSFeed(rssUrl: string): Promise<any[]> {
  return [];
}

export async function fetchAJNArchiveUrl(channelId: string): Promise<string | null> {
  return null;
}

export function isValidPlaybackUrl(url: string): boolean {
  if (!url || url.trim() === '') {
    return false;
  }
  try {
    if (url.includes('rumble.com') || url.includes('youtube.com') || url.includes('youtu.be')) {
      return true;
    }
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

