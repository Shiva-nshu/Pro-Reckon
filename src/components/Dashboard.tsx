import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Target, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [dbStatus, setDbStatus] = useState<string>('unknown');

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
      setDbStatus(healthData.dbStatus);
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
    try {
      await fetch('/api/leads/scrape', { method: 'POST' });
      alert('Scraper started in background!');
    } catch (e) {
      alert('Failed to start scraper');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Lead Discovery & Conversion</h1>
          <p className="text-sm text-slate-500 mt-1">Find the right clients for ProReckon Solutions</p>
          {dbStatus === 'disconnected' && (
            <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
              ⚠️ Demo mode — connect Firebase in .env to persist leads.
            </p>
          )}
        </div>
        <button 
          onClick={triggerScrape}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <RefreshCw size={18} />
          Run Scraper
        </button>
      </div>

      {/* KPI Cards — Intent → Qualification → Outreach flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Total Leads" value={stats?.totalLeads} icon={<Users className="text-blue-500" />} />
        <KPICard title="Qualified for outreach (60+)" value={stats?.qualifiedLeads ?? stats?.qualifiedForOutreach} icon={<CheckCircle className="text-green-500" />} />
        <KPICard title="Hot (conversion-ready)" value={stats?.hotLeads} icon={<Target className="text-purple-500" />} />
        <KPICard title="Conversion Rate" value={`${stats?.conversionRate}%`} icon={<TrendingUp className="text-orange-500" />} />
      </div>
      <p className="text-xs text-slate-500">Only leads with qualification score ≥ 60 are ready for personalized outreach.</p>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-4">Pipeline by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.pipeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-4">Score tier (Hot / Qualified / Low)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.scoreTierBreakdown || stats?.tierBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-4">Lead Distribution by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.pipeline}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.pipeline?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-full">
        {icon}
      </div>
    </div>
  );
}
