import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Star, 
  ExternalLink, 
  Bookmark, 
  BookOpen, 
  Trash2, 
  Share2, 
  X,
  MessageSquare,
  Sparkles,
  Terminal,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';

export default function HistoryPage({ setActivePage }) {
  const { user, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active Ticket Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editStatus, setEditStatus] = useState('solved');

  useEffect(() => {
    if (isAuthenticated) {
      loadTickets();
    }
  }, [isAuthenticated, statusFilter, categoryFilter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;
      const data = await api.issues.getAll(params);
      setTickets(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTickets();
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setEditNotes(ticket.resolution_notes || '');
    setEditRating(ticket.rating || 5);
    setEditStatus(ticket.status || 'open');
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      const updated = await api.issues.update(selectedTicket.id, {
        status: editStatus,
        resolution_notes: editNotes,
        rating: editRating,
      });
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      alert('Ticket updated successfully!');
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handlePublishToKb = async (ticketId) => {
    try {
      await api.issues.publishToKb(ticketId);
      alert('This solved issue was successfully published to the Knowledge Base!');
      loadTickets();
      if (selectedTicket) {
        setSelectedTicket({ ...selectedTicket, is_public_kb: true });
      }
    } catch (err) {
      alert(`Publish failed: ${err.message}`);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!confirm('Are you sure you want to delete this ticket from your history?')) return;
    try {
      await api.issues.delete(ticketId);
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      if (selectedTicket?.id === ticketId) setSelectedTicket(null);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mx-auto flex items-center justify-center mb-4">
          <History className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In to View History</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
          Your personal problem-solving history stores all your error scans, custom resolution notes, and star ratings.
        </p>
        <button
          onClick={() => setActivePage('login')}
          className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/20"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  // Summary Metrics
  const totalCount = tickets.length;
  const solvedCount = tickets.filter((t) => t.status === 'solved').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const openCount = tickets.filter((t) => t.status === 'open').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <History className="w-8 h-8 text-cyan-500" />
          Personal Problem-Solving History
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review, annotate, and track all your technical issues diagnosed by FixTrail.
        </p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Tickets" value={totalCount} icon={Bookmark} color="cyan" />
        <StatCard title="Solved Issues" value={solvedCount} icon={CheckCircle2} color="emerald" />
        <StatCard title="In Progress" value={inProgressCount} icon={Clock} color="amber" />
        <StatCard title="Open Issues" value={openCount} icon={AlertCircle} color="rose" />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['all', 'solved', 'in_progress', 'open'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by error or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400 mt-2 font-mono">Loading ticket history...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No issues found matching your filters.</p>
          <p className="text-xs text-slate-400 mt-1">Upload a new error screenshot on the Solve page to start tracking.</p>
          <button
            onClick={() => setActivePage('solve')}
            className="mt-4 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-md shadow-cyan-600/20"
          >
            Diagnose New Issue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((t) => {
            const statusConfig = {
              solved: { label: 'Solved', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
              in_progress: { label: 'In Progress', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
              open: { label: 'Open', badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
              closed: { label: 'Closed', badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
            }[t.status] || { label: t.status, badge: 'bg-slate-500/10 text-slate-500' };

            return (
              <div
                key={t.id}
                onClick={() => openTicketModal(t)}
                className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-cyan-500/40 cursor-pointer flex flex-col justify-between group transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.badge}`}>
                      {statusConfig.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition line-clamp-2 mb-2">
                    {t.title}
                  </h3>

                  {t.detected_error_code && (
                    <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-900 text-cyan-400 border border-cyan-500/20 mb-3">
                      {t.detected_error_code}
                    </span>
                  )}

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {t.root_cause || t.description || 'No additional notes provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{t.category}</span>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">{t.rating || 5}.0</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Details & Edit Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-slate-900 text-cyan-400 border border-cyan-500/20">
                  {selectedTicket.detected_error_code || 'IT Ticket'}
                </span>
                <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {selectedTicket.category}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(selectedTicket.created_at).toLocaleString()}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {selectedTicket.title}
              </h2>
            </div>

            {/* Screenshot if available */}
            {selectedTicket.screenshot_url && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-60 bg-black/40">
                <img
                  src={selectedTicket.screenshot_url}
                  alt="Saved Error Screenshot"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* AI Diagnosis Details */}
            <div className="p-4 rounded-2xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/20 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <p className="font-bold text-cyan-600 dark:text-cyan-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Root Cause Diagnosis:
              </p>
              <p>{selectedTicket.root_cause || selectedTicket.ai_diagnosis}</p>
            </div>

            {/* Update Form: Status, Notes, Rating */}
            <form onSubmit={handleUpdateTicket} className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Manage Ticket Status & Personal Notes
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ticket Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="open">Open (Unresolved)</option>
                    <option value="in_progress">In Progress</option>
                    <option value="solved">Solved (Verified)</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Solution Rating
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditRating(star)}
                        className={`p-1 text-base transition ${
                          star <= editRating ? 'text-amber-400 scale-110' : 'text-slate-600'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-500 ml-2">{editRating} / 5</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Notes & What Worked
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Ran step 2 in administrative PowerShell and port was released immediately."
                  className="w-full p-3 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition"
                    title="Delete ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {editStatus === 'solved' && !selectedTicket.is_public_kb && (
                    <button
                      type="button"
                      onClick={() => handlePublishToKb(selectedTicket.id)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Publish to Knowledge Base</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-md shadow-cyan-600/20"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
