import { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';

export interface CaptionEntry {
    userId: string;
    name: string;
    text: string;
    isFinal: boolean;
    timestamp: number;
}

export const useVoiceSocket = (
    selectedChannelId: string | null,
    selectedServerId: string | null,
    userId: string | undefined,
    user: any,
    isVoiceChannel: boolean
) => {
    const { voiceSocket } = useSocket();
    const [voiceParticipants, setVoiceParticipants] = useState<any[]>([]);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(false);
    const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
    const [ccCaptions, setCCCaptions] = useState<Map<string, CaptionEntry>>(new Map());
    const audioContextRef = useRef<AudioContext | null>(null);
    const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
    const sourceNodesRef = useRef<Map<string, MediaStreamAudioSourceNode>>(new Map());

    // Emit local CC transcript to all peers in the room
    const emitCCTranscript = useCallback((text: string, isFinal: boolean) => {
        if (!voiceSocket || !selectedChannelId || !userId || !user) return;
        voiceSocket.emit('cc_transcript', {
            roomId: selectedChannelId,
            userId,
            name: user.name || 'Unknown',
            text,
            isFinal,
        });
    }, [voiceSocket, selectedChannelId, userId, user]);


    const cleanup = () => {
        if (selectedChannelId && voiceSocket) {
            voiceSocket.emit("leave_video_room", { roomId: selectedChannelId });
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        peersRef.current.forEach(peer => peer.close());
        peersRef.current.clear();
        setRemoteStreams(new Map());
        setVoiceParticipants([]);
        setIsMuted(false);
        setIsVideoOn(false);
        setSpeakingUsers(new Set());

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        analysersRef.current.clear();
        sourceNodesRef.current.forEach(node => node.disconnect());
        sourceNodesRef.current.clear();
    };

    // Toggle Mute
    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(prev => !prev);
        }
    };

    const toggleVideo = async () => {
        setIsVideoOn(prev => !prev);
    };

    useEffect(() => {
        if (!isVoiceChannel) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioCtx = audioContextRef.current;

        const setupAnalyser = (stream: MediaStream, id: string) => {
            if (analysersRef.current.has(id)) return;
            if (stream.getAudioTracks().length === 0) return;

            try {
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);

                sourceNodesRef.current.set(id, source);
                analysersRef.current.set(id, analyser);
            } catch (e) {
                console.error("Error setting up audio analysis for", id, e);
            }
        };

        if (localStreamRef.current && userId) {
            setupAnalyser(localStreamRef.current, userId);
        }
        remoteStreams.forEach((stream, socketId) => {
            const participant = voiceParticipants.find(p => p.socketId === socketId);
            if (participant?.userInfo?.id) {
                setupAnalyser(stream, participant.userInfo.id);
            }
        });

        const intervalId = setInterval(() => {
            const speaking = new Set<string>();
            const dataArray = new Uint8Array(128);
            const THRESHOLD = 10;

            analysersRef.current.forEach((analyser, id) => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;

                if (average > THRESHOLD) {
                    speaking.add(id);
                }
            });

            if (userId && isMuted) {
                speaking.delete(userId);
            }

            setSpeakingUsers(speaking);
        }, 100);

        return () => {
            clearInterval(intervalId);
        };
    }, [isVoiceChannel, remoteStreams.size, voiceParticipants.length, userId, isMuted, localStreamRef.current]);

    useEffect(() => {
        if (!voiceSocket || !selectedChannelId || !userId || !user || !selectedServerId) {
            // If we switch away from voice channel, ensure clean up
            if (!isVoiceChannel) {
                if (selectedChannelId && voiceSocket) voiceSocket.emit("leave_video_room", { roomId: selectedChannelId });
                cleanup();
            }
            return;
        }

        if (!isVoiceChannel) {
            if (selectedChannelId) voiceSocket.emit("leave_video_room", { roomId: selectedChannelId });
            cleanup();
            return;
        }

        const startVoice = async () => {
            // If we already have a stream, don't restart (prevents loops)
            if (localStreamRef.current) return;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                localStreamRef.current = stream;

                stream.getAudioTracks().forEach(t => t.enabled = !isMuted);

                setVoiceParticipants(prev => {
                    const exists = prev.find(p => p.userInfo?.id === user?.id);
                    if (exists) return prev;
                    return [...prev, { userInfo: user, socketId: voiceSocket.id || 'me' }];
                });

                voiceSocket.emit("join_video_room", {
                    roomId: selectedChannelId,
                    teamId: selectedServerId,
                    userInfo: user,
                    role: 'MEMBER'
                });
            } catch (err) {
                console.error("Failed to access microphone:", err);
                alert("Không thể truy cập microphone. Vui lòng cấp quyền để tham gia voice chat.");
            }
        };
        startVoice();

        const createPeer = (targetSocketId: string, initiator: boolean) => {
            const peer = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            });

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    peer.addTrack(track, localStreamRef.current!);
                });
            }

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    voiceSocket.emit('ice_candidate', {
                        candidate: event.candidate,
                        targetUserId: targetSocketId,
                        roomId: selectedChannelId
                    });
                }
            };

            peer.ontrack = (event) => {
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.set(targetSocketId, event.streams[0]);
                    return newMap;
                });
            };

            peersRef.current.set(targetSocketId, peer);
            return peer;
        };

        const handleUserJoined = async (data: { userInfo: any, socketId: string, role: string }) => {
            setVoiceParticipants(prev => {
                if (prev.find(p => p.userInfo?.id === data.userInfo?.id)) return prev;
                return [...prev, data];
            });

            const peer = createPeer(data.socketId, true);
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            voiceSocket.emit('offer', {
                sdp: offer,
                targetUserId: data.socketId,
                roomId: selectedChannelId,
                userInfo: user
            });
        };

        const handleAllUsers = (users: any[]) => {
            setVoiceParticipants(prev => {
                const existingIds = new Set(prev.map(p => p.userInfo?.id));
                const newUsers = users.filter(u => !existingIds.has(u.userInfo?.id));
                return [...prev, ...newUsers];
            });
        };

        const handleOffer = async (data: { sdp: any, senderSocketId: string, userInfo: any }) => {
            if (data.userInfo) {
                setVoiceParticipants(prev => {
                    if (prev.find(p => p.userInfo?.id === data.userInfo?.id)) return prev;
                    return [...prev, { userInfo: data.userInfo, socketId: data.senderSocketId }];
                });
            }

            const peer = createPeer(data.senderSocketId, false);
            try {
                await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);

                voiceSocket.emit('answer', {
                    sdp: answer,
                    targetUserId: data.senderSocketId,
                    roomId: selectedChannelId
                });
            } catch (err) {
                console.error("Error handling offer:", err);
            }
        };

        const handleAnswer = async (data: { sdp: any, senderSocketId: string }) => {
            const peer = peersRef.current.get(data.senderSocketId);
            if (peer) {
                try {
                    await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
                } catch (err) {
                    console.error("Error setting remote description (answer):", err);
                }
            }
        };

        const handleIceCandidate = async (data: { candidate: any, senderSocketId: string }) => {
            const peer = peersRef.current.get(data.senderSocketId);
            if (peer) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (err) {
                    console.error("Error adding ICE candidate:", err);
                }
            }
        };

        const handleUserLeft = (data: { userId?: string, socketId?: string, reason?: string }) => {
            console.log("User left voice (event received):", data);

            setVoiceParticipants(prev => {
                const newParticipants = prev.filter(p => {
                    if (data.userId && p.userInfo?.id === data.userId) {
                        return false;
                    }
                    if (data.socketId && p.socketId === data.socketId) {
                        return false;
                    }
                    return true;
                });
                console.log("Participants after removal:", newParticipants);
                return newParticipants;
            });

            if (data.socketId) {
                const peer = peersRef.current.get(data.socketId);
                if (peer) {
                    peer.close();
                    peersRef.current.delete(data.socketId);
                }
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(data.socketId!);
                    return newMap;
                });
            }

            if (data.userId && analysersRef.current.has(data.userId)) {
                analysersRef.current.delete(data.userId);
            }
        };

        const handleCCTranscript = (data: { userId: string; name: string; text: string; isFinal: boolean }) => {
            setCCCaptions(prev => {
                const next = new Map(prev);
                next.set(data.userId, {
                    userId: data.userId,
                    name: data.name,
                    text: data.text,
                    isFinal: data.isFinal,
                    timestamp: Date.now(),
                });
                return next;
            });
            // Clear final captions after 5 seconds
            if (data.isFinal) {
                setTimeout(() => {
                    setCCCaptions(prev => {
                        const next = new Map(prev);
                        const entry = next.get(data.userId);
                        if (entry && entry.text === data.text) next.delete(data.userId);
                        return next;
                    });
                }, 5000);
            }
        };

        voiceSocket.on("user_joined_video", handleUserJoined);
        voiceSocket.on("all_users_in_room", handleAllUsers);
        voiceSocket.on("offer", handleOffer);
        voiceSocket.on("answer", handleAnswer);
        voiceSocket.on("ice_candidate", handleIceCandidate);
        voiceSocket.on("user_left_video", handleUserLeft);
        voiceSocket.on("cc_transcript", handleCCTranscript);

        return () => {
            voiceSocket.off("user_joined_video", handleUserJoined);
            voiceSocket.off("all_users_in_room", handleAllUsers);
            voiceSocket.off("offer", handleOffer);
            voiceSocket.off("answer", handleAnswer);
            voiceSocket.off("ice_candidate", handleIceCandidate);
            voiceSocket.off("user_left_video", handleUserLeft);
            voiceSocket.off("cc_transcript", handleCCTranscript);
            if (selectedChannelId) voiceSocket.emit("leave_video_room", { roomId: selectedChannelId });
            cleanup();
        };
    }, [voiceSocket, selectedChannelId, userId, user, isVoiceChannel, selectedServerId]);

    return {
        voiceParticipants,
        remoteStreams,
        isMuted,
        toggleMute,
        isVideoOn,
        toggleVideo,
        speakingUsers,
        ccCaptions,
        emitCCTranscript,
    };
};
