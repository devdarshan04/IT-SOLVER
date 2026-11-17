import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, Database, Cpu, ExternalLink, X, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await api.system.getStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load system status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      await api.system.setApiKey({ gemini_api_key: apiKey.trim() });
      setMessage('Gemini API Key updated successfully!');
      setApiKey('');
      await loadStatus();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Engine & System Status</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Google Gemini & Relational Database Integration</p>
          </div>
        </div>

        {/* Status badges */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <Database className="w-4 h-4 text-emerald-500" /> Database Engine
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {status?.database || 'Connected'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <Sparkles className="w-4 h-4 text-cyan-500" /> Gemini API Status
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              {status?.has_gemini_key ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Active ({status.masked_key})</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-amber-500 text-xs">Built-in IT Engine Active</span>
                </>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Configure Google Gemini API Key
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder={status?.has_gemini_key ? "Enter new key to replace..." : "AIzaSy..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              Don't have a key?{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-0.5"
              >
                Get a free key from Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              message.startsWith('Error') 
                ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            }`}>
              {message.startsWith('Error') ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {message}
            </div>
          )}

          <div className="p-3 rounded-xl bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-cyan-600 dark:text-cyan-400 mb-0.5">Note on Offline / Zero-Config Testing</p>
            FixTrail includes an intelligent local IT diagnostic engine that runs even without an external API key, so you can test all screenshot uploads and troubleshooting workflows immediately!
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving || !apiKey.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 transition shadow-lg shadow-cyan-500/20"
            >
              {saving ? 'Saving...' : 'Save API Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
