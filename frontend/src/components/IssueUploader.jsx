import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  Sparkles, 
  Terminal, 
  Monitor, 
  Zap, 
  Clipboard, 
  AlertCircle 
} from 'lucide-react';

const SAMPLE_TEMPLATES = [
  {
    name: 'Port 3000 Already In Use',
    desc: 'Error: listen EADDRINUSE: address already in use :::3000 when starting dev server',
    os: 'Windows',
    cat: 'Networking',
  },
  {
    name: 'CORS Policy Blocked',
    desc: 'Access to fetch at http://localhost:8000/api from origin http://localhost:5173 has been blocked by CORS policy: No Access-Control-Allow-Origin header is present on the requested resource.',
    os: 'Web/Browser',
    cat: 'Web & Frontend',
  },
  {
    name: 'Docker Daemon Unreachable',
    desc: 'Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?',
    os: 'Linux',
    cat: 'DevOps & Cloud',
  },
  {
    name: 'MySQL Error 2003 Connection Refused',
    desc: 'OperationalError: (2003, "Can\'t connect to MySQL server on localhost:3306 (10061)")',
    os: 'Windows',
    cat: 'Database',
  },
  {
    name: 'Windows BSOD Stop Code',
    desc: 'Your PC ran into a problem and needs to restart. Stop code: KMODE_EXCEPTION_NOT_HANDLED, What failed: ndis.sys',
    os: 'Windows',
    cat: 'Operating System',
  },
];

export default function IssueUploader({ onAnalyze, loading }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState('');
  const [osPlatform, setOsPlatform] = useState('Windows');
  const [categoryHint, setCategoryHint] = useState('Auto-Detect');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          handleSelectedFile(blob);
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleSelectedFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyTemplate = (tpl) => {
    setDescription(tpl.desc);
    setOsPlatform(tpl.os);
    setCategoryHint(tpl.cat);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file && !description.trim()) {
      alert('Please upload a screenshot or describe your error.');
      return;
    }

    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('description', description);
    formData.append('os_platform', osPlatform);
    formData.append('category_hint', categoryHint);

    onAnalyze(formData);
  };

  return (
    <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            AI Problem Diagnostics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload an error screenshot or paste your stack trace for instant step-by-step resolution.
          </p>
        </div>

        {/* Quick Clipboard notice */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] font-medium text-slate-600 dark:text-slate-300 self-start sm:self-auto">
          <Clipboard className="w-3.5 h-3.5 text-cyan-500" />
          <span>Press <b>Ctrl + V</b> anywhere to paste screenshot</span>
        </div>
      </div>

      {/* Quick Sample Selector */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick-Test Sample Error Scenarios
        </label>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-cyan-50 dark:bg-slate-800/60 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 hover:border-cyan-500/40 transition"
            >
              {tpl.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drag and Drop Zone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            1. Screenshot Error Image (Optional / Highly Recommended)
          </label>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-cyan-500 bg-cyan-500/10 scale-[1.01]'
                : previewUrl
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-cyan-50/20 dark:hover:bg-cyan-950/10'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleSelectedFile(e.target.files[0])}
            />

            {previewUrl ? (
              <div className="flex flex-col items-center">
                <div className="relative group max-w-sm rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-md">
                  <img
                    src={previewUrl}
                    alt="Error Screenshot Preview"
                    className="max-h-52 object-contain bg-black/40"
                  />
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {file?.name} (Click or drag another to replace)
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Drag and drop error screenshot here, or <span className="text-cyan-600 dark:text-cyan-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Supports PNG, JPG, WEBP (or paste directly from your clipboard)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Problem Description & Stack Trace */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            2. Problem Description / Terminal Error Message
          </label>
          <div className="relative">
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. While running 'npm run dev', terminal threw 'Error: listen EADDRINUSE: address already in use :::3000'..."
              className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono transition"
            />
          </div>
        </div>

        {/* Environment Metadata: Platform & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-cyan-500" /> Target OS / Environment
            </label>
            <select
              value={osPlatform}
              onChange={(e) => setOsPlatform(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            >
              <option value="Windows">Windows (10 / 11 / Server)</option>
              <option value="Linux">Linux (Ubuntu / Debian / RHEL / Arch)</option>
              <option value="macOS">macOS (Apple Silicon / Intel)</option>
              <option value="Docker/WSL">Docker / WSL2 Container</option>
              <option value="Web/Browser">Web Browser (Chrome / Firefox / Edge)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-500" /> Category Filter / Hint
            </label>
            <select
              value={categoryHint}
              onChange={(e) => setCategoryHint(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            >
              <option value="Auto-Detect">Auto-Detect via AI</option>
              <option value="Networking">Networking & Port Sockets</option>
              <option value="Database">Database (MySQL / Postgres / Mongo)</option>
              <option value="DevOps & Cloud">DevOps, Docker & Cloud</option>
              <option value="Web & Frontend">Web & Frontend (React / Vite / CORS)</option>
              <option value="Python & Backend">Python & Backend (FastAPI / Pip)</option>
              <option value="Operating System">Operating System & Kernel (BSOD)</option>
            </select>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading || (!file && !description.trim())}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-50 transition shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2.5"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing Error with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Diagnose & Solve Error</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
