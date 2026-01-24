"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
  motion,
  useDragControls,
  AnimatePresence,
  LayoutGroup,
} from "motion/react";
import {
  Sparkles,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  X,
  Languages,
  Send,
  GripHorizontal,
  Users,
  Loader2,
  Mail,
  ListTodo,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type {
  TranscriptEntry,
  LiveTranscript,
  TranscriptionStatus,
} from "@/components/video-call/types";

// Action item types from Antunes' implementation
interface ActionItem {
  id: string;
  type: "email" | "task" | "followup";
  title: string;
  description: string;
  assignee?: string;
  dueDate?: string;
  priority: "high" | "medium" | "low";
  metadata: {
    recipients?: string[];
    subject?: string;
    emailBody?: string;
  };
}

// Custom chat transport that includes transcripts in requests
class TranscriptAwareChatTransport {
  constructor(
    private api: string,
    private getTranscripts: () => TranscriptEntry[],
  ) {}

  async makeRequest(messages: any[]): Promise<Response> {
    const transcripts = this.getTranscripts();
    const body = JSON.stringify({
      transcripts,
      messages,
    });

    return fetch(this.api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });
  }
}

const typeIcons = {
  email: Mail,
  task: ListTodo,
  followup: Calendar,
};

const priorityColors = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  low: "bg-green-500/20 text-green-400",
};

type TabType = "transcript" | "actions" | "chat";

const TABS: { id: TabType; label: string; icon: typeof Languages }[] = [
  { id: "transcript", label: "Transcript", icon: Languages },
  { id: "actions", label: "Actions", icon: Sparkles },
  { id: "chat", label: "Chat", icon: MessageSquare },
];

// Size constraints
const MIN_WIDTH = 400;
const MAX_WIDTH = 800;
const MIN_HEIGHT = 200;
const MAX_HEIGHT = 500;
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 256;

interface AgentPanelProps {
  preferredLanguage: string;
  transcripts: TranscriptEntry[];
  liveTranscript: LiveTranscript | null;
  transcriptionStatus: TranscriptionStatus;
  roomId: string;
}

export function AgentPanel({
  preferredLanguage,
  transcripts,
  liveTranscript,
  transcriptionStatus,
  roomId,
}: AgentPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("transcript");
  const [inputValue, setInputValue] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);

  // Actions state (from Antunes)
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [actionsSummary, setActionsSummary] = useState("");
  const [selectedActions, setSelectedActions] = useState<Set<string>>(
    new Set(),
  );
  const [loadingActions, setLoadingActions] = useState(true);
  const [executingActions, setExecutingActions] = useState<Set<string>>(
    new Set(),
  );
  const [executedActions, setExecutedActions] = useState<Set<string>>(
    new Set(),
  );
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  // Chat with AI - manual message management with transcripts
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Fetch actions on mount and when transcripts change
  useEffect(() => {
    async function fetchActions() {
      try {
        const res = await fetch(`/api/agent/${roomId}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcripts }),
        });
        const data = await res.json();
        setActions(data.actions || []);
        setActionsSummary(data.summary || "");
      } catch (error) {
        console.error("Failed to fetch actions:", error);
      } finally {
        setLoadingActions(false);
      }
    }
    if (roomId && transcripts.length > 0) {
      fetchActions();
    }
  }, [roomId, transcripts]);

  // Size state for resize functionality
  const [size, setSize] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const resizeStartRef = useRef({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    x: 0,
    y: 0,
  });

  // Ref for drag constraints (the viewport container)
  const constraintsRef = useRef<HTMLDivElement>(null);

  const dragControls = useDragControls();

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    // Delay resetting isDragging to prevent click
    setTimeout(() => setIsDragging(false), 100);
  };

  const handleMinimizedClick = () => {
    // Only expand if we weren't dragging
    if (!isDragging) {
      setIsMinimized(false);
    }
  };

  const handleResizeStart = (e: React.PointerEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      width: size.width,
      height: size.height,
      x: e.clientX,
      y: e.clientY,
    };

    const handleResizeMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - resizeStartRef.current.x;
      const deltaY = moveEvent.clientY - resizeStartRef.current.y;

      let newWidth = resizeStartRef.current.width;
      let newHeight = resizeStartRef.current.height;

      // Resize from right edge
      if (corner.includes("e")) {
        newWidth = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, resizeStartRef.current.width + deltaX),
        );
      }

      // Resize from left edge
      if (corner.includes("w")) {
        newWidth = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, resizeStartRef.current.width - deltaX),
        );
      }

      // Resize from bottom
      if (corner.includes("s")) {
        newHeight = Math.min(
          MAX_HEIGHT,
          Math.max(MIN_HEIGHT, resizeStartRef.current.height + deltaY),
        );
      }

      setSize({ width: newWidth, height: newHeight });
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      document.removeEventListener("pointermove", handleResizeMove);
      document.removeEventListener("pointerup", handleResizeEnd);
    };

    document.addEventListener("pointermove", handleResizeMove);
    document.addEventListener("pointerup", handleResizeEnd);
  };

  // Chat submit using real AI with transcripts
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isChatLoading) {
      const userMessage = { role: "user", content: inputValue };

      // Add user message to the chat UI
      const newMessages = [...chatMessages, userMessage];
      setChatMessages(newMessages);
      setInputValue("");
      setIsChatLoading(true);

      // Send to API with transcripts
      try {
        const response = await fetch(`/api/agent/${roomId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcripts,
            messages: newMessages,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          setIsChatLoading(false);
          return;
        }

        const decoder = new TextDecoder();
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantContent += chunk;
        }

        // Add assistant message
        if (assistantContent) {
          const assistantMessage = {
            role: "assistant",
            content: assistantContent,
          };
          setChatMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        console.error("Chat error:", error);
      } finally {
        setIsChatLoading(false);
      }
    }
  };

  // Get message text helper
  const getMessageText = (message: any) => {
    return typeof message.content === "string" ? message.content : "";
  };

  // Action toggle
  const toggleAction = (id: string) => {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Execute selected actions
  const executeSelectedActions = async () => {
    const toExecute = actions.filter((a) => selectedActions.has(a.id));
    for (const action of toExecute) {
      setExecutingActions((prev) => new Set(prev).add(action.id));
      try {
        const res = await fetch(`/api/agent/${roomId}/actions/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, meetingSummary: actionsSummary }),
        });
        const result = await res.json();
        if (result.success) {
          setExecutedActions((prev) => new Set(prev).add(action.id));
          setSelectedActions((prev) => {
            const next = new Set(prev);
            next.delete(action.id);
            return next;
          });
        } else {
          setActionErrors((prev) => ({
            ...prev,
            [action.id]: result.error || "Failed",
          }));
        }
      } catch {
        setActionErrors((prev) => ({ ...prev, [action.id]: "Network error" }));
      } finally {
        setExecutingActions((prev) => {
          const next = new Set(prev);
          next.delete(action.id);
          return next;
        });
      }
    }
  };

  // Group transcripts by speaker
  const transcriptsBySpeaker = useMemo(() => {
    const grouped: Record<string, TranscriptEntry[]> = {};
    for (const t of transcripts) {
      if (!grouped[t.speaker]) grouped[t.speaker] = [];
      grouped[t.speaker].push(t);
    }
    return grouped;
  }, [transcripts]);

  const speakers = Object.keys(transcriptsBySpeaker);

  return (
    <>
      {/* Full viewport constraint boundary - covers entire viewport with padding */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 z-30 pointer-events-none"
        style={{ margin: 16, marginBottom: 120 }}
      />

      <LayoutGroup>
        <motion.div
          layout="position"
          layoutId="agent-panel"
          drag
          dragControls={dragControls}
          dragConstraints={constraintsRef}
          dragMomentum={true}
          dragElastic={0.2}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          dragListener={isMinimized}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto"
          style={{ width: isMinimized ? "auto" : size.width }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <AnimatePresence mode="wait">
            {isMinimized ? (
              <motion.button
                key="minimized"
                type="button"
                onClick={handleMinimizedClick}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex items-center gap-2 px-4 py-2.5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-full text-white text-sm hover:bg-black/80 transition-colors shadow-2xl select-none cursor-grab active:cursor-grabbing"
              >
                <Sparkles className="w-4 h-4" />
                <span>Show Agent</span>
                <ChevronUp className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="relative"
                style={{ width: size.width }}
              >
                {/* Drag handle for expanded state */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    dragControls.start(e);
                  }}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 cursor-grab active:cursor-grabbing select-none touch-none"
                >
                  <div className="px-4 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 rounded-full transition-colors">
                    <GripHorizontal className="w-5 h-5 text-white/60" />
                  </div>
                </div>
                {/* Main floating panel */}
                <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl mt-4">
                  {/* Header with tabs */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                    <div className="flex items-center gap-1">
                      {TABS.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors",
                            activeTab === tab.id
                              ? "bg-white/10 text-white"
                              : "text-white/50 hover:text-white hover:bg-white/5",
                          )}
                        >
                          <tab.icon className="w-3.5 h-3.5" />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMinimized(true)}
                        className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content (collapsible with animation) - Fixed height for all tabs */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: size.height, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                        className="overflow-hidden"
                      >
                        <div
                          className="h-full overflow-y-auto"
                          style={{ height: size.height }}
                        >
                          {/* Transcript Tab */}
                          {activeTab === "transcript" && (
                            <div className="h-full flex flex-col">
                              {/* Speaker filter */}
                              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 shrink-0">
                                <Users className="w-3.5 h-3.5 text-white/50" />
                                <button
                                  type="button"
                                  onClick={() => setSelectedSpeaker(null)}
                                  className={cn(
                                    "px-2 py-1 text-xs rounded-md transition-colors",
                                    selectedSpeaker === null
                                      ? "bg-white/10 text-white"
                                      : "text-white/50 hover:text-white",
                                  )}
                                >
                                  All
                                </button>
                                {speakers.map((speaker) => (
                                  <button
                                    key={speaker}
                                    type="button"
                                    onClick={() => setSelectedSpeaker(speaker)}
                                    className={cn(
                                      "px-2 py-1 text-xs rounded-md transition-colors",
                                      selectedSpeaker === speaker
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "text-white/50 hover:text-white",
                                    )}
                                  >
                                    {speaker}
                                  </button>
                                ))}
                              </div>

                              {/* Transcripts */}
                              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                                {/* Live transcript indicator */}
                                {liveTranscript && (
                                  <div className="px-4 py-3 bg-blue-500/10 border-b border-blue-500/20">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                      <span className="text-xs font-medium text-blue-400">
                                        {liveTranscript.speaker}
                                      </span>
                                      <span className="text-[10px] text-blue-400/50">
                                        speaking...
                                      </span>
                                    </div>
                                    <p className="text-sm text-white">
                                      {liveTranscript.text}
                                    </p>
                                  </div>
                                )}

                                {/* Transcript entries */}
                                {(selectedSpeaker
                                  ? transcriptsBySpeaker[selectedSpeaker] || []
                                  : transcripts
                                )
                                  .slice()
                                  .sort(
                                    (a, b) =>
                                      b.timestamp.getTime() -
                                      a.timestamp.getTime(),
                                  )
                                  .map((entry) => (
                                    <div
                                      key={entry.id}
                                      className="px-4 py-3 hover:bg-white/5 transition-colors"
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-blue-400">
                                          {entry.speaker}
                                        </span>
                                        <span className="text-xs text-white/30">
                                          {formatTime(entry.timestamp)}
                                        </span>
                                      </div>
                                      {entry.original !== entry.translated && (
                                        <p className="text-xs text-white/40 line-through mb-0.5">
                                          {entry.original}
                                        </p>
                                      )}
                                      <p className="text-sm text-white">
                                        {entry.translated}
                                      </p>
                                    </div>
                                  ))}

                                {/* Empty state */}
                                {transcripts.length === 0 &&
                                  !liveTranscript && (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                      <Languages className="w-8 h-8 text-white/20 mb-2" />
                                      <p className="text-sm text-white/50">
                                        Waiting for speech...
                                      </p>
                                      <p className="text-xs text-white/30 mt-1">
                                        Translations appear here in real-time
                                      </p>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}

                          {/* Actions Tab */}
                          {activeTab === "actions" && (
                            <div className="h-full flex flex-col">
                              {/* Execute button header */}
                              {selectedActions.size > 0 && (
                                <div className="px-4 py-2 border-b border-white/5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={executeSelectedActions}
                                    className="w-full py-2 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                                  >
                                    Execute Selected ({selectedActions.size})
                                  </button>
                                </div>
                              )}

                              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                                {loadingActions ? (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-white/50 mr-2" />
                                    <span className="text-sm text-white/50">
                                      Analyzing meeting...
                                    </span>
                                  </div>
                                ) : actions.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <ListTodo className="w-8 h-8 text-white/20 mb-2" />
                                    <p className="text-sm text-white/50">
                                      No action items detected yet
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    {actionsSummary && (
                                      <div className="bg-white/5 rounded-lg p-3 mb-3">
                                        <p className="text-xs text-white/50 mb-1">
                                          MEETING SUMMARY
                                        </p>
                                        <p className="text-sm text-white/70">
                                          {actionsSummary}
                                        </p>
                                      </div>
                                    )}
                                    {actions.map((action) => {
                                      const Icon = typeIcons[action.type];
                                      const isExecuted = executedActions.has(
                                        action.id,
                                      );
                                      const isExecuting = executingActions.has(
                                        action.id,
                                      );
                                      const error = actionErrors[action.id];

                                      return (
                                        <div
                                          key={action.id}
                                          className={cn(
                                            "border rounded-lg p-3 transition-all",
                                            isExecuted
                                              ? "bg-green-500/10 border-green-500/30"
                                              : selectedActions.has(action.id)
                                                ? "border-blue-500/50 bg-blue-500/10"
                                                : "border-white/10 hover:border-white/20",
                                          )}
                                        >
                                          <div className="flex items-start gap-3">
                                            {isExecuted ? (
                                              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                            ) : isExecuting ? (
                                              <Loader2 className="w-4 h-4 animate-spin text-white/50 mt-0.5 shrink-0" />
                                            ) : (
                                              <Checkbox
                                                checked={selectedActions.has(
                                                  action.id,
                                                )}
                                                onCheckedChange={() =>
                                                  toggleAction(action.id)
                                                }
                                                className="mt-0.5 shrink-0"
                                              />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <Icon className="w-3.5 h-3.5 text-white/50" />
                                                <span className="text-sm font-medium text-white">
                                                  {action.title}
                                                </span>
                                                <Badge
                                                  className={cn(
                                                    "text-[10px]",
                                                    priorityColors[
                                                      action.priority
                                                    ],
                                                  )}
                                                >
                                                  {action.priority}
                                                </Badge>
                                              </div>
                                              <p className="text-xs text-white/60 mb-1">
                                                {action.description}
                                              </p>
                                              {action.type === "email" &&
                                                action.metadata.recipients && (
                                                  <p className="text-[10px] text-white/40">
                                                    To:{" "}
                                                    {action.metadata.recipients.join(
                                                      ", ",
                                                    )}
                                                  </p>
                                                )}
                                              {error && (
                                                <div className="flex items-center gap-1 mt-1 text-red-400">
                                                  <AlertCircle className="w-3 h-3" />
                                                  <span className="text-[10px]">
                                                    {error}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Chat Tab */}
                          {activeTab === "chat" && (
                            <div className="h-full flex flex-col px-4 py-3">
                              {chatMessages.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                  <MessageSquare className="w-8 h-8 text-white/20 mb-2" />
                                  <p className="text-sm text-white/50">
                                    Ask anything about the meeting...
                                  </p>
                                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                                    {[
                                      "What should I say?",
                                      "Summarize this",
                                      "Key takeaways?",
                                    ].map((suggestion) => (
                                      <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() =>
                                          setInputValue(suggestion)
                                        }
                                        className="px-3 py-1.5 text-xs text-white/60 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1 overflow-y-auto space-y-3">
                                  {chatMessages.map((msg, idx) => (
                                    <div
                                      key={idx}
                                      className={cn(
                                        "flex",
                                        msg.role === "user"
                                          ? "justify-end"
                                          : "justify-start",
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "max-w-[80%] px-3 py-2 rounded-xl text-sm",
                                          msg.role === "user"
                                            ? "bg-blue-500 text-white"
                                            : "bg-white/10 text-white",
                                        )}
                                      >
                                        {getMessageText(msg)}
                                      </div>
                                    </div>
                                  ))}
                                  {isChatLoading && (
                                    <div className="flex justify-start">
                                      <div className="bg-white/10 rounded-xl px-3 py-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Input field */}
                  <form
                    onSubmit={handleSubmit}
                    className="px-4 py-3 border-t border-white/10"
                  >
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2.5">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={
                          activeTab === "chat"
                            ? "Ask about the meeting..."
                            : "Search transcripts..."
                        }
                        disabled={isChatLoading}
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={!inputValue.trim() || isChatLoading}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          inputValue.trim() && !isChatLoading
                            ? "text-blue-400 hover:bg-blue-500/20"
                            : "text-white/30",
                        )}
                      >
                        {isChatLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Resize handles - only visible when expanded */}
                {isExpanded && (
                  <>
                    {/* Right edge */}
                    <div
                      onPointerDown={(e) => handleResizeStart(e, "e")}
                      className="absolute top-0 right-0 w-3 h-full cursor-ew-resize group"
                    >
                      <div className="absolute right-0 top-0 w-1 h-full bg-transparent group-hover:bg-blue-500/30 transition-colors rounded-r-2xl" />
                    </div>
                    {/* Left edge */}
                    <div
                      onPointerDown={(e) => handleResizeStart(e, "w")}
                      className="absolute top-0 left-0 w-3 h-full cursor-ew-resize group"
                    >
                      <div className="absolute left-0 top-0 w-1 h-full bg-transparent group-hover:bg-blue-500/30 transition-colors rounded-l-2xl" />
                    </div>
                    {/* Bottom edge */}
                    <div
                      onPointerDown={(e) => handleResizeStart(e, "s")}
                      className="absolute bottom-0 left-3 right-3 h-3 cursor-ns-resize group"
                    >
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-blue-500/30 transition-colors" />
                    </div>
                    {/* Bottom-right corner */}
                    <div
                      onPointerDown={(e) => handleResizeStart(e, "se")}
                      className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize group"
                    >
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-transparent group-hover:bg-blue-500/40 transition-colors rounded-br-xl" />
                    </div>
                    {/* Bottom-left corner */}
                    <div
                      onPointerDown={(e) => handleResizeStart(e, "sw")}
                      className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize group"
                    >
                      <div className="absolute bottom-0 left-0 w-3 h-3 bg-transparent group-hover:bg-blue-500/40 transition-colors rounded-bl-xl" />
                    </div>
                  </>
                )}

                {/* Resize indicator */}
                {isResizing && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-black/70 backdrop-blur px-2 py-1 rounded-md">
                    {Math.round(size.width)} × {Math.round(size.height)}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </>
  );
}

function formatTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}
