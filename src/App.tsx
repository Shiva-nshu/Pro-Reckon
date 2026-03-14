import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Target, Settings, PieChart, ExternalLink, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import LeadsList from './components/LeadsList';
import ConsultationPage from './components/ConsultationPage';

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/leads', icon: <Users size={20} />, label: 'Leads' },
    { path: '/pipeline', icon: <Target size={20} />, label: 'Pipeline' },
    { path: '/analytics', icon: <PieChart size={20} />, label: 'Analytics' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
    { path: '/consultation', icon: <ExternalLink size={20} />, label: 'Public Page' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 flex flex-col
          bg-[var(--sidebar-bg)] text-white
          border-r border-[var(--sidebar-border)]
          transition-transform duration-300 ease-out
          lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--sidebar-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg">
              P
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">ProReckon AI</h1>
              <p className="text-xs text-slate-400">Lead Acquisition</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }
                `}
              >
                <span className={isActive ? 'text-indigo-300' : ''}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--sidebar-border)]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-slate-500 truncate">ProReckon Solutions</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/consultation" element={<ConsultationPage />} />
        <Route
          path="/*"
          element={
            <div className="min-h-screen bg-[var(--app-bg)]">
              <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              <div className="lg:pl-64 min-h-screen flex flex-col">
                {/* Mobile header */}
                <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                    aria-label="Open menu"
                  >
                    <Menu size={24} />
                  </button>
                  <span className="font-semibold text-slate-800">ProReckon AI</span>
                </header>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/leads" element={<LeadsList />} />
                    <Route path="/pipeline" element={<Placeholder title="Pipeline" subtitle="Conversion-ready leads. Coming soon." />} />
                    <Route path="/analytics" element={<Placeholder title="Analytics" subtitle="Coming soon." />} />
                    <Route path="/settings" element={<Placeholder title="Settings" subtitle="Coming soon." />} />
                  </Routes>
                </main>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl bg-white border border-[var(--border)] shadow-[var(--card-shadow)] p-12 text-center">
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      <p className="text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}
