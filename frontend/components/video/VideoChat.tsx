"use client";

import React, { useEffect, useRef } from 'react';
import { useWebRTC } from '../../lib/WebRTC/hooks/useWebRTC';

export type VideoChatProps = {
  roomId: string;
  signalingUrl: string; // e.g., process.env.NEXT_PUBLIC_SIGNALING_URL + '/webrtc'
  multi?: boolean;
};

export default function VideoChat({ roomId, signalingUrl, multi = false }: VideoChatProps) {
  const {
    joined,
    error,
    localStream,
    remoteStreams,
    startLocal,
    stopLocal,
    toggleMute,
    toggleVideo,
  } = useWebRTC({ roomId, signalingUrl, multi, autoStartLocal: true });

  const localRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (localRef.current && localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={startLocal} className="rounded border px-3 py-1">Start</button>
        <button onClick={stopLocal} className="rounded border px-3 py-1">Stop</button>
        <button onClick={toggleMute} className="rounded border px-3 py-1">Mute/Unmute</button>
        <button onClick={toggleVideo} className="rounded border px-3 py-1">Video On/Off</button>
      </div>

      {error && <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="text-sm text-gray-600">Joined: {String(joined)}</div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <video ref={localRef} autoPlay playsInline muted className="w-full bg-black" />
        </div>
        {remoteStreams.map((s, idx) => (
          <RemoteVideo key={idx} stream={s} />
        ))}
      </div>
    </div>
  );
}

function RemoteVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline className="w-full bg-black" />;
}
