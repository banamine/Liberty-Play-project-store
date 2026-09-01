import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Tv,
  RotateCcw,
  Sparkles,
  Layers,
  Settings,
  AlertCircle
} from 'lucide-react';
import { Channel, StreamStats } from '../types';
import { validatePlaybackUrl } from '../utils/urlValidator';

interface VideoPlayerProps {
  channel: Channel | null;
  onUpdateStats: (stats: StreamStats) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onUpdateStats }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const validation = validatePlaybackUrl(channel?.url);

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel) return;

    setIsLoading(true);
    setErrorMsg(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = channel.url;
    const urlValidation = validatePlaybackUrl(streamUrl);

    if (!urlValidation.valid) {
      setErrorMsg(urlValidation.error || 'Invalid playback URL');
      setIsLoading(false);
      return;
    }

    if (urlValidation.isEmbed) {
      setIsLoading(false);
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
        if (data.frag) {
          onUpdateStats({
            resolution: `${video.videoWidth || 1280}x${video.videoHeight || 720}`,
            fps: 60,
            bitrateKbps: Math.round(data.frag.stats.bwEstimate ? data.frag.stats.bwEstimate / 1000 : 3500),
            bufferLength: Math.round(video.buffered.length ? video.buffered.end(video.buffered.length - 1) - video.currentTime : 0),
            droppedFrames: 0,
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMsg('Network error: Unable to load stream segments.');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setErrorMsg('Media error: Attempting stream recovery...');
              hls.recoverMediaError();
              break;
            default:
              setErrorMsg('Fatal playback error. Stream may be offline.');
              hls.destroy();
              break;
          }
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari / iOS)
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        setErrorMsg('Native HLS playback failed.');
        setIsLoading(false);
      });
    } else {
      setErrorMsg('HLS is not supported in this browser.');
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel]);

  // Handle Play/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  // Handle Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Mouse movement for control auto-hide
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  if (!channel) {
    return (
      <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4 shadow-xl">
          <Tv className="w-10 h-10 text-cyan-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Channel Selected</h2>
        <p className="text-slate-400 max-w-md text-sm">
          Select a channel from the sidebar or EPG matrix to begin streaming live IPTV content.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden select-none group"
    >
      {/* Video Element or Embed */}
      {validation.isEmbed ? (
        <iframe
          src={channel.url}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          className={`w-full h-full object-${aspectRatio}`}
          playsInline
          autoPlay
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center z-20">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-3"></div>
          <p className="text-white font-medium text-sm">Buffering stream...</p>
          <p className="text-xs text-cyan-400 mt-1">{channel.name}</p>
        </div>
      )}

      {/* Error State */}
      {errorMsg && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-4 text-red-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Playback Interrupted</h3>
          <p className="text-sm text-slate-400 max-w-md mb-6">{errorMsg}</p>
          <button
            onClick={() => {
              if (hlsRef.current) {
                hlsRef.current.loadSource(channel.url);
              } else if (videoRef.current) {
                videoRef.current.src = channel.url;
                videoRef.current.load();
              }
              setErrorMsg(null);
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reconnect Stream</span>
          </button>
        </div>
      )}

      {/* Channel Header Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent transition-opacity duration-300 flex items-center justify-between z-10 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-3">
          {channel.logo && (
            <img src={channel.logo} alt="" className="w-9 h-9 rounded-lg bg-slate-900 p-1 object-contain border border-slate-700/60" />
          )}
          <div>
            <h2 className="text-white font-bold text-base drop-shadow">{channel.name}</h2>
            <p className="text-xs text-cyan-400 font-medium">{channel.group} • LIVE</p>
          </div>
        </div>
      </div>

      {/* Playback Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent transition-opacity duration-300 flex items-center justify-between z-10 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition-all shadow-lg shadow-cyan-500/20"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
          </button>

          <div className="flex items-center space-x-2">
            <button onClick={toggleMute} className="text-slate-300 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : (volume ?? 1)}
              onChange={handleVolumeChange}
              className="w-20 accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Aspect Ratio Toggle */}
          <button
            onClick={() =>
              setAspectRatio((prev) => (prev === 'contain' ? 'cover' : prev === 'cover' ? 'fill' : 'contain'))
            }
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700/60 transition-colors uppercase"
            title="Aspect Ratio"
          >
            {aspectRatio}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
