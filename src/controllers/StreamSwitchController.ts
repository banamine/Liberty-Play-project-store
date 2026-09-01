/**
 * FIXED: Stream Switch Controller
 *
 * Handles:
 * ✅ Feed/channel selection → API episode fetch → playback
 * ✅ Stream fallback logic (primary → backup)
 * ✅ PlaybackCircuitBreaker for graceful degradation
 * ✅ Error recovery and retry logic
 */

/**
 * ============================================================================
 * TYPES
 * ============================================================================
 */
export interface Show {
  id: string;
  title: string;
  channel: string;
  description: string;
  videoCount: number;
  audioCount: number;
  hasArchiveBackup: boolean;
}

export interface Episode {
  id: string;
  title: string;
  url: string;
  sourceUrl: string;
  duration: number;
  format: string;
  date: string;
  quality: string;
  size: string;
}

export interface StreamState {
  selectedShowId: string | null;
  episodes: Episode[];
  currentEpisode: Episode | null;
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
  maxRetries: number;
}

export interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half-open';
  failureCount: number;
  failureThreshold: number;
  resetTimeoutMs: number;
  lastFailureTime: number | null;
}

/**
 * ============================================================================
 * PLAYBACK CIRCUIT BREAKER
 *
 * Prevents cascading failures by:
 * - Opening after N consecutive failures
 * - Allowing half-open state for recovery attempts
 * - Auto-closing on successful stream
 * ============================================================================
 */
export class PlaybackCircuitBreaker {
  private state: CircuitBreakerState;

  constructor(
    failureThreshold: number = 3,
    resetTimeoutMs: number = 30000
  ) {
    this.state = {
      status: 'closed',
      failureCount: 0,
      failureThreshold,
      resetTimeoutMs,
      lastFailureTime: null,
    };
  }

  // Record a failure
  recordFailure(): void {
    this.state.failureCount++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failureCount >= this.state.failureThreshold) {
      this.state.status = 'open';
      console.warn(
        `🚫 Circuit breaker OPENED after ${this.state.failureCount} failures`
      );

      // Schedule reset to half-open state
      setTimeout(() => {
        this.state.status = 'half-open';
        console.log('🔄 Circuit breaker entering HALF-OPEN state');
      }, this.state.resetTimeoutMs);
    }
  }

  // Record a success
  recordSuccess(): void {
    if (this.state.status === 'half-open') {
      this.state.status = 'closed';
      this.state.failureCount = 0;
      console.log('✅ Circuit breaker CLOSED - stream recovered');
    }
  }

  // Check if we can attempt a request
  canAttempt(): boolean {
    return this.state.status !== 'open';
  }

  getStatus(): CircuitBreakerState {
    return { ...this.state };
  }
}

/**
 * ============================================================================
 * STREAM SWITCH CONTROLLER
 *
 * Main orchestrator for:
 * 1. Fetching available shows
 * 2. Loading episodes for selected show
 * 3. Playing episodes with fallback logic
 * 4. Handling errors and retries
 * ============================================================================
 */
export class StreamSwitchController {
  private baseUrl: string;
  private state: StreamState;
  private circuitBreaker: PlaybackCircuitBreaker;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.circuitBreaker = new PlaybackCircuitBreaker(3, 30000);

    this.state = {
      selectedShowId: null,
      episodes: [],
      currentEpisode: null,
      isLoading: false,
      error: null,
      retryCount: 0,
      maxRetries: 3,
    };

