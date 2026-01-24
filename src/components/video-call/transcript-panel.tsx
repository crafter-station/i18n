"use client";

import { useRef, useLayoutEffect } from "react";
import { Languages } from "lucide-react";

import type { TranscriptEntry, LiveTranscript, TranscriptionStatus } from "./types";

interface TranscriptPanelProps {
  transcripts: TranscriptEntry[];
  liveTranscript: LiveTranscript | null;
  transcriptionStatus: TranscriptionStatus;
}

export function TranscriptPanel({
  transcripts,
  liveTranscript,
  transcriptionStatus,
}: TranscriptPanelProps) {
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts, liveTranscript]);

  return (
    <div className="w-96 flex flex-col bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-300">
              Live Transcript
            </span>
          </div>
          <StatusIndicator status={transcriptionStatus} />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {liveTranscript && <LiveTranscriptCard transcript={liveTranscript} />}

        {transcripts.length === 0 && !liveTranscript && <EmptyState />}

        {transcripts.map((entry) => (
          <TranscriptCard key={entry.id} entry={entry} />
        ))}

        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: TranscriptionStatus }) {
  const statusConfig = {
    active: { color: "bg-emerald-400", label: "Live" },
    error: { color: "bg-red-400", label: "Error" },
    stopped: { color: "bg-amber-400", label: "Stopped" },
    starting: { color: "bg-blue-400 animate-pulse", label: "Starting..." },
  };

  const { color, label } = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-xs text-neutral-500">{label}</span>
    </div>
  );
}

function LiveTranscriptCard({ transcript }: { transcript: LiveTranscript }) {
  return (
    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-xs font-medium text-blue-400">
          {transcript.speaker}
        </span>
      </div>
      <p className="text-sm text-neutral-200 leading-relaxed">
        {transcript.text}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
        <Languages className="w-5 h-5 text-neutral-500" />
      </div>
      <p className="text-sm text-neutral-500">Waiting for speech...</p>
      <p className="text-xs text-neutral-600 mt-1">
        Translations appear here in real-time
      </p>
    </div>
  );
}

function TranscriptCard({ entry }: { entry: TranscriptEntry }) {
  const showOriginal = entry.original !== entry.translated;

  return (
    <div className="group p-3 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-medium text-neutral-400">
          {entry.speaker}
        </span>
        <span className="text-[10px] text-neutral-600">
          {entry.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      {showOriginal && (
        <p className="text-xs text-neutral-500 mb-1 line-through decoration-neutral-700">
          {entry.original}
        </p>
      )}
      <p className="text-sm text-neutral-200 leading-relaxed">
        {entry.translated}
      </p>
    </div>
  );
}
