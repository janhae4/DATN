"use client";

import { useCallback } from "react";

interface ActionsProps {
  id: string;
}

export default function Actions({ id }: ActionsProps) {
  const onJoin = useCallback(() => {
    // TODO: replace with your real join logic (e.g., navigate to RTC room, open SDK, etc.)
    alert(`Join meeting ${id}`);
  }, [id]);

  const onCopy = useCallback(async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : `"/meeting/${id}"`;
      await navigator.clipboard.writeText(url);
      alert("Meeting link copied to clipboard!");
    } catch (e) {
      alert("Failed to copy link");
    }
  }, [id]);

  return (
    <div className="flex gap-3">
      <button
        type="button"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        onClick={onJoin}
      >
        Join
      </button>
      <button
        type="button"
        className="rounded border px-4 py-2 hover:bg-gray-50"
        onClick={onCopy}
      >
        Copy Link
      </button>
    </div>
  );
}
