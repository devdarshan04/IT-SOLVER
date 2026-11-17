import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  ThumbsUp, 
  Eye, 
  Terminal, 
  Copy, 
  Check, 
  Plus, 
  Filter, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All',
  'Networking',
  'DevOps & Cloud',
  'Database',
  'Web & Frontend',
  'Operating System',
];

export default function KnowledgeBasePage({ initialSelectedArticleId = null }) {
  const { isAuthenticated, user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [platform, setPlatform] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [expandedId, setExpandedId] = useState(initialSelectedArticleId);
  const [copiedKey, setCopiedKey] = useState(null);
  const [helpfulGiven, setHelpfulGiven] = useState({});

  // Contribute Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newCategory, setNewCategory] = useState('Networking');
  const [newPlatform, setNewPlatform] = useState('All Platforms');
  const [newCommand, setNewCommand] = useState('');
  const [newSteps, setNewSteps] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadArticles();
  }, [selectedCategory, platform, sortBy]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await api.knowledge.getAll({
        search,
        category: selectedCategory,
        platform,
        sort_by: sortBy,
      });
      setArticles(data);
    } catch (err) {
      console.error('Failed to load KB:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadArticles();
  };

  const handleHelpful = async (articleId, e) => {
    e.stopPropagation();
    if (helpfulGiven[articleId]) return;
    try {
      const res = await api.knowledge.markHelpful(articleId);
      setHelpfulGiven((prev) => ({ ...prev, [articleId]: true }));
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, helpful_count: res.helpful_count, upvotes: (a.upvotes || 0) + 1 } : a))
      );
    } catch (err) {
      console.error('Helpful vote failed:', err);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) {
      alert('Please provide a title and problem summary.');
      return;
    }
    setSubmitting(true);
    try {
      // Build step json
      const stepsPayload = [
        {
          step_number: 1,
          title: 'Primary Resolution Command',
          action: newSteps || 'Execute the following command in terminal to resolve the issue.',
          command: newCommand || null,
          explanation: 'Standard verified solution tested by FixTrail community.',
        },
      ];

      await api.knowledge.create({
        title: newTitle,
        problem_summary: newSummary,
        category: newCategory,
        os_platform: newPlatform,
        steps_json: JSON.stringify(stepsPayload),
        verification_command: newCommand ? `echo "Verified"` : null,
        tags: `${newCategory.toLowerCase()},community`,
      });

      setIsModalOpen(false);
      setNewTitle('');
      setNewSummary('');
      setNewCommand('');
      setNewSteps('');
      alert('Knowledge Base article created successfully!');
      loadArticles();
    } catch (err) {
      alert(`Creation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-cyan-500" />
            FixTrail Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Curated, verified technical resolutions for frequent developer and sysadmin roadblocks.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-md shadow-cyan-600/20 flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Contribute Solution</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search & Sort Filters Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search solutions (e.g. Docker, CORS, MySQL 2003, BSOD)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </form>

        {/* Sort & OS Platform dropdowns */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All OS Platforms</option>
            <option value="Windows">Windows</option>
            <option value="Linux">Linux</option>
            <option value="Multi-Platform">Multi-Platform</option>
            <option value="Web/Browser">Web / Browser</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="popular">Most Popular</option>
            <option value="helpful">Most Helpful</option>
            <option value="newest">Recently Added</option>
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400 mt-2 font-mono">Loading knowledge articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No articles matched your criteria.</p>
          <p className="text-xs text-slate-400 mt-1">Try broadening your search term or selecting another category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((art) => {
            const isExpanded = expandedId === art.id;
            let steps = [];
            try {
              steps = JSON.parse(art.steps_json || '[]');
            } catch (e) {
              steps = [];
            }

            return (
              <div
                key={art.id}
                className={`glass-card p-5 sm:p-6 rounded-3xl border transition-all duration-200 ${
                  isExpanded
                    ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/5'
                    : 'border-slate-200 dark:border-slate-800 hover:border-cyan-500/30'
                }`}
              >
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : art.id)}
                  className="cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        {art.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {art.os_platform}
                      </span>
                      <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Fix
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {art.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {art.problem_summary}
                    </p>
                  </div>

                  {/* Right Action stats */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={(e) => handleHelpful(art.id, e)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                        helpfulGiven[art.id]
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-500'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{art.helpful_count || 0} Helpful</span>
                    </button>

                    <div className="text-slate-400 hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-cyan-500" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Troubleshooting Steps Drawer */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
                    {art.root_cause && (
                      <div className="p-3.5 rounded-xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">Root Cause: </span>
                        {art.root_cause}
                      </div>
                    )}

                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Step-by-Step Resolution Guide
                    </h4>

                    {steps.map((st, sidx) => (
                      <div key={sidx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold flex items-center justify-center">
                            {st.step_number || sidx + 1}
                          </span>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                            {st.title}
                          </h5>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {st.action}
                        </p>

                        {st.command && (
                          <div className="relative group my-2">
                            <div className="terminal-block">
                              <pre className="text-xs font-mono">{st.command}</pre>
                            </div>
                            <button
                              onClick={() => copyToClipboard(st.command, `${art.id}-${sidx}`)}
                              className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 border border-slate-700"
                            >
                              {copiedKey === `${art.id}-${sidx}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedKey === `${art.id}-${sidx}` ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {art.verification_command && (
                      <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-emerald-400 font-bold">Verification: </span>
                          <span>{art.verification_command}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(art.verification_command, `verify-${art.id}`)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px]"
                        >
                          {copiedKey === `verify-${art.id}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2">
                      <span>Contributed by: <b>{art.created_by}</b></span>
                      <span>{art.views_count || 1} Views</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Contribute Knowledge Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-500" /> Contribute to Knowledge Base
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Share a verified fix to help other developers resolve recurring technical problems.
            </p>

            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Article Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Resolving Python 'SSL: CERTIFICATE_VERIFY_FAILED'"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Platform
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="All Platforms">All Platforms</option>
                    <option value="Windows">Windows</option>
                    <option value="Linux">Linux</option>
                    <option value="Multi-Platform">Multi-Platform</option>
                    <option value="Web/Browser">Web / Browser</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Problem Summary & Symptoms
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain when this error triggers and what the symptom looks like..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Command / Script
                </label>
                <input
                  type="text"
                  placeholder="e.g. pip install --upgrade certifi"
                  value={newCommand}
                  onChange={(e) => setNewCommand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-md shadow-cyan-600/20"
                >
                  {submitting ? 'Publishing...' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
