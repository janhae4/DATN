import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// 1. Type Definitions
export interface TranscriptMessage {
  id: string;
  userId: string;
  userName?: string;
  content: string;
  timestamp: string;
}

interface TranscriptPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: TranscriptMessage[];
}

// 2. Main Component
export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ 
  isOpen, 
  onClose, 
  messages 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full flex flex-col bg-neutral-900 border-l border-neutral-800 shrink-0">
      
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <h3 className="text-sm font-medium text-neutral-200 tracking-wide">
          Transcript
        </h3>
        <button 
          onClick={onClose}
          className="text-neutral-500 hover:text-white transition-colors duration-200"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content Area */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-sm font-light">
            <span>No activity yet.</span>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Meta Data */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">
                  {msg.userName || 'Unknown User'}
                </span>
                <span className="text-[10px] text-neutral-600 font-mono">
                  {msg.timestamp}
                </span>
              </div>
              
              {/* Content - No bubble, just clean text */}
              <p className="text-sm text-neutral-400 leading-relaxed font-light">
                {msg.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};