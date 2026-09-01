import React from 'react';
import { Tv, Radio, Plus, ListMusic, Info, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Playlist } from '../types';

interface HeaderProps {
  playlists: Playlist[];
  activePlaylistId: string;
  onSelectPlaylist: (id: string) => void;
  onOpenPlaylistModal: () => void;
  onToggleEPG: () => void;
  isEPGOpen: boolean;
  onToggleStats: () => void;
  isStatsOpen: boolean;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  channelCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onOpenPlaylistModal,
  onToggleEPG,
  isEPGOpen,
  onToggleStats,
  isStatsOpen,
  searchTerm,
  onSearchChange,
  channelCount,
}) => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 select-none shadow-md">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Tv className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
            Liberty Play <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">IPTV v2.4</span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">High-Performance HLS Console & EPG Matrix</p>
        </div>
      </div>

      {/* Playlist Selector & Search */}
      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5">
          <ListMusic className="w-4 h-4 text-cyan-400" />
          <select
            value={activePlaylistId || ''}
            onChange={(e) => onSelectPlaylist(e.target.value)}
            className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer pr-2 font-medium"
          >
            {playlists.map((pl) => (
              <option key={pl.id} value={pl.id} className="bg-slate-900 text-slate-200">
                {pl.name} ({pl.channels.length} ch)
              </option>
            ))}
          </select>
          <button
            onClick={onOpenPlaylistModal}
            className="ml-1 p-1 hover:bg-slate-700 rounded-lg text-cyan-400 transition-colors"
            title="Add Custom Playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleEPG}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isEPGOpen
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>EPG Guide</span>
          </button>

          <button
            onClick={onToggleStats}
            className={`p-2 rounded-xl text-xs font-semibold transition-all ${
              isStatsOpen
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
            }`}
            title="Stream Diagnostics & Stats"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
