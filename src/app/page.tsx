"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { LanguageNetwork } from "@/components/language-network";

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (data.roomId) {
        router.push(`/${data.roomId}`);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight">i18n</span>
        </div>
        <div className="flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-neutral-600 hover:text-black transition-colors"
          >
            Features
          </a>
          <a
            href="#infrastructure"
            className="text-sm text-neutral-600 hover:text-black transition-colors"
          >
            Infrastructure
          </a>
          <button
            type="button"
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="text-sm font-medium bg-black text-white px-4 py-2 hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Start Call"}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 py-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <p className="text-xs font-medium tracking-widest uppercase text-neutral-500">
              [ REAL-TIME TRANSLATION ]
            </p>
            <h1 className="text-5xl lg:text-6xl font-light tracking-tight text-black leading-[1.1]">
              Break language barriers in every meeting
            </h1>
            <p className="text-lg text-neutral-700 leading-relaxed max-w-xl">
              The agentic translation layer for video calls. Every participant
              hears the conversation in their native language, in real-time.
              Powered by Daily.co infrastructure and advanced AI models.
            </p>
            <div className="flex items-center gap-6 pt-4">
              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="flex items-center gap-2 bg-black text-white px-6 py-3 font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Room...
                  </>
                ) : (
                  <>
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <a
                href="#features"
                className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase hover:text-neutral-600 transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-black" />
                How It Works
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <LanguageNetwork />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-neutral-200">
        <div className="px-8 py-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="space-y-2">
              <p className="text-6xl lg:text-7xl font-light text-black">
                {"<"}500ms
              </p>
              <p className="font-medium text-black">Translation latency</p>
              <p className="text-sm text-neutral-600">
                Near-instant voice translation with AI acceleration
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-6xl lg:text-7xl font-light text-black">10+</p>
              <p className="font-medium text-black">Languages supported</p>
              <p className="text-sm text-neutral-600">
                Spanish, Portuguese, French, German, and more
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-6xl lg:text-7xl font-light text-black">98%</p>
              <p className="font-medium text-black">Translation accuracy</p>
              <p className="text-sm text-neutral-600">
                Context-aware AI preserves meaning and nuance
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-6xl lg:text-7xl font-light text-black">
                10+
              </p>
              <p className="font-medium text-black">Concurrent speakers</p>
              <p className="text-sm text-neutral-600">
                Scale from 1:1 calls to team meetings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-neutral-200" id="features">
        <div className="px-8 py-24 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-6">
              <p className="text-xs font-medium tracking-widest uppercase text-neutral-500">
                [ HOW IT WORKS ]
              </p>
              <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-black leading-[1.1]">
                Your personal translation agent
              </h2>
              <p className="text-lg text-neutral-700 leading-relaxed max-w-xl">
                Each participant sets their preferred language. Your AI agent
                listens, transcribes, translates, and synthesizes speech in
                real-time. Everyone speaks naturally while hearing everything in
                their native tongue.
              </p>
              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="inline-flex items-center gap-2 text-sm font-medium tracking-wide uppercase hover:text-neutral-600 transition-colors pt-4"
              >
                <span className="w-1.5 h-1.5 bg-black" />
                Try It Now
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-8">
              <div className="border-l-2 border-black pl-6 space-y-2">
                <p className="text-xl font-medium text-black">
                  1. Voice Capture
                </p>
                <p className="text-neutral-600">
                  Daily.co WebRTC captures audio with ultra-low latency from
                  each participant
                </p>
              </div>
              <div className="border-l-2 border-neutral-300 pl-6 space-y-2">
                <p className="text-xl font-medium text-black">
                  2. Speech Recognition
                </p>
                <p className="text-neutral-600">
                  Real-time transcription identifies speaker and extracts text
                  with context
                </p>
              </div>
              <div className="border-l-2 border-neutral-300 pl-6 space-y-2">
                <p className="text-xl font-medium text-black">
                  3. AI Translation
                </p>
                <p className="text-neutral-600">
                  GPT-4o translates preserving tone, idioms, and technical
                  terminology
                </p>
              </div>
              <div className="border-l-2 border-neutral-300 pl-6 space-y-2">
                <p className="text-xl font-medium text-black">
                  4. Voice Synthesis
                </p>
                <p className="text-neutral-600">
                  ElevenLabs delivers natural TTS in the listener's language
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure Section */}
      <section className="border-t border-neutral-200" id="infrastructure">
        <div className="px-8 py-24 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <p className="text-xs font-medium tracking-widest uppercase text-neutral-500">
                [ POWERED BY ]
              </p>
              <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-black leading-[1.1]">
                Built for the hackathon
              </h2>
              <p className="text-lg text-neutral-700 leading-relaxed max-w-xl">
                Combining the best-in-class infrastructure for real-time
                communication, AI translation, and voice synthesis.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-3xl font-light text-black">Daily.co</p>
                <p className="font-medium text-black">Video Infrastructure</p>
                <p className="text-sm text-neutral-600">
                  WebRTC for ultra-low latency video and audio
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-light text-black">OpenAI</p>
                <p className="font-medium text-black">Translation</p>
                <p className="text-sm text-neutral-600">
                  GPT-4o-mini for fast, accurate translation
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-light text-black">ElevenLabs</p>
                <p className="font-medium text-black">Voice Synthesis</p>
                <p className="text-sm text-neutral-600">
                  Flash v2.5 for 75ms latency TTS
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-light text-black">Resend</p>
                <p className="font-medium text-black">Email Summary</p>
                <p className="text-sm text-neutral-600">
                  Post-call transcript delivered to inbox
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-neutral-200">
        <div className="px-8 py-24 max-w-7xl mx-auto text-center">
          <div className="space-y-8 max-w-2xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-black leading-[1.1]">
              Start breaking language barriers
            </h2>
            <p className="text-lg text-neutral-700 leading-relaxed">
              Create a room, share the link, and start talking.
            </p>
            <div className="flex items-center justify-center gap-6 pt-4">
              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="flex items-center gap-2 bg-black text-white px-8 py-4 font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Room
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200">
        <div className="px-8 py-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-2">
              <p className="text-xl font-semibold tracking-tight">i18n</p>
              <p className="text-sm text-neutral-600">
                Real-time translation for video calls
              </p>
            </div>
            <div className="flex items-center gap-8 text-sm text-neutral-600">
              <a
                href="https://github.com/crafter-station/i18n"
                className="hover:text-black transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://daily.co"
                className="hover:text-black transition-colors"
              >
                Daily.co
              </a>
              <a
                href="https://elevenlabs.io"
                className="hover:text-black transition-colors"
              >
                ElevenLabs
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-neutral-200 text-sm text-neutral-500">
            <p>Built by Crafter Station for Agents Hackathon Brazil 2026.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
