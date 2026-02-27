"use client";

import { useCallback, useRef, useState } from "react";

import type { TargetLangCode } from "@palabra-ai/translator";

import { type LanguageCode, getTargetCode } from "@/lib/languages";

import type {
  LiveTranscript,
  TranscriptEntry,
  TranscriptionStatus,
} from "../types";

interface UseTranscriptionOptions {
  preferredLanguage: LanguageCode;
  username: string;
}

type PalabraClientInstance = {
  startTranslation: () => Promise<boolean>;
  stopTranslation: () => Promise<void>;
  startPlayback: () => Promise<void>;
  cleanup: () => Promise<void>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
  getConfigManager: () => {
    setValue: (path: string, value: unknown) => unknown;
  };
};

export function useTranscription({
  preferredLanguage,
  username,
}: UseTranscriptionOptions) {
  const clientRef = useRef<PalabraClientInstance | null>(null);

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [liveTranscript, setLiveTranscript] = useState<LiveTranscript | null>(
    null,
  );
  const [currentTranslation, setCurrentTranslation] = useState<string | null>(
    null,
  );
  const [transcriptionStatus, setTranscriptionStatus] =
    useState<TranscriptionStatus>("starting");

  const startTranscription = useCallback(async () => {
    try {
      // Fetch Palabra credentials from our API
      const authRes = await fetch("/api/palabra-auth");
      if (!authRes.ok) {
        console.error("[Palabra] Failed to fetch credentials");
        setTranscriptionStatus("error");
        return;
      }
      const { clientId, clientSecret } = await authRes.json();

      // Dynamic import (client-side only, like Espik)
      const { PalabraClient } = await import("@palabra-ai/translator");

      const targetCode = getTargetCode(preferredLanguage) as TargetLangCode;

      const client = new PalabraClient({
        auth: { clientId, clientSecret },
        translateFrom: "auto",
        translateTo: targetCode,
        handleOriginalTrack: async () => {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          return stream.getAudioTracks()[0];
        },
      }) as unknown as PalabraClientInstance;

      // Low-latency tuning via config manager
      try {
        const configManager = client.getConfigManager();
        configManager.setValue("pipeline.stt.vad_threshold", 0.3);
        configManager.setValue("pipeline.stt.min_silence_duration_ms", 200);
        configManager.setValue("pipeline.tts.queue_level", 1);
      } catch {
        // Config tuning is optional - continue if it fails
      }

      // Wire up event listeners
      client.on("transcriptionReceived", (data: unknown) => {
        const { transcription } = data as {
          transcription: { text: string; transcription_id: string };
        };
        if (!transcription?.text) return;

        setLiveTranscript({ speaker: username, text: transcription.text });
      });

      client.on("translationReceived", (data: unknown) => {
        const { transcription } = data as {
          transcription: { text: string; transcription_id: string };
        };
        if (!transcription?.text) return;

        const translatedText = transcription.text;

        setCurrentTranslation(translatedText);
        setLiveTranscript({ speaker: username, text: translatedText });

        // Add to transcript history
        setTranscripts((prev) => [
          ...prev.slice(-20),
          {
            id: transcription.transcription_id || crypto.randomUUID(),
            speaker: username,
            original: "",
            translated: translatedText,
            timestamp: new Date(),
          },
        ]);

        // Clear UI states after delay
        setTimeout(() => setLiveTranscript(null), 1500);
        setTimeout(() => setCurrentTranslation(null), 3000);
      });

      client.on("partialTranscriptionReceived", (data: unknown) => {
        const { transcription } = data as {
          transcription: { text: string };
        };
        if (!transcription?.text) return;
        setLiveTranscript({ speaker: username, text: transcription.text });
      });

      client.on("partialTranslatedTranscriptionReceived", (data: unknown) => {
        const { transcription } = data as {
          transcription: { text: string };
        };
        if (!transcription?.text) return;
        setLiveTranscript({ speaker: username, text: transcription.text });
      });

      client.on("errorReceived", (data: unknown) => {
        const error = data as { code: string; description: string };
        console.error("[Palabra] Error:", error.code, error.description);
        setTranscriptionStatus("error");
      });

      // Start translation and playback
      const started = await client.startTranslation();
      if (started) {
        await client.startPlayback();
        clientRef.current = client;
        setTranscriptionStatus("active");
      } else {
        console.error("[Palabra] Failed to start translation");
        setTranscriptionStatus("error");
      }
    } catch (error) {
      console.error("[Palabra] Failed to start:", error);
      setTranscriptionStatus("error");
    }
  }, [preferredLanguage, username]);

  const stopTranscription = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;

    try {
      await client.stopTranslation();
      await client.cleanup();
    } catch (error) {
      console.error("[Palabra] Failed to stop:", error);
    } finally {
      clientRef.current = null;
      setTranscriptionStatus("stopped");
    }
  }, []);

  return {
    transcripts,
    liveTranscript,
    currentTranslation,
    transcriptionStatus,
    startTranscription,
    stopTranscription,
  };
}
