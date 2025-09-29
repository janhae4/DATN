"use client";

interface CameraSelectProps {
  videoInputs: MediaDeviceInfo[];
  selectedVideoId: string;
  setSelectedVideoId: (id: string) => void;
}

export default function CameraSelect({ videoInputs, selectedVideoId, setSelectedVideoId }: CameraSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted-foreground">Camera</label>
      <select
        className="h-9 rounded-md border bg-background px-2 text-sm"
        value={selectedVideoId}
        onChange={(e) => setSelectedVideoId(e.target.value)}
        onBlur={(e) => setSelectedVideoId(e.target.value)}
        disabled={!videoInputs.length}
      >
        {videoInputs.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `Camera ${d.deviceId.slice(0, 4)}`}
          </option>
        ))}
      </select>
    </div>
  );
}
