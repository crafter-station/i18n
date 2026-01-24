import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type UIMessage,
} from "ai";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { transcripts, rooms } from "@/db/schema";
import { webSearchTool } from "@/tools/web-search";
import mockData from "@/mock/transcripts.json";

export const maxDuration = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Try to find transcripts in database
    let roomTranscripts = await db.query.transcripts.findMany({
      where: eq(transcripts.roomId, roomId),
      orderBy: (transcripts, { asc }) => [asc(transcripts.timestamp)],
    });

    // Use mock data if no transcripts found
    if (roomTranscripts.length === 0) {
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
    }

    const transcriptContext = roomTranscripts
      .map((t) => {
        const time = new Date(t.timestamp).toLocaleTimeString();
        const speaker = t.speakerName || "Unknown";
        return `[${time}] ${speaker} (${t.originalLanguage}): ${t.originalText}`;
      })
      .join("\n");

    const systemPrompt = `You are a helpful meeting assistant for an internationalized video call platform.
You have access to the complete transcript of a meeting room and a web search tool. Your job is to:
- Answer questions about what was discussed in the meeting
- Tell what specific participants said
- Extract action items and tasks mentioned
- Summarize decisions that were made
- Search the web for additional context when needed

Here is the complete meeting transcript:
---
${transcriptContext || "No transcript available yet for this meeting."}
---

Guidelines:
- For questions about the meeting, use ONLY the transcript above
- If the user asks about external topics, current events, or needs additional information not in the transcript, use the webSearch tool
- If something wasn't discussed in the meeting, say so and offer to search the web if relevant
- Be concise and helpful
- Respond in the same language the user asks the question`;

    const result = streamText({
      model: "openai/gpt-5.1",
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: {
        webSearch: webSearchTool,
      },
      stopWhen: stepCountIs(5),
      temperature: 0.3,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Agent error:", error);
    return Response.json({ error: "Agent failed" }, { status: 500 });
  }
}
