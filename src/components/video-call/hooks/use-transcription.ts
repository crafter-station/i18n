"use client";

import { useCallback, useState } from "react";

import {
  useDaily,
  useDailyEvent,
  useLocalParticipant,
} from "@daily-co/daily-react";

import { type LanguageCode, SUPPORTED_LANGUAGES } from "@/lib/languages";

import type {
  LiveTranscript,
  TranscriptEntry,
  TranscriptionStatus,
} from "../types";
import { useTTS } from "./use-tts";

interface UseTranscriptionOptions {
  preferredLanguage: LanguageCode;
}

// Translate using Groq when Daily's translations aren't available
async function translateWithGroq(
  text: string,
  targetLanguage: string,
): Promise<string> {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLanguage }),
    });

    if (!res.ok) return text;

    const { translatedText } = await res.json();
    return translatedText || text;
  } catch {
    return text;
  }
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
  useDailyEvent("transcription-started", () => {
    setTranscriptionStatus("active");
  });

  useDailyEvent("transcription-stopped", () => {
    setTranscriptionStatus("stopped");
  });

  useDailyEvent("transcription-error", () => {
    setTranscriptionStatus("error");
  });

  // Handle transcription messages
  useDailyEvent("transcription-message", async (event) => {
    if (!event?.text) return;

    const { text, participantId } = event;
    const isFinal = event.rawResponse?.is_final ?? true;

    // Skip own transcriptions
    if (participantId === localParticipant?.session_id) return;

    const participant = daily?.participants()?.[participantId];
    const speakerName = participant?.user_name || "Participant";

    // For non-final transcriptions, show live preview
    if (!isFinal) {
      setLiveTranscript({ speaker: speakerName, text });
      return;
    }

    // Try Daily translation first, fallback to Groq
    const translations = (event as { translations?: Record<string, string> })
      .translations;
    const translatedText =
      translations?.[preferredLanguage] ||
      (await translateWithGroq(text, preferredLanguage));

    // Update UI and play TTS in parallel
    setLiveTranscript({ speaker: speakerName, text: translatedText });
    setCurrentTranslation(translatedText);

    // Start TTS immediately (don't wait)
    playTTS(translatedText, preferredLanguage);

    // Add to transcript history
    setTranscripts((prev) => [
      ...prev.slice(-20),
      {
        id: crypto.randomUUID(),
        speaker: speakerName,
        original: text,
        translated: translatedText,
        timestamp: new Date(),
      },
    ]);

    // Clear UI states after delay
    setTimeout(() => setLiveTranscript(null), 1500);
    setTimeout(() => setCurrentTranslation(null), 3000);
  });

  const startTranscription = useCallback(async () => {
    if (!daily) return;

    try {
      const translationsConfig = Object.fromEntries(
        SUPPORTED_LANGUAGES.map((lang) => [lang.code, "*"]),
      );

      await daily.startTranscription({
        language: "multi",
        model: "nova-2",
        punctuate: true,
        profanity_filter: false,
        includeRawResponse: true,
        translations: translationsConfig,
      } as Parameters<typeof daily.startTranscription>[0]);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.toLowerCase().includes("already") ||
        errorMessage.toLowerCase().includes("in progress")
      ) {
        setTranscriptionStatus("active");
      } else {
        console.error("[Transcription] Failed to start:", error);
        setTranscriptionStatus("error");
      }
    }
  }, [daily]);

  const stopTranscription = useCallback(() => {
    daily?.stopTranscription();
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
