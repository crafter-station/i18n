"use client";

import { useState, useCallback } from "react";
import { useDaily, useDailyEvent, useLocalParticipant } from "@daily-co/daily-react";

import type {
  TranscriptEntry,
  LiveTranscript,
  TranscriptionStatus,
} from "../types";
import { useTTS } from "./use-tts";

interface UseTranscriptionOptions {
  preferredLanguage: string;
  username: string;
}

export function useTranscription({
  preferredLanguage,
  username,
}: UseTranscriptionOptions) {
  const daily = useDaily();
  const localParticipant = useLocalParticipant();
  const { playTTS } = useTTS();

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [liveTranscript, setLiveTranscript] = useState<LiveTranscript | null>(null);
  const [currentTranslation, setCurrentTranslation] = useState<string | null>(null);
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

    // Get translated text if available, fallback to original
    const translatedText =
      (event as { translation?: { text?: string } }).translation?.text || text;

    const isOwnTranscription = participantId === localParticipant?.session_id;
    const participant = daily?.participants()?.[participantId];

    // Use passed username for own transcriptions, fallback to participant data
    const speakerName = isOwnTranscription
      ? username
      : participant?.user_name || "Participant";
    const displayName = isOwnTranscription ? `${speakerName} (You)` : speakerName;

    // Show live transcript (translated for others, original for self)
    const liveText = isOwnTranscription ? text : translatedText;
    setLiveTranscript({ speaker: displayName, text: liveText });

    if (!isFinal) return;

    // Clear live transcript after delay
    setTimeout(() => setLiveTranscript(null), 1500);

    const entry: TranscriptEntry = {
      id: crypto.randomUUID(),
      speaker: isOwnTranscription ? displayName : speakerName,
      original: text,
      translated: translatedText,
      timestamp: new Date(),
    };

    setTranscripts((prev) => [...prev.slice(-20), entry]);

    // Play TTS for other participants' messages in user's preferred language
    if (!isOwnTranscription) {
      setCurrentTranslation(translatedText);
      playTTS(translatedText, preferredLanguage);
      setTimeout(() => setCurrentTranslation(null), 3000);
    }
  });

  const startTranscription = useCallback(async () => {
    if (!daily) return;

    try {
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
      console.log("[Daily] Transcription started with translation to:", preferredLanguage);
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
