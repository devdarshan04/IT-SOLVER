import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Database, 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  Trash2, 
  ExternalLink,
  Flame,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';

export default function AdminDashboardPage({ setActivePage }) {
  const { user, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashData, ticketsData] = await Promise.all([
        api.analytics.getDashboard(),
        api.issues.getAll({ all_users: true }),
      ]);
      setMetrics(dashData);
      setAllTickets(ticketsData);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.issues.update(ticketId, { status: newStatus });
      setAllTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
      // Reload analytics metrics
      const dashData = await api.analytics.getDashboard();
      setMetrics(dashData);
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await api.issues.delete(ticketId);
      setAllTickets((prev) => prev.filter((t) => t.id !== ticketId));
      const dashData = await api.analytics.getDashboard();
      setMetrics(dashData);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-4 border border-purple-500/20">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Privileges Required</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
          The Admin Analytics Dashboard is reserved for system administrators to view enterprise metrics and manage all user issues.
        </p>
        <button
          onClick={() => setActivePage('login')}
          className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 transition shadow-lg shadow-purple-600/20"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  const filteredTickets = filterStatus === 'all'
    ? allTickets
    : allTickets.filter((t) => t.status === filterStatus);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Dashboard Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Admin Portal
            </span>
            <span className="text-xs text-slate-400">Live Telemetry & Diagnostics</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-8 h-8 text-cyan-500" />
            Issue Analytics & System Overview
          </h1>
        </div>

        {/* Database & System Engine Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Database Engine</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">{metrics?.database_type || 'Active'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Issues Logged"
          value={metrics?.total_tickets || 0}
          icon={Layers}
          color="cyan"
          subtitle="All platform tickets"
        />
        <StatCard
          title="Resolution Rate"
          value={`${metrics?.resolution_rate || 0}%`}
          icon={CheckCircle2}
          color="emerald"
          subtitle={`${metrics?.solved_tickets || 0} issues resolved`}
        />
        <StatCard
          title="Avg AI Confidence"
          value={`${metrics?.avg_confidence || 95}%`}
          icon={Sparkles}
          color="purple"
          subtitle="Gemini diagnostic accuracy"
        />
        <StatCard
          title="Active Users"
          value={metrics?.total_users || 0}
          icon={Users}
          color="amber"
          subtitle={`${metrics?.total_kb_articles || 0} KB articles`}
        />
      </div>

      {/* Analytics Breakdown Grid: Category & Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-500" /> Top Error Categories
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Distribution of technical failures identified by FixTrail.
          </p>

          <div className="space-y-4">
            {(metrics?.category_breakdown || []).map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-200">{cat.category}</span>
                  <span className="text-slate-500 font-mono">{cat.count} ({cat.percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400"
                    style={{ width: `${Math.max(5, cat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity & 7-Day Trend (5 cols) */}
        <div className="lg:col-span-5 glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" /> Severity Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Classification of issues by operational criticality.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {(metrics?.severity_breakdown || []).map((sev, idx) => {
                const colors = {
                  Critical: 'border-red-500/30 bg-red-500/5 text-red-500',
                  High: 'border-orange-500/30 bg-orange-500/5 text-orange-500',
                  Medium: 'border-amber-500/30 bg-amber-500/5 text-amber-500',
                  Low: 'border-blue-500/30 bg-blue-500/5 text-blue-500',
                }[sev.severity] || 'border-slate-500/30 bg-slate-500/5 text-slate-500';

                return (
                  <div key={idx} className={`p-3 rounded-2xl border ${colors}`}>
                    <p className="text-[10px] uppercase font-bold tracking-wider">{sev.severity}</p>
                    <p className="text-xl font-extrabold mt-0.5">{sev.count}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7-Day Trend Visualization */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
              7-Day Ticket Intake & Resolution
            </h4>
            <div className="flex items-end justify-between gap-2 h-24 pt-2">
              {(metrics?.trend_last_7_days || []).map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-0.5 h-16">
                    <div
                      className="w-2.5 sm:w-3.5 bg-cyan-500 rounded-t-sm"
                      style={{ height: `${Math.min(100, item.total * 25 + 10)}%` }}
                      title={`Total: ${item.total}`}
                    />
                    <div
                      className="w-2.5 sm:w-3.5 bg-emerald-400 rounded-t-sm"
                      style={{ height: `${Math.min(100, item.solved * 25 + 5)}%` }}
                      title={`Solved: ${item.solved}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono truncate w-full text-center">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Enterprise Ticket Management Table */}
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              All Organization Tickets
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage tickets submitted across all users in FixTrail.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {['all', 'open', 'in_progress', 'solved'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                  filterStatus === st
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-6">ID & Date</th>
                <th className="py-3.5 px-6">Error Title</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Severity</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-6 font-mono text-slate-500">
                    #{t.id}
                    <div className="text-[10px] text-slate-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                    {t.title}
                    {t.detected_error_code && (
                      <div className="text-[10px] font-mono text-cyan-500 font-bold">
                        {t.detected_error_code}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300">
                    {t.category}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {t.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="solved">Solved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => handleDeleteTicket(t.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition"
                      title="Delete Ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
