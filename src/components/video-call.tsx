"use client";

import {
  DailyProvider,
  useDaily,
  useDailyEvent,
  useLocalParticipant,
  useParticipantIds,
  useVideoTrack,
  useAudioTrack,
} from "@daily-co/daily-react";
import DailyIframe, { type DailyCall } from "@daily-co/daily-js";
import { useCallback, useEffect, useState, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgentPanel } from "@/components/agent-panel";
import { getLanguageFlag, getLanguageName } from "@/lib/languages";

interface VideoCallProps {
  roomUrl: string;
  token: string;
  preferredLanguage: string;
  username: string;
  visitorId: string;
  roomId: string;
}

// Module-level singleton to handle React Strict Mode
let globalCallObject: DailyCall | null = null;

export function VideoCall(props: VideoCallProps) {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);

  useEffect(() => {
    // Use existing instance or create new one
    if (!globalCallObject) {
      globalCallObject = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: true,
      });
    }

    setCallObject(globalCallObject);

    // Cleanup only on actual unmount (not Strict Mode remount)
    return () => {
      // Don't destroy here - let it persist for Strict Mode
      // The call will be cleaned up when leaving the page
    };
  }, []);

  if (!callObject) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <DailyProvider callObject={callObject}>
      <CallUI {...props} />
    </DailyProvider>
  );
}

interface TranscriptEntry {
  id: string;
  speaker: string;
  original: string;
  translated: string;
  timestamp: Date;
}

