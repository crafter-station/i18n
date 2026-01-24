"use client";

import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

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
}

export function CallControls({
  isMuted,
  isVideoOff,
  preferredLanguage,
  onToggleMute,
  onToggleVideo,
  onLeave,
}: CallControlsProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-center gap-3">
        <ControlButton
          isActive={isMuted}
          onClick={onToggleMute}
          icon={isMuted ? MicOff : Mic}
        />

        <ControlButton
          isActive={isVideoOff}
          onClick={onToggleVideo}
          icon={isVideoOff ? VideoOff : Video}
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={onLeave}
          className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
        >
          <PhoneOff className="w-5 h-5" />
        </Button>

        <div className="ml-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <span className="text-lg">{getLanguageFlag(preferredLanguage)}</span>
          <span className="text-sm text-neutral-300">
            {getLanguageName(preferredLanguage)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ControlButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

function ControlButton({ isActive, onClick, icon: Icon }: ControlButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={`w-12 h-12 rounded-full transition-all ${
        isActive
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      <Icon className="w-5 h-5" />
    </Button>
  );
}
