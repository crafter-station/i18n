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
  roomId: string;
  username: string;
}

export function useTranscription({
  preferredLanguage,
  roomId,
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

    const isOwnTranscription = participantId === localParticipant?.session_id;
    const participant = daily?.participants()?.[participantId];
    
    // Use passed username for own transcriptions, fallback to participant data
    const speakerName = isOwnTranscription
      ? username
      : participant?.user_name || "Participant";
    const displayName = isOwnTranscription ? `${speakerName} (You)` : speakerName;

    // Show live transcript
    setLiveTranscript({ speaker: displayName, text });

    if (!isFinal) return;

    // Clear live transcript after delay
    setTimeout(() => setLiveTranscript(null), 1500);

    // Own transcriptions: show without translation
    if (isOwnTranscription) {
      const entry: TranscriptEntry = {
        id: crypto.randomUUID(),
        speaker: displayName,
        original: text,
        translated: text,
        timestamp: new Date(),
      };
      setTranscripts((prev) => [...prev.slice(-20), entry]);
      return;
    }

    // Translate others' transcriptions
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          fromLang: "auto",
          toLang: preferredLanguage,
          roomId,
          participantId,
          speakerName,
        }),
      });

      const { translatedText } = await res.json();

      const entry: TranscriptEntry = {
        id: crypto.randomUUID(),
        speaker: speakerName,
        original: text,
        translated: translatedText,
        timestamp: new Date(),
      };

      setTranscripts((prev) => [...prev.slice(-20), entry]);
      setCurrentTranslation(translatedText);
      playTTS(translatedText, preferredLanguage);

      setTimeout(() => setCurrentTranslation(null), 3000);
    } catch (error) {
      console.error("[Translation] Error:", error);
    }
  });

  const startTranscription = useCallback(async () => {
    if (!daily) return;

    try {
      await daily.startTranscription({
        language: "multi",
        model: "nova-2",
        punctuate: true,
        profanity_filter: false,
      });
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
