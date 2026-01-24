"use client";

import { Info, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

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
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
  onShowShare: () => void;
}

export function CallControls({
  isMuted,
  isVideoOff,
  preferredLanguage,
  onToggleMute,
  onToggleVideo,
  onLeave,
  onShowShare,
}: CallControlsProps) {
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
      <div className="flex items-center justify-center gap-4">
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

      {/* Share info button - absolute positioned on the right */}
      <button
        type="button"
        onClick={onShowShare}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        title="Share meeting link"
      >
        <Info className="w-5 h-5" />
      </button>
    </div>
  );
}
