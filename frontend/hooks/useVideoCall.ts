import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const ICE_SERVERS = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export const useVideoCall = (roomId: string) => {
    const [peers, setPeers] = useState<Record<string, MediaStream>>({});
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isAudioMuted, setIsAudioMuted] = useState(false); // Thêm state cho audio
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
    const socketRef = useRef<Socket | null>(null);
    const [isLoading, setIsLoading] = useState(true); // 1. Thêm state loading


    const createPeerConnection = (peerId: string, socket: Socket): RTCPeerConnection => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Thêm local tracks
        localStreamRef.current?.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current!);
        });

        // Nhận remote stream
        pc.ontrack = (event) => {
            console.log(`Track received from ${peerId}`);
            setPeers((prev) => ({ ...prev, [peerId]: event.streams[0] }));
        };

        // Gửi ICE candidate
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', { candidate: event.candidate, roomId, targetId: peerId });
            }
        };

        return pc;
    };

    const toggleVideoMute = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoMuted(!videoTrack.enabled);
            }
        }
    };

    const toggleAudioMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            }
        }
    };

    useEffect(() => {
        const setupVideoCall = async () => {
            try {
                // 1. Lấy local stream
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;

                // Đồng bộ trạng thái camera ngay khi lấy stream
                const videoTrack = stream.getVideoTracks()[0];
                if (videoTrack) {
                    setIsVideoMuted(!videoTrack.enabled);
                }

                // Đồng bộ trạng thái audio ngay khi lấy stream
                const audioTrack = stream.getAudioTracks()[0];
                if (audioTrack) {
                    setIsAudioMuted(!audioTrack.enabled);
                }

                setIsLoading(false); // Đã lấy stream xong

                // 2. Kết nối socket
                socketRef.current = io('http://localhost:3004');
                const socket = socketRef.current;

                // 3. Tham gia phòng
                socket.emit('join-room', roomId);

                // 4. Lắng nghe sự kiện
                socket.on('user-joined', (newUserId: string) => {
                    console.log(`USER JOINED: ${newUserId}`);
                    const pc = createPeerConnection(newUserId, socket);
                    peerConnections.current[newUserId] = pc;

                    pc.createOffer()
                        .then((offer) => pc.setLocalDescription(offer))
                        .then(() => {
                            socket.emit('offer', { sdp: pc.localDescription, roomId, targetId: newUserId });
                        });
                });

                socket.on('offer', (data: { sdp: RTCSessionDescriptionInit; senderId: string }) => {
                    console.log(`RECEIVED OFFER FROM: ${data.senderId}`);
                    const pc = createPeerConnection(data.senderId, socket);
                    peerConnections.current[data.senderId] = pc;

                    pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
                        .then(() => pc.createAnswer())
                        .then((answer) => pc.setLocalDescription(answer))
                        .then(() => {
                            socket.emit('answer', { sdp: pc.localDescription, roomId, targetId: data.senderId });
                        });
                });

                socket.on('answer', (data: { sdp: RTCSessionDescriptionInit; senderId: string }) => {
                    console.log(`RECEIVED ANSWER FROM: ${data.senderId}`);
                    const pc = peerConnections.current[data.senderId];
                    if (pc) {
                        pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    }
                });

                socket.on('ice-candidate', (data: { candidate: RTCIceCandidateInit; senderId: string }) => {
                    const pc = peerConnections.current[data.senderId];
                    if (pc) {
                        pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                    }
                });

                socket.on('user-left', (userId: string) => {
                    console.log(`USER LEFT: ${userId}`);
                    if (peerConnections.current[userId]) {
                        peerConnections.current[userId].close();
                        delete peerConnections.current[userId];
                    }
                    setPeers((prev) => {
                        const newPeers = { ...prev };
                        delete newPeers[userId];
                        return newPeers;
                    });
                });

            } catch (error) {
                console.error('Failed to set up video call:', error);
            }
        };

        setupVideoCall();

        // Cleanup
        return () => {
            localStreamRef.current?.getTracks().forEach((track) => track.stop());
            Object.values(peerConnections.current).forEach((pc) => pc.close());
            socketRef.current?.disconnect();
        };
    }, [roomId]);

    return { localStream: localStreamRef.current, peers, isVideoMuted, toggleVideoMute, isAudioMuted, toggleAudioMute, isLoading };
};
