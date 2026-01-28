import { useRef, useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';

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

    // Helper to cleanup media/peers
    const cleanup = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        peersRef.current.forEach(peer => peer.close());
        peersRef.current.clear();
        setRemoteStreams(new Map());
        setVoiceParticipants([]);
    };

    useEffect(() => {
        if (!voiceSocket || !selectedChannelId || !userId || !user || !selectedServerId) {
            // If we switch away from voice channel, ensure clean up
            if (!isVoiceChannel) cleanup();
            return;
        }

        if (!isVoiceChannel) {
            cleanup();
            return;
        }

        const startVoice = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                localStreamRef.current = stream;

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

        const handleUserLeft = (data: { userId: string, socketId?: string, reason: string }) => {
            setVoiceParticipants(prev => prev.filter(p => p.userInfo?.id !== data.userId));
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
        };

        voiceSocket.on("user_joined_video", handleUserJoined);
        voiceSocket.on("all_users_in_room", handleAllUsers);
        voiceSocket.on("offer", handleOffer);
        voiceSocket.on("answer", handleAnswer);
        voiceSocket.on("ice_candidate", handleIceCandidate);
        voiceSocket.on("user_left_video", handleUserLeft);

        return () => {
            voiceSocket.off("user_joined_video", handleUserJoined);
            voiceSocket.off("all_users_in_room", handleAllUsers);
            voiceSocket.off("offer", handleOffer);
            voiceSocket.off("answer", handleAnswer);
            voiceSocket.off("ice_candidate", handleIceCandidate);
            voiceSocket.off("user_left_video", handleUserLeft);
            // Main cleanup on unmount/dep change
            cleanup();
        };
    }, [voiceSocket, selectedChannelId, userId, user, isVoiceChannel, selectedServerId]);

    return { voiceParticipants, remoteStreams };
};
