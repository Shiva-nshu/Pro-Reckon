import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

function getScoreTier(score: number): 'Hot' | 'Qualified' | 'Low' {
  if (score >= 70) return 'Hot';
  if (score >= 60) return 'Qualified';
  return 'Low';
}

function tierColor(tier: 'Hot' | 'Qualified' | 'Low') {
  switch (tier) {
    case 'Hot': return 'bg-green-100 text-green-800';
    case 'Qualified': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-red-50 text-red-800';
  }
}

export default function LeadsList() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qualifiedOnly, setQualifiedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [seeding, setSeeding] = useState(false);

  const fetchLeads = () => {
    setLoading(true);
    const url = qualifiedOnly ? '/api/leads?qualifiedOnly=true' : '/api/leads';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setLeads(Array.isArray(data.leads) ? data.leads : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLeads([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeads();
  }, [qualifiedOnly]);

  const seedDemo = () => {
    setSeeding(true);
    fetch('/api/leads/seed-demo', { method: 'POST' })
      .then((res) => res.json())
      .then(() => fetchLeads())
      .catch(console.error)
      .finally(() => setSeeding(false));
  };

  const score = (lead: any) => lead.qualificationScore ?? lead.score ?? 0;
  const displayTier = (lead: any) => lead.scoreTier ?? getScoreTier(score(lead));
  const filtered = search.trim()
    ? leads.filter((l: any) =>
        [l.companyName, l.industry, l.location].some(
          (v) => typeof v === 'string' && v.toLowerCase().includes(search.trim().toLowerCase())
        )
      )
    : leads;

  if (loading) return <div className="p-8">Loading Leads...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lead Discovery & Conversion</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Instead of contacting thousands of random businesses, this system identifies companies most likely to need funding and prioritizes them.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={qualifiedOnly}
              onChange={(e) => setQualifiedOnly(e.target.checked)}
              className="rounded border-slate-300"
            />
            Qualified (60+)
          </label>
          <button
            type="button"
            onClick={seedDemo}
            disabled={seeding}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {seeding ? 'Adding…' : 'Load demo leads'}
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search company, industry, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Company</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Industry</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Location</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Score</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((lead: any) => {
              const s = score(lead);
              const tier = displayTier(lead);
              return (
                <tr key={lead._id ?? lead.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900">{lead.companyName}</td>
                  <td className="px-6 py-4 text-slate-700">{lead.industry ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-700">{lead.location ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900">{s}</span>
                    <span className="text-slate-500 text-sm"> / 100</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tierColor(tier)}`}>
                      {tier === 'Hot' && '🟢 '}
                      {tier === 'Qualified' && '🟡 '}
                      {tier === 'Low' && '🔴 '}
                      {tier}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-500">
            {leads.length === 0 ? 'No leads yet. Run a scrape or add demo leads to see the table.' : 'No matches for your search.'}
          </div>
        )}
      </div>
    </div>
  );
}
