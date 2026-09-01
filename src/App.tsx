import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { EPGView } from './components/EPGView';
import { PlaylistModal } from './components/PlaylistModal';
import { StreamStatsDrawer } from './components/StreamStatsDrawer';
import { DEFAULT_PLAYLISTS } from './data/defaultPlaylists';
import { Playlist, Channel, StreamStats } from './types';
import { fetchAJNChannels } from './utils/ajnFetchPipeline';

export default function App() {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('liberty_play_playlists');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_PLAYLISTS;
      }
    }
    return DEFAULT_PLAYLISTS;
  });

  const [activePlaylistId, setActivePlaylistId] = useState<string>(playlists[0]?.id || 'liberty-global-live');
  const [activeChannel, setActiveChannel] = useState<Channel | null>(() => {
    return playlists[0]?.channels[0] || null;
  });

  const [isEPGOpen, setIsEPGOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [streamStats, setStreamStats] = useState<StreamStats | null>(null);

  // Load real AJN channels on startup
  useEffect(() => {
    fetchAJNChannels()
      .then(channels => {
        if (channels.length > 0) {
          setPlaylists(prev => [
            { ...prev[0], channels }, // Replace default playlist channels
            ...prev.slice(1)
          ]);
        }
      })
      .catch(err => console.error('Failed to load AJN channels:', err));
  }, []);

  // Save playlists to localStorage
  useEffect(() => {
    localStorage.setItem('liberty_play_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Find active playlist
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) || playlists[0];
  const channels = activePlaylist ? activePlaylist.channels : [];

  // Handle select playlist
  const handleSelectPlaylist = (id: string) => {
    setActivePlaylistId(id);
    const pl = playlists.find((p) => p.id === id);
    if (pl && pl.channels.length > 0) {
      setActiveChannel(pl.channels[0]);
    }
  };

  // Add custom playlist
  const handleAddPlaylist = (newPlaylist: Playlist) => {
    setPlaylists((prev) => [...prev, newPlaylist]);
    setActivePlaylistId(newPlaylist.id);
    if (newPlaylist.channels.length > 0) {
      setActiveChannel(newPlaylist.channels[0]);
    }
  };

  // Toggle favorite on channel
  const handleToggleFavorite = (channelId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== activePlaylistId) return pl;
        return {
          ...pl,
          channels: pl.channels.map((ch) =>
            ch.id === channelId ? { ...ch, isFavorite: !ch.isFavorite } : ch
          ),
        };
      })
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {/* Top Header */}
      <Header
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        onSelectPlaylist={handleSelectPlaylist}
        onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
        onToggleEPG={() => setIsEPGOpen(!isEPGOpen)}
        isEPGOpen={isEPGOpen}
        onToggleStats={() => setIsStatsOpen(!isStatsOpen)}
        isStatsOpen={isStatsOpen}
        searchTerm=""
        onSearchChange={() => {}}
        channelCount={channels.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        <Sidebar
          channels={channels}
          activeChannel={activeChannel}
          onSelectChannel={(ch) => setActiveChannel(ch)}
          onToggleFavorite={handleToggleFavorite}
        />

        <VideoPlayer
          channel={activeChannel}
          onUpdateStats={(stats) => setStreamStats(stats)}
        />

        {/* EPG Modal / Matrix Overlay */}
        {isEPGOpen && (
          <EPGView
            channels={channels}
            activeChannel={activeChannel}
            onSelectChannel={(ch) => setActiveChannel(ch)}
            onClose={() => setIsEPGOpen(false)}
          />
        )}

        {/* Stream Diagnostics Drawer */}
        {isStatsOpen && (
          <StreamStatsDrawer
            stats={streamStats}
            activeChannel={activeChannel}
            onClose={() => setIsStatsOpen(false)}
          />
        )}
      </div>

      {/* Add Playlist Modal */}
      {isPlaylistModalOpen && (
        <PlaylistModal
          onClose={() => setIsPlaylistModalOpen(false)}
          onAddPlaylist={handleAddPlaylist}
        />
      )}
    </div>
  );
}
