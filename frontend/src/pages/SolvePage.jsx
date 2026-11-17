import React, { useState } from 'react';
import { Sparkles, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import IssueUploader from '../components/IssueUploader';
import SolutionViewer from '../components/SolutionViewer';
import SimilarIssuesModal from '../components/SimilarIssuesModal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SolvePage({ setActivePage, onOpenKbArticle }) {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [lastFormData, setLastFormData] = useState(null);
  const [savedTicketId, setSavedTicketId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAnalyze = async (formData) => {
    setLoading(true);
    setErrorMsg('');
    setLastFormData(formData);
    try {
      // Analyze with Gemini AI
      const result = await api.issues.analyze(formData);
      setDiagnosis(result);
      setSavedTicketId(null);
      setIsSaved(false);

      // If user is authenticated, also automatically save as an Issue Ticket
      if (isAuthenticated) {
        try {
          const ticket = await api.issues.create(formData);
          setSavedTicketId(ticket.id);
          setIsSaved(true);
        } catch (saveErr) {
          console.warn('Auto-save failed:', saveErr);
        }
      }
    } catch (err) {
      console.error('Diagnosis failed:', err);
      setErrorMsg(err.message || 'Failed to analyze error. Please check your network or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!isAuthenticated) {
      alert('Please sign in or register to save this issue in your personal history.');
      setActivePage('login');
      return;
    }
    if (!lastFormData) return;

    try {
      const ticket = await api.issues.create(lastFormData);
      setSavedTicketId(ticket.id);
      setIsSaved(true);
    } catch (err) {
      alert(`Failed to save ticket: ${err.message}`);
    }
  };

  const handleReset = () => {
    setDiagnosis(null);
    setLastFormData(null);
    setSavedTicketId(null);
    setIsSaved(false);
    setErrorMsg('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> AI Diagnostic Workbench
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Solve Technical Errors
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Upload screenshot artifacts, logs, or command line failures. FixTrail's AI delivers an immediate step-by-step resolution roadmap.
        </p>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Workbench: Uploader OR Solution Display */}
      {!diagnosis ? (
        <IssueUploader onAnalyze={handleAnalyze} loading={loading} />
      ) : (
        <div className="space-y-6">
          {/* Similar Issues Banner / Modal */}
          {diagnosis.similar_issues && diagnosis.similar_issues.length > 0 && (
            <SimilarIssuesModal
              similarIssues={diagnosis.similar_issues}
              onSelectKbArticle={(kbId) => {
                if (onOpenKbArticle) {
                  onOpenKbArticle(kbId);
                } else {
                  setActivePage('knowledge');
                }
              }}
            />
          )}

          {/* Detailed Solution Roadmap */}
          <SolutionViewer
            diagnosis={diagnosis}
            onSaveToHistory={handleSaveToHistory}
            onReset={handleReset}
            savedTicketId={savedTicketId}
            isSaved={isSaved}
          />
        </div>
      )}

    </div>
  );
}
