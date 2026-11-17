import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SolvePage from './pages/SolvePage';
import HistoryPage from './pages/HistoryPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './context/AuthContext';
import { Wrench, Github, Heart, ShieldCheck, Database, Cpu } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [targetKbArticleId, setTargetKbArticleId] = useState(null);
  const { user } = useAuth();

  const handleOpenKbArticle = (articleId) => {
    setTargetKbArticleId(articleId);
    setActivePage('knowledge');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 selection:bg-cyan-500 selection:text-white transition-colors duration-200">
      
      {/* Top Navigation */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activePage === 'home' && <HomePage setActivePage={setActivePage} />}
        {activePage === 'solve' && (
          <SolvePage 
            setActivePage={setActivePage} 
            onOpenKbArticle={handleOpenKbArticle} 
          />
        )}
        {activePage === 'history' && <HistoryPage setActivePage={setActivePage} />}
        {activePage === 'knowledge' && (
          <KnowledgeBasePage 
            initialSelectedArticleId={targetKbArticleId} 
          />
        )}
        {activePage === 'admin' && <AdminDashboardPage setActivePage={setActivePage} />}
        {activePage === 'login' && <LoginPage setActivePage={setActivePage} />}
        {activePage === 'register' && <RegisterPage setActivePage={setActivePage} />}
      </main>

      {/* Modern Responsive Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              FixTrail – Smart IT Problem Solver
            </span>
            <span className="text-slate-400">© 2026</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              FastAPI & Gemini Online
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>React.js + Tailwind CSS</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>MySQL Relational Backend</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
