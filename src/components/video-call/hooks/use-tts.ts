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

    audio.onended = () => {
      URL.revokeObjectURL(url);
      playNextAudio();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      playNextAudio();
    };

    audio.play().catch(() => playNextAudio());
  }, []);

  const playTTS = useCallback(
    async (text: string, language: string) => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language }),
        });

        if (!res.ok) return;

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audioQueueRef.current.push(url);

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
