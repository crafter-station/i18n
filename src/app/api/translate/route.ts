import OpenAI from "openai";

import { db } from "@/db";
import { transcripts } from "@/db/schema";
import { generateTranscriptId } from "@/lib/nanoid";

export async function POST(req: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    const { text, fromLang, toLang, roomId, participantId, speakerName } =
      await req.json();

    // Skip if same language
    if (fromLang === toLang) {
      return Response.json({ translatedText: text });
    }

    // Translate using GPT-4o-mini (fast + cheap)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a real-time translator. Translate the following text from ${fromLang} to ${toLang}. Output ONLY the translation, nothing else. Preserve the tone and intent.`,
        },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const translatedText = response.choices[0].message.content?.trim() || text;

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
