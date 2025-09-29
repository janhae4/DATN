"use client";

interface ErrorBoxProps {
  error: string | null;
}

export default function ErrorBox({ error }: ErrorBoxProps) {
  if (!error) return null;
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      {error}
    </div>
  );
}