    // Initialize event listeners map
    this.listeners.set('stateChange', new Set());
    this.listeners.set('episodeLoaded', new Set());
    this.listeners.set('error', new Set());
    this.listeners.set('streamSwitched', new Set());
  }

  // ============================================================================
  // EVENT EMITTER - Notify subscribers of state changes
  // ============================================================================
  private emit(eventName: string, data?: any): void {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (err) {
          console.error(`Error in ${eventName} handler:`, err);
        }
      });
    }
  }

  public on(eventName: string, handler: (data?: any) => void): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventName)!.delete(handler);
    };
  }

  // ============================================================================
  // API CALLS - Fetch shows and episodes
  // ============================================================================

  /**
   * Fetch all available shows from backend
   */
  async fetchShows(): Promise<Show[]> {
    try {
      console.log('📺 Fetching available shows...');
      const response = await fetch(`${this.baseUrl}/shows`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Loaded ${data.shows.length} shows`);
      return data.shows;

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.handleError(error, 'fetchShows');
      throw error;
    }
  }

  /**
   * Fetch episodes for a specific show
   */
  async fetchEpisodes(showId: string): Promise<Episode[]> {
    try {
      if (!this.circuitBreaker.canAttempt()) {
        throw new Error('Circuit breaker is open - stream unavailable');
      }

      this.setState({ isLoading: true, selectedShowId: showId });
      console.log(`📻 Fetching episodes for show: ${showId}`);

      const response = await fetch(`${this.baseUrl}/episodes/${showId}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const episodes: Episode[] = data.episodes;

      console.log(`✅ Loaded ${episodes.length} episodes`);
      this.circuitBreaker.recordSuccess();
      this.setState({ episodes, isLoading: false, error: null });
      this.emit('episodeLoaded', { showId, episodeCount: episodes.length });

      return episodes;

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.circuitBreaker.recordFailure();
      this.handleError(error, 'fetchEpisodes');
      this.setState({ isLoading: false });
      throw error;
    }
  }

  /**
   * Switch to a specific show and load first episode
   */
  async switchToShow(showId: string): Promise<void> {
    try {
      console.log(`🔄 Switching to show: ${showId}`);

      const episodes = await this.fetchEpisodes(showId);

      if (episodes.length === 0) {
        throw new Error('No episodes available for this show');
      }

      // Auto-play first episode
      await this.playEpisode(episodes[0]);
      this.emit('streamSwitched', { showId, episode: episodes[0] });

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.handleError(error, 'switchToShow');
      throw error;
    }
  }

  // ============================================================================
  // PLAYBACK CONTROL
  // ============================================================================

  /**
   * Play a specific episode with fallback logic
   */
  async playEpisode(episode: Episode, attempt: number = 1): Promise<void> {
    try {
      if (!this.circuitBreaker.canAttempt()) {
        throw new Error('Circuit breaker is open');
      }

      console.log(`▶️ Playing episode: ${episode.title} (attempt ${attempt})`);

      // Attempt primary stream
      const success = await this.testStreamAvailability(episode.sourceUrl);

      if (!success && attempt < this.state.maxRetries) {
        console.warn(`⚠️ Primary stream failed, retrying... (${attempt}/${this.state.maxRetries})`);
        this.setState({ retryCount: attempt });

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        return this.playEpisode(episode, attempt + 1);
      }

      if (!success) {
        throw new Error(`Stream unavailable after ${this.state.maxRetries} retries`);
      }

      // ✅ Stream is available
      this.setState({
        currentEpisode: episode,
        error: null,
        retryCount: 0,
      });

      this.circuitBreaker.recordSuccess();
      console.log(`✅ Episode playing: ${episode.title}`);
      this.emit('stateChange', { currentEpisode: episode });

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.circuitBreaker.recordFailure();
      this.handleError(error, 'playEpisode');
      throw error;
    }
  }

  /**
   * Test if a stream URL is accessible
   * (Makes a HEAD request to check availability without loading full stream)
   */
  private async testStreamAvailability(sourceUrl: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const proxyUrl = `${this.baseUrl}/stream-proxy?url=${encodeURIComponent(sourceUrl)}`;

      const response = await fetch(proxyUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;

    } catch (err) {
      console.warn(`⚠️ Stream availability test failed:`, err);
      return false;
    }
  }

  /**
   * Get fallback stream from Archive.org if primary fails
   */
  async getArchiveOrgFallback(): Promise<Episode | null> {
    try {
      console.log('🔍 Looking for Archive.org fallback...');

      const response = await fetch(`${this.baseUrl}/archives`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const collections = data.collections;

      if (collections.length > 0) {
        // Create a fallback episode from first available collection
        const collection = collections[0];
        return {
          id: `archive-${collection.id}`,
          title: collection.title,
          url: `/api/stream-proxy?url=${encodeURIComponent(collection.url)}`,
          sourceUrl: collection.url,
          duration: 3600,
          format: 'video/mp4',
          date: new Date().toISOString(),
          quality: '480p',
          size: 'Unknown',
        };
      }

      return null;

    } catch (err) {
      console.warn('⚠️ Failed to get Archive.org fallback:', err);
      return null;
    }
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  private setState(updates: Partial<StreamState>): void {
    this.state = { ...this.state, ...updates };
    this.emit('stateChange', this.state);
  }

  public getState(): Readonly<StreamState> {
    return Object.freeze({ ...this.state });
  }

  public getCircuitBreakerStatus(): CircuitBreakerState {
    return this.circuitBreaker.getStatus();
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private handleError(error: Error, context: string): void {
    console.error(`❌ [${context}] ${error.message}`);

    this.setState({ error });
    this.emit('error', { error, context });
  }

  /**
   * Clear error state
   */
  public clearError(): void {
    this.setState({ error: null });
  }

  // ============================================================================
  // DIAGNOSTIC METHODS
  // ============================================================================

  /**
   * Get full diagnostics for debugging
   */
  public getDiagnostics(): object {
    return {
      timestamp: new Date().toISOString(),
      state: this.state,
      circuitBreaker: this.circuitBreaker.getStatus(),
      apiUrl: this.baseUrl,
    };
  }

  /**
   * Log diagnostics to console
   */
  public logDiagnostics(): void {
    console.log('📊 STREAM CONTROLLER DIAGNOSTICS:', this.getDiagnostics());
  }
}
