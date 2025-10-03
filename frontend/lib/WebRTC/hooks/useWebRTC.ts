"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Import from separate modules
import type { UseWebRTCOptions, WebRTCHookReturn, Peer } from '../types';
import { createAndStorePeerConnection } from '../core/peerConnection';
import { createSocketHandlers } from '../core/socketHandlers';
import { useWebRTCLocalMedia } from './useWebRTCLocalMedia';

// ==========================================
// MAIN WEBRTC HOOK
// ==========================================

export function useWebRTC({
  roomId,
  signalingUrl,
  iceServers = [{ urls: ['stun:stun.l.google.com:19302'] }],
  autoStartLocal = true,
  multi = false,
}: UseWebRTCOptions): WebRTCHookReturn {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  //user đã join room chưa.
  const [joined, setJoined] = useState(false);

  //lỗi khi kết nối.
  const [error, setError] = useState<string | null>(null);

  //  “đồng hồ” giúp re-render UI khi danh sách peer thay đổi.
  const [peersTick, setPeersTick] = useState(0);

  // socket đã kết nối chưa.
  const [isConnected, setIsConnected] = useState(false);

  // callback để trigger re-render khi danh sách peer thay đổi.
  const bumpPeersTick = useCallback(() => setPeersTick((t) => t + 1), []);

  // socket ref.
  const socketRef = useRef<Socket | null>(null);

  //  danh sách các người khác trong phòng (mỗi người có RTCPeerConnection và remoteStream).
  const peersRef = useRef<Map<string, Peer>>(new Map());

  // đã khởi tạo chưa.
  const initializedRef = useRef(false);

  // ==========================================
  // LOCAL MEDIA MANAGEMENT
  // ==========================================
  const {
    localStream,
    startLocal: startLocalMedia,
    stopLocal: stopLocalMedia,
    toggleMute,
    toggleVideo,
    addTracksToPeerConnection,
    localStreamRef,
  } = useWebRTCLocalMedia();

  // ==========================================
  // PEER CONNECTION MANAGEMENT
  // ==========================================
  const createPeerConnectionForSocket = useCallback((socketId: string): RTCPeerConnection => {
    const socket = socketRef.current;
    if (!socket) {
      throw new Error('Socket not available');
    }
    return createAndStorePeerConnection(
      socketId,
      iceServers,
      roomId,
      socket,
      multi,
      bumpPeersTick,
      localStreamRef,
      peersRef,
      addTracksToPeerConnection
    );
  }, [iceServers, roomId, multi, bumpPeersTick, addTracksToPeerConnection]);

  // ==========================================
  // SOCKET LIFECYCLE MANAGEMENT
  // ==========================================
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const socket = io(signalingUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Create and bind event handlers
    const handlers = createSocketHandlers(
      socket,
      roomId,
      multi,
      createPeerConnectionForSocket,
      setError,
      setJoined,
      bumpPeersTick,
      peersRef
    );

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      handlers.onConnect();
    });
    socket.on('joined', handlers.onJoined);
    socket.on('peer-joined', handlers.onPeerJoined);
    socket.on('offer', handlers.onOffer);
    socket.on('answer', handlers.onAnswer);
    socket.on('ice-candidate', handlers.onIceCandidate);
    socket.on('peer-left', handlers.onPeerLeft);
    socket.on('room-full', handlers.onRoomFull);

    // Error handlers
    socket.on('connect_error', handlers.onError);
    socket.on('reconnect_error', handlers.onError);
    socket.io.on('error', handlers.onError);
    socket.on('join-error', handlers.onJoinError);

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
      setIsConnected(false);
      setJoined(false);
      setError(`Connection lost: ${reason}`);
    });

    console.log('Socket.IO connection initialized for room:', roomId);

    // Cleanup function
    return () => {
      try {
        socket.emit('leave');
      } catch (error) {
        console.warn('Error leaving room:', error);
      }

      try {
        socket.disconnect();
      } catch (error) {
        console.warn('Error disconnecting socket:', error);
      }

      // Close all peer connections
      peersRef.current.forEach(({ pc }) => {
        try {
          pc.close();
        } catch (error) {
          console.warn('Error closing peer connection:', error);
        }
      });

      peersRef.current.clear();
    };
  }, [roomId, signalingUrl, multi]);

  // ==========================================
  // AUTO-START LOCAL MEDIA
  // ==========================================
  useEffect(() => {
    if (autoStartLocal) {
      startLocalMedia().catch((err) => {
        console.warn('Auto-start local media failed:', err);
      });
    }
  }, [autoStartLocal, startLocalMedia]);

  // ==========================================
  // REMOTE STREAMS COMPUTATION
  // ==========================================
  const remoteStreams = useMemo(() => {
    return [...peersRef.current.values()].map((peer) => peer.stream);
  }, [peersTick]);

  // ==========================================
  // PUBLIC API
  // ==========================================
  return {
    joined,
    error,
    localStream,
    remoteStreams,
    startLocal: startLocalMedia,
    stopLocal: stopLocalMedia,
    toggleMute,
    toggleVideo,
    isConnected,
  };
}
