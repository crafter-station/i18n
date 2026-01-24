import { NextResponse } from "next/server";

import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

import { getLanguageName } from "@/lib/languages";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text, targetLanguage, sourceLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "text and targetLanguage are required" },
        { status: 400 },
      );
    }

    const targetLangName = getLanguageName(targetLanguage);
    const sourceLangName = sourceLanguage
      ? getLanguageName(sourceLanguage)
      : null;

    // Use Groq's fastest model for low latency
    const { text: translatedText } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: `Translate the following text to ${targetLangName}. ${sourceLangName ? `The source language is ${sourceLangName}.` : ""} Only respond with the translation, nothing else. Do not add quotes or explanations.

Text: ${text}`,
    });

    console.log("[Translate API]", {
      from: sourceLangName || "auto",
      to: targetLangName,
      original: text.slice(0, 30),
      translated: translatedText.slice(0, 30),
    });

    return NextResponse.json({ translatedText: translatedText.trim() });
  } catch (error) {
    console.error("[Translate API] Error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
