import { ReactNode } from "react";

export interface VideoControlsProps {
  videoNode: ReactNode;

  // device lists
  videoInputs: MediaDeviceInfo[];
  audioInputs: MediaDeviceInfo[];
  selectedVideoId: string;
  setSelectedVideoId: (id: string) => void;
  selectedAudioId: string;
  setSelectedAudioId: (id: string) => void;

  // states
  isPreviewing: boolean;
  muted: boolean;
  videoOff: boolean;

  // actions
  startPreview: () => void;
  stopPreview: () => void;
  applyNewDevices: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  
  // info
  cameraPerm: string;
  micPerm: string;
  error: string | null;
}
