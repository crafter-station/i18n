"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { ArrowRight, Loader2 } from "lucide-react";

import type { LanguageCode } from "@/lib/languages";

import { LanguageSelector } from "@/components/language-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoCall } from "@/components/video-call";

import { useFingerprint } from "@/hooks/use-fingerprint";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { visitorId, isLoading: isLoadingFingerprint } = useFingerprint();

  const [username, setUsername] = useState("");
  const [preferredLanguage, setPreferredLanguage] =
    useState<LanguageCode>("en");
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!visitorId || !username.trim()) return;

    setIsJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          username: username.trim(),
          preferredLanguage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join room");
      }

      setRoomUrl(data.roomUrl);
      setToken(data.token);
      setIsJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setIsJoining(false);
    }
  };

  // Show video call when joined
  if (isJoined && roomUrl && token && visitorId) {
    return (
      <VideoCall
        roomUrl={roomUrl}
        token={token}
        preferredLanguage={preferredLanguage}
        username={username}
        visitorId={visitorId}
        roomId={roomId}
      />
    );
  }

  // Show join form
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs font-medium tracking-widest uppercase text-neutral-500">
              [ JOIN ROOM ]
            </p>
            <h1 className="text-3xl font-light tracking-tight text-black">
              Room {roomId.slice(0, 6)}...
            </h1>
            <p className="text-neutral-600">
              Set your name and preferred language
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                Your Name
              </label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white"
                disabled={isJoining || isLoadingFingerprint}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">
                I want to hear translations in
              </label>
              <LanguageSelector
                value={preferredLanguage}
                onChange={setPreferredLanguage}
                disabled={isJoining}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button
              onClick={handleJoin}
              disabled={!username.trim() || isJoining || isLoadingFingerprint}
              className="w-full bg-black text-white hover:bg-neutral-800"
            >
              {isJoining || isLoadingFingerprint ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLoadingFingerprint ? "Loading..." : "Joining..."}
                </>
              ) : (
                <>
                  Join Call
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-neutral-500">
            You'll hear other participants in{" "}
            {preferredLanguage === "en" ? "English" : preferredLanguage}
          </p>
        </div>
      </div>
    </div>
  );
}