function CallUI({
  roomUrl,
  token,
  preferredLanguage,
  username,
  visitorId,
  roomId,
}: VideoCallProps) {
  const daily = useDaily();
  const localParticipant = useLocalParticipant();
  const participantIds = useParticipantIds({ filter: "remote" });

  const [isJoining, setIsJoining] = useState(true);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [currentTranslation, setCurrentTranslation] = useState<string | null>(
    null,
  );

  // Derive audio/video state from actual Daily participant state
  const isMuted = localParticipant?.audio === false;
  const isVideoOff = localParticipant?.video === false;

  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

  // Join the call
  useEffect(() => {
    if (!daily) return;

    const join = async () => {
      try {
        await daily.join({ url: roomUrl, token });
        setIsJoining(false);
      } catch (error) {
        console.error("Failed to join call:", error);
      }
    };

    join();

    return () => {
      daily.leave();
    };
  }, [daily, roomUrl, token]);

  // Handle app messages (for transcriptions from Daily)
  useDailyEvent("app-message", async (event) => {
    // Handle transcription messages
    if (event?.data?.is_final && event?.data?.text) {
      const { text, user_id, user_name } = event.data;

      // Skip own messages
      if (user_id === visitorId) return;

      // Translate the text
      try {
        const translateRes = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            fromLang: "auto", // TODO: detect language
            toLang: preferredLanguage,
            roomId,
            participantId: user_id,
            speakerName: user_name,
          }),
        });

        const { translatedText } = await translateRes.json();

        // Add to transcripts
        const entry: TranscriptEntry = {
          id: crypto.randomUUID(),
          speaker: user_name || "Unknown",
          original: text,
          translated: translatedText,
          timestamp: new Date(),
        };

        setTranscripts((prev) => [...prev.slice(-20), entry]);
        setCurrentTranslation(translatedText);

        // Play TTS
        playTTS(translatedText, preferredLanguage);

        // Clear current translation after 3 seconds
        setTimeout(() => setCurrentTranslation(null), 3000);
      } catch (error) {
        console.error("Translation error:", error);
      }
    }
  });

  // TTS playback with queue
  const playTTS = async (text: string, language: string) => {
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
      console.error("TTS error:", error);
    }
  };

  const playNextAudio = () => {
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
  };

  const toggleMute = useCallback(() => {
    if (!daily) return;
    // Toggle based on current actual state
    daily.setLocalAudio(isMuted);
  }, [daily, isMuted]);

  const toggleVideo = useCallback(() => {
    if (!daily) return;
    // Toggle based on current actual state
    daily.setLocalVideo(isVideoOff);
  }, [daily, isVideoOff]);

  const leaveCall = useCallback(() => {
    if (!daily) return;
    daily.leave();
    window.location.href = "/";
  }, [daily]);

  if (isJoining) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto" />
          <p className="text-white">Joining call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-900 flex flex-col overflow-hidden">
      {/* Translation overlay */}
      {currentTranslation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-6 py-3 rounded-lg max-w-xl text-center animate-fade-in">
          <p className="text-lg">{currentTranslation}</p>
        </div>
      )}

      {/* Video grid - takes remaining space */}
      <div className="flex-1 p-4 pb-0 overflow-hidden">
        <div
          className={`grid gap-4 h-full ${
            participantIds.length === 0
              ? "grid-cols-1"
              : participantIds.length === 1
                ? "grid-cols-2"
                : "grid-cols-2 grid-rows-2"
          }`}
        >
          {/* Local participant */}
          {localParticipant && (
            <ParticipantTile
              sessionId={localParticipant.session_id}
              username={username}
              isLocal
              preferredLanguage={preferredLanguage}
            />
          )}

          {/* Remote participants */}
          {participantIds.map((id) => (
            <ParticipantTile key={id} sessionId={id} />
          ))}
        </div>
      </div>

      {/* Floating agent panel */}
      <AgentPanel preferredLanguage={preferredLanguage} />

      {/* Fixed controls bar */}
      <div className="shrink-0 bg-neutral-800/90 backdrop-blur-sm p-4 border-t border-white/5 relative">
        {/* Language indicator - absolute positioned so it doesn't affect centering */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 text-sm flex items-center gap-2">
          <span>{getLanguageFlag(preferredLanguage)}</span>
          <span className="hidden sm:inline">
            Hearing in {getLanguageName(preferredLanguage)}
          </span>
        </div>

        {/* Centered controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="icon"
            onClick={toggleMute}
            className="w-12 h-12 rounded-full"
          >
            {isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant={isVideoOff ? "destructive" : "secondary"}
            size="icon"
            onClick={toggleVideo}
            className="w-12 h-12 rounded-full"
          >
            {isVideoOff ? (
              <VideoOff className="w-5 h-5" />
            ) : (
              <Video className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            onClick={leaveCall}
            className="w-12 h-12 rounded-full"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ParticipantTileProps {
  sessionId: string;
  username?: string;
  isLocal?: boolean;
  preferredLanguage?: string;
}

function ParticipantTile({
  sessionId,
  username,
  isLocal,
  preferredLanguage,
}: ParticipantTileProps) {
  const videoTrack = useVideoTrack(sessionId);
  const audioTrack = useAudioTrack(sessionId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Attach video track
  useEffect(() => {
    const video = videoRef.current;
    const track = videoTrack?.persistentTrack;

    if (!video || !track) return;

    video.srcObject = new MediaStream([track]);
  }, [videoTrack?.persistentTrack]);

  // Attach audio track (only for remote participants)
  useEffect(() => {
    if (isLocal) return;

    const audio = audioRef.current;
    const track = audioTrack?.persistentTrack;

    if (!audio || !track) return;

    audio.srcObject = new MediaStream([track]);
  }, [audioTrack?.persistentTrack, isLocal]);

  return (
    <div className="relative bg-neutral-800 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
      />

      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-sm">
        {username || sessionId.slice(0, 6)}
        {isLocal && " (You)"}
        {preferredLanguage && ` ${getLanguageFlag(preferredLanguage)}`}
      </div>

      {/* Video off placeholder */}
      {videoTrack?.isOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-700">
          <div className="w-16 h-16 rounded-full bg-neutral-600 flex items-center justify-center text-white text-2xl">
            {(username || "U")[0].toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
