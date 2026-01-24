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
    console.log("[Transcription] Event received:", event);

    if (!event?.text) return;

    const { text, participantId } = event;
    const isFinal = event.rawResponse?.is_final ?? true;

    // Get translation for user's preferred language (translations is Record<langCode, text>)
    const translations = (event as { translations?: Record<string, string> })
      .translations;
    const translatedText = translations?.[preferredLanguage] ?? text;

    // Check if we have a valid translation (different from original)
    const hasTranslation =
      translations?.[preferredLanguage] !== undefined &&
      translations[preferredLanguage].length > 0;

    console.log("[Transcription] Translation check:", {
      preferredLanguage,
      hasTranslation,
      availableTranslations: translations ? Object.keys(translations) : null,
      original: text.slice(0, 30),
      translated: translatedText.slice(0, 30),
    });

    const isOwnTranscription = participantId === localParticipant?.session_id;
    const participant = daily?.participants()?.[participantId];

    const speakerName = isOwnTranscription
      ? username
      : participant?.user_name || "Participant";
    const displayName = isOwnTranscription
      ? `${speakerName} (You)`
      : speakerName;

    // Skip own transcriptions - user should never hear themselves
    if (isOwnTranscription) {
      console.log("[Transcription] Skipping own transcription");
      return;
    }

    // Show live transcript
    setLiveTranscript({ speaker: displayName, text: translatedText });

    if (!isFinal) return;

    setTimeout(() => setLiveTranscript(null), 1500);

    const entry: TranscriptEntry = {
      id: crypto.randomUUID(),
      speaker: speakerName,
      original: text,
      translated: translatedText,
      timestamp: new Date(),
    };

    setTranscripts((prev) => [...prev.slice(-20), entry]);

    // Play TTS for other participants (use translation if available, otherwise original)
    console.log("[Transcription] Playing TTS:", {
      speaker: speakerName,
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
      // Request translations for ALL supported languages so each user gets their preference
      const translationsConfig = Object.fromEntries(
        SUPPORTED_LANGUAGES.map((lang) => [lang.code, "*"]),
      );

      // Type cast needed as 'translations' is not in SDK types yet
      await daily.startTranscription({
        language: "multi",
        model: "nova-2",
        punctuate: true,
        profanity_filter: false,
        translations: translationsConfig,
      } as Parameters<typeof daily.startTranscription>[0]);
      console.log(
        "[Daily] Transcription started with translations for all languages",
      );
    } catch (error) {
      console.error("[Daily] Failed to start transcription:", error);
      setTranscriptionStatus("error");
    }
  }, [daily]);

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
