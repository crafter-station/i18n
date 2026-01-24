import { generateObject } from "ai";
import { z } from "zod";

import { ActionsRequestSchema } from "@/lib/agent-schemas";

const ActionItemSchema = z.object({
  actions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["email", "task", "followup"]),
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
    }),
  ),
  summary: z.string(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const body = await req.json();

    // Validate request body
    const validatedRequest = ActionsRequestSchema.parse(body);
    const { transcripts: clientTranscripts } = validatedRequest;

    // Build transcript context from client-provided transcripts
    const transcriptContext = clientTranscripts
      .map((t) => {
        const time = new Date(t.timestamp).toLocaleTimeString();
        return `[${time}] ${t.speaker}: ${t.original}`;
      })
      .join("\n");

    const result = await generateObject({
      model: "openai/gpt-5.1",
      schema: ActionItemSchema,
      prompt: `Analyze this meeting transcript and extract action items.

TRANSCRIPT:
${transcriptContext || "No transcript available"}

Extract:
1. Tasks mentioned (who needs to do what, by when)
2. Follow-up meetings needed
3. Emails to be sent (summaries, updates to stakeholders)

For each action, generate a unique ID (use format: action_1, action_2, etc).
For email actions, include suggested subject and brief body in metadata.
Provide a brief meeting summary (2-3 sentences).

Prioritize actions based on urgency mentioned in the conversation.`,
      temperature: 0.3,
    });

    return Response.json(result.object);
  } catch (error) {
    console.error("Action extraction error:", error);
    return Response.json(
      { error: "Failed to extract actions" },
      { status: 500 },
    );
  }
}
