"use client";

import { Button } from "@/components/ui/button";

interface ControlButtonsProps {
  isPreviewing: boolean;
  muted: boolean;
  videoOff: boolean;
  startPreview: () => void;
  stopPreview: () => void;
  applyNewDevices: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  disabledApply?: boolean;
}

export default function ControlButtons({
  isPreviewing,
  muted,
  videoOff,
  startPreview,
  stopPreview,
  applyNewDevices,
  toggleMute,
  toggleVideo,
  disabledApply,
}: ControlButtonsProps) {
  return (
    <>
      <Button variant="outline" onClick={applyNewDevices} disabled={disabledApply}>
        Apply Devices
      </Button>
      {!isPreviewing ? (
        <Button onClick={startPreview}>Enable Camera & Mic</Button>
      ) : (
        <Button variant="outline" onClick={stopPreview}>Stop Preview</Button>
      )}
      {isPreviewing && (
        <>
          <Button variant="outline" onClick={toggleMute}>{muted ? "Unmute" : "Mute"}</Button>
          <Button variant="outline" onClick={toggleVideo}>{videoOff ? "Video On" : "Video Off"}</Button>
        </>
      )}
    </>
  );
}
