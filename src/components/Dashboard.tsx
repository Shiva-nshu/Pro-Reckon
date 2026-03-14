import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Target, CheckCircle, TrendingUp, RefreshCw, Zap, AlertCircle } from 'lucide-react';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<string>('unknown');
  const [triggering, setTriggering] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (!res.ok) {
        setStats({ totalLeads: 0, qualifiedLeads: 0, hotLeads: 0, conversionRate: '0', pipeline: [], tierBreakdown: [], scoreTierBreakdown: [] });
      } else {
        setStats(data);
      }
      const healthRes = await fetch('/api/health');
      const healthData = await healthRes.json();
      setDbStatus(healthData.dbStatus ?? 'unknown');
    } catch (err) {
      console.error(err);
      setStats({ totalLeads: 0, qualifiedLeads: 0, hotLeads: 0, conversionRate: '0', pipeline: [], tierBreakdown: [], scoreTierBreakdown: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const triggerScrape = async () => {
    setTriggering(true);
    try {
      await fetch('/api/leads/scrape/run', { method: 'POST' });
      alert('Lead search started in background. Refresh in a minute.');
    } catch (e) {
      alert('Failed to start search');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-9 w-64 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-11 w-36 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Lead Discovery & Conversion
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Find the right clients for ProReckon Solutions
          </p>
          {dbStatus === 'disconnected' && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>Connect Firebase in .env to persist leads.</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={triggerScrape}
          disabled={triggering}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-indigo-500/30 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 transition-all"
        >
          <RefreshCw size={18} className={triggering ? 'animate-spin' : ''} />
          {triggering ? 'Starting…' : 'Search leads'}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Leads"
          value={stats?.totalLeads ?? 0}
          icon={<Users size={22} />}
          iconBg="bg-indigo-100 text-indigo-600"
        />
        <KPICard
          title="Qualified (60+)"
          value={stats?.qualifiedLeads ?? stats?.qualifiedForOutreach ?? 0}
          icon={<CheckCircle size={22} />}
          iconBg="bg-emerald-100 text-emerald-600"
        />
        <KPICard
          title="Hot leads"
          value={stats?.hotLeads ?? 0}
          icon={<Zap size={22} />}
          iconBg="bg-violet-100 text-violet-600"
        />
        <KPICard
          title="Conversion rate"
          value={`${stats?.conversionRate ?? 0}%`}
          icon={<TrendingUp size={22} />}
          iconBg="bg-amber-100 text-amber-600"
        />
      </div>
      <p className="text-sm text-slate-500">
        Leads with score ≥ 60 are ready for personalized outreach.
      </p>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Pipeline by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.pipeline ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Score tier</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.scoreTierBreakdown || stats?.tierBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" fill="#059669" radius={[6, 6, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Lead distribution</h3>
          <div className="h-64 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.pipeline ?? []}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => (name != null && percent != null ? `${name} ${(percent * 100).toFixed(0)}%` : '')}
                >
                  {(stats?.pipeline ?? []).map((_: any, index: number) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  iconBg,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
      </div>
      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
    </div>
  );
}
