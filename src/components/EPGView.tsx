import React from 'react';
import { Radio, Clock, Play, Tv } from 'lucide-react';
import { Channel } from '../types';
import { MOCK_EPG_DATABASE } from '../data/defaultPlaylists';

interface EPGViewProps {
  channels: Channel[];
  activeChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onClose: () => void;
}

export const EPGView: React.FC<EPGViewProps> = ({ channels, activeChannel, onSelectChannel, onClose }) => {
  const hours = ['10:00', '11:00', '12:00', '13:00', '14:00'];

  return (
    <div className="absolute inset-x-0 bottom-0 top-16 bg-slate-950/95 backdrop-blur-xl z-20 flex flex-col border-t border-slate-800 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* EPG Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Electronic Program Guide (EPG)</h2>
            <p className="text-xs text-slate-400">Live timeline matrix & broadcast schedules</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          Close EPG
        </button>
      </div>

      {/* Timeline Header */}
      <div className="grid grid-cols-6 bg-slate-950 border-b border-slate-800 text-xs font-semibold text-slate-400 py-2.5 px-4">
        <div>Channel</div>
        <div className="col-span-5 grid grid-cols-3 text-center">
          {hours.map((h, i) => (
            <div key={h} className={`flex items-center justify-center gap-1.5 ${i === 0 ? 'text-cyan-400 font-bold' : ''}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{h}</span>
              {i === 0 && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
            </div>
          ))}
        </div>
      </div>

      {/* Channels Matrix */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
        {channels.map((channel) => {
          const programs = MOCK_EPG_DATABASE[channel.tvgId || ''] || [
            { title: `${channel.name} - 24/7 Live Broadcast Feed`, desc: 'Continuous high-definition IPTV transmission stream.', time: '10:00 - 15:00', duration: 300 }
          ];

          return (
            <div key={channel.id} className="grid grid-cols-6 items-center px-4 py-3 hover:bg-slate-900/50 transition-colors">
              {/* Channel Info */}
              <div
                onClick={() => {
                  onSelectChannel(channel);
                  onClose();
                }}
                className="flex items-center space-x-3 cursor-pointer group pr-4"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {channel.logo ? (
                    <img src={channel.logo} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Tv className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                    {channel.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{channel.group}</p>
                </div>
              </div>

              {/* Program Slots */}
              <div className="col-span-5 grid grid-cols-3 gap-3">
                {programs.map((prog, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onSelectChannel(channel);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      idx === 0
                        ? 'bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-400 text-white shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{prog.time}</span>
                      {idx === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-extrabold">LIVE</span>}
                    </div>
                    <p className="text-xs font-semibold truncate mb-1">{prog.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{prog.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
