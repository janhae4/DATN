import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    Room,
    RoomEvent,
    Participant,
    RemoteTrack,
    RemoteTrackPublication,
    LocalTrackPublication,
    RemoteParticipant,
    Track,
    VideoPresets
} from 'livekit-client';

const WS_URL = process.env.NEXT_PUBLIC_WEBRTC_WS_URL || 'ws://127.0.0.1:8005/ws';
// LiveKit URL (inside browser should use the public one, or localhost if testing)
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'http://127.0.0.1:7880';

interface WebSocketMessage {
    type: string;
    roomId?: string;
    userId?: string;
    payload?: any;
}

export interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: string;
    isPrivate?: boolean;
    targetUserId?: string;
    targetUserName?: string;
}

export interface SocketIOCompatible {
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback: (data: any) => void) => void;
    emit: (event: string, data: any) => void;
    connected: boolean;
    disconnect: () => void;
}

export const useWebRTC = (roomId: string, initialCallInfo?: any) => {
    const { user } = useAuth();
    const [socketWrapper, setSocketWrapper] = useState<SocketIOCompatible | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [remoteScreenStreams, setRemoteScreenStreams] = useState<Map<string, MediaStream>>(new Map());
    const [remoteTracks, setRemoteTracks] = useState<Map<string, Track[]>>(new Map());
    const [remoteScreenTracks, setRemoteScreenTracks] = useState<Map<string, Track[]>>(new Map());
    const [peerNames, setPeerNames] = useState<Map<string, string>>(new Map());
    const [peerMuteStates, setPeerMuteStates] = useState<Map<string, boolean>>(new Map());
    const [peerCamStates, setPeerCamStates] = useState<Map<string, boolean>>(new Map());
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);

    // Recording & Role states
    const [pendingRecordingRequest, setPendingRecordingRequest] = useState<{
        recordingId: string; requestedBy: string; requestedName: string; roomId: string;
    } | null>(null);
    const [approvedRecordingId, setApprovedRecordingId] = useState<string | null>(null);
    const [recordingStopped, setRecordingStopped] = useState(false);
    const [isRoomRecording, setIsRoomRecording] = useState(false);
    const [activeRoomRecordingId, setActiveRoomRecordingId] = useState<string | null>(null);
    const [myCallRole, setMyCallRole] = useState<'HOST' | 'ADMIN' | 'MEMBER' | 'BANNED'>('MEMBER');
    const [canRecordDirectly, setCanRecordDirectly] = useState(false);

    // Misc states
    const [toasts, setToasts] = useState<{ id: string; type: 'info' | 'success' | 'error' | 'recording'; message: string }[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

    const [aiSummaryStream, setAiSummaryStream] = useState<string>('');
    const [isSummaryStreaming, setIsSummaryStreaming] = useState(false);

    const [joinStatus, setJoinStatus] = useState<'joining' | 'joined' | 'pending' | 'denied' | 'password_required'>(() => {
        if (initialCallInfo?.hasPassword) {
            const isJoined = initialCallInfo.participants?.some(
                (p: any) => p.userId === user?.id && p.status === 'JOINED' && !p.leftAt
            );
            if (!isJoined) return 'password_required';
        }
        return 'joining';
    });
    const [knockingUsers, setKnockingUsers] = useState<{ userId: string, userName: string }[]>([]);
    const [joinErrorMessage, setJoinErrorMessage] = useState<string>('');
    const [isKicked, setIsKicked] = useState(false);
    const [kickedMessage, setKickedMessage] = useState<string | null>(null);

    // Refs
    const socketRef = useRef<WebSocket | null>(null);
    const listenersRef = useRef<Map<string, ((data: any) => void)[]>>(new Map());
    const roomRef = useRef<Room | null>(null);
    const isConnectingRef = useRef(false);

    const addToast = useCallback((type: 'info' | 'success' | 'error' | 'recording', message: string) => {
        const id = Date.now().toString() + Math.random();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const onEvent = useCallback((event: string, callback: (data: any) => void) => {
        if (!listenersRef.current.has(event)) listenersRef.current.set(event, []);
        listenersRef.current.get(event)?.push(callback);
    }, []);

    const offEvent = useCallback((event: string, callback: (data: any) => void) => {
        const callbacks = listenersRef.current.get(event);
        if (callbacks) listenersRef.current.set(event, callbacks.filter(cb => cb !== callback));
    }, []);

    const emitEvent = useCallback((event: string, data: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            const msg: WebSocketMessage = { type: event, roomId, payload: data };
            socketRef.current.send(JSON.stringify(msg));
        }
    }, [roomId]);

    const sendChatMessage = useCallback((content: string, targetUserId?: string) => {
        emitEvent('chat_message', { roomId, content, targetUserId });
    }, [emitEvent, roomId]);

    // --- Media Initialization for Preview ---
    const initLocalMedia = useCallback(async () => {
        if (localStream) return;

        let stream: MediaStream | null = null;
        let mic = false;
        let cam = false;

        try {
            // 1. Thử xin cả hai
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true, video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            mic = true;
            cam = true;
        } catch (err: any) {
            console.warn('⚠️ Both Mic+Cam failed, trying fallbacks...', err.name);

            // 2. Thử chỉ Video
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
                cam = true;
            } catch (vErr) {
                console.warn('⚠️ No Camera found');
            }

            // 3. Thử chỉ Audio (Nếu chưa có stream từ bước 2)
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mic = true;
                if (stream) {
                    audioStream.getTracks().forEach(t => stream?.addTrack(t));
                } else {
                    stream = audioStream;
                }
            } catch (aErr) {
                console.warn('⚠️ No Microphone found');
            }
        }

        if (stream) {
            setLocalStream(stream);
            setIsMicOn(mic);
            setIsCamOn(cam);
        } else {
            console.error('❌ No media devices found at all');
        }
    }, [localStream]);

    useEffect(() => {
        if (roomId && user) {
            initLocalMedia();
        }
    }, [roomId, user, initLocalMedia]);

    // Helper: Sync tracks to MediaStreams
    const syncRemoteStreams = useCallback((participant: Participant) => {
        const userId = participant.identity;

        // Skip local participant to avoid duplication in UI
        if (roomRef.current?.localParticipant.identity === userId) {
            return;
        }

        const publications = Array.from(participant.trackPublications.values());

        // Handling Camera
        const camPub = publications.find(p => p.source === Track.Source.Camera);
        if (camPub?.track && camPub.isSubscribed) {
            const stream = new MediaStream([camPub.track.mediaStreamTrack!]);
            setRemoteStreams(prev => new Map(prev).set(userId, stream));
            setRemoteTracks(prev => new Map(prev).set(userId, [camPub.track!]));
        } else {
            // Check if user has any audio tracks if camera is off
            const audioPubs = publications.filter(p => p.kind === 'audio' && p.track && p.isSubscribed);
            if (audioPubs.length > 0) {
                const lkAudioTracks = audioPubs.map(p => p.track!);
                const nativeTracks = lkAudioTracks.map(t => t.mediaStreamTrack!);
                setRemoteStreams(prev => new Map(prev).set(userId, new MediaStream(nativeTracks)));
                setRemoteTracks(prev => new Map(prev).set(userId, lkAudioTracks));
            } else {
                setRemoteStreams(prev => {
                    const m = new Map(prev); m.delete(userId); return m;
                });
                setRemoteTracks(prev => {
                    const m = new Map(prev); m.delete(userId); return m;
                });
            }
        }

        // Handling Screen Share
        const screenPub = publications.find(p => p.source === Track.Source.ScreenShare);
        if (screenPub?.track && screenPub.isSubscribed) {
            const stream = new MediaStream([screenPub.track.mediaStreamTrack!]);
            setRemoteScreenStreams(prev => new Map(prev).set(userId, stream));
            setRemoteScreenTracks(prev => new Map(prev).set(userId, [screenPub.track!]));
        } else {
            setRemoteScreenStreams(prev => {
                const m = new Map(prev); m.delete(userId); return m;
            });
            setRemoteScreenTracks(prev => {
                const m = new Map(prev); m.delete(userId); return m;
            });
        }

        setPeerNames(prev => new Map(prev).set(userId, participant.name || userId));
        setPeerMuteStates(prev => new Map(prev).set(userId, !participant.isMicrophoneEnabled));
        setPeerCamStates(prev => new Map(prev).set(userId, participant.isCameraEnabled));
    }, []);

    // Helper: Refresh local MediaStream
    const refreshLocalStream = useCallback(() => {
        const room = roomRef.current;
        if (!room) return;

        // Get native tracks
        const camTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track?.mediaStreamTrack;
        const screenTrack = room.localParticipant.getTrackPublication(Track.Source.ScreenShare)?.track?.mediaStreamTrack;
        const micTracks = Array.from(room.localParticipant.trackPublications.values())
            .filter(p => p.track?.kind === 'audio')
            .map(p => p.track?.mediaStreamTrack)
            .filter((t): t is MediaStreamTrack => !!t);

        // Update local camera stream with stabilization to avoid flickering
        setLocalStream(prev => {
            const newTracks = camTrack ? [camTrack, ...micTracks] : (micTracks.length > 0 ? micTracks : []);
            if (newTracks.length === 0) return null;

            if (prev) {
                const prevTracks = prev.getTracks();
                const isSame = prevTracks.length === newTracks.length &&
                    prevTracks.every((t, i) => t.id === newTracks[i].id);
                if (isSame) return prev; // Avoid setting new MediaStream object
            }
            return new MediaStream(newTracks);
        });

        // Update local screen share stream with stabilization
        setLocalScreenStream(prev => {
            if (!screenTrack) return null;
            if (prev && prev.getTracks().some(t => t.id === screenTrack.id)) return prev;
            return new MediaStream([screenTrack]);
        });
    }, []);

    // Connect to LiveKit Room
    const connectToLiveKit = useCallback(async (token: string) => {
        if (isConnectingRef.current) return;

        if (roomRef.current?.state === 'connected' || roomRef.current?.state === 'connecting') {
            return;
        }

        isConnectingRef.current = true;
        console.log('🚀 Connecting to LiveKit...');

        try {
            if (roomRef.current) {
                await roomRef.current.disconnect();
            }

            const room = new Room({
                adaptiveStream: true,
                dynacast: false,
                publishDefaults: {
                    simulcast: true,
                    videoEncoding: VideoPresets.h720.encoding,
                    videoSimulcastLayers: [
                        VideoPresets.h720,
                        VideoPresets.h360,
                        VideoPresets.h180,
                    ],
                },
                videoCaptureDefaults: {
                    resolution: VideoPresets.h720.resolution,
                }
            });
            roomRef.current = room;

            room
                .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
                    console.log(`✅ Subscribed to track from ${participant.identity}`);
                    syncRemoteStreams(participant);
                })
                .on(RoomEvent.TrackUnsubscribed, (track, pub, p) => syncRemoteStreams(p))
                .on(RoomEvent.TrackMuted, (pub, p) => {
                    if (p.isLocal) refreshLocalStream();
                    else syncRemoteStreams(p);
                })
                .on(RoomEvent.TrackUnmuted, (pub, p) => {
                    if (p.isLocal) refreshLocalStream();
                    else syncRemoteStreams(p);
                })
                .on(RoomEvent.ParticipantConnected, (p) => {
                    addToast('info', `${p.name || 'A user'} joined the call`);
                })
                .on(RoomEvent.ParticipantDisconnected, (p) => {
                    setRemoteStreams(prev => {
                        const m = new Map(prev);
                        m.delete(p.identity);
                        return m;
                    });
                    setRemoteTracks(prev => {
                        const m = new Map(prev);
                        m.delete(p.identity);
                        return m;
                    });
                    setPeerNames(prev => {
                        const m = new Map(prev);
                        m.delete(p.identity);
                        return m;
                    });
                })
                .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
                    if (speakers.length > 0) setActiveSpeakerId(speakers[0].identity);
                    else setActiveSpeakerId(null);
                })
                .on(RoomEvent.LocalTrackPublished, refreshLocalStream)
                .on(RoomEvent.LocalTrackUnpublished, refreshLocalStream);

            // 1. CONNECT TỚI LIVEKIT
            await room.connect(LIVEKIT_URL, token);
            console.log('✅ Connected to LiveKit');

            // 2. SET ENABLE DỰA VÀO STREAM ĐÃ CÓ (Hoặc xin mới nếu chưa có)
            let camPermitted = isCamOn;
            let micPermitted = isMicOn;

            // 3. SET ENABLE DỰA VÀO QUYỀN ĐÃ XIN
            if (camPermitted) {
                try {
                    await room.localParticipant.setCameraEnabled(true, {
                        resolution: VideoPresets.h720.resolution,
                    });
                    setIsCamOn(true);
                } catch (e: any) {
                    console.warn("LiveKit failed to init Camera", e);
                    setIsCamOn(false);
                }
            } else {
                setIsCamOn(false);
            }

            if (micPermitted) {
                try {
                    await room.localParticipant.setMicrophoneEnabled(true);
                    setIsMicOn(true);
                } catch (e: any) {
                    console.warn("LiveKit failed to init Mic", e);
                    setIsMicOn(false);
                }
            } else {
                setIsMicOn(false);
            }

            room.remoteParticipants.forEach(p => syncRemoteStreams(p));
            setIsLoading(false);
        } catch (err) {
            console.error('❌ LiveKit connection error:', err);
            setError(err instanceof Error ? err : new Error('Connection failed'));
        } finally {
            isConnectingRef.current = false;
        }
    }, [syncRemoteStreams, refreshLocalStream, addToast]);

    // WebSocket handling for signaling/chat
    useEffect(() => {
        if (!user || socketRef.current) return;

        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;

        const wrapper: SocketIOCompatible = {
            on: onEvent,
            off: offEvent,
            emit: emitEvent,
            connected: false,
            disconnect: () => ws.close()
        };
        setSocketWrapper(wrapper);

        ws.onopen = () => {
            setIsConnected(true);
            wrapper.connected = true;
            const joinMsg: WebSocketMessage = {
                type: 'join_video_room',
                roomId,
                payload: { roomId, userInfo: { id: user.id, name: user.name }, role: 'MEMBER' }
                // Note: password can be added here if we want to auto-join with a saved password
            };
            ws.send(JSON.stringify(joinMsg));
        };

        ws.onmessage = async (event) => {
            const message: WebSocketMessage = JSON.parse(event.data);
            const { type, payload } = message;

            // Dispatch to external listeners
            listenersRef.current.get(type)?.forEach(cb => cb(payload));

            switch (type) {
                case 'your_room_role': {
                    const { callRole, canRecordDirectly: crd, livekitToken } = payload;
                    if (callRole) setMyCallRole(callRole);
                    if (crd !== undefined) setCanRecordDirectly(!!crd);
                    if (livekitToken) connectToLiveKit(livekitToken);
                    setJoinStatus('joined');
                    break;
                }
                case 'join_pending': {
                    setJoinStatus('pending');
                    break;
                }
                case 'join_approved': {
                    // Try joining again now that we are approved
                    const joinMsg: WebSocketMessage = {
                        type: 'join_video_room',
                        roomId,
                        payload: { roomId, userInfo: { id: user.id, name: user.name }, role: 'MEMBER' }
                    };
                    ws.send(JSON.stringify(joinMsg));
                    break;
                }
                case 'user_knocking': {
                    const { userId, userName } = payload;
                    setKnockingUsers(prev => [...prev.filter(u => u.userId !== userId), { userId, userName }]);
                    addToast('info', `${userName} wants to join the meeting`);
                    break;
                }
                case 'knocker_removed': {
                    const { userId } = payload;
                    setKnockingUsers(prev => prev.filter(u => u.userId !== userId));
                    break;
                }
                case 'join_error': {
                    if (payload.code === 'INVALID_PASSWORD') {
                        setJoinStatus('password_required');
                        setJoinErrorMessage('Incorrect password. Please try again.');
                    } else if (payload.code === 'PASSWORD_REQUIRED') {
                        setJoinStatus('password_required');
                        setJoinErrorMessage('');
                    } else if (payload.code === 'REJECTED') {
                        setJoinStatus('denied');
                        setJoinErrorMessage(payload.message);
                    } else if (payload.code === 'CALL_ENDED') {
                        setJoinStatus('denied');
                        setJoinErrorMessage('This meeting has ended.');
                    } else {
                        addToast('error', payload.message || 'Error joining room');
                    }
                    break;
                }
                case 'chat_message': {
                    const { userId, userName, content, isPrivate, targetUserId, targetUserName } = payload;
                    setChatMessages(prev => [...prev, {
                        id: Date.now().toString() + Math.random(),
                        userId: message.userId || userId,
                        userName: userName || 'Unknown',
                        content: content || '',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isPrivate: !!isPrivate,
                        targetUserId: targetUserId,
                        targetUserName: targetUserName,
                    }]);
                    break;
                }
                case 'user_toggle_audio': {
                    const { userId, isMuted } = payload;
                    setPeerMuteStates(prev => new Map(prev).set(userId, isMuted));
                    break;
                }
                case 'user_toggle_video': {
                    const { userId, isVideoOn } = payload;
                    setPeerCamStates(prev => new Map(prev).set(userId, isVideoOn));
                    break;
                }
                case 'recording_requested': {
                    const { recordingId, requestedBy, requestedName } = payload;
                    setPendingRecordingRequest({ recordingId, requestedBy, requestedName, roomId });
                    break;
                }
                case 'recording_approved': {
                    setApprovedRecordingId(payload.recordingId);
                    setPendingRecordingRequest(null);
                    setIsRoomRecording(true);
                    setActiveRoomRecordingId(payload.recordingId);
                    addToast('recording', '🔴 This meeting is being recorded');
                    break;
                }
                case 'recording_in_progress': {
                    setIsRoomRecording(true);
                    if (payload.recordingId) setActiveRoomRecordingId(payload.recordingId);
                    addToast('recording', '🔴 This meeting is being recorded');
                    break;
                }
                case 'recording_stopped': {
                    setRecordingStopped(true);
                    setIsRoomRecording(false);
                    setActiveRoomRecordingId(null);
                    addToast('info', 'Recording has been stopped');
                    break;
                }
                case 'you-are-kicked': {
                    setIsKicked(true);
                    setKickedMessage(payload.message || "You have been removed from the meeting by an administrator.");
                    // Don't redirect immediately, let the UI show a modal first
                    if (roomRef.current) {
                        roomRef.current.disconnect();
                        roomRef.current = null;
                    }
                    break;
                }
                case 'remote_toggle_audio': {
                    if (payload.targetUserId === user?.id) {
                        addToast('info', 'The host has muted your microphone');
                        setIsMicOn(false);
                        roomRef.current?.localParticipant.setMicrophoneEnabled(false);
                        emitEvent('user_toggle_audio', { userId: user?.id, isMuted: true });
                    }
                    break;
                }
                case 'remote_toggle_video': {
                    if (payload.targetUserId === user?.id) {
                        addToast('info', 'The host has turned off your camera');
                        setIsCamOn(false);
                        roomRef.current?.localParticipant.setCameraEnabled(false);
                    }
                    break;
                }
                case 'ai_summary_chunk': {
                    setIsSummaryStreaming(true);
                    setAiSummaryStream(prev => prev + (payload.chunk || ''));
                    break;
                }
                case 'ai_summary_complete': {
                    setIsSummaryStreaming(false);
                    break;
                }
            }
        };

        return () => {
            ws.close();
            if (roomRef.current) {
                roomRef.current.disconnect();
                roomRef.current = null;
            }
            socketRef.current = null;
            setRemoteStreams(new Map());
            setRemoteScreenStreams(new Map());
            setRemoteTracks(new Map());
            setRemoteScreenTracks(new Map());
        };
    }, [roomId, user, onEvent, offEvent, emitEvent, connectToLiveKit]);

    const toggleScreenShare = useCallback(async () => {
        const room = roomRef.current;
        if (!room) return;

        try {
            if (isScreenSharing) {
                await room.localParticipant.setScreenShareEnabled(false);
                setIsScreenSharing(false);
            } else {
                await room.localParticipant.setScreenShareEnabled(true);
                setIsScreenSharing(true);
            }
        } catch (err) {
            console.error('Failed to toggle screen share:', err);
        }
    }, [isScreenSharing]);

    const toggleMic = useCallback(async () => {
        const nextState = !isMicOn;
        const room = roomRef.current;

        // 1. Update local UI state
        setIsMicOn(nextState);

        // 2. Update local stream tracks (for preview)
        if (localStream) {
            localStream.getAudioTracks().forEach(t => t.enabled = nextState);
        }

        // 3. Update LiveKit if connected
        if (room) {
            try {
                await room.localParticipant.setMicrophoneEnabled(nextState);
            } catch (err) {
                console.error('❌ Failed to toggle mic in LiveKit:', err);
            }
        }

        // 4. Notify others via WebSocket
        emitEvent('user_toggle_audio', { userId: user?.id, isMuted: !nextState });
    }, [isMicOn, localStream, emitEvent, user]);

    const toggleCam = useCallback(async () => {
        const nextState = !isCamOn;
        const room = roomRef.current;

        // 1. Update local UI state
        setIsCamOn(nextState);

        // 2. Update local stream tracks (for preview)
        if (localStream) {
            localStream.getVideoTracks().forEach(t => t.enabled = nextState);
        }

        // 3. Update LiveKit if connected
        if (room) {
            try {
                await room.localParticipant.setCameraEnabled(nextState, {
                    resolution: VideoPresets.h720.resolution,
                });
            } catch (err) {
                console.error('❌ Failed to toggle camera in LiveKit:', err);
            }
        }

        // 4. Notify others via WebSocket
        emitEvent('user_toggle_video', { userId: user?.id, isVideoOn: nextState });
    }, [isCamOn, localStream, user, emitEvent]);

    const joinWithPassword = useCallback((password: string) => {
        if (!socketRef.current || !user) return;
        const msg: WebSocketMessage = {
            type: 'join_video_room',
            roomId,
            payload: { roomId, password, userInfo: { id: user.id, name: user.name } }
        };
        socketRef.current.send(JSON.stringify(msg));
    }, [roomId, user]);

    const kickUser = useCallback((targetUserId: string) => {
        emitEvent('kick_user', { roomId, targetUserId, message: 'Kicked by moderator' });
    }, [roomId, emitEvent]);

    const remoteMuteAudio = useCallback((targetUserId: string) => {
        emitEvent('remote_toggle_audio', { roomId, targetUserId });
    }, [roomId, emitEvent]);

    const remoteMuteVideo = useCallback((targetUserId: string) => {
        emitEvent('remote_toggle_video', { roomId, targetUserId });
    }, [roomId, emitEvent]);

    return {
        socket: socketWrapper,
        localStream,
        localScreenStream,
        remoteStreams,
        remoteScreenStreams,
        remoteTracks,
        remoteScreenTracks,
        peerNames,
        peerMuteStates,
        peerCamStates,
        chatMessages,
        sendChatMessage,
        toggleScreenShare,
        isScreenSharing,
        toggleMic,
        toggleCam,
        isMicOn,
        isCamOn,
        roomId,
        isConnected,
        isLoading,
        error,
        activeSpeakerId,
        aiSummaryStream,
        isSummaryStreaming,
        recording: {
            requestRecording: () => emitEvent('request_recording', { roomId }),
            startRecording: () => emitEvent('start_recording', { roomId }),
            stopRecording: () => emitEvent('stop_recording', { roomId }),
            approveRecording: (recordingId: string) => emitEvent('approve_recording', { roomId, recordingId }),
            rejectRecording: (recordingId: string) => emitEvent('reject_recording', { roomId, recordingId }),
            isRoomRecording,
            activeRoomRecordingId,
            recordingStopped
        },
        pendingRecordingRequest,
        approvedRecordingId,
        recordingStopped,
        isRoomRecording,
        stopRoomRecording: () => {
            if (activeRoomRecordingId) emitEvent('stop_recording', { recordingId: activeRoomRecordingId, roomId });
        },
        clearApprovedRecordingId: () => setApprovedRecordingId(null),
        clearRecordingStopped: () => setRecordingStopped(false),
        myCallRole,
        canRecordDirectly,
        toasts,
        dismissToast,
        clearAiSummaryStream: () => {
            setAiSummaryStream('');
            setIsSummaryStreaming(false);
        },
        // Lobby & Password
        joinStatus,
        knockingUsers,
        joinErrorMessage,
        isKicked,
        kickedMessage,
        joinWithPassword,
        approveUser: (targetUserId: string) => emitEvent('approve_join', { roomId, targetUserId }),
        rejectUser: (targetUserId: string) => emitEvent('reject_join', { roomId, targetUserId }),
        kickUser,
        remoteMuteAudio,
        remoteMuteVideo,
        emit: emitEvent
    };
};