"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Globe,
  Mic,
  Languages,
  Volume2,
  Mail,
  Sparkles,
  Users,
} from "lucide-react";

const TOTAL_SLIDES = 5;

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* Slide container */}
      <div className="flex-1 flex items-center justify-center p-8">
        {currentSlide === 0 && <SlideTitleProblem />}
        {currentSlide === 1 && <SlideSolution />}
        {currentSlide === 2 && <SlideHowItWorks />}
        {currentSlide === 3 && <SlideTechStack />}
        {currentSlide === 4 && <SlideDemo />}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
          disabled={currentSlide === 0}
          className="p-2 bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-30"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 transition-all ${
                i === currentSlide ? "bg-black w-6" : "bg-neutral-400"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1))
          }
          disabled={currentSlide === TOTAL_SLIDES - 1}
          className="p-2 bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-30"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide indicator */}
      <div className="fixed top-8 right-8 text-sm text-neutral-500 font-mono">
        {currentSlide + 1} / {TOTAL_SLIDES}
      </div>
    </div>
  );
}

function SlideTitleProblem() {
  return (
    <div className="max-w-5xl w-full text-center space-y-12">
      <div className="space-y-6">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-500">
          Agents Hackathon Brazil 2026
        </p>
        <h1 className="text-7xl lg:text-8xl font-light tracking-tight text-black">
          i18n
        </h1>
        <p className="text-2xl lg:text-3xl text-neutral-700 max-w-2xl mx-auto leading-relaxed">
          The agentic translation layer for video calls
        </p>
      </div>

      {/* Problem statement */}
      <div className="bg-black text-white p-8 max-w-2xl mx-auto">
        <p className="text-lg leading-relaxed">
          <span className="text-neutral-400">7.9B people</span> in the world.
          <br />
          <span className="text-neutral-400">7,000+</span> languages spoken.
          <br />
          <span className="font-medium">
            Language barriers cost businesses $2T annually.
          </span>
        </p>
      </div>

      <p className="text-sm text-neutral-500">
        By Crafter Station
      </p>
    </div>
  );
}

function SlideSolution() {
  return (
    <div className="max-w-5xl w-full space-y-12">
      <div className="text-center space-y-4">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-500">
          [ Solution ]
        </p>
        <h2 className="text-5xl lg:text-6xl font-light tracking-tight text-black">
          Everyone speaks their language.
          <br />
          <span className="text-neutral-400">Everyone understands.</span>
        </h2>
      </div>

      {/* Visual representation */}
      <div className="flex items-center justify-center gap-8 py-8">
        <ParticipantCard language="English" flag="🇺🇸" speaking />
        <ArrowRight className="w-8 h-8 text-neutral-400" />
        <div className="bg-black text-white p-6 space-y-2">
          <Sparkles className="w-6 h-6 mx-auto" />
          <p className="text-xs uppercase tracking-wider">AI Agent</p>
        </div>
        <ArrowRight className="w-8 h-8 text-neutral-400" />
        <ParticipantCard language="Português" flag="🇧🇷" />
        <ParticipantCard language="Español" flag="🇪🇸" />
      </div>

      {/* Key benefits */}
      <div className="grid grid-cols-3 gap-8 text-center">
        <div className="space-y-2">
          <p className="text-5xl font-light">{"<"}500ms</p>
          <p className="text-sm text-neutral-600">Translation latency</p>
        </div>
        <div className="space-y-2">
          <p className="text-5xl font-light">10+</p>
          <p className="text-sm text-neutral-600">Languages supported</p>
        </div>
        <div className="space-y-2">
          <p className="text-5xl font-light">98%</p>
          <p className="text-sm text-neutral-600">Translation accuracy</p>
        </div>
      </div>
    </div>
  );
}

