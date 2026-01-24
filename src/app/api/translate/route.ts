import { generateText } from "ai";

import { db } from "@/db";
import { transcripts } from "@/db/schema";
import { generateTranscriptId } from "@/lib/nanoid";

export async function POST(req: Request) {
  try {
    const { text, fromLang, toLang, roomId, participantId, speakerName } =
      await req.json();

    // Skip if same language
    if (fromLang === toLang) {
      return Response.json({ translatedText: text });
    }

    // Translate using GPT-4o-mini (fast + cheap) via Vercel AI SDK
    const result = await generateText({
      model: "openai/gpt-4o-mini",
      system: `You are a real-time translator. Translate the following text from ${fromLang} to ${toLang}. Output ONLY the translation, nothing else. Preserve the tone and intent.`,
      prompt: text,
      temperature: 0.3,
      maxOutputTokens: 500,
    });

    const translatedText = result.text.trim() || text;

    // Store transcript if roomId provided
    if (roomId && participantId) {
      await db.insert(transcripts).values({
        id: generateTranscriptId(),
        roomId,
        participantId,
        speakerName: speakerName || null,
        originalText: text,
        originalLanguage: fromLang,
        translatedTexts: { [toLang]: translatedText },
      });
    }

    return Response.json({ translatedText });
  } catch (error) {
    console.error("Translation error:", error);
    return Response.json({ error: "Translation failed" }, { status: 500 });
  }
}
