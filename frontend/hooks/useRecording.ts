import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type RecordingState = 'idle' | 'requesting' | 'recording' | 'uploading' | 'completed' | 'error';

interface RecordingHook {
    state: RecordingState;
    recordingId: string | null;
    duration: number;
    formattedDuration: string;
    isRecording: boolean;
    isRequesting: boolean;
    isUploading: boolean;
    isCompleted: boolean;
    triggerRecording: () => void;
    approveRecording: (id: string) => void;
    rejectRecording: (id: string) => void;
    startRecording: (id: string) => Promise<void>;
    stopRecording: () => void;
    forceStop: () => void;
}

export const useRecording = (
    emitWS: (event: string, data: any) => void,
    roomId: string,
    canRecordDirectly: boolean
): RecordingHook => {
    const [state, setState] = useState<RecordingState>('idle');
    const [recordingId, setRecordingId] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const triggerRecording = useCallback(() => {
        if (state !== 'idle') return;
        if (canRecordDirectly) {
            emitWS('start_recording_direct', { roomId });
        } else {
            setState('requesting');
            emitWS('request_recording', { roomId });
        }
    }, [state, canRecordDirectly, emitWS, roomId]);

    const approveRecording = useCallback((id: string) => {
        emitWS('approve_recording', { recordingId: id, roomId });
    }, [emitWS, roomId]);

    const rejectRecording = useCallback((id: string) => {
        emitWS('reject_recording', { recordingId: id, roomId });
    }, [emitWS, roomId]);

    const startRecording = useCallback(async (recId: string) => {
        // In Server-side recording mode (LiveKit Egress), we don't capture locally.
        // We just update the state to reflect that the ROOM is being recorded.
        setState('recording');
        setRecordingId(recId);

        // Start duration timer
        if (timerRef.current) clearInterval(timerRef.current);
        setDuration(0);
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }, []);

    const stopRecording = useCallback(() => {
        const recId = recordingId;
        if (!recId) return;
        emitWS('stop_recording', { recordingId: recId, roomId });
    }, [recordingId, emitWS, roomId]);

    const forceStop = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setState('idle');
        setRecordingId(null);
        setDuration(0);
    }, []);

    const fmt = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return [h, m, sec].map(v => v.toString().padStart(2, '0')).join(':');
    };

    return {
        state,
        recordingId,
        duration,
        formattedDuration: fmt(duration),
        isRecording: state === 'recording',
        isRequesting: state === 'requesting',
        isUploading: state === 'uploading',
        isCompleted: state === 'completed',
        triggerRecording,
        approveRecording,
        rejectRecording,
        startRecording,
        stopRecording,
        forceStop,
    };
};
