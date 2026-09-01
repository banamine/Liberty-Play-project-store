/**
 * FIXED: useStreamController Hook
 *
 * React integration for StreamSwitchController
 * Connects feed selection UI → stream loading → playback
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  StreamSwitchController,
  Show,
  Episode,
  StreamState,
  CircuitBreakerState,
} from '../controllers/StreamSwitchController';

interface UseStreamControllerOptions {
  apiUrl?: string;
  autoLoadShows?: boolean;
  onStreamSwitch?: (episode: Episode) => void;
  onError?: (error: Error) => void;
}

export const useStreamController = (options: UseStreamControllerOptions = {}) => {
  const {
    apiUrl = '/api',
    autoLoadShows = true,
    onStreamSwitch,
    onError,
  } = options;

  const controllerRef = useRef<StreamSwitchController | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [state, setState] = useState<StreamState>({
    selectedShowId: null,
    episodes: [],
    currentEpisode: null,
    isLoading: false,
    error: null,
    retryCount: 0,
    maxRetries: 3,
  });
  const [circuitBreakerStatus, setCircuitBreakerStatus] = useState<CircuitBreakerState>({
    status: 'closed',
    failureCount: 0,
    failureThreshold: 3,
    resetTimeoutMs: 30000,
    lastFailureTime: null,
  });
  const [showsLoading, setShowsLoading] = useState(false);

  // ============================================================================
  // INITIALIZE CONTROLLER
  // ============================================================================
  useEffect(() => {
    if (!controllerRef.current) {
      controllerRef.current = new StreamSwitchController(apiUrl);

      // ✅ Subscribe to controller events
      const unsubscribeStateChange = controllerRef.current.on(
        'stateChange',
        (newState: StreamState) => {
          setState(newState);
          // Update circuit breaker status
          setCircuitBreakerStatus(
            controllerRef.current!.getCircuitBreakerStatus()
          );
        }
      );

      const unsubscribeError = controllerRef.current.on('error', (data: { error: Error }) => {
        console.error('Stream error:', data.error);
        onError?.(data.error);
      });

      const unsubscribeStreamSwitched = controllerRef.current.on(
        'streamSwitched',
        (data: { episode: Episode }) => {
          console.log('Stream switched:', data);
          onStreamSwitch?.(data.episode);
        }
      );

      // Cleanup on unmount
      return () => {
        unsubscribeStateChange();
        unsubscribeError();
        unsubscribeStreamSwitched();
      };
    }
  }, [apiUrl, onError, onStreamSwitch]);

  // ============================================================================
  // LOAD SHOWS ON MOUNT
  // ============================================================================
  useEffect(() => {
    if (autoLoadShows && shows.length === 0) {
      loadShows();
    }
  }, [autoLoadShows]);

  // ============================================================================
  // PUBLIC API - Feed/Show Selection
  // ============================================================================

  /**
   * Load list of available shows
   */
  const loadShows = useCallback(async () => {
    if (!controllerRef.current) return;

    try {
      setShowsLoading(true);
      const loadedShows = await controllerRef.current.fetchShows();
      setShows(loadedShows);
      console.log(`✅ Loaded ${loadedShows.length} shows`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to load shows:', error);
      onError?.(error);
    } finally {
      setShowsLoading(false);
    }
  }, [onError]);

  /**
   * Switch to a specific show (by ID)
   */
  const switchToShow = useCallback(
    async (showId: string) => {
      if (!controllerRef.current) return;

      try {
        await controllerRef.current.switchToShow(showId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Failed to switch show:', error);
        onError?.(error);
      }
    },
    [onError]
  );

  /**
   * Load episodes for a specific show
   */
  const loadEpisodes = useCallback(
    async (showId: string) => {
      if (!controllerRef.current) return;

      try {
        await controllerRef.current.fetchEpisodes(showId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Failed to load episodes:', error);
        onError?.(error);
      }
    },
    [onError]
  );

  /**
   * Play a specific episode
   */
  const playEpisode = useCallback(
    async (episode: Episode) => {
      if (!controllerRef.current) return;

      try {
        await controllerRef.current.playEpisode(episode);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Failed to play episode:', error);
        onError?.(error);
      }
    },
    [onError]
  );

  /**
   * Get fallback stream from Archive.org
   */
  const getArchiveFallback = useCallback(async () => {
    if (!controllerRef.current) return null;

    try {
      return await controllerRef.current.getArchiveOrgFallback();
    } catch (err) {
      console.error('Failed to get archive fallback:', err);
      return null;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.clearError();
    }
  }, []);

  /**
   * Retry current episode
   */
  const retryEpisode = useCallback(async () => {
    if (state.currentEpisode) {
      await playEpisode(state.currentEpisode);
    }
  }, [state.currentEpisode, playEpisode]);

  /**
   * Get diagnostics
   */
  const getDiagnostics = useCallback(() => {
    return controllerRef.current?.getDiagnostics() || null;
  }, []);

  /**
   * Log diagnostics to console
   */
  const logDiagnostics = useCallback(() => {
    controllerRef.current?.logDiagnostics();
  }, []);

  // ============================================================================
  // RETURN HOOK STATE & METHODS
  // ============================================================================
  return {
    // State
    shows,
    state,
    circuitBreakerStatus,
    showsLoading,
    isStreamHealthy: circuitBreakerStatus.status !== 'open',

    // Actions
    switchToShow,
    loadEpisodes,
    playEpisode,
    loadShows,
    getArchiveFallback,
    clearError,
    retryEpisode,

    // Diagnostics
    getDiagnostics,
    logDiagnostics,
  };
};
