export interface Channel {
  id: string;
  name: string;
  url: string;
  group: string;
  logo?: string;
  tvgId?: string;
  tvgName?: string;
  isFavorite?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  url?: string;
  channels: Channel[];
  isCustom?: boolean;
}

export interface EPGProgram {
  id: string;
  channelId: string;
  title: string;
  description: string;
  startTime: string; // ISO or HH:mm
  endTime: string;
  durationMinutes: number;
  category?: string;
}

export interface StreamStats {
  resolution: string;
  fps: number;
  bitrateKbps: number;
  bufferLength: number;
  droppedFrames: number;
}
