import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { transcripts, rooms, participants } from "@/db/schema";
import mockData from "@/mock/transcripts.json";

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
    })
  ),
  summary: z.string(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    // Try to find room in database
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, roomId),
    });

    let roomTranscripts = await db.query.transcripts.findMany({
      where: eq(transcripts.roomId, roomId),
      orderBy: (transcripts, { asc }) => [asc(transcripts.timestamp)],
    });

    let roomParticipants = await db.query.participants.findMany({
      where: eq(participants.roomId, roomId),
    });

    // Use mock data if no transcripts found
    const useMock = roomTranscripts.length === 0;
    if (useMock) {
      roomTranscripts = mockData.transcripts.map((t) => ({
        id: t.id,
        roomId,
        participantId: t.participantId,
        speakerName: t.speakerName,
        originalText: t.originalText,
        originalLanguage: t.originalLanguage,
        translatedTexts: t.translatedTexts as unknown as Record<string, string>,
        timestamp: new Date(t.timestamp),
      }));
      roomParticipants = mockData.participants.map((p) => ({
        id: p.id,
        visitorId: p.visitorId,
        roomId,
        username: p.username,
        preferredLanguage: p.preferredLanguage,
        email: p.email,
        joinedAt: new Date(),
        leftAt: null,
      }));
    }

    const transcriptContext = roomTranscripts
      .map((t) => {
        const time = new Date(t.timestamp).toLocaleTimeString();
        const speaker = t.speakerName || "Unknown";
        return `[${time}] ${speaker}: ${t.originalText}`;
      })
      .join("\n");

    const participantsList = roomParticipants
      .map((p) => `- ${p.username} (${p.email || "no email"})`)
      .join("\n");

    const result = await generateObject({
      model: openai("gpt-5.1"),
      schema: ActionItemSchema,
      prompt: `Analyze this meeting transcript and extract action items.

PARTICIPANTS:
${participantsList || "No participants registered"}

TRANSCRIPT:
${transcriptContext}

Extract:
1. Tasks mentioned (who needs to do what, by when)
2. Follow-up meetings needed
3. Emails to be sent (summaries, updates to stakeholders)

For each action, generate a unique ID (use format: action_1, action_2, etc).
For email actions, include suggested subject and brief body in metadata.
Provide a brief meeting summary (2-3 sentences).

If participants have emails, include them as recipients for relevant email actions.
Prioritize actions based on urgency mentioned in the conversation.`,
      temperature: 0.3,
    });

    return Response.json(result.object);
  } catch (error) {
    console.error("Action extraction error:", error);
    return Response.json(
      { error: "Failed to extract actions" },
      { status: 500 }
    );
  }
}
