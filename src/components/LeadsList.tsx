import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Mail, Phone, ExternalLink } from 'lucide-react';

export default function LeadsList() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        setLeads(data.leads);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <div className="p-8">Loading Leads...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Discovered Leads</h1>
          <p className="text-sm text-slate-500 mt-0.5">Right-fit clients for ProReckon Solutions</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Company</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Contact</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Score</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead: any) => (
              <tr key={lead._id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{lead.companyName}</p>
                    <p className="text-xs text-slate-500">{lead.industry} • {lead.location}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm text-slate-900">{lead.founderName}</p>
                    <div className="flex gap-2 mt-1">
                      {lead.email && <Mail size={14} className="text-slate-400" />}
                      {lead.phone && <Phone size={14} className="text-slate-400" />}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${lead.score > 30 ? 'bg-green-100 text-green-800' : 
                      lead.score > 15 ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'}`}>
                    {lead.score} / 100
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
