import React, { useState, useMemo } from 'react';
import { Search, Star, Play, Radio, Filter, Folder, Globe, Tv } from 'lucide-react';
import { Channel } from '../types';

interface SidebarProps {
  channels: Channel[];
  activeChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  channels,
  activeChannel,
  onSelectChannel,
  onToggleFavorite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Extract unique groups
  const groups = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => set.add(c.group || 'General'));
    return ['All', ...Array.from(set)];
  }, [channels]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.group.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = selectedGroup === 'All' || c.group === selectedGroup;
      const matchesFav = !showFavoritesOnly || c.isFavorite;
      return matchesSearch && matchesGroup && matchesFav;
    });
  }, [channels, searchTerm, selectedGroup, showFavoritesOnly]);

  return (
    <aside className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col h-full select-none">
      {/* Search Bar */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/50">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search channels & genres..."
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs / Favorites Toggle */}
      <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            showFavoritesOnly
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>Favorites</span>
        </button>

        <div className="text-xs text-slate-400 font-medium px-2">
          {filteredChannels.length} channels
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-3 py-2 border-b border-slate-800/60 overflow-x-auto flex space-x-1.5 scrollbar-thin scrollbar-thumb-slate-700">
        {groups.map((group) => (
          <button
            key={group}
            onClick={() => setSelectedGroup(group)}
            className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedGroup === group
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredChannels.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-500 text-sm">
            No matching channels found. Try adjusting your search or category filter.
          </div>
        ) : (
          filteredChannels.map((channel) => {
            const isActive = activeChannel?.id === channel.id;
            return (
              <div
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-white shadow-md'
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    {channel.logo ? (
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          // Fallback on image error
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Tv className="w-4 h-4 text-slate-500" />
                    )}
                    {isActive && (
                      <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center backdrop-blur-[1px]">
                        <Play className="w-4 h-4 text-cyan-400 fill-cyan-400 animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-cyan-400 font-semibold' : 'text-slate-200'}`}>
                      {channel.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{channel.group}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(channel.id);
                    }}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${channel.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
