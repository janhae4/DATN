"use client";

import { useCallback, useRef, useState } from 'react';
import { UseWebRTCLocalMediaReturn } from '../types';

// ==========================================
// WEBRTC LOCAL MEDIA MANAGEMENT HOOK
// ==========================================



export function useWebRTCLocalMedia(): UseWebRTCLocalMediaReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const startLocal = useCallback(async () => {
    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMessage = 'Media devices not supported in this browser';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setError(null);
    } catch (err: any) {
      const errorMessage = err?.message ?? 'Failed to access camera/mic';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const stopLocal = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }
  }, [localStream]);

  const toggleMute = useCallback(() => {
    if (!localStream) return;

    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (!localStream) return;

    const videoTracks = localStream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
  }, [localStream]);

  const addTracksToPeerConnection = useCallback((peerConnection: RTCPeerConnection) => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });
    }
  }, []);

  return {
    localStream,
    error,
    startLocal,
    stopLocal,
    toggleMute,
    toggleVideo,
    addTracksToPeerConnection,
    localStreamRef,
  };
}


