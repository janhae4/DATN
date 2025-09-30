"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type UseWebRTCOptions = {
  roomId: string;
  signalingUrl: string; 
  iceServers?: RTCIceServer[];
  autoStartLocal?: boolean;
  multi?: boolean;
};

type Peer = {
  pc: RTCPeerConnection;
  stream: MediaStream;
};

export function useWebRTC({
  roomId,
  signalingUrl,
  iceServers = [{ urls: ['stun:stun.l.google.com:19302'] }],
  autoStartLocal = true,
  multi = false,
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  // tick to force rerender when peers map updates or new tracks arrive
  const [peersTick, setPeersTick] = useState(0);
  const bumpPeersTick = useCallback(() => setPeersTick((t) => t + 1), []);

  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Map<string, Peer>>(new Map());
  const initializedRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Tạo kết nối P2P
  const createPeerConnection = useCallback((socketId: string) => {
    const pc = new RTCPeerConnection({ iceServers });
    const remoteStream = new MediaStream();


    // Khi có stream từ peer
    pc.ontrack = (ev) => {
      if (ev.streams && ev.streams[0]) {
        ev.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      } else if (ev.track) {
        remoteStream.addTrack(ev.track);
      }
      bumpPeersTick();
    };

    // Khi có candidate
    pc.onicecandidate = (ev) => {
      if (ev.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          roomId,
          candidate: ev.candidate.toJSON(),
          to: multi ? socketId : undefined,
        });
      }
    };

    // Lưu kết nối P2P
    peersRef.current.set(socketId, { pc, stream: remoteStream });
    bumpPeersTick();

    // Thêm stream local vào kết nối P2P
    const ls = localStreamRef.current;
    if (ls) {
      ls.getTracks().forEach((track) => pc.addTrack(track, ls));
    }

    return pc;
  }, [bumpPeersTick, iceServers, multi, roomId]);

  // Xin quyền camera/mic
  const startLocal = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      peersRef.current.forEach(({ pc }) => {
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to access camera/mic');
    }
  }, []);

  // Tắt quyền camera/mic
  const stopLocal = useCallback(() => {
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    localStreamRef.current = null;
  }, [localStream]);

  // Tắt kết nối P2P
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const socket = io(signalingUrl, {
      // Allow default transport (polling -> upgrade to websocket) for better compatibility
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { roomId });
      setJoined(true);
    });

    socket.io.on('error', (err: any) => {
      // engine.io manager-level error
      console.warn('Socket.IO manager error', err);
    });
    socket.on('connect_error', (err: any) => {
      console.warn('Socket connect_error', err?.message ?? err);
    });
    socket.on('reconnect_error', (err: any) => {
      console.warn('Socket reconnect_error', err?.message ?? err);
    });

    socket.on('room-full', () => setError('Room is full'));

    socket.on('joined', async ({ peers }: { peers: string[] }) => {
      if (multi) {
        for (const pid of peers) {
          const pc = createPeerConnection(pid);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { roomId, sdp: offer, to: pid });
        }
      }
    });

    // Tạo kết nối P2P
    socket.on('peer-joined', async ({ socketId }: { socketId: string }) => {
      if (!multi) {
        const pc = createPeerConnection(socketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { roomId, sdp: offer });
      }
    });

    // Nhận lời mời kết nối P2P
    socket.on('offer', async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      const targetId = from ?? 'peer';
      const existing = peersRef.current.get(targetId);
      const pc = existing?.pc ?? createPeerConnection(targetId);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { roomId, sdp: answer, to: multi ? targetId : undefined });
    });

    socket.on('answer', async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      const targetId = from ?? 'peer';
      const peer = peersRef.current.get(targetId);
      if (!peer) return;
      await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on('ice-candidate', async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const targetId = from ?? 'peer';
      const peer = peersRef.current.get(targetId);
      if (!peer) return;
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // ignore
      }
    });

    socket.on('peer-left', ({ socketId }: { socketId: string }) => {
      const peer = peersRef.current.get(socketId);
      if (peer) {
        peer.pc.close();
        peersRef.current.delete(socketId);
        bumpPeersTick();
      }
    });

    return () => {
      // cleanup on unmount
      try { socket.emit('leave'); } catch {}
      try { socket.disconnect(); } catch {}
      peersRef.current.forEach(({ pc }) => pc.close());
      peersRef.current.clear();
    };
  }, [multi, roomId, signalingUrl]);

  // Tự động bật camera/mic
  useEffect(() => {
    if (autoStartLocal) startLocal();
  }, [autoStartLocal, startLocal]);

  // Lấy stream từ các peer
  const remoteStreams = useMemo(() => {
    return [...peersRef.current.values()].map((p) => p.stream);
  }, [peersTick]);

  // Tắt bật âm thanh
  const toggleMute = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
  }, [localStream]);

  // Tắt bật video
  const toggleVideo = useCallback(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
  }, [localStream]);


  return {
    joined,
    error,
    localStream,
    remoteStreams,
    startLocal,
    stopLocal,
    toggleMute,
    toggleVideo,
  };
}
