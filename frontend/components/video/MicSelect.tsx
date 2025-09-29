"use client";

interface MicSelectProps {
  audioInputs: MediaDeviceInfo[];
  selectedAudioId: string;
  setSelectedAudioId: (id: string) => void;
}

export default function MicSelect({ audioInputs, selectedAudioId, setSelectedAudioId }: MicSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted-foreground">Microphone</label>
      <select
        className="h-9 rounded-md border bg-background px-2 text-sm"
        value={selectedAudioId}
        onChange={(e) => setSelectedAudioId(e.target.value)}
        onBlur={(e) => setSelectedAudioId(e.target.value)}
        disabled={!audioInputs.length}
      >
        {audioInputs.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `Mic ${d.deviceId.slice(0, 4)}`}
          </option>
        ))}
      </select>
    </div>
  );
}
