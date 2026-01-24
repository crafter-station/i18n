"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Send,
  Loader2,
  MessageSquare,
  CheckCircle2,
  Mail,
  ListTodo,
  Calendar,
  Sparkles,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

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

interface ActionsResponse {
  actions: ActionItem[];
  summary: string;
}

const typeIcons = {
  email: Mail,
  task: ListTodo,
  followup: Calendar,
};

const priorityColors = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

export default function AgentPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [input, setInput] = useState("");

  // Action items state
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [summary, setSummary] = useState("");
  const [selectedActions, setSelectedActions] = useState<Set<string>>(
    new Set()
  );
  const [loadingActions, setLoadingActions] = useState(true);
  const [executingActions, setExecutingActions] = useState<Set<string>>(
    new Set()
  );
  const [executedActions, setExecutedActions] = useState<Set<string>>(
    new Set()
  );
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/agent/${roomId}`,
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Fetch action items on mount
  useEffect(() => {
    async function fetchActions() {
      try {
        const res = await fetch(`/api/agent/${roomId}/actions`);
        const data: ActionsResponse = await res.json();
        setActions(data.actions || []);
        setSummary(data.summary || "");
      } catch (error) {
        console.error("Failed to fetch actions:", error);
      } finally {
        setLoadingActions(false);
      }
    }
    fetchActions();
  }, [roomId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === "ready") {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const getMessageText = (message: (typeof messages)[0]) => {
    return message.parts
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("");
  };

  const toggleAction = (id: string) => {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const executeSelectedActions = async () => {
    const toExecute = actions.filter((a) => selectedActions.has(a.id));

    for (const action of toExecute) {
      setExecutingActions((prev) => new Set(prev).add(action.id));

      try {
        const res = await fetch(`/api/agent/${roomId}/actions/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, meetingSummary: summary }),
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
      } catch (error) {
        setActionErrors((prev) => ({
          ...prev,
          [action.id]: "Network error",
        }));
      } finally {
        setExecutingActions((prev) => {
          const next = new Set(prev);
          next.delete(action.id);
          return next;
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <header className="border-b bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-medium tracking-widest uppercase text-neutral-500">
            [ MEETING ASSISTANT ]
          </p>
          <h1 className="text-xl font-light tracking-tight text-black">
            Room {roomId.slice(0, 8)}...
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Action Items Section */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="font-medium text-sm">
                  Detected Actions
                </h2>
                {!loadingActions && actions.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {actions.length}
                  </Badge>
                )}
              </div>
              {selectedActions.size > 0 && (
                <Button
                  size="sm"
                  onClick={executeSelectedActions}
                  className="bg-black text-white hover:bg-neutral-800"
                >
                  Execute Selected ({selectedActions.size})
                </Button>
              )}
            </div>

            <div className="p-4">
              {loadingActions ? (
                <div className="flex items-center justify-center py-8 text-neutral-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Analyzing meeting...</span>
                </div>
              ) : actions.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No action items detected yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary && (
                    <div className="bg-neutral-50 rounded-lg p-3 mb-4">
                      <p className="text-xs font-medium text-neutral-500 mb-1">
                        MEETING SUMMARY
                      </p>
                      <p className="text-sm text-neutral-700">{summary}</p>
                    </div>
                  )}

                  {actions.map((action) => {
                    const Icon = typeIcons[action.type];
                    const isExecuted = executedActions.has(action.id);
                    const isExecuting = executingActions.has(action.id);
                    const error = actionErrors[action.id];

                    return (
                      <div
                        key={action.id}
                        className={`border rounded-lg p-3 transition-all ${
                          isExecuted
                            ? "bg-green-50 border-green-200"
                            : selectedActions.has(action.id)
                              ? "border-black bg-neutral-50"
                              : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isExecuted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                          ) : isExecuting ? (
                            <Loader2 className="w-5 h-5 animate-spin text-neutral-500 mt-0.5" />
                          ) : (
                            <Checkbox
                              checked={selectedActions.has(action.id)}
                              onCheckedChange={() => toggleAction(action.id)}
                              className="mt-0.5"
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4 text-neutral-500" />
                              <span className="font-medium text-sm">
                                {action.title}
                              </span>
                              <Badge
                                className={`text-xs ${priorityColors[action.priority]}`}
                              >
                                {action.priority}
                              </Badge>
                            </div>

                            <p className="text-sm text-neutral-600 mb-2">
                              {action.description}
                            </p>

                            {action.type === "email" &&
                              action.metadata.recipients && (
                                <p className="text-xs text-neutral-500">
                                  To: {action.metadata.recipients.join(", ")}
                                </p>
                              )}

                            {action.assignee && (
                              <p className="text-xs text-neutral-500">
                                Assignee: {action.assignee}
                              </p>
                            )}

                            {error && (
                              <div className="flex items-center gap-1 mt-2 text-red-600">
                                <AlertCircle className="w-3 h-3" />
                                <span className="text-xs">{error}</span>
                              </div>
                            )}

                            {isExecuted && (
                              <p className="text-xs text-green-600 mt-1">
                                Executed successfully
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100">
              <h2 className="font-medium text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Ask Questions
              </h2>
            </div>

            <div className="p-4 min-h-[300px] max-h-[400px] overflow-auto">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <p className="text-sm">
                    Ask me about the meeting, participants, or action items.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          message.role === "user"
                            ? "bg-black text-white"
                            : "bg-neutral-100"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {getMessageText(message)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-neutral-100 rounded-lg px-3 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-neutral-100 p-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the meeting..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-black text-white hover:bg-neutral-800"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
