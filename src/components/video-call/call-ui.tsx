"use client";

import { useCallback, useEffect, useState } from "react";

import {
  useDaily,
  useDailyEvent,
  useLocalParticipant,
  useParticipantIds,
} from "@daily-co/daily-react";
import { Loader2 } from "lucide-react";

import { AgentPanel } from "@/components/agent-panel";

import { CallControls } from "./call-controls";
import { useTranscription } from "./hooks/use-transcription";
import { ParticipantTile } from "./participant-tile";
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
    // isMuted=false means audio is ON, so pass false to turn it OFF
    daily.setLocalAudio(isMuted);
    setIsMuted(!isMuted);
  }, [daily, isMuted]);

  const toggleVideo = useCallback(() => {
    if (!daily) return;
    // isVideoOff=false means video is ON, so pass false to turn it OFF
    daily.setLocalVideo(isVideoOff);
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
      <AgentPanel
        preferredLanguage={preferredLanguage}
        transcripts={transcripts}
        liveTranscript={liveTranscript}
        transcriptionStatus={transcriptionStatus}
        roomId={roomId}
      />

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
