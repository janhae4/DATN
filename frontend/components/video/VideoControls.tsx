"use client";

import { VideoControlsProps } from "@/components/video/VideoControls.types";
import CameraSelect from "@/components/video/CameraSelect";
import MicSelect from "@/components/video/MicSelect";
import PermissionStatus from "@/components/video/PermissionStatus";
import ErrorBox from "@/components/video/ErrorBox";
import ControlButtons from "@/components/video/ControlButtons";

export default function VideoControls(props: VideoControlsProps) {
  const {
    videoNode,
    videoInputs,
    audioInputs,
    selectedVideoId,
    setSelectedVideoId,
    selectedAudioId,
    setSelectedAudioId,
    isPreviewing,
    muted,
    videoOff,
    startPreview,
    stopPreview,
    applyNewDevices,
    toggleMute,
    toggleVideo,
    cameraPerm,
    micPerm,
    error,
  } = props;

  return (
    <div className="flex flex-col gap-4">
      <PermissionStatus cameraPerm={cameraPerm} micPerm={micPerm} />

      <div className="flex flex-wrap items-center gap-3">
        <CameraSelect
          videoInputs={videoInputs}
          selectedVideoId={selectedVideoId}
          setSelectedVideoId={setSelectedVideoId}
        />
        <MicSelect
          audioInputs={audioInputs}
          selectedAudioId={selectedAudioId}
          setSelectedAudioId={setSelectedAudioId}
        />
        <ControlButtons
          isPreviewing={isPreviewing}
          muted={muted}
          videoOff={videoOff}
          startPreview={startPreview}
          stopPreview={stopPreview}
          applyNewDevices={applyNewDevices}
          toggleMute={toggleMute}
          toggleVideo={toggleVideo}
          disabledApply={!selectedVideoId && !selectedAudioId}
        />
      </div>

      <ErrorBox error={error} />

      <div className="overflow-hidden rounded-md border bg-black/80">
        {videoNode}
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: If access is denied, check your browser site permissions for camera and microphone.
      </p>
    </div>
  );
}
