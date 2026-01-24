"use client";

import { useEffect, useState } from "react";

import DailyIframe, { type DailyCall } from "@daily-co/daily-js";
import { DailyProvider } from "@daily-co/daily-react";
import { Loader2 } from "lucide-react";

import { CallUI } from "./call-ui";
import type { VideoCallProps } from "./types";

// Module-level singleton to handle React Strict Mode
let globalCallObject: DailyCall | null = null;

export function VideoCall(props: VideoCallProps) {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);

  useEffect(() => {
    if (!globalCallObject) {
      globalCallObject = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: true,
      });
    }

    setCallObject(globalCallObject);

    return () => {
      // Don't destroy here - let it persist for Strict Mode
    };
  }, []);

  if (!callObject) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <DailyProvider callObject={callObject}>
      <CallUI {...props} />
    </DailyProvider>
  );
}
