import { z } from "zod";

// Shared schema for transcript entries sent from frontend to backend
export const TranscriptEntrySchema = z.object({
  id: z.string(),
  speaker: z.string(),
  original: z.string(),
  translated: z.string(),
  timestamp: z
    .union([z.date(), z.string()])
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
});

export type TranscriptEntry = z.infer<typeof TranscriptEntrySchema>;

// Chat request schema - messages are passed as-is from useChat (UIMessage format)
export const ChatRequestSchema = z.object({
  transcripts: z.array(TranscriptEntrySchema),
  messages: z.array(z.any()), // Accept any message format from useChat
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// Actions request schema
export const ActionsRequestSchema = z.object({
  transcripts: z.array(TranscriptEntrySchema),
});

export type ActionsRequest = z.infer<typeof ActionsRequestSchema>;

// Email action schema for intent detection
export const EmailActionSchema = z.object({
  id: z.string(),
  type: z.literal("email"),
  title: z.string(),
  description: z.string(),
  assignee: z.string(),
  dueDate: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  metadata: z.object({
    recipients: z.array(z.string()),
    subject: z.string(),
    emailBody: z.string(),
  }),
});

export type EmailAction = z.infer<typeof EmailActionSchema>;

// Intent detection response schema
export const IntentDetectionResponseSchema = z.object({
  hasEmailIntent: z.boolean(),
  confidence: z.enum(["high", "medium", "low"]),
  action: EmailActionSchema.nullable(),
  reasoning: z.string(),
});

export type IntentDetectionResponse = z.infer<
  typeof IntentDetectionResponseSchema
>;
