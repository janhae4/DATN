"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";

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
      const url = typeof window !== "undefined" ? window.location.href : `/meeting/${id}`;
      await navigator.clipboard.writeText(url);
      alert("Meeting link copied to clipboard!");
    } catch (e) {
      alert("Failed to copy link");
    }
  }, [id]);

  return (
    <div className="flex gap-3">
      <Button onClick={onJoin}>Join</Button>
      <Button variant="outline" onClick={onCopy}>Copy Link</Button>
    </div>
  );
}
