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

    const isOwnTranscription = participantId === localParticipant?.session_id;

    // Skip own transcriptions - user should never hear themselves
    if (isOwnTranscription) {
      console.log("[Transcription] Skipping own transcription");
      return;
    }

    const participant = daily?.participants()?.[participantId];
    const speakerName = participant?.user_name || "Participant";

    // For non-final transcriptions, just show live preview with original text
    if (!isFinal) {
      setLiveTranscript({ speaker: speakerName, text });
      return;
    }

    // Try to get translation from Daily first
    const translations = (event as { translations?: Record<string, string> })
      .translations;
    let translatedText = translations?.[preferredLanguage];

    // If no Daily translation, use Groq
    if (!translatedText) {
      console.log("[Transcription] No Daily translation, using Groq...");
      translatedText = await translateWithGroq(text, preferredLanguage);
    }

    console.log("[Transcription] Processing:", {
      speaker: speakerName,
      original: text.slice(0, 30),
      translated: translatedText.slice(0, 30),
      usedGroq: !translations?.[preferredLanguage],
    });

    // Show translated text in live transcript
    setLiveTranscript({ speaker: speakerName, text: translatedText });
    setTimeout(() => setLiveTranscript(null), 1500);

    const entry: TranscriptEntry = {
      id: crypto.randomUUID(),
      speaker: speakerName,
      original: text,
      translated: translatedText,
      timestamp: new Date(),
    };

    setTranscripts((prev) => [...prev.slice(-20), entry]);

    // Play TTS with translated text
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
        includeRawResponse: true,
        translations: translationsConfig,
      } as Parameters<typeof daily.startTranscription>[0]);
      console.log(
        "[Daily] Transcription started with translations for all languages",
      );
    } catch (error: unknown) {
      // If transcription is already running (started by another participant), that's fine
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.toLowerCase().includes("already") ||
        errorMessage.toLowerCase().includes("in progress")
      ) {
        console.log(
          "[Daily] Transcription already running, not overriding config",
        );
        setTranscriptionStatus("active");
      } else {
        console.error("[Daily] Failed to start transcription:", error);
        setTranscriptionStatus("error");
      }
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
