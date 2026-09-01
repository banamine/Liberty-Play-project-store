/**
 * FIXED: BroadcastTVGuide Component
 *
 * Fixes:
 * ✅ React.memo on program cells - prevents unnecessary re-renders
 * ✅ react-window virtualization for 5,100+ channels
 * ✅ Throttled timeline updates - prevents main-thread lockup
 * ✅ Strict TypeScript interfaces - no 'any' types
 * ✅ Memoized callbacks to prevent child re-renders
 */

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
// @ts-ignore
import { FixedSizeList as List } from 'react-window';
import { throttle } from 'lodash-es';

/**
 * ============================================================================
 * TYPES - Strict interfaces instead of 'any'
 * ============================================================================
 */
interface Program {
  id: string;
  title: string;
  startTime: number; // Unix timestamp
  endTime: number;
  channel: string;
  description?: string;
  isLive?: boolean;
  isNow?: boolean;
}

interface Channel {
  id: string;
  name: string;
  number: number;
  programs: Program[];
}

interface TimeSlot {
  hour: number;
  label: string;
}

interface BroadcastTVGuideProps {
  channels: Channel[];
  currentTime?: number;
  onProgramClick?: (program: Program) => void;
  onChannelClick?: (channel: Channel) => void;
  timeWindowMinutes?: number; // How many minutes to show
}

interface RowData {
  channel: Channel;
  channels: Channel[];
  timeSlots: TimeSlot[];
  currentTime: number;
  onProgramClick: (program: Program) => void;
  getRowHeight: (index: number) => number;
  timeWindowMinutes: number;
}

/**
 * ============================================================================
 * MEMOIZED PROGRAM CELL - Core performance optimization
 * ============================================================================
 */
interface ProgramCellProps {
  program: Program;
  timeSlotStart: number;
  timeSlotEnd: number;
  currentTime: number;
}

const ProgramCell = React.memo<ProgramCellProps>(
  ({ program, timeSlotStart, timeSlotEnd, currentTime }) => {
    const isInTimeSlot =
      program.startTime < timeSlotEnd && program.endTime > timeSlotStart;

    if (!isInTimeSlot) {
      return <div className="program-cell empty" />;
    }

    const isLive = currentTime >= program.startTime && currentTime < program.endTime;
    const percentStart = Math.max(
      0,
      ((program.startTime - timeSlotStart) / (timeSlotEnd - timeSlotStart)) * 100
    );
    const percentWidth = Math.min(
      100,
      ((program.endTime - program.startTime) / (timeSlotEnd - timeSlotStart)) * 100
    );

    return (
      <div
        className={`program-cell ${isLive ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200' : 'bg-slate-800/80 border-slate-700 text-slate-300'} p-2 rounded-lg border text-xs truncate transition-colors cursor-pointer hover:bg-cyan-500/30`}
        style={{
          left: `${percentStart}%`,
          width: `${percentWidth}%`,
          position: 'absolute',
          height: '44px',
        }}
        title={program.title}
      >
        <div className="font-medium truncate">{program.title}</div>
        {program.isLive && <span className="text-[10px] bg-red-500 text-white px-1 rounded font-bold">LIVE</span>}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.program.id === nextProps.program.id &&
      prevProps.currentTime === nextProps.currentTime &&
      prevProps.timeSlotStart === nextProps.timeSlotStart &&
      prevProps.timeSlotEnd === nextProps.timeSlotEnd
    );
  }
);

ProgramCell.displayName = 'ProgramCell';

/**
 * ============================================================================
 * TIME SLOT HEADER - Memoized to prevent re-renders
 * ============================================================================
 */
interface TimeSlotHeaderProps {
  timeSlots: TimeSlot[];
  currentTime: number;
}

const TimeSlotHeader = React.memo<TimeSlotHeaderProps>(
  ({ timeSlots, currentTime }) => (
    <div className="flex bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-400 py-2">
      <div className="w-48 px-4 flex items-center border-r border-slate-800 shrink-0">Channel</div>
      <div className="flex-1 flex relative">
        {timeSlots.map((slot) => (
          <div
            key={slot.label}
            className={`flex-1 text-center border-r border-slate-800/60 py-1 ${
              currentTime >= slot.hour * 3600000 &&
              currentTime < (slot.hour + 1) * 3600000
                ? 'text-cyan-400 bg-cyan-500/10 font-bold'
                : ''
            }`}
          >
            {slot.label}
          </div>
        ))}
      </div>
    </div>
  )
);

