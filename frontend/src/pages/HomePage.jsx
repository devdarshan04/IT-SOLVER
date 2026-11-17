import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  Layers, 
  Database, 
  Zap, 
  CheckCircle2, 
  BookOpen, 
  Search,
  ExternalLink
} from 'lucide-react';
import Hero3D from '../components/Hero3D';

export default function HomePage({ setActivePage }) {
  const features = [
    {
      icon: Sparkles,
      title: 'AI Screenshot OCR Detection',
      desc: 'Upload any error popup or stack trace screenshot. Our multimodal vision model extracts the error code and diagnoses the underlying system failure.',
      tag: 'Gemini Vision',
    },
    {
      icon: Terminal,
      title: 'Actionable Step-by-Step Fixes',
      desc: 'No vague explanations. Receive clear shell commands, PowerShell scripts, and configuration edits with 1-click copy and progress tracking.',
      tag: 'CLI & PowerShell',
    },
    {
      icon: Search,
      title: 'Similar Issue Detection',
      desc: 'Our similarity engine cross-references your issue against thousands of verified solutions in the Knowledge Base to surface instant fixes.',
      tag: '94%+ Match Rate',
    },
    {
      icon: Database,
      title: 'Personal Problem-Solving History',
      desc: 'Maintain an organized log of all your resolved technical tickets, custom resolution notes, and ratings for rapid future reference.',
      tag: 'MySQL & SQLAlchemy',
    },
    {
      icon: BookOpen,
      title: 'Community Knowledge Base',
      desc: 'Browse and upvote curated fixes for Docker, Kubernetes, MySQL 2003, Windows BSODs, React CORS, and port collisions.',
      tag: 'Verified Guides',
    },
    {
      icon: ShieldCheck,
      title: 'Admin Intelligence & Analytics',
      desc: 'Executive dashboard tracking resolution velocity, category trends, API health, and team troubleshooting metrics.',
      tag: 'Live Analytics',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 py-6 sm:py-10">
      
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
              Powered by Google Gemini 1.5 & 2.0 API
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              Instant IT Troubleshooting.{' '}
              <span className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-400 dark:from-cyan-400 dark:via-cyan-300 dark:to-teal-300 bg-clip-text text-transparent">
                One Screenshot Away.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Snap a screenshot of your cryptic terminal error, BSOD, or database crash. <b>FixTrail</b> detects the root cause and generates clear, copy-pasteable step-by-step resolution scripts.
            </p>

            {/* Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => setActivePage('solve')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 shadow-xl shadow-cyan-500/25 transition-all duration-200 flex items-center justify-center gap-2.5 group hover:scale-[1.02]"
              >
                <span>Upload Error & Diagnose</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setActivePage('knowledge')}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl font-semibold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-cyan-500" />
                <span>Explore Knowledge Base</span>
              </button>
            </div>

            {/* Live Stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-left">
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">96.5%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Resolution Rate</p>
              </div>
              <div>
                <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">&lt; 3.2s</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Diagnostic Speed</p>
              </div>
              <div>
                <p className="text-2xl font-black text-teal-600 dark:text-teal-400">100%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Actionable Steps</p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero3D Interactive Element */}
          <div className="lg:col-span-5 w-full">
            <Hero3D />
          </div>

        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            Enterprise Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-3">
            Engineered for Modern IT & DevOps Teams
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
            Every layer of FixTrail is built to streamline error diagnosis and reduce Mean Time to Resolution (MTTR).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative group hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition duration-200">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {f.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tech Stack Ribbon */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Production-Grade Tech Stack
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Robust full-stack architecture with Python FastAPI, MySQL database, and React.js frontend.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
              <p className="text-cyan-400 font-bold text-sm">React.js + Vite</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Component UI</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
              <p className="text-teal-400 font-bold text-sm">Tailwind CSS</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Responsive Styles</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
              <p className="text-emerald-400 font-bold text-sm">Python FastAPI</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Async REST API</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
              <p className="text-blue-400 font-bold text-sm">MySQL Database</p>
              <p className="text-[11px] text-slate-400 mt-0.5">SQLAlchemy ORM</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 col-span-2 sm:col-span-1">
              <p className="text-purple-400 font-bold text-sm">Google Gemini</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Vision & Reasoning</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
