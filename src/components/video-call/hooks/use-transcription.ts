"use client";

import { useCallback, useState } from "react";

import {
  useDaily,
  useDailyEvent,
  useLocalParticipant,
} from "@daily-co/daily-react";

import { SUPPORTED_LANGUAGES } from "@/lib/languages";

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

// Helper to find translation with fallback for language code variants
function getTranslationFromEvent(
  translations: Record<string, string> | undefined,
  lang: string,
): string | null {
  if (!translations) return null;

  // Exact match (e.g., "en")
  if (translations[lang]) return translations[lang];

  // Try language variant (e.g., "en" -> "en-US", "es" -> "es-ES")
  const variant = Object.keys(translations).find(
    (k) => k.startsWith(`${lang}-`) || k.startsWith(`${lang}_`),
  );
  if (variant) return translations[variant];

  // Try base language if full code provided (e.g., "en-US" -> "en")
  const baseLang = lang.split(/[-_]/)[0];
  if (baseLang !== lang && translations[baseLang]) {
    return translations[baseLang];
  }

  return null;
}

// Call our translation API using Groq
async function translateText(
  text: string,
  targetLanguage: string,
): Promise<string> {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLanguage }),
    });

    if (!res.ok) {
      console.error("[Translate] API error:", res.status);
      return text;
    }

    const { translatedText } = await res.json();
    return translatedText || text;
  } catch (error) {
    console.error("[Translate] Error:", error);
    return text;
  }
}

export function useTranscription({
  preferredLanguage,
  isMuted,
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

    // Only process final transcriptions for TTS (avoid duplicates)
    if (!isFinal) {
      // Show live preview with original text
      const participant = daily?.participants()?.[participantId];
      const speakerName = participant?.user_name || "Participant";
      setLiveTranscript({ speaker: speakerName, text });
      return;
    }

    const participant = daily?.participants()?.[participantId];
    const speakerName = participant?.user_name || "Participant";

    // Try to get translation from Daily's event first
    const translations = (event as { translations?: Record<string, string> })
      .translations;
    let translatedText = getTranslationFromEvent(
      translations,
      preferredLanguage,
    );

    // If Daily didn't provide translation, use our Groq-powered translation API
    if (!translatedText) {
      console.log("[Transcription] No Daily translation, using Groq API...");
      translatedText = await translateText(text, preferredLanguage);
    }

    // Debug logging
    console.log("[Transcription] Processing:", {
      speaker: speakerName,
      original: text.slice(0, 50),
      translated: translatedText.slice(0, 50),
      preferredLanguage,
      usedGroq: !getTranslationFromEvent(translations, preferredLanguage),
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
