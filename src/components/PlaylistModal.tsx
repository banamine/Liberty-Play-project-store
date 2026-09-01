import React, { useState } from 'react';
import { X, Link as LinkIcon, Upload, Plus, AlertCircle } from 'lucide-react';
import { Playlist } from '../types';
import { parseM3U } from '../utils/m3uParser';

interface PlaylistModalProps {
  onClose: () => void;
  onAddPlaylist: (playlist: Playlist) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({ onClose, onAddPlaylist }) => {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!playlistName) {
      setPlaylistName(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setFileContent(content);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to read uploaded file.');
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) {
      setError('Please provide a playlist name.');
      return;
    }

    if (activeTab === 'url') {
      if (!playlistUrl.trim()) {
        setError('Please enter a valid M3U playlist URL.');
        return;
      }

      // Fetch M3U URL or create a playlist with a sample channel pointing to that URL
      // In web apps, direct fetch might fail due to CORS, so we parse or add directly
      const newPlaylist: Playlist = {
        id: `custom-pl-${Date.now()}`,
        name: playlistName,
        url: playlistUrl,
        isCustom: true,
        channels: [
          {
            id: `ch-custom-${Date.now()}`,
            name: `${playlistName} Stream`,
            url: playlistUrl,
            group: 'Custom Playlist',
          }
        ]
      };
      onAddPlaylist(newPlaylist);
      onClose();
    } else {
      if (!fileContent.trim()) {
        setError('Please upload a valid M3U file.');
        return;
      }

      const parsedChannels = parseM3U(fileContent);
      if (parsedChannels.length === 0) {
        setError('No valid #EXTINF streams found in the uploaded file.');
        return;
      }

      const newPlaylist: Playlist = {
        id: `custom-pl-${Date.now()}`,
        name: playlistName,
        isCustom: true,
        channels: parsedChannels,
      };
      onAddPlaylist(newPlaylist);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <h3 className="text-white font-bold text-lg">Add M3U Playlist</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Playlist Name
            </label>
            <input
              type="text"
              placeholder="e.g., Sports & Cinema HD"
              value={playlistName || ''}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-in py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center justify-center gap-2 transition-all ${
                activeTab === 'url'
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>M3U Stream URL</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex-in py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center justify-center gap-2 transition-all ${
                activeTab === 'file'
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload M3U File</span>
            </button>
          </div>

          {activeTab === 'url' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                M3U8 / Stream URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/playlist.m3u8"
                value={playlistUrl || ''}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select .m3u or .m3u8 File
              </label>
              <input
                type="file"
                accept=".m3u,.m3u8,.txt"
                onChange={handleFileUpload}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
              />
              {fileContent && (
                <p className="text-xs text-emerald-400 mt-2 font-medium">
                  ✓ File loaded successfully ({parseM3U(fileContent).length} channels detected)
                </p>
              )}
            </div>
          )}

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Import Playlist</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
