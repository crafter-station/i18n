import { NextResponse } from "next/server";

import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

import { getLanguageName } from "@/lib/languages";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "text and targetLanguage are required" },
        { status: 400 },
      );
    }

    const targetLangName = getLanguageName(targetLanguage);

    const { text: translatedText } = await generateText({
      model: groq("openai/gpt-oss-20b"),
      prompt: `Translate to ${targetLangName}. Only respond with the translation, nothing else:\n\n${text}`,
    });

    return NextResponse.json({ translatedText: translatedText.trim() });
  } catch (error) {
    console.error("[Translate] Error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
