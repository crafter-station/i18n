"use client";

import { useState } from "react";
import { Check, Link2, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

import {
  getLanguageFlag,
  getLanguageName,
  type LanguageCode,
} from "@/lib/languages";

import { Button } from "@/components/ui/button";

interface CallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  preferredLanguage: LanguageCode;
  roomId: string;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
}

export function CallControls({
  isMuted,
  isVideoOff,
  preferredLanguage,
  roomId,
  onToggleMute,
  onToggleVideo,
  onLeave,
}: CallControlsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/${roomId}`;

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my i18n call",
          text: "Join my real-time translated video call",
          url,
        });
        return;
      } catch {
        // User cancelled or share failed, fall back to copy
      }
    }

    // Fall back to clipboard
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="shrink-0 bg-neutral-800/90 backdrop-blur-sm p-4 border-t border-white/5 relative">
      {/* Language indicator - absolute positioned so it doesn't affect centering */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 text-sm flex items-center gap-2">
        <span>{getLanguageFlag(preferredLanguage)}</span>
        <span className="hidden sm:inline">
          Hearing in {getLanguageName(preferredLanguage)}
        </span>
      </div>

      {/* Centered controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleShare}
          className="w-12 h-12 rounded-full"
          title={copied ? "Copied!" : "Share invite link"}
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : (
            <Link2 className="w-5 h-5" />
          )}
        </Button>

        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          onClick={onToggleMute}
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
          onClick={onToggleVideo}
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
          onClick={onLeave}
          className="w-12 h-12 rounded-full"
        >
          <PhoneOff className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
