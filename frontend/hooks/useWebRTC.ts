import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getMe } from '@/services/authService';

const SOCKET_URL = 'http://localhost:4001';
const ICE_SERVERS = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export const useWebRTC = (roomId: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    
    // 1. New State for User Names
    const [peerNames, setPeerNames] = useState<Map<string, string>>(new Map());
    
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    // Store both ID and Name
    const [currentUser, setCurrentUser] = useState({ id: '', name: '' });

    // Fetch current user data on mount
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const userData = await getMe();
                if (userData?.id) {
                    setCurrentUser({ 
                        id: userData.id, 
                        name: userData.name || 'Unknown User' 
                    });
                }
            } catch (err) {
                console.error('Failed to fetch current user:', err);
                setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchCurrentUser();
    }, []);

    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const socketRef = useRef<Socket | null>(null);

    const createPeer = useCallback((targetUserId: string, socket: Socket, stream: MediaStream) => {
        const peer = new RTCPeerConnection(ICE_SERVERS);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice_candidate', { candidate: event.candidate, targetUserId, roomId });
            }
        };

        peer.ontrack = (event) => {
            if (targetUserId === currentUser.id) return;
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.set(targetUserId, event.streams[0]);
                return newMap;
            });
        };

        peersRef.current.set(targetUserId, peer);
        return peer;
    }, [roomId, currentUser.id]);

    useEffect(() => {
        if (!currentUser.id) return;

        const newSocket = io(SOCKET_URL, { withCredentials: true, transports: ['websocket'] });
        socketRef.current = newSocket;
        setSocket(newSocket);

        const startMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                localStreamRef.current = stream;

                newSocket.emit('join_video_room', {
                    roomId,
                    userInfo: { id: currentUser.id, name: currentUser.name },
                    role: 'MEMBER'
                });
                setIsConnected(true);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to access camera/microphone'));
            }
        };

        startMedia();

        return () => {
            localStreamRef.current?.getTracks().forEach(track => track.stop());
            newSocket.disconnect();
        };
    }, [roomId, currentUser.id, currentUser.name]);

    useEffect(() => {
        if (!socket || !currentUser.id) return;

        // 1. User Joined
        socket.on('user_joined_video', async ({ socketId, userInfo }) => {
            if (userInfo.id === currentUser.id) return;

            // SAVE NAME
            setPeerNames(prev => new Map(prev).set(socketId, userInfo.name));

            if (!localStreamRef.current) return;
            
            const peer = createPeer(socketId, socket, localStreamRef.current);
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            
            socket.emit('offer', { 
                sdp: offer, 
                targetUserId: socketId, 
                roomId, 
                // SEND MY NAME IN OFFER
                userInfo: { id: currentUser.id, name: currentUser.name } 
            });
        });

        // 2. Offer Received
        socket.on('offer', async ({ sdp, senderSocketId, senderId, userInfo }) => {
            if (senderId === currentUser.id) return;

            // SAVE NAME (Extract from userInfo sent in offer)
            if (userInfo && userInfo.name) {
                setPeerNames(prev => new Map(prev).set(senderSocketId, userInfo.name));
            }

            if (!localStreamRef.current) return;
            
            const peer = createPeer(senderSocketId, socket, localStreamRef.current);
            await peer.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            
            socket.emit('answer', { sdp: answer, targetUserId: senderSocketId, roomId });
        });

        socket.on('answer', async ({ sdp, senderSocketId }) => {
            const peer = peersRef.current.get(senderSocketId);
            if (peer) await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        });

        socket.on('ice_candidate', async ({ candidate, senderSocketId }) => {
            const peer = peersRef.current.get(senderSocketId);
            if (peer) await peer.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on('user_left_video', ({ socketId }) => {
            const peer = peersRef.current.get(socketId);
            if (peer) peer.close();
            peersRef.current.delete(socketId);
            
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.delete(socketId);
                return newMap;
            });

            // Remove Name
            setPeerNames(prev => {
                const newMap = new Map(prev);
                newMap.delete(socketId);
                return newMap;
            })
        });

        return () => {
            socket.off('user_joined_video');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice_candidate');
            socket.off('user_left_video');
        };
    }, [socket, createPeer, roomId, currentUser]);

    // Return peerNames
    return { localStream, remoteStreams, peerNames, isConnected, isLoading, error, socket  };
};