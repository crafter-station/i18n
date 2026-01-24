import type { LanguageCode } from "@/lib/languages";

export interface VideoCallProps {
  roomUrl: string;
  token: string;
  preferredLanguage: LanguageCode;
  username: string;
  visitorId: string;
  roomId: string;
}

export interface TranscriptEntry {
  id: string;
  speaker: string;
  original: string;
  translated: string;
  timestamp: Date;
}

export interface LiveTranscript {
  speaker: string;
  text: string;
}

export type TranscriptionStatus = "starting" | "active" | "error" | "stopped";
