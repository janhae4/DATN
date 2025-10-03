import { useCallback, useEffect, useRef, useState } from "react";

export type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

export function useLocalMedia() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraPerm, setCameraPerm] = useState<PermissionState>("prompt");
  const [micPerm, setMicPerm] = useState<PermissionState>("prompt");
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const [muted, setMuted] = useState<boolean>(false);
  const [videoOff, setVideoOff] = useState<boolean>(false);

  // permissions
  useEffect(() => {
    let cancelled = false;
    async function checkPermissions() {
      try {
        if (typeof navigator === "undefined" || !("permissions" in navigator)) {
          setCameraPerm("unsupported");
          setMicPerm("unsupported");
          return;
        }
        const navPerm = navigator.permissions as any;
        const results = await Promise.allSettled([
          navPerm.query({ name: "camera" as PermissionName }),
          navPerm.query({ name: "microphone" as PermissionName }),
        ]);
        if (cancelled) return;
        const cam = results[0].status === "fulfilled" ? results[0].value.state : "prompt";
        const mic = results[1].status === "fulfilled" ? results[1].value.state : "prompt";
        setCameraPerm(cam);
        setMicPerm(mic);
      } catch {
        setCameraPerm("unsupported");
        setMicPerm("unsupported");
      }
    }
    checkPermissions();
    return () => { cancelled = true; };
  }, []);

  // enumerate devices
  const enumerate = useCallback(async () => {
    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const vids = devices.filter((d) => d.kind === "videoinput");
      const auds = devices.filter((d) => d.kind === "audioinput");
      setVideoInputs(vids);
      setAudioInputs(auds);
      if (!selectedVideoId && vids[0]?.deviceId) setSelectedVideoId(vids[0].deviceId);
      if (!selectedAudioId && auds[0]?.deviceId) setSelectedAudioId(auds[0].deviceId);
    } catch {}
  }, [selectedAudioId, selectedVideoId]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", enumerate);
      return () => navigator.mediaDevices.removeEventListener("devicechange", enumerate);
    }
  }, [enumerate]);

  // start preview
  const startPreview = useCallback(async () => {
    setError(null);
    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'Media devices not supported in this browser';
        setError(errorMsg);
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: selectedVideoId ? { deviceId: { exact: selectedVideoId } } : true,
        audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsPreviewing(true);
      setMuted(false);
      setVideoOff(false);
      await enumerate();
    } catch (e: any) {
      setError(e?.message ?? "Failed to access camera/microphone");
      setIsPreviewing(false);
    }
  }, [enumerate, selectedAudioId, selectedVideoId]);

  const stopPreview = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsPreviewing(false);
  }, []);

  const applyNewDevices = useCallback(async () => {
    if (!isPreviewing) return startPreview();
    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'Media devices not supported in this browser';
        setError(errorMsg);
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: selectedVideoId ? { deviceId: { exact: selectedVideoId } } : true,
        audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const old = streamRef.current;
      if (old) old.getTracks().forEach((t) => t.stop());
      streamRef.current = newStream;
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(() => {});
      }
      const newVideo = newStream.getVideoTracks()[0];
      const newAudio = newStream.getAudioTracks()[0];
      if (muted && newAudio) newAudio.enabled = false;
      if (videoOff && newVideo) newVideo.enabled = false;
    } catch (e: any) {
      setError(e?.message ?? "Failed to switch devices");
    }
  }, [isPreviewing, muted, selectedAudioId, selectedVideoId, videoOff, startPreview]);

  const toggleMute = useCallback(() => {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!audioTrack.enabled);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoOff(!videoTrack.enabled);
    }
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  return {
    // refs
    videoRef,
    // state
    cameraPerm, micPerm, error, isPreviewing,
    videoInputs, audioInputs,
    selectedVideoId, setSelectedVideoId,
    selectedAudioId, setSelectedAudioId,
    muted, videoOff,
    // actions
    startPreview, stopPreview, applyNewDevices, toggleMute, toggleVideo,
  };
}
