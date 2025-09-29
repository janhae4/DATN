"use client";

interface PermissionStatusProps {
  cameraPerm: string;
  micPerm: string;
}

export default function PermissionStatus({ cameraPerm, micPerm }: PermissionStatusProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Camera: <span className="font-medium">{cameraPerm}</span> · Mic: <span className="font-medium">{micPerm}</span>
      </p>
    </div>
  );
}
