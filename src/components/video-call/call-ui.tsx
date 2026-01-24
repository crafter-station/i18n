"use client";

import { useCallback, useEffect, useState } from "react";

import {
  useDaily,
  useDailyEvent,
  useLocalParticipant,
  useParticipantIds,
} from "@daily-co/daily-react";
import { Loader2 } from "lucide-react";

import { CallControls } from "./call-controls";
import { useTranscription } from "./hooks/use-transcription";
import { ParticipantTile } from "./participant-tile";
import { TranscriptPanel } from "./transcript-panel";
import type { VideoCallProps } from "./types";

export function CallUI({
  roomUrl,
  token,
  preferredLanguage,
  username,
  roomId,
}: VideoCallProps) {
  const daily = useDaily();
  const localParticipant = useLocalParticipant();
  const participantIds = useParticipantIds({ filter: "remote" });

  const [isJoining, setIsJoining] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const {
    transcripts,
    liveTranscript,
    currentTranslation,
    transcriptionStatus,
    startTranscription,
    stopTranscription,
  } = useTranscription({ preferredLanguage, username });

  // Join call and start transcription
  useEffect(() => {
    if (!daily) return;

    const join = async () => {
      try {
        console.log("[Daily] Joining call...");
        await daily.join({ url: roomUrl, token });
        console.log("[Daily] Joined successfully");

        // Disable auto-subscribe so we can control audio/video separately
        daily.setSubscribeToTracksAutomatically(false);

        // Subscribe to video only, mute audio - users hear TTS instead
        daily.updateParticipants({
          "*": { setSubscribedTracks: { video: true, audio: false } },
        });

        await startTranscription();
        setIsJoining(false);
      } catch (error) {
        console.error("[Daily] Failed to join:", error);
      }
    };

    join();

    return () => {
      const meetingState = daily.meetingState();
      if (meetingState === "joined-meeting") {
        stopTranscription();
        daily.leave();
      }
    };
  }, [daily, roomUrl, token, startTranscription, stopTranscription]);

  // Mute audio for newly joined participants (they hear TTS instead)
  useDailyEvent("participant-joined", (event) => {
    const participant = event?.participant;
    if (!participant || participant.local) return;

    console.log("[Daily] Participant joined:", participant.user_name);

    // Mute their audio - user will hear translated TTS instead
    daily?.updateParticipant(participant.session_id, {
      setSubscribedTracks: { video: true, audio: false },
    });
  });

  useDailyEvent("participant-left", (event) => {
    console.log("[Daily] Participant left:", event?.participant?.user_name);
  });

  const toggleMute = useCallback(() => {
    if (!daily) return;
    const newMutedState = !isMuted;
    daily.setLocalAudio(!newMutedState);
    setIsMuted(newMutedState);
    console.log("[Daily] Mute:", newMutedState);
  }, [daily, isMuted]);

  const toggleVideo = useCallback(() => {
    if (!daily) return;
    daily.setLocalVideo(!isVideoOff);
    setIsVideoOff(!isVideoOff);
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex flex-col relative">
      {/* Translation toast */}
      {currentTranslation && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-xl text-white px-8 py-4 rounded-2xl max-w-xl text-center border border-white/10 shadow-2xl">
          <p className="text-lg font-light">{currentTranslation}</p>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex gap-4 p-4 pb-0">
        {/* Video grid */}
        <div className="flex-1">
          <div
            className={`grid gap-3 h-full ${
              participantIds.length === 0
                ? "grid-cols-1"
                : participantIds.length === 1
                  ? "grid-cols-2"
                  : "grid-cols-2 grid-rows-2"
            }`}
          >
            {localParticipant && (
              <ParticipantTile
                sessionId={localParticipant.session_id}
                username={username}
                isLocal
                preferredLanguage={preferredLanguage}
              />
            )}
            {participantIds.map((id) => (
              <ParticipantTile key={id} sessionId={id} />
            ))}
          </div>
        </div>

        {/* Transcript sidebar */}
        <TranscriptPanel
          transcripts={transcripts}
          liveTranscript={liveTranscript}
          transcriptionStatus={transcriptionStatus}
        />
      </div>

      {/* Controls */}
      <CallControls
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        preferredLanguage={preferredLanguage}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onLeave={leaveCall}
      />
    </div>
  );
}
