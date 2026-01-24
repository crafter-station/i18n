"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { EmailAction, IntentDetectionResponse } from "@/lib/agent-schemas";

import type { TranscriptEntry } from "../types";

interface UseIntentDetectionOptions {
  roomId: string;
  transcripts: TranscriptEntry[];
  enabled?: boolean;
  pollingInterval?: number;
  minTranscripts?: number;
}

interface UseIntentDetectionResult {
  detectedEmail: EmailAction | null;
  isDetecting: boolean;
  dismissEmail: () => void;
  clearDismissed: () => void;
}

export function useIntentDetection({
  roomId,
  transcripts,
  enabled = true,
  pollingInterval = 2000,
  minTranscripts = 3,
}: UseIntentDetectionOptions): UseIntentDetectionResult {
  const [detectedEmail, setDetectedEmail] = useState<EmailAction | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Track dismissed actions to avoid re-triggering
  const dismissedActionsRef = useRef<Set<string>>(new Set());
  // Track last processed transcript count to avoid redundant calls
  const lastProcessedCountRef = useRef(0);
  // Track if popup is open (to pause polling)
  const isPopupOpenRef = useRef(false);

  const detectIntent = useCallback(async () => {
    if (!enabled || transcripts.length < minTranscripts) return;
    if (isPopupOpenRef.current) return;

    // Skip if no new transcripts since last check
    if (transcripts.length === lastProcessedCountRef.current) return;

    setIsDetecting(true);

    try {
      const response = await fetch(`/api/agent/${roomId}/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcripts: transcripts.slice(-10) }),
      });

      if (!response.ok) {
        throw new Error("Intent detection failed");
      }

      const result: IntentDetectionResponse = await response.json();
      lastProcessedCountRef.current = transcripts.length;

      if (
        result.hasEmailIntent &&
        result.confidence === "high" &&
        result.action
      ) {
        // Check if already dismissed
        const actionKey = `${result.action.metadata.subject}_${result.action.metadata.emailBody.slice(0, 50)}`;

        if (!dismissedActionsRef.current.has(actionKey)) {
          setDetectedEmail(result.action);
          isPopupOpenRef.current = true;
        }
      }
    } catch (error) {
      console.error("[IntentDetection] Error:", error);
    } finally {
      setIsDetecting(false);
    }
  }, [enabled, roomId, transcripts, minTranscripts]);

  // Polling effect
  useEffect(() => {
    if (!enabled || transcripts.length < minTranscripts) return;

    const intervalId = setInterval(detectIntent, pollingInterval);

    return () => clearInterval(intervalId);
  }, [enabled, detectIntent, pollingInterval, transcripts.length, minTranscripts]);

  const dismissEmail = useCallback(() => {
    if (detectedEmail) {
      const actionKey = `${detectedEmail.metadata.subject}_${detectedEmail.metadata.emailBody.slice(0, 50)}`;
      dismissedActionsRef.current.add(actionKey);
    }
    setDetectedEmail(null);
    isPopupOpenRef.current = false;
  }, [detectedEmail]);

  const clearDismissed = useCallback(() => {
    dismissedActionsRef.current.clear();
  }, []);

  return {
    detectedEmail,
    isDetecting,
    dismissEmail,
    clearDismissed,
  };
}
