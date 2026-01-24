import { elevenlabs } from "@ai-sdk/elevenlabs";
import { experimental_generateSpeech as generateSpeech } from "ai";

import { isValidLanguageCode, LANGUAGE_VOICES } from "@/lib/languages";

export async function POST(req: Request) {
  try {
    const { text, language } = await req.json();

    if (!text || text.trim().length === 0) {
      return Response.json({ error: "No text provided" }, { status: 400 });
    }

    // STRICT: Validate language code - no fallbacks
    if (!language || !isValidLanguageCode(language)) {
      console.error("[TTS API] Invalid language code:", language);
      return Response.json(
        { error: `Invalid language code: ${language}` },
        { status: 400 },
      );
    }

    const voiceId = LANGUAGE_VOICES[language];
    if (!voiceId) {
      console.error("[TTS API] No voice configured for language:", language);
      return Response.json(
        { error: `No voice available for language: ${language}` },
        { status: 400 },
      );
    }

    console.log("[TTS API] Generating speech:", {
      language,
      voiceId,
      textLength: text.length,
    });

    const result = await generateSpeech({
      model: elevenlabs.speech("eleven_flash_v2_5"),
      text,
      voice: voiceId,
      providerOptions: {
        elevenlabs: {
          outputFormat: "mp3_22050_32",
          optimizeStreamingLatency: 4,
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            speed: 1.1,
          },
        },
      },
    });

    return new Response(Buffer.from(result.audio.uint8Array), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return Response.json({ error: "TTS failed" }, { status: 500 });
  }
}