function SlideHowItWorks() {
  return (
    <div className="max-w-5xl w-full space-y-12">
      <div className="text-center space-y-4">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-500">
          [ How It Works ]
        </p>
        <h2 className="text-5xl lg:text-6xl font-light tracking-tight text-black">
          4-step agentic pipeline
        </h2>
      </div>

      {/* Pipeline visualization */}
      <div className="grid grid-cols-4 gap-6">
        <PipelineStep
          number={1}
          icon={<Mic className="w-8 h-8" />}
          title="Capture"
          description="WebRTC audio via Daily.co"
        />
        <PipelineStep
          number={2}
          icon={<Languages className="w-8 h-8" />}
          title="Transcribe"
          description="Deepgram STT"
        />
        <PipelineStep
          number={3}
          icon={<Globe className="w-8 h-8" />}
          title="Translate"
          description="GPT-4o context-aware"
        />
        <PipelineStep
          number={4}
          icon={<Volume2 className="w-8 h-8" />}
          title="Synthesize"
          description="ElevenLabs Flash v2.5"
        />
      </div>

      {/* Bonus: AI Agent capabilities */}
      <div className="bg-neutral-200/50 p-8 mt-8">
        <div className="flex items-center gap-4 mb-4">
          <Sparkles className="w-5 h-5" />
          <p className="font-medium">Bonus: Proactive AI Agent</p>
        </div>
        <div className="grid grid-cols-3 gap-6 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>Auto-detect email intents</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Meeting summarization</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Action item extraction</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideTechStack() {
  return (
    <div className="max-w-5xl w-full space-y-12">
      <div className="text-center space-y-4">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-500">
          [ Tech Stack ]
        </p>
        <h2 className="text-5xl lg:text-6xl font-light tracking-tight text-black">
          Built for real-time
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <TechCard
          name="Daily.co"
          role="Video Infrastructure"
          description="WebRTC with ultra-low latency audio/video streaming"
        />
        <TechCard
          name="Deepgram"
          role="Speech-to-Text"
          description="Real-time transcription with speaker diarization"
        />
        <TechCard
          name="OpenAI GPT-4o"
          role="Translation + Agent"
          description="Context-aware translation preserving tone and idioms"
        />
        <TechCard
          name="ElevenLabs"
          role="Text-to-Speech"
          description="Flash v2.5 with 75ms latency, natural voice"
        />
      </div>

      <div className="flex justify-center gap-8 text-sm text-neutral-500 pt-4">
        <span>Next.js 16</span>
        <span>•</span>
        <span>TypeScript</span>
        <span>•</span>
        <span>Tailwind CSS</span>
        <span>•</span>
        <span>Neon PostgreSQL</span>
        <span>•</span>
        <span>Resend</span>
      </div>
    </div>
  );
}

function SlideDemo() {
  return (
    <div className="max-w-5xl w-full space-y-12">
      <div className="text-center space-y-4">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-500">
          [ Live Demo ]
        </p>
        <h2 className="text-5xl lg:text-6xl font-light tracking-tight text-black">
          See it in action
        </h2>
      </div>

      {/* Demo screenshot placeholder */}
      <div className="relative bg-neutral-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border-4 border-neutral-800">
        {/* Placeholder UI mockup */}
        <div className="absolute inset-0 p-4 flex">
          {/* Video grid mock */}
          <div className="flex-1 grid grid-cols-2 gap-2 p-2">
            <div className="bg-neutral-800 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-neutral-700 rounded-full mx-auto mb-2" />
                <p className="text-white/60 text-sm">You (English)</p>
              </div>
            </div>
            <div className="bg-neutral-800 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-neutral-700 rounded-full mx-auto mb-2" />
                <p className="text-white/60 text-sm">Guest (Português)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Translation overlay mock */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-lg">
          <p className="text-lg">"Prazer em conhecê-lo!"</p>
        </div>

        {/* Agent panel mock */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-96 bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-white/70 text-sm mb-3">
            <Sparkles className="w-4 h-4" />
            <span>AI Agent</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="bg-white/10 rounded-lg p-2 text-white/80">
              <span className="text-blue-400 text-xs">Maria:</span> Nice to meet you!
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-white/80">
              <span className="text-green-400 text-xs">João:</span> Prazer em conhecê-lo!
            </div>
          </div>
        </div>

        <div className="z-10 text-center">
          <p className="text-white/50 text-sm">[ Screenshot placeholder ]</p>
        </div>
      </div>

      <div className="text-center space-y-6">
        <a
          href="https://i18n.crafter.run/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 text-lg font-medium hover:bg-neutral-800 transition-colors"
        >
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Launch Live Demo
          <ArrowRight className="w-5 h-5" />
        </a>
        <p className="text-sm text-neutral-500">
          github.com/crafter-station/i18n
        </p>
      </div>
    </div>
  );
}

// Helper components
function ParticipantCard({
  language,
  flag,
  speaking,
}: {
  language: string;
  flag: string;
  speaking?: boolean;
}) {
  return (
    <div
      className={`p-6 border-2 ${speaking ? "border-blue-500 bg-blue-50" : "border-neutral-300"} space-y-2 text-center`}
    >
      <p className="text-4xl">{flag}</p>
      <p className="text-sm font-medium">{language}</p>
      {speaking && (
        <div className="flex items-center justify-center gap-1">
          <span className="w-1 h-3 bg-blue-500 animate-pulse" />
          <span className="w-1 h-4 bg-blue-500 animate-pulse delay-75" />
          <span className="w-1 h-2 bg-blue-500 animate-pulse delay-150" />
        </div>
      )}
    </div>
  );
}

function PipelineStep({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto">
          {icon}
        </div>
        <span className="absolute -top-2 -right-2 w-8 h-8 bg-neutral-200 text-black text-sm font-medium rounded-full flex items-center justify-center">
          {number}
        </span>
      </div>
      <div>
        <p className="font-medium text-lg">{title}</p>
        <p className="text-sm text-neutral-600">{description}</p>
      </div>
    </div>
  );
}

function TechCard({
  name,
  role,
  description,
}: {
  name: string;
  role: string;
  description: string;
}) {
  return (
    <div className="border-l-2 border-black pl-6 py-2">
      <p className="text-2xl font-light">{name}</p>
      <p className="font-medium text-sm text-neutral-700">{role}</p>
      <p className="text-sm text-neutral-500 mt-1">{description}</p>
    </div>
  );
}
