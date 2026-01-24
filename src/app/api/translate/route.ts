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

    console.log("[Translate API] Translating to:", targetLangName);

    const { text: translatedText } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: `Translate the following text to ${targetLangName}. Only respond with the translation, nothing else. Do not add quotes or explanations.

Text: ${text}`,
    });

    console.log("[Translate API]", {
      to: targetLangName,
      original: text.slice(0, 30),
      translated: translatedText.trim().slice(0, 30),
    });

    return NextResponse.json({ translatedText: translatedText.trim() });
  } catch (error) {
    console.error("[Translate API] Error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
