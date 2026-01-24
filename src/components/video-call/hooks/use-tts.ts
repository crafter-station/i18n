"use client";

import { useRef, useCallback } from "react";

export function useTTS() {
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

  const playNextAudio = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const url = audioQueueRef.current.shift()!;
    const audio = new Audio(url);
    console.log("[TTS] Playing audio...");

    audio.onended = () => {
      console.log("[TTS] Audio finished");
      URL.revokeObjectURL(url);
      playNextAudio();
    };

    audio.onerror = (e) => {
      console.error("[TTS] Audio playback error:", e);
      URL.revokeObjectURL(url);
      playNextAudio();
    };

    audio.play().catch((err) => {
      console.error("[TTS] Play failed:", err);
      playNextAudio();
    });
  }, []);

  const playTTS = useCallback(
    async (text: string, language: string) => {
      try {
        console.log("[TTS] Generating audio:", { text: text.slice(0, 50), language });
        
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language }),
        });

        if (!res.ok) {
          console.error("[TTS] API error:", res.status);
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audioQueueRef.current.push(url);
        console.log("[TTS] Audio queued, queue size:", audioQueueRef.current.length);

        if (!isPlayingRef.current) {
          playNextAudio();
        }
      } catch (error) {
        console.error("[TTS] Error:", error);
      }
    },
    [playNextAudio]
  );

  return { playTTS };
}
