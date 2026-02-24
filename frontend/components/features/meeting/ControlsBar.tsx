'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  FileText,
  ScreenShare,
  MessageSquare,
  Circle,
  MoreHorizontal,
  X,
  StopCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { useRecording } from '@/hooks/useRecording';

type RecordingHook = ReturnType<typeof useRecording>;

interface ControlsBarProps {
  isMicOn: boolean;
  isCamOn: boolean;
  isTranscriptOn?: boolean;
  isScreenSharing?: boolean;
  isChatOn?: boolean;
  isAISummaryOpen?: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleTranscript?: () => void;
  onToggleScreenShare?: () => void;
  onToggleChat?: () => void;
  onToggleAISummary?: () => void;
  onLeave: () => void;
  localVideoRef?: React.RefObject<HTMLVideoElement>;
  recording?: RecordingHook;
  canRecordDirectly?: boolean;
  isRoomRecording?: boolean;
  onStopRoomRecording?: () => void;
}

// ── Reusable icon button ──────────────────────────────────────────────
const CtrlBtn = ({
  onClick,
  isActive,
  activeIcon: ActiveIcon,
  inactiveIcon: InactiveIcon,
  label,
  activeColor = 'bg-white/10 hover:bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]',
  inactiveColor = 'bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300',
  size = 'md' as 'md' | 'lg',
  badge = null as string | null,
}: {
  onClick: () => void;
  isActive: boolean;
  activeIcon: React.ElementType;
  inactiveIcon: React.ElementType;
  label: string;
  activeColor?: string;
  inactiveColor?: string;
  size?: 'md' | 'lg';
  badge?: string | null;
}) => {
  const dim = size === 'lg' ? 'w-14 h-14' : 'w-12 h-12';
  const iconSize = size === 'lg' ? 24 : 20;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className={`relative rounded-full ${dim} transition-all duration-300 hover:scale-110 active:scale-95 border border-white/5 backdrop-blur-md ${isActive ? activeColor : inactiveColor
                }`}
              onClick={onClick}
            >
              {isActive
                ? <ActiveIcon size={iconSize} strokeWidth={2} />
                : <InactiveIcon size={iconSize} strokeWidth={2} />}
            </Button>

            {badge && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-lg shadow-red-500/30 animate-pulse z-10">
                {badge}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="mb-3 px-3 py-1.5 text-xs font-medium rounded-full bg-neutral-900/90 text-white border-neutral-800 backdrop-blur-sm shadow-xl"
        >
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ── Menu item inside More panel ───────────────────────────────────────
const MenuItem = ({
  onClick,
  isActive,
  icon: Icon,
  label,
  description,
  activeColor = 'text-white bg-white/10',
  badge,
  disabled = false,
}: {
  onClick: () => void;
  isActive: boolean;
  icon: React.ElementType;
  label: string;
  description: string;
  activeColor?: string;
  badge?: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 group
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5 active:scale-[0.98]'}
      ${isActive && !disabled ? 'bg-white/5' : ''}
    `}
  >
    <div
      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 ${isActive && !disabled
        ? `${activeColor} border-white/10`
        : 'bg-transparent text-neutral-400 border-white/5 group-hover:text-white group-hover:bg-white/5'
        }`}
    >
      <Icon size={16} strokeWidth={2} />
    </div>
    <div className="flex-1 text-left">
      <div className={`text-sm font-medium flex items-center gap-2 ${isActive && !disabled ? 'text-white' : 'text-neutral-300'}`}>
        {label}
        {badge && (
          <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">
            {badge}
          </span>
        )}
      </div>
      <div className="text-xs text-neutral-500">{description}</div>
    </div>
    <div className={`w-1.5 h-1.5 rounded-full transition-all ${isActive && !disabled ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-transparent'}`} />
  </button>
);

// ── Main Component ────────────────────────────────────────────────────
export const ControlsBar = ({
  isMicOn,
  isCamOn,
  isTranscriptOn = false,
  isScreenSharing = false,
  isChatOn = false,
  isAISummaryOpen = false,
  onToggleMic,
  onToggleCam,
  onToggleTranscript,
  onToggleScreenShare,
  onToggleChat,
  onToggleAISummary,
  onLeave,
  localVideoRef,
  recording,
  canRecordDirectly = false,
  isRoomRecording = false,
  onStopRoomRecording,
}: ControlsBarProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Auto-hide controls
  useEffect(() => {
    const resetTimer = () => {
      setIsVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (!showMore) setIsVisible(false);
      }, 3000);
    };
    window.addEventListener('mousemove', resetTimer);
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [showMore]);

  // Close "More" on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    if (showMore) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMore]);

  const handleToggleCam = () => {
    onToggleCam();
  };

  // Recording action – delegates to hook which decides based on role
  const handleRecordingAction = () => {
    if (!recording) return;
    if (recording.state === 'recording') {
      recording.stopRecording();
    } else {
      recording.triggerRecording();
    }
  };

  const getRecordingLabel = () => {
    if (!recording) return canRecordDirectly ? 'Start Recording' : 'Request Recording';
    switch (recording.state) {
      case 'requesting': return 'Cancel Request';
      case 'recording': return `Stop Recording – ${recording.formattedDuration}`;
      case 'uploading': return 'Saving...';
      case 'completed': return 'Recording Saved!';
      default: return canRecordDirectly ? 'Start Recording' : 'Request Recording';
    }
  };

  const getRecordingDescription = () => {
    if (!recording) return canRecordDirectly ? 'Start immediately, no approval needed' : 'Requires host/admin approval';
    switch (recording.state) {
      case 'requesting': return 'Waiting for host/admin approval...';
      case 'recording': return `In progress – ${recording.formattedDuration}`;
      case 'uploading': return 'Uploading to cloud storage...';
      case 'completed': return 'Saved to Meeting History';
      default: return canRecordDirectly ? 'You can start recording directly' : 'Send a request to the host';
    }
  };

  const getRecordingIcon = () => {
    if (!recording) return Circle;
    if (recording.state === 'recording') return StopCircle;
    if (recording.state === 'uploading') return Loader2;
    if (recording.state === 'completed') return CheckCircle2;
    return Circle;
  };

  // Count active "more" features for badge on More button
  const moreActiveCount = [
    isTranscriptOn,
    isChatOn,
    isScreenSharing,
    recording?.isRecording,
    recording?.isRequesting,
  ].filter(Boolean).length;

  return (
    <div
      className={`absolute bottom-8 left-0 right-0 flex items-end justify-center z-50 pointer-events-none transition-all duration-500 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
    >
      {/* ── More Panel (popup above bar) ── */}
      <div
        ref={moreRef}
        className={`absolute bottom-full mb-3 pointer-events-auto transition-all duration-300 ease-out ${showMore
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
          }`}
      >
        <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-2 w-72">
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">More options</span>
            <button
              onClick={() => setShowMore(false)}
              className="w-5 h-5 flex items-center justify-center rounded-full text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={12} />
            </button>
          </div>

          <div className="h-px bg-white/5 mx-2 mb-1" />

          <div className="flex flex-col gap-0.5">
            {onToggleScreenShare && (
              <MenuItem
                onClick={onToggleScreenShare}
                isActive={isScreenSharing}
                icon={ScreenShare}
                label="Share Screen"
                description={isScreenSharing ? 'Currently sharing' : 'Share your screen'}
                activeColor="text-emerald-400 bg-emerald-500/10"
              />
            )}

            {onToggleChat && (
              <MenuItem
                onClick={onToggleChat}
                isActive={isChatOn}
                icon={MessageSquare}
                label="Chat"
                description={isChatOn ? 'Hide chat panel' : 'Open chat'}
                activeColor="text-purple-400 bg-purple-500/10"
              />
            )}

            {onToggleTranscript && (
              <MenuItem
                onClick={onToggleTranscript}
                isActive={isTranscriptOn}
                icon={FileText}
                label="Transcript"
                description={isTranscriptOn ? 'Hide transcript' : 'Show live transcript'}
                activeColor="text-blue-400 bg-blue-500/10"
              />
            )}

            {onToggleAISummary && (
              <MenuItem
                onClick={onToggleAISummary}
                isActive={isAISummaryOpen}
                icon={Sparkles}
                label="AI Summary"
                description={isAISummaryOpen ? 'Hide AI Summary & Tasks' : 'Show AI Summary & Tasks'}
                activeColor="text-amber-400 bg-amber-500/10"
              />
            )}

            {/* Divider before recording */}
            <div className="h-px bg-white/5 mx-2 my-1" />

            {/* Recording Item */}
            <MenuItem
              onClick={handleRecordingAction}
              isActive={recording?.isRecording || recording?.isRequesting || false}
              icon={getRecordingIcon()}
              label={
                recording?.state === 'recording' && !canRecordDirectly
                  ? `Recording in progress (${recording.formattedDuration})`
                  : getRecordingLabel()
              }
              description={
                recording?.state === 'recording' && !canRecordDirectly
                  ? 'Only Host or Team Admin can stop this recording'
                  : getRecordingDescription()
              }
              activeColor="text-red-400 bg-red-500/10"
              badge={recording?.isRecording ? recording.formattedDuration : undefined}
              disabled={
                recording?.state === 'uploading' ||
                recording?.state === 'completed' ||
                (recording?.state === 'recording' && !canRecordDirectly)
              }
            />
          </div>
        </div>
      </div>

      {/* ── Main Controls Bar ── */}
      <div
        className="pointer-events-auto flex items-center justify-center gap-3 px-5 py-2.5 rounded-full bg-neutral-900/50 backdrop-blur-md border border-white/10 shadow-2xl hover:bg-neutral-900/60 transition-all hover:border-white/15"
        onMouseEnter={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setIsVisible(true);
        }}
        onMouseLeave={() => {
          if (!showMore) {
            timeoutRef.current = setTimeout(() => setIsVisible(false), 3000);
          }
        }}
      >
        {/* Mic */}
        <CtrlBtn
          onClick={onToggleMic}
          isActive={isMicOn}
          activeIcon={Mic}
          inactiveIcon={MicOff}
          label={isMicOn ? 'Mute' : 'Unmute'}
          activeColor="bg-white/10 hover:bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]"
        />

        {/* Camera */}
        <CtrlBtn
          onClick={handleToggleCam}
          isActive={isCamOn}
          activeIcon={Video}
          inactiveIcon={VideoOff}
          label={isCamOn ? 'Turn Off Camera' : 'Turn On Camera'}
          activeColor="bg-white/10 hover:bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]"
        />

        {/* Separator */}
        <div className="w-px h-7 bg-white/10" />

        {/* More Button */}
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full w-12 h-12 transition-all duration-300 hover:scale-110 active:scale-95 border backdrop-blur-md ${showMore || moreActiveCount > 0
                    ? 'bg-white/10 text-white border-white/15 shadow-[0_0_10px_rgba(255,255,255,0.08)]'
                    : 'bg-transparent text-neutral-400 hover:text-white hover:bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  onClick={() => setShowMore(prev => !prev)}
                >
                  <MoreHorizontal size={20} strokeWidth={2} />
                </Button>

                {moreActiveCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-neutral-900 shadow shadow-indigo-500/40 z-10">
                    {moreActiveCount}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="mb-3 px-3 py-1.5 text-xs font-medium rounded-full bg-neutral-900/90 text-white border-neutral-800 backdrop-blur-sm shadow-xl"
            >
              <p>More options</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Separator */}
        <div className="w-px h-7 bg-white/10" />

        {/* ── Recording indicators ── */}

        {/* HOST/ADMIN only: recording icon to click-to-stop (no duration shown) */}
        {isRoomRecording && canRecordDirectly && (
          <button
            onClick={onStopRoomRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-semibold hover:bg-red-500/25 hover:text-red-300 transition-all duration-200 active:scale-95"
            title="Click to stop recording"
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            REC
          </button>
        )}

        {/* Waiting for approval (MEMBER who requested) */}
        {recording?.isRequesting && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <Loader2 size={10} className="animate-spin" />
            Waiting for approval...
          </div>
        )}

        {/* Uploading */}
        {recording?.isUploading && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Loader2 size={10} className="animate-spin" />
            Saving recording...
          </div>
        )}

        {/* Leave */}
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full w-14 h-14 shadow-lg shadow-red-900/20 transition-all duration-300 hover:scale-110 active:scale-95 border border-white/5 hover:border-red-500/30 hover:shadow-red-600/30"
                onClick={onLeave}
              >
                <PhoneOff size={22} strokeWidth={2.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="mb-3 px-3 py-1.5 text-xs font-medium rounded-full bg-neutral-900/90 text-white border-neutral-800 backdrop-blur-sm shadow-xl"
            >
              <p>Leave call</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};