import { experimental_generateSpeech as generateSpeech } from "ai";
import { elevenlabs } from "@ai-sdk/elevenlabs";

import { LANGUAGE_VOICES } from "@/lib/languages";

export async function POST(req: Request) {
  try {
    const { text, language } = await req.json();

    if (!text || text.trim().length === 0) {
      return Response.json({ error: "No text provided" }, { status: 400 });
    }

    const voiceId = LANGUAGE_VOICES[language] || LANGUAGE_VOICES.en;

    // Generate speech using Vercel AI SDK with ElevenLabs Flash v2.5
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
