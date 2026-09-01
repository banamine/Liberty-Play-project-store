/**
 * useAJNPipeline Hook
 *
 * React hook for binding AJN Fetch Pipeline to UI components
 * Handles:
 * - Starting/stopping auto-refresh cycle
 * - Real-time channel list updates
 * - Error state and fallback rendering
 * - Loading state (TUNING spinner)
 * - Category/filter organization
 *
 * @since 2026-09-01
 * @status PRODUCTION-READY
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getOrchestrator, AJNFetchPipelineOrchestrator, PipelineResult, NormalizedChannel } from '../services/ajn_fetch_pipeline_orchestrator';

export interface UseAJNPipelineConfig {
  refreshInterval?: number; // ms, default 30s
  enableStreamVault?: boolean;
  enableRss?: boolean;
  enableArchiveCollection?: boolean;
  enableArchiveM3U?: boolean;
  rssFeeds?: string[];
  archiveCollectionUrls?: string[];
  m3uPlaylistUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  enableCache?: boolean;
  cacheExpiryMs?: number;
  autoStart?: boolean;
}

export interface UseAJNPipelineResult {
  channels: NormalizedChannel[];
  loading: boolean;
  error: Error | null;
  status: {
    isRunning: boolean;
    nextRefreshAt: Date | null;
    sourceHealth: Array<{
      source: string;
      state: 'healthy' | 'degraded' | 'failed';
      failureCount: number;
      lastError: string | null;
    }>;
    perSourceCounts?: {
      streamVault: number;
      rss: number;
      archiveCollection: number;
      archiveM3U: number;
    };
  };
  refresh: () => Promise<void>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  groupedByCategory: Map<string, NormalizedChannel[]>;
}

export function useAJNPipeline(config: UseAJNPipelineConfig = {}): UseAJNPipelineResult {
  const [channels, setChannels] = useState<NormalizedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState({
    isRunning: false,
    nextRefreshAt: null as Date | null,
    sourceHealth: [] as any[],
    perSourceCounts: {
      streamVault: 0,
      rss: 0,
      archiveCollection: 0,
      archiveM3U: 0,
    },
  });

  const orchestratorRef = useRef<AJNFetchPipelineOrchestrator | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!orchestratorRef.current) {
      orchestratorRef.current = getOrchestrator({
        refreshIntervalMs: config.refreshInterval || 30 * 1000,
        enableStreamVault: config.enableStreamVault !== false,
        enableRss: config.enableRss !== false,
        enableArchiveCollection: config.enableArchiveCollection !== false,
        enableArchiveM3U: config.enableArchiveM3U !== false,
        rssFeeds: config.rssFeeds,
        archiveCollectionUrls: config.archiveCollectionUrls,
        m3uPlaylistUrl: config.m3uPlaylistUrl,
        supabaseUrl: config.supabaseUrl,
        supabaseAnonKey: config.supabaseAnonKey,
        enableCaching: config.enableCache !== false,
        cacheExpiryMs: config.cacheExpiryMs,
      });
    }
  }, []);

  useEffect(() => {
    const orchestrator = orchestratorRef.current;
    if (!orchestrator) return;

    if (config.autoStart !== false) {
      console.log('[Hook] Starting auto-refresh on mount');
      orchestrator.startAutoRefresh();
    }
  }, [config.autoStart]);

  const updateUI = useCallback(() => {
    const orchestrator = orchestratorRef.current;
    if (!orchestrator || !isMountedRef.current) return;

    const result = orchestrator.getLastResult();
    const orchStatus = orchestrator.getStatus();

    if (result) {
      setChannels(result.channels);
      setStatus({
        isRunning: orchStatus.isRunning,
        nextRefreshAt: result.nextRefreshAt,
        sourceHealth: orchStatus.sourceHealth,
        perSourceCounts: result.perSourceCounts,
      });

      if (!result.success && result.errorLog.length > 0) {
        const errorMsg = result.errorLog.map((e) => `${e.source}: ${e.error}`).join('; ');
        setError(new Error(`Partial failure: ${errorMsg}`));
      } else {
        setError(null);
      }
    }

    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const orchestrator = orchestratorRef.current;
    if (!orchestrator) return;

    setLoading(true);
    setError(null);

    try {
      await orchestrator.fetchAndMerge();
      updateUI();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Hook] Manual refresh error:', errorMsg);
      setError(new Error(`Refresh failed: ${errorMsg}`));
    } finally {
      setLoading(false);
    }
  }, [updateUI]);

  useEffect(() => {
    const orchestrator = orchestratorRef.current;
    if (!orchestrator) return;

    updateUI();

    const pollInterval = Math.min((config.refreshInterval || 30 * 1000) / 6, 5000);
    const pollTimer = setInterval(() => {
      updateUI();
    }, pollInterval);

    return () => {
      clearInterval(pollTimer);
    };
  }, [config.refreshInterval, updateUI]);

  const startAutoRefresh = useCallback(() => {
    const orchestrator = orchestratorRef.current;
    if (orchestrator) {
      console.log('[Hook] Starting auto-refresh');
      orchestrator.startAutoRefresh();
      updateUI();
    }
  }, [updateUI]);

  const stopAutoRefresh = useCallback(() => {
    const orchestrator = orchestratorRef.current;
    if (orchestrator) {
      console.log('[Hook] Stopping auto-refresh');
      orchestrator.stopAutoRefresh();
      updateUI();
    }
  }, [updateUI]);

  const groupedByCategory = new Map<string, NormalizedChannel[]>();
  for (const channel of channels) {
    if (!groupedByCategory.has(channel.category)) {
      groupedByCategory.set(channel.category, []);
    }
    groupedByCategory.get(channel.category)!.push(channel);
  }

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    channels,
    loading,
    error,
    status,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    groupedByCategory,
  };
}
