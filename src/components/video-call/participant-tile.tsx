"use client";

import { useVideoTrack, useAudioTrack } from "@daily-co/daily-react";
import { useEffect, useRef } from "react";

import { getLanguageFlag } from "@/lib/languages";

interface ParticipantTileProps {
  sessionId: string;
  username?: string;
  isLocal?: boolean;
  preferredLanguage?: string;
}

export function ParticipantTile({
  sessionId,
  username,
  isLocal,
  preferredLanguage,
}: ParticipantTileProps) {
  const videoTrack = useVideoTrack(sessionId);
  const audioTrack = useAudioTrack(sessionId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const track = videoTrack?.persistentTrack;
    if (!video || !track) return;
    video.srcObject = new MediaStream([track]);
  }, [videoTrack?.persistentTrack]);

  useEffect(() => {
    if (isLocal) return;
    const audio = audioRef.current;
    const track = audioTrack?.persistentTrack;
    if (!audio || !track) return;
    audio.srcObject = new MediaStream([track]);
  }, [audioTrack?.persistentTrack, isLocal]);

  return (
    <div className="relative bg-neutral-800 rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
      />

      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}

      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm">
        {username || sessionId.slice(0, 6)}
        {isLocal && " (You)"}
        {preferredLanguage && ` ${getLanguageFlag(preferredLanguage)}`}
      </div>

      {videoTrack?.isOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
          <div className="w-20 h-20 rounded-full bg-neutral-700 flex items-center justify-center text-white text-3xl font-light">
            {(username || "U")[0].toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
