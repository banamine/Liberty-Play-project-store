import React from 'react';
import { X, Activity, Cpu, Wifi, HardDrive, Shield } from 'lucide-react';
import { StreamStats, Channel } from '../types';

interface StreamStatsDrawerProps {
  stats: StreamStats | null;
  activeChannel: Channel | null;
  onClose: () => void;
}

export const StreamStatsDrawer: React.FC<StreamStatsDrawerProps> = ({ stats, activeChannel, onClose }) => {
  return (
    <div className="absolute top-16 right-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-b border-slate-800 z-20 p-5 shadow-2xl select-none animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-white font-bold text-sm">Stream Diagnostics</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Active Channel</p>
          <p className="text-sm font-bold text-white truncate">{activeChannel?.name || 'None'}</p>
          <p className="text-xs text-cyan-400 truncate">{activeChannel?.url || ''}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Resolution</span>
            </div>
            <p className="text-sm font-bold text-white">{stats?.resolution || '1280x720'}</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bitrate</span>
            </div>
            <p className="text-sm font-bold text-white">{stats?.bitrateKbps || 3500} kbps</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>Buffer</span>
            </div>
            <p className="text-sm font-bold text-white">{stats?.bufferLength || 2.4}s</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Frame Drop</span>
            </div>
            <p className="text-sm font-bold text-white">{stats?.droppedFrames || 0} frames</p>
          </div>
        </div>

        <div className="pt-2">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-slate-300">
            <span className="font-bold text-cyan-400">Liberty Play Engine:</span> HLS.js adaptive bitrate streaming active with low-latency segment caching.
          </div>
        </div>
      </div>
    </div>
  );
};