TimeSlotHeader.displayName = 'TimeSlotHeader';

/**
 * ============================================================================
 * CHANNEL ROW - Virtualized row component for react-window
 * ============================================================================
 */
interface ChannelRowProps {
  index: number;
  style: React.CSSProperties;
  data: RowData;
}

const ChannelRow = React.memo<ChannelRowProps>(
  ({ index, style, data }) => {
    const channel = data.channels[index] || data.channel;
    if (!channel) return null;

    const timeSlotStart = data.currentTime;
    const timeSlotEnd = timeSlotStart + (data.timeWindowMinutes * 60000);

    return (
      <div
        style={style}
        className="flex items-center border-b border-slate-800/60 bg-slate-950/60 hover:bg-slate-900/60 transition-colors"
      >
        <div className="w-48 px-4 flex items-center space-x-3 border-r border-slate-800 shrink-0 overflow-hidden">
          <span className="w-6 text-xs text-slate-500 font-mono">{channel.number}</span>
          <span className="text-sm font-medium text-slate-200 truncate">{channel.name}</span>
        </div>
        <div className="flex-1 relative h-full flex items-center px-2">
          {channel.programs?.map((program) => (
            <ProgramCell
              key={program.id}
              program={program}
              timeSlotStart={timeSlotStart}
              timeSlotEnd={timeSlotEnd}
              currentTime={data.currentTime}
            />
          ))}
          {(!channel.programs || channel.programs.length === 0) && (
            <span className="text-xs text-slate-500 italic pl-2">No program schedule available</span>
          )}
        </div>
      </div>
    );
  }
);

ChannelRow.displayName = 'ChannelRow';

/**
 * ============================================================================
 * MAIN COMPONENT - BroadcastTVGuide
 * ============================================================================
 */
export const BroadcastTVGuide: React.FC<BroadcastTVGuideProps> = ({
  channels,
  currentTime: propCurrentTime,
  onProgramClick = (_prog: Program) => {},
  onChannelClick = (_chan: Channel) => {},
  timeWindowMinutes = 240, // 4 hours default
}) => {
  const listRef = useRef<List>(null);
  const [currentTime, setCurrentTime] = useState(propCurrentTime || Date.now());

  // ============================================================================
  // THROTTLED TIME UPDATE - Prevents re-renders every millisecond
  // ============================================================================
  const throttledUpdateTime = useMemo(
    () =>
      throttle(() => {
        setCurrentTime(Date.now());
      }, 1000),
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      throttledUpdateTime();
    }, 1000);

    return () => {
      clearInterval(interval);
      throttledUpdateTime.cancel();
    };
  }, [throttledUpdateTime]);

  // ============================================================================
  // MEMOIZED TIME SLOTS CALCULATION
  // ============================================================================
  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = [];
    const startHour = Math.floor(currentTime / 3600000) * 3600000;

    for (let i = 0; i < timeWindowMinutes; i += 60) {
      const slotTime = startHour + (i * 60000);
      const hour = new Date(slotTime).getHours();
      slots.push({
        hour: hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
      });
    }

    return slots;
  }, [currentTime, timeWindowMinutes]);

  const handleProgramClick = useCallback(
    (program: Program) => {
      onProgramClick(program);
    },
    [onProgramClick]
  );

  const getRowHeight = useCallback(() => {
    return 64; // fixed row height for virtualization
  }, []);

  const rowData: RowData = useMemo(
    () => ({
      channel: channels[0] || ({} as Channel),
      channels: channels,
      timeSlots,
      currentTime,
      onProgramClick: handleProgramClick,
      getRowHeight,
      timeWindowMinutes,
    }),
    [channels, timeSlots, currentTime, handleProgramClick, getRowHeight, timeWindowMinutes]
  );

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 select-none">
      <TimeSlotHeader timeSlots={timeSlots} currentTime={currentTime} />

      <div className="flex-1 w-full relative overflow-hidden">
        <List
          ref={listRef}
          width={1200}
          height={600}
          itemCount={channels.length}
          itemSize={getRowHeight}
          itemData={rowData}
          style={{ width: '100%', height: '100%' }}
        >
          {ChannelRow}
        </List>
      </div>

      <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
        <span>Showing {channels.length} broadcast channels (Virtualized EPG Grid)</span>
        <span className="font-mono text-cyan-400">{new Date(currentTime).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
