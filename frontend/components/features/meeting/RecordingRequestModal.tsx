'use client';

import React from 'react';
import { Circle, Video, X, Check } from 'lucide-react';

interface RecordingRequest {
    recordingId: string;
    requestedBy: string;
    requestedName: string;
    roomId: string;
}

interface RecordingRequestModalProps {
    request: RecordingRequest | null;
    onApprove: (recordingId: string, requestedBy: string) => void;
    onReject: (recordingId: string, requestedBy: string) => void;
    /** If false, the modal is visible but user cannot approve/reject (non-privileged) */
    canRespond?: boolean;
}

export function RecordingRequestModal({
    request,
    onApprove,
    onReject,
    canRespond = true,
}: RecordingRequestModalProps) {
    if (!request || !canRespond) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-6 pointer-events-none">
            <div className="pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="relative bg-neutral-900/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 p-5 w-[360px]">

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex-shrink-0 w-10 h-10 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                            <Circle size={16} className="text-red-400 fill-red-400 animate-pulse" />
                            <span className="absolute inset-0 rounded-full border border-red-500/30 animate-ping" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Recording Request</h3>
                            <p className="text-xs text-neutral-400">Someone wants to record this meeting</p>
                        </div>
                    </div>

                    {/* Request info */}
                    <div className="bg-white/5 rounded-xl px-4 py-3 mb-4 border border-white/5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                                <Video size={14} className="text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs text-neutral-500">Requested by</p>
                                <p className="text-sm font-semibold text-white">{request.requestedName}</p>
                            </div>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2 pt-2 border-t border-white/5">
                            The recording will be saved to meeting history once it ends.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => onReject(request.recordingId, request.requestedBy)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-neutral-300 hover:text-white text-sm font-medium transition-all duration-200 active:scale-95"
                        >
                            <X size={14} />
                            Decline
                        </button>
                        <button
                            onClick={() => onApprove(request.recordingId, request.requestedBy)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 hover:border-red-500/40 text-red-400 hover:text-red-300 text-sm font-semibold transition-all duration-200 active:scale-95 shadow-lg shadow-red-500/10"
                        >
                            <Check size={14} />
                            Allow Recording
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
