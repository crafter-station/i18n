import { generateObject } from "ai";
import { z } from "zod";

import {
  ActionsRequestSchema,
  EmailActionSchema,
} from "@/lib/agent-schemas";

const IntentDetectionSchema = z.object({
  hasEmailIntent: z.boolean(),
  confidence: z.enum(["high", "medium", "low"]),
  action: EmailActionSchema.nullable(),
  reasoning: z.string(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    await params;
    const body = await req.json();

    const validatedRequest = ActionsRequestSchema.parse(body);
    const { transcripts: clientTranscripts } = validatedRequest;

    if (clientTranscripts.length < 3) {
      return Response.json({
        hasEmailIntent: false,
        confidence: "low",
        action: null,
        reasoning: "Not enough transcript data",
      });
    }

    // Take last 10 transcripts for intent detection
    const recentTranscripts = clientTranscripts.slice(-10);

    const transcriptContext = recentTranscripts
      .map((t) => {
        const time = new Date(t.timestamp).toLocaleTimeString();
        return `[${time}] ${t.speaker}: ${t.original}`;
      })
      .join("\n");

    const result = await generateObject({
      model: "openai/gpt-5.1",
      schema: IntentDetectionSchema,
      prompt: `Analyze these recent meeting messages to detect if participants are discussing sending an email.

RECENT TRANSCRIPT (last ${recentTranscripts.length} messages):
${transcriptContext}

Your task:
1. Determine if the conversation indicates someone needs to send an email (e.g., "I'll email them", "let's send an update", "I need to write to...", "should we email the team?")
2. If YES, extract the email details: who should receive it, subject, and draft body content
3. Only return hasEmailIntent=true if there's CLEAR intent to send an email

Guidelines:
- confidence "high": Explicit mention of sending email with clear context
- confidence "medium": Implied email need but less explicit
- confidence "low": Vague or uncertain

If hasEmailIntent is false, set action to null.
If hasEmailIntent is true, generate a complete email action with:
- Unique ID (format: email_intent_[timestamp])
- Clear subject line based on context
- Professional email body draft
- Best guess at recipients based on context (use placeholders like "[Team]" if unclear)`,
      temperature: 0.2,
    });

    return Response.json(result.object);
  } catch (error) {
    console.error("Intent detection error:", error);
    return Response.json(
      { error: "Failed to detect intent" },
      { status: 500 },
    );
  }
}
