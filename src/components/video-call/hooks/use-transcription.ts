"use client";

import { useCallback, useRef, useState } from "react";

import { nanoid } from "nanoid";

import { type LanguageCode, getTargetCode } from "@/lib/languages";

import type {
  LiveTranscript,
  TranscriptEntry,
  TranscriptionStatus,
} from "../types";

interface UseTranscriptionOptions {
  spokenLanguage: LanguageCode;
  preferredLanguage: LanguageCode;
  username: string;
}

type PalabraClientInstance = {
  startTranslation: () => Promise<boolean>;
  stopTranslation: () => Promise<void>;
  startPlayback: () => Promise<void>;
  cleanup: () => Promise<void>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
  getConfigManager: () => {
    setValue: (path: string, value: unknown) => unknown;
  };
};

export function useTranscription({
  spokenLanguage,
  preferredLanguage,
  username,
}: UseTranscriptionOptions) {
  // Remote client: translates remote audio → TTS playback
  const remoteClientRef = useRef<PalabraClientInstance | null>(null);
  // Local client: transcribes your mic → text only, no TTS
  const localClientRef = useRef<PalabraClientInstance | null>(null);
  const localTrackRef = useRef<MediaStreamTrack | null>(null);

  // AudioContext mixer for combining remote audio tracks
  const audioContextRef = useRef<AudioContext | null>(null);
  const mixerDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const sourceNodesRef = useRef<
    Map<string, MediaStreamAudioSourceNode>
  >(new Map());

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [liveTranscript, setLiveTranscript] = useState<LiveTranscript | null>(
    null,
  );
  const [currentTranslation, setCurrentTranslation] = useState<string | null>(
    null,
  );
  const [transcriptionStatus, setTranscriptionStatus] =
    useState<TranscriptionStatus>("starting");

  const startTranscription = useCallback(async () => {
    try {
      // Create AudioContext to mix remote participant audio
      const audioContext = new AudioContext();
      const mixerDest = audioContext.createMediaStreamDestination();
      audioContextRef.current = audioContext;
      mixerDestRef.current = mixerDest;

      // Fetch Palabra credentials from our API
      const authRes = await fetch("/api/palabra-auth");
      if (!authRes.ok) {
        console.error("[Palabra] Failed to fetch credentials");
        setTranscriptionStatus("error");
        return;
      }
      const { clientId, clientSecret } = await authRes.json();

      // Dynamic import (client-side only)
      const { PalabraClient } = await import("@palabra-ai/translator");

      const targetCode = getTargetCode(preferredLanguage) as Parameters<
        typeof PalabraClient.prototype.setTranslateTo
      >[0];
      const sourceCode = spokenLanguage as Parameters<
        typeof PalabraClient.prototype.setTranslateFrom
      >[0];

      // ─── Remote client: translates others' speech → TTS playback ───
      const remoteClient = new PalabraClient({
        auth: { clientId, clientSecret },
        translateFrom: "auto" as Parameters<
          typeof PalabraClient.prototype.setTranslateFrom
        >[0],
        translateTo: targetCode,
        handleOriginalTrack: async () => {
          // Mixed remote audio track
          return mixerDest.stream.getAudioTracks()[0];
        },
      }) as unknown as PalabraClientInstance;

      try {
        const cfg = remoteClient.getConfigManager();
        cfg.setValue("pipeline.stt.vad_threshold", 0.3);
        cfg.setValue("pipeline.stt.min_silence_duration_ms", 200);
        cfg.setValue("pipeline.tts.queue_level", 1);
      } catch {
        // optional
      }

      remoteClient.on("transcriptionReceived", (data: unknown) => {
        const { transcription } = data as {
          transcription: { text: string; transcription_id: string };
        };
        if (!transcription?.text) return;
        setLiveTranscript({ speaker: "Remote", text: transcription.text });
      });

      remoteClient.on("translationReceived", (data: unknown) => {
        const { transcription } = data as {
          transcription: { text: string; transcription_id: string };
        };
        if (!transcription?.text) return;

        const translatedText = transcription.text;
        setCurrentTranslation(translatedText);
        setLiveTranscript({ speaker: "Remote", text: translatedText });

        setTranscripts((prev) => [
          ...prev.slice(-50),
          {
            id: transcription.transcription_id || nanoid(),
            speaker: "Remote",
            original: "",
            translated: translatedText,
            timestamp: new Date(),
          },
        ]);

        setTimeout(() => setLiveTranscript(null), 1500);
        setTimeout(() => setCurrentTranslation(null), 3000);
      });

      remoteClient.on("partialTranscriptionReceived", (data: unknown) => {
        const { transcription } = data as {
          transcription: { text: string };
        };
        if (!transcription?.text) return;
        setLiveTranscript({ speaker: "Remote", text: transcription.text });
      });

      remoteClient.on(
        "partialTranslatedTranscriptionReceived",
        (data: unknown) => {
          const { transcription } = data as {
            transcription: { text: string };
          };
          if (!transcription?.text) return;
          setLiveTranscript({ speaker: "Remote", text: transcription.text });
        },
      );

      remoteClient.on("errorReceived", (data: unknown) => {
        const error = data as { code: string; description: string };
        console.error("[Palabra Remote] Error:", error.code, error.description);
      });

      // ─── Local client: transcribes YOUR mic → text only, NO TTS ───
      const localClient = new PalabraClient({
        auth: { clientId, clientSecret },
        translateFrom: sourceCode,
        translateTo: targetCode,
        handleOriginalTrack: async () => {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const track = stream.getAudioTracks()[0];
          localTrackRef.current = track;
          return track;
        },
      }) as unknown as PalabraClientInstance;

      localClient.on("transcriptionReceived", (data: unknown) => {
        const { transcription } = data as {
          transcription: { text: string; transcription_id: string };
        };
        if (!transcription?.text) return;

        // Show your own speech in the transcript
        setTranscripts((prev) => [
          ...prev.slice(-50),
          {
            id: transcription.transcription_id || nanoid(),
            speaker: username,
            original: transcription.text,
            translated: transcription.text,
            timestamp: new Date(),
          },
        ]);
      });

      localClient.on("partialTranscriptionReceived", (data: unknown) => {
        const { transcription } = data as {
          transcription: { text: string };
        };
        if (!transcription?.text) return;
        setLiveTranscript({ speaker: username, text: transcription.text });
      });

      localClient.on("errorReceived", (data: unknown) => {
        const error = data as { code: string; description: string };
        console.error("[Palabra Local] Error:", error.code, error.description);
      });

      // ─── Start both clients ───
      const [remoteStarted, localStarted] = await Promise.all([
        remoteClient.startTranslation(),
        localClient.startTranslation(),
      ]);

      if (remoteStarted) {
        // Only remote client plays TTS (translated audio of others)
        await remoteClient.startPlayback();
        remoteClientRef.current = remoteClient;
      } else {
        console.error("[Palabra] Failed to start remote translation");
      }

      if (localStarted) {
        // NO startPlayback() — we don't want to hear our own translation
        localClientRef.current = localClient;
      } else {
        console.error("[Palabra] Failed to start local transcription");
      }

      setTranscriptionStatus(
        remoteStarted || localStarted ? "active" : "error",
      );
    } catch (error) {
      console.error("[Palabra] Failed to start:", error);
      setTranscriptionStatus("error");
    }
  }, [spokenLanguage, preferredLanguage, username]);

  const stopTranscription = useCallback(async () => {
    // Stop remote client
    const remote = remoteClientRef.current;
    if (remote) {
      try {
        await remote.stopTranslation();
        await remote.cleanup();
      } catch (error) {
        console.error("[Palabra Remote] Failed to stop:", error);
      } finally {
        remoteClientRef.current = null;
      }
    }

    // Stop local client
    const local = localClientRef.current;
    if (local) {
      try {
        await local.stopTranslation();
        await local.cleanup();
      } catch (error) {
        console.error("[Palabra Local] Failed to stop:", error);
      } finally {
        localClientRef.current = null;
      }
    }

    // Stop local mic track
    const track = localTrackRef.current;
    if (track) {
      track.stop();
      localTrackRef.current = null;
    }

    // Clean up AudioContext
    const ctx = audioContextRef.current;
    if (ctx) {
      for (const source of sourceNodesRef.current.values()) {
        source.disconnect();
      }
      sourceNodesRef.current.clear();
      await ctx.close();
      audioContextRef.current = null;
      mixerDestRef.current = null;
    }

    setTranscriptionStatus("stopped");
  }, []);

  // Mute/unmute the local mic track (for Palabra transcription)
  const setMuted = useCallback((muted: boolean) => {
    const track = localTrackRef.current;
    if (track) {
      track.enabled = !muted;
    }
  }, []);

  // Connect a remote participant's audio track to the Palabra mixer
  const addRemoteTrack = useCallback(
    (participantId: string, track: MediaStreamTrack) => {
      const ctx = audioContextRef.current;
      const dest = mixerDestRef.current;
      if (!ctx || !dest) return;

      // Remove existing source for this participant if any
      const existing = sourceNodesRef.current.get(participantId);
      if (existing) {
        existing.disconnect();
      }

      const source = ctx.createMediaStreamSource(new MediaStream([track]));
      source.connect(dest);
      sourceNodesRef.current.set(participantId, source);
    },
    [],
  );

  // Disconnect a remote participant's audio track from the mixer
  const removeRemoteTrack = useCallback((participantId: string) => {
    const source = sourceNodesRef.current.get(participantId);
    if (source) {
      source.disconnect();
      sourceNodesRef.current.delete(participantId);
    }
  }, []);

  return {
    transcripts,
    liveTranscript,
    currentTranslation,
    transcriptionStatus,
    startTranscription,
    stopTranscription,
    setMuted,
    addRemoteTrack,
    removeRemoteTrack,
  };
}
