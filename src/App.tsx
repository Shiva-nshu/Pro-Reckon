import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Send, Settings, PieChart, ExternalLink } from 'lucide-react';
import Dashboard from './components/Dashboard';
import LeadsList from './components/LeadsList';
import ConsultationPage from './components/ConsultationPage';

function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/leads', icon: <Users size={20} />, label: 'Leads' },
    { path: '/campaigns', icon: <Send size={20} />, label: 'Campaigns' },
    { path: '/analytics', icon: <PieChart size={20} />, label: 'Analytics' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
    { path: '/consultation', icon: <ExternalLink size={20} />, label: 'Public Page' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          ProReckon AI
        </h1>
        <p className="text-xs text-slate-400 mt-1">Client Acquisition System</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.path 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
            AD
          </div>
          <div>
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-slate-500">ProReckon Solutions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/consultation" element={<ConsultationPage />} />
        
        {/* Protected Routes (with Sidebar) */}
        <Route path="/*" element={
          <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <main className="ml-64 p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/leads" element={<LeadsList />} />
                <Route path="/campaigns" element={<div className="p-8">Campaigns Module Coming Soon</div>} />
                <Route path="/analytics" element={<div className="p-8">Analytics Module Coming Soon</div>} />
                <Route path="/settings" element={<div className="p-8">Settings Module Coming Soon</div>} />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
