import { ArrowRight } from "lucide-react";

import { LanguageNetwork } from "@/components/language-network";

export default function Home() {
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
          <a
            href="#pricing"
            className="text-sm text-neutral-600 hover:text-black transition-colors"
          >
            Pricing
          </a>
          <button
            type="button"
            className="text-sm font-medium bg-black text-white px-4 py-2 hover:bg-neutral-800 transition-colors"
          >
            Get Started
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
                className="flex items-center gap-2 bg-black text-white px-6 py-3 font-medium hover:bg-neutral-800 transition-colors"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#demo"
                className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase hover:text-neutral-600 transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-black" />
                Watch Demo
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
              <p className="text-6xl lg:text-7xl font-light text-black">40+</p>
              <p className="font-medium text-black">Languages supported</p>
              <p className="text-sm text-neutral-600">
                From Spanish to Mandarin, Japanese to Arabic
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
                100+
              </p>
              <p className="font-medium text-black">Concurrent speakers</p>
              <p className="text-sm text-neutral-600">
                Scale from 1:1 calls to global all-hands
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
                Seamless multilingual conversations
              </h2>
              <p className="text-lg text-neutral-700 leading-relaxed max-w-xl">
                Each participant sets their preferred language. Our AI agents
                listen, transcribe, translate, and synthesize speech in
                real-time. Everyone speaks naturally while hearing everything in
                their native tongue.
              </p>
              <a
                href="#docs"
                className="inline-flex items-center gap-2 text-sm font-medium tracking-wide uppercase hover:text-neutral-600 transition-colors pt-4"
              >
                <span className="w-1.5 h-1.5 bg-black" />
                Technical Documentation
                <ArrowRight className="w-3 h-3" />
              </a>
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
                  Agentic LLMs translate preserving tone, idioms, and technical
                  terminology
                </p>
              </div>
              <div className="border-l-2 border-neutral-300 pl-6 space-y-2">
                <p className="text-xl font-medium text-black">
                  4. Voice Synthesis
                </p>
                <p className="text-neutral-600">
                  Natural TTS delivers translation in the listener's language
                  with original speaker's voice characteristics
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
                [ INFRASTRUCTURE ]
              </p>
              <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-black leading-[1.1]">
                Built on Daily.co's global network
              </h2>
              <p className="text-lg text-neutral-700 leading-relaxed max-w-xl">
                We leverage Daily.co's battle-tested WebRTC infrastructure to
                ensure crystal-clear audio capture and delivery. Combined with
                edge-deployed AI models, we achieve translation latency that
                feels instantaneous.
              </p>
              <a
                href="#architecture"
                className="inline-flex items-center gap-2 text-sm font-medium tracking-wide uppercase hover:text-neutral-600 transition-colors pt-4"
              >
                <span className="w-1.5 h-1.5 bg-black" />
                View Architecture
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-5xl font-light text-black">75+</p>
                <p className="font-medium text-black">Global edge locations</p>
                <p className="text-sm text-neutral-600">
                  AI inference at the edge for minimal latency
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-5xl font-light text-black">99.99%</p>
                <p className="font-medium text-black">Uptime SLA</p>
                <p className="text-sm text-neutral-600">
                  Enterprise-grade reliability guaranteed
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-5xl font-light text-black">E2E</p>
                <p className="font-medium text-black">Encrypted</p>
                <p className="text-sm text-neutral-600">
                  Your conversations never leave our secure pipeline
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-5xl font-light text-black">SOC 2</p>
                <p className="font-medium text-black">Compliant</p>
                <p className="text-sm text-neutral-600">
                  Enterprise security and privacy standards
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-t border-neutral-200">
        <div className="px-8 py-24 max-w-7xl mx-auto">
          <div className="space-y-6 max-w-2xl mb-16">
            <p className="text-xs font-medium tracking-widest uppercase text-neutral-500">
              [ USE CASES ]
            </p>
            <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-black leading-[1.1]">
              For teams that span the globe
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 p-8 border border-neutral-200 hover:border-neutral-400 transition-colors">
              <p className="text-2xl font-medium text-black">
                Global All-Hands
              </p>
              <p className="text-neutral-600 leading-relaxed">
                Company-wide meetings where every employee participates in their
                preferred language. No more translation delays or missed
                context.
              </p>
            </div>
            <div className="space-y-4 p-8 border border-neutral-200 hover:border-neutral-400 transition-colors">
              <p className="text-2xl font-medium text-black">
                International Sales
              </p>
              <p className="text-neutral-600 leading-relaxed">
                Close deals across borders without interpreters. Your sales team
                speaks naturally while prospects hear perfect native
                translation.
              </p>
            </div>
            <div className="space-y-4 p-8 border border-neutral-200 hover:border-neutral-400 transition-colors">
              <p className="text-2xl font-medium text-black">
                Customer Support
              </p>
              <p className="text-neutral-600 leading-relaxed">
                Provide support in 40+ languages with a single team. Real-time
                translation removes language as a hiring constraint.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-neutral-200">
        <div className="px-8 py-24 max-w-7xl mx-auto text-center">
          <div className="space-y-8 max-w-2xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-black leading-[1.1]">
              Start breaking language barriers today
            </h2>
            <p className="text-lg text-neutral-700 leading-relaxed">
              Free for up to 5 participants. No credit card required.
            </p>
            <div className="flex items-center justify-center gap-6 pt-4">
              <button
                type="button"
                className="flex items-center gap-2 bg-black text-white px-8 py-4 font-medium hover:bg-neutral-800 transition-colors"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#contact"
                className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase hover:text-neutral-600 transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-black" />
                Contact Sales
                <ArrowRight className="w-3 h-3" />
              </a>
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
              <a href="#" className="hover:text-black transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-black transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-black transition-colors">
                Documentation
              </a>
              <a href="#" className="hover:text-black transition-colors">
                GitHub
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-neutral-200 text-sm text-neutral-500">
            <p>Built by Crafter Station. Powered by Daily.co.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
