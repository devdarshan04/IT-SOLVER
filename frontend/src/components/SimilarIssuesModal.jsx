import React, { useState } from 'react';
import { Layers, CheckCircle2, BookOpen, ExternalLink, ChevronDown, ChevronUp, Sparkles, ShieldCheck } from 'lucide-react';

export default function SimilarIssuesModal({ similarIssues, onSelectKbArticle }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!similarIssues || similarIssues.length === 0) return null;

  return (
    <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-cyan-500/10 border border-amber-500/30 dark:border-amber-500/20 shadow-lg">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Similar Solved Issues Detected
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                {similarIssues.length} Matches Found
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              FixTrail cross-referenced your symptoms with verified solutions in our Knowledge Base.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {similarIssues.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-cyan-500/40 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                    {item.similarity_score}% Match
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                        {item.category}
                      </span>
                      {item.is_kb ? (
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified KB Solution
                        </span>
                      ) : (
                        <span className="text-cyan-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved User Ticket
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title={isExpanded ? 'Collapse' : 'Expand Quick Fix'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Fix Preview Accordion */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-2 animate-fadeIn">
                  <p className="font-semibold text-slate-900 dark:text-white">Quick Solution Summary:</p>
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                    {item.quick_fix}
                  </p>
                  {item.is_kb && onSelectKbArticle && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onSelectKbArticle(item.id)}
                        className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        Open Full Knowledge Base Guide <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
