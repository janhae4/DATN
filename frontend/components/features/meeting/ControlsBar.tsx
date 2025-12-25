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
  MonitorUp, 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ControlsBarProps {
  isMicOn: boolean;
  isCamOn: boolean;
  isTranscriptOn?: boolean;
  isScreenSharing?: boolean;    
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleTranscript?: () => void;
  onToggleScreenShare?: () => void;     
  onLeave: () => void;
  localVideoRef?: React.RefObject<HTMLVideoElement>;
} 

export const ControlsBar = ({ 
  isMicOn, 
  isCamOn, 
  isTranscriptOn = false, 
  isScreenSharing = false,
  onToggleMic, 
  onToggleCam, 
  onToggleTranscript,
  onToggleScreenShare,
  onLeave,
  localVideoRef
}: ControlsBarProps) => {
  // State to manage visibility
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle camera toggle with overlay
  const handleToggleCam = () => {
    onToggleCam();
    
    // If local video element exists, add/remove camera-off class
    if (localVideoRef?.current) {
      localVideoRef.current.classList.toggle('camera-off', !isCamOn);
    }
  };

  // Hook to listen for mouse movement events
  useEffect(() => {
    const handleMouseMove = () => {
      // When mouse moves -> Show controls
      setIsVisible(true);
      
      // Clear old timeout (if any) to reset the counter
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout: After 3 seconds of no movement -> Hide
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    // Attach event to window to catch all movements
    window.addEventListener('mousemove', handleMouseMove);
    
    // Cleanup when component unmounts
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const ControlButton = ({ 
    onClick, 
    isActive, 
    activeIcon: ActiveIcon, 
    inactiveIcon: InactiveIcon,
    label,
    variant = "ghost",
    className = "",
    activeColor = "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]", 
    inactiveColor = "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300", 
  }: any) => (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            className={`rounded-full w-12 h-12 transition-all duration-300 hover:scale-110 active:scale-95 border border-white/5 backdrop-blur-md ${
                isActive 
                ? activeColor 
                : inactiveColor
            } ${className}`}
            onClick={onClick}
          >
            {isActive ? <ActiveIcon size={20} strokeWidth={2} /> : <InactiveIcon size={20} strokeWidth={2} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="mb-3 px-3 py-1.5 text-xs font-medium rounded-full bg-neutral-900/90 text-white border-neutral-800 backdrop-blur-sm shadow-xl">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    // Fixed wrapper at the bottom, using CSS transition for smooth show/hide
    <div 
        className={`fixed bottom-8 left-0 right-0 flex items-center justify-center z-50 pointer-events-none transition-all duration-500 ease-in-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
    >
      
      {/* Main container: When hovered, KEEP it visible (prevent hiding) */}
      <div 
        className="pointer-events-auto flex items-center justify-center gap-4 p-2 px-6 rounded-full bg-neutral-900/40 backdrop-blur-md border border-white/10 shadow-2xl hover:bg-neutral-900/50 transition-all hover:border-white/20"
        onMouseEnter={() => {
            // When mouse is over the control bar -> Cancel hide timeout -> Always show
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setIsVisible(true);
        }}
        onMouseLeave={() => {
            // When mouse leaves the control bar -> Start countdown to hide
            timeoutRef.current = setTimeout(() => {
                setIsVisible(false);
            }, 3000);
        }}
      >
        
        <ControlButton
          onClick={onToggleMic}
          isActive={isMicOn}
          activeIcon={Mic}
          inactiveIcon={MicOff}
          label={isMicOn ? "Mute Mic" : "Unmute Mic"}
          activeColor="bg-white/10 hover:bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]"
        />

        <ControlButton
          onClick={handleToggleCam}
          isActive={isCamOn}
          activeIcon={Video}
          inactiveIcon={VideoOff}
          label={isCamOn ? "Turn Off Camera" : "Turn On Camera"}
          activeColor="bg-white/10 hover:bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]"
        />

        {onToggleTranscript && (
          <ControlButton
            onClick={onToggleTranscript}
            isActive={isTranscriptOn}
            activeIcon={FileText}
            inactiveIcon={FileText}
            label={isTranscriptOn ? "Hide Transcript" : "Show Transcript"}
            activeColor="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
            inactiveColor="bg-transparent text-muted-foreground hover:text-white hover:bg-white/5 border-transparent hover:border-white/5"
          />
        )}

        {onToggleScreenShare && (
           <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full w-12 h-12 transition-all duration-300 hover:scale-110 active:scale-95 border border-white/5 backdrop-blur-md ${
                      isScreenSharing 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                      : 'bg-transparent text-muted-foreground hover:text-green-400 hover:bg-white/5 border-transparent hover:border-white/5'
                  }`}
                  onClick={onToggleScreenShare}
                >
                  <ScreenShare size={20} strokeWidth={2} className={isScreenSharing ? "animate-pulse" : ""} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="mb-3 px-3 py-1.5 text-xs font-medium rounded-full bg-neutral-900/90 text-white border-neutral-800 backdrop-blur-sm shadow-xl">
                <p>{isScreenSharing ? "Stop Sharing" : "Share Screen"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <div className="w-px h-8 bg-white/10 mx-1" />

        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full w-14 h-14 shadow-lg shadow-red-900/20 transition-all duration-300 hover:scale-110 active:scale-95 border border-white/5 hover:border-red-500/30 hover:shadow-red-600/30"
                onClick={onLeave}
              >
                <PhoneOff size={24} strokeWidth={2.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="mb-3 px-3 py-1.5 text-xs font-medium rounded-full  backdrop-blur-sm shadow-xl">
              <p>Leave</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

      </div>
    </div>
  );
};