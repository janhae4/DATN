"use client";
import VideoControls from "@/components/video/VideoControls";
import { useLocalMedia } from "@/lib/WebRTC/hooks/useLocalMedia";

export default function VideoAccess() {
  const {
    videoRef,
    cameraPerm,
    micPerm,
    error,
    isPreviewing,
    videoInputs,
    audioInputs,
    selectedVideoId,
    setSelectedVideoId,
    selectedAudioId,
    setSelectedAudioId,
    muted,
    videoOff,
    startPreview,
    stopPreview,
    applyNewDevices,
    toggleMute,
    toggleVideo,
  } = useLocalMedia();

  return (
    <VideoControls
      videoNode={(
        <video
          ref={videoRef}
          className="block h-[240px] w-full object-cover"
          playsInline
          muted
          autoPlay
        />
      )}
      videoInputs={videoInputs}
      audioInputs={audioInputs}
      selectedVideoId={selectedVideoId}
      setSelectedVideoId={setSelectedVideoId}
      selectedAudioId={selectedAudioId}
      setSelectedAudioId={setSelectedAudioId}
      isPreviewing={isPreviewing}
      muted={muted}
      videoOff={videoOff}
      startPreview={startPreview}
      stopPreview={stopPreview}
      applyNewDevices={applyNewDevices}
      toggleMute={toggleMute}
      toggleVideo={toggleVideo}
      cameraPerm={cameraPerm}
      micPerm={micPerm}
      error={error}
    />
  );
}
