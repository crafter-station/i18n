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
    if (!event?.text) return;

    const { text, participantId } = event;
    const isFinal = event.rawResponse?.is_final ?? true;

    // STRICT: Get translation ONLY for user's exact preferred language
    const translations = (event as { translations?: Record<string, string> })
      .translations;
    const translatedText = translations?.[preferredLanguage];

    // If no translation available for the exact language, skip TTS but still show original
    const hasTranslation =
      translatedText !== undefined && translatedText.length > 0;

    if (!hasTranslation && translations) {
      console.warn(
        `[Transcription] No translation for "${preferredLanguage}". Available: ${Object.keys(translations).join(", ")}`,
      );
    }

    const isOwnTranscription = participantId === localParticipant?.session_id;
    const participant = daily?.participants()?.[participantId];

    const speakerName = isOwnTranscription
      ? username
      : participant?.user_name || "Participant";
    const displayName = isOwnTranscription
      ? `${speakerName} (You)`
      : speakerName;

    // Show live transcript: translated for others (in their language), original for self
    const liveText = isOwnTranscription ? text : (translatedText ?? text);
    setLiveTranscript({ speaker: displayName, text: liveText });

    if (!isFinal) return;

    setTimeout(() => setLiveTranscript(null), 1500);

    const entry: TranscriptEntry = {
      id: crypto.randomUUID(),
      speaker: isOwnTranscription ? displayName : speakerName,
      original: text,
      translated: translatedText ?? text,
      timestamp: new Date(),
    };

    setTranscripts((prev) => [...prev.slice(-20), entry]);

    // STRICT: Play TTS ONLY if we have a translation in the exact preferred language
    if (!isOwnTranscription && hasTranslation) {
      setCurrentTranslation(translatedText);
      playTTS(translatedText, preferredLanguage);
      setTimeout(() => setCurrentTranslation(null), 3000);
    }
  });

  const startTranscription = useCallback(async () => {
    if (!daily) return;

    try {
      // Request translations for all supported languages so each user gets their preference
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
