"use client";

import { useCallback, useState } from "react";

import {
  useDaily,
  useDailyEvent,
  useLocalParticipant,
} from "@daily-co/daily-react";

import type {
  LiveTranscript,
  TranscriptEntry,
  TranscriptionStatus,
} from "../types";
import { useTTS } from "./use-tts";

interface UseTranscriptionOptions {
  preferredLanguage: string;
  isMuted: boolean;
}

export function useTranscription({
  preferredLanguage,
}: UseTranscriptionOptions) {
  const daily = useDaily();
  const localParticipant = useLocalParticipant();
  const { playTTS } = useTTS();

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [liveTranscript, setLiveTranscript] = useState<LiveTranscript | null>(
    null,
  );
  const [currentTranslation, setCurrentTranslation] = useState<string | null>(
    null,
  );
  const [transcriptionStatus, setTranscriptionStatus] =
    useState<TranscriptionStatus>("starting");

  // Transcription lifecycle events
  useDailyEvent("transcription-started", (event) => {
    console.log("[Daily] Transcription started:", event);
    setTranscriptionStatus("active");
  });

  useDailyEvent("transcription-stopped", () => {
    console.log("[Daily] Transcription stopped");
    setTranscriptionStatus("stopped");
  });

  useDailyEvent("transcription-error", (event) => {
    console.error("[Daily] Transcription error:", event);
    setTranscriptionStatus("error");
  });

  // Handle transcription messages
  useDailyEvent("transcription-message", async (event) => {
    if (!event?.text) return;

    const { text, participantId } = event;
    const isFinal = event.rawResponse?.is_final ?? true;

    // Multiple ways to detect own transcription for reliability
    const isOwnTranscription =
      participantId === localParticipant?.session_id ||
      (event as { participant?: { local?: boolean } }).participant?.local ===
        true;

    // Skip own transcriptions entirely - user should never hear themselves
    if (isOwnTranscription) {
      console.log("[Transcription] Skipping own transcription");
      return;
    }

    const participant = daily?.participants()?.[participantId];
    const speakerName = participant?.user_name || "Participant";

    // Only process final transcriptions for TTS (avoid duplicates)
    if (!isFinal) {
      // Show live preview with original text
      setLiveTranscript({ speaker: speakerName, text });
      return;
    }

    // Get translated text from Daily's translation feature (singular 'translation', not 'translations')
    const translatedText =
      (event as { translation?: { text?: string } }).translation?.text || text;

    // Debug logging
    console.log("[Transcription] Processing:", {
      speaker: speakerName,
      original: text.slice(0, 50),
      translated: translatedText.slice(0, 50),
      preferredLanguage,
      hasTranslation: !!(event as { translation?: { text?: string } })
        .translation?.text,
    });

    // Show translated text in live transcript
    setLiveTranscript({ speaker: speakerName, text: translatedText });

    // Clear live transcript after delay
    setTimeout(() => setLiveTranscript(null), 1500);

    const entry: TranscriptEntry = {
      id: crypto.randomUUID(),
      speaker: speakerName,
      original: text,
      translated: translatedText,
      timestamp: new Date(),
    };

    setTranscripts((prev) => [...prev.slice(-20), entry]);

    // Play TTS for other participants' messages in user's preferred language
    console.log("[Transcription] Playing TTS:", {
      text: translatedText.slice(0, 30),
      language: preferredLanguage,
    });

    setCurrentTranslation(translatedText);
    playTTS(translatedText, preferredLanguage);
    setTimeout(() => setCurrentTranslation(null), 3000);
  });

  const startTranscription = useCallback(async () => {
    if (!daily) return;

    try {
      // Request translation to user's preferred language only
      // Type cast needed as 'translations' is not in SDK types yet
      await daily.startTranscription({
        language: "multi",
        model: "nova-2",
        punctuate: true,
        profanity_filter: false,
        translations: {
          [preferredLanguage]: "*",
        },
      } as Parameters<typeof daily.startTranscription>[0]);
      console.log(
        "[Daily] Transcription started with translation to:",
        preferredLanguage,
      );
    } catch (error) {
      console.error("[Daily] Failed to start transcription:", error);
      setTranscriptionStatus("error");
    }
  }, [daily, preferredLanguage]);

  const stopTranscription = useCallback(() => {
    if (!daily) return;
    daily.stopTranscription();
  }, [daily]);

  return {
    transcripts,
    liveTranscript,
    currentTranslation,
    transcriptionStatus,
    startTranscription,
    stopTranscription,
  };
}
