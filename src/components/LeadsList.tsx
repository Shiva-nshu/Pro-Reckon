import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Trash2, ChevronUp, ChevronDown, Mail, Phone, Link2, Building2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const PER_PAGE = 20;

function getScoreTier(score: number): 'Hot' | 'Qualified' | 'Low' {
  if (score >= 70) return 'Hot';
  if (score >= 60) return 'Qualified';
  return 'Low';
}

function normalizeTier(tier: string | undefined, score: number): 'Hot' | 'Qualified' | 'Low' {
  if (tier === 'Hot Lead') return 'Hot';
  if (tier === 'Qualified Lead') return 'Qualified';
  if (tier === 'Low Priority') return 'Low';
  return getScoreTier(score);
}

function tierStyle(tier: 'Hot' | 'Qualified' | 'Low') {
  switch (tier) {
    case 'Hot':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200/80';
    case 'Qualified':
      return 'bg-amber-100 text-amber-800 border border-amber-200/80';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200/80';
  }
}

const SOURCES = [
  { value: '', label: 'All sources' },
  { value: 'Gemini', label: 'Gemini' },
  { value: 'Hunter.io', label: 'Hunter.io' },
  { value: 'indiamart', label: 'IndiaMart' },
  { value: 'tradeindia', label: 'TradeIndia' },
  { value: 'justdial', label: 'JustDial' },
  { value: 'googlemaps', label: 'Google Maps' },
  { value: 'mca', label: 'MCA' },
  { value: 'startups', label: 'Startups' },
];

function getLeadId(lead: { id?: string; _id?: string }): string {
  return lead.id ?? lead._id ?? '';
}

export default function LeadsList() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageChanging, setPageChanging] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [filterMinScore, setFilterMinScore] = useState<string>('');
  const [filterSource, setFilterSource] = useState('');
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [scraping, setScraping] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [enriching, setEnriching] = useState(false);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(currentPage));
    params.set('limit', String(PER_PAGE));
    if (filterMinScore) params.set('minScore', filterMinScore);
    if (filterSource) params.set('source', filterSource);
    if (searchQuery) params.set('search', searchQuery);
    fetch('/api/leads?' + params.toString())
      .then((res) => res.json())
      .then((data) => {
        setLeads(Array.isArray(data.leads) ? data.leads : []);
        setTotal(Number(data.total) || 0);
        setPages(Math.max(1, Number(data.pages) || 0));
        setLoading(false);
        setPageChanging(false);
      })
      .catch(() => {
        setLeads([]);
        setTotal(0);
        setPages(0);
        setLoading(false);
        setPageChanging(false);
      });
  }, [currentPage, filterMinScore, filterSource, searchQuery]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(search.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const goToPage = (p: number) => {
    const next = Math.max(1, Math.min(pages, p));
    if (next === currentPage) return;
    setPageChanging(true);
    setCurrentPage(next);
  };

  const onFilterChange = () => setCurrentPage(1);

  const runScrape = () => {
    setScraping(true);
    fetch('/api/leads/scrape/run', { method: 'POST' })
      .then(() => alert('Lead search started (Gemini + Hunter). Refresh in a minute.'))
      .catch(() => alert('Failed to start search'))
      .finally(() => setScraping(false));
  };

  const enrichContacts = () => {
    setEnriching(true);
    fetch('/api/leads/enrich', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || 'Enrichment started. Refresh in a few minutes to see email/phone.');
        fetchLeads();
      })
      .catch(() => alert('Failed to start enrichment'))
      .finally(() => setEnriching(false));
  };

  const score = (lead: any) => lead.qualificationScore ?? lead.score ?? 0;
  const displayTier = (lead: any) => normalizeTier(lead.tier, score(lead));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = leads.map((l: any) => getLeadId(l));
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(pageIds));
  };

  const removeLead = async (id: string) => {
    if (!confirm('Remove this lead?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) fetchLeads();
      else alert(data.error || 'Failed to remove');
    } finally {
      setActionLoading(null);
    }
  };

  const moveLead = async (index: number, direction: 'up' | 'down') => {
    const order = leads.map((l: any) => getLeadId(l));
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= order.length) return;
    [order[index], order[newIndex]] = [order[newIndex], order[index]];
    setActionLoading('reorder');
    try {
      const res = await fetch('/api/leads/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
      if (res.ok) fetchLeads();
      else alert((await res.json()).error || 'Failed to reorder');
    } finally {
      setActionLoading(null);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Remove ${selectedIds.size} selected lead(s)?`)) return;
    setActionLoading('bulk-delete');
    try {
      const res = await fetch('/api/leads/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedIds(new Set());
        fetchLeads();
        alert(data.message || 'Done');
      } else alert(data.error || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const moveSelectedToTop = async () => {
    if (selectedIds.size === 0) return;
    const order = leads.map((l: any) => getLeadId(l));
    const selected = order.filter((id) => selectedIds.has(id));
    const rest = order.filter((id) => !selectedIds.has(id));
    const newOrder = [...selected, ...rest];
    setActionLoading('reorder');
    try {
      const res = await fetch('/api/leads/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      });
      if (res.ok) fetchLeads();
      else alert((await res.json()).error || 'Failed to reorder');
    } finally {
      setActionLoading(null);
    }
  };

  const isInitialLoad = loading && leads.length === 0 && total === 0;
  if (isInitialLoad) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-72 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="h-14 bg-slate-50" />
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-16 border-t border-slate-100 flex gap-4 px-6 items-center">
              <div className="h-4 w-4 rounded bg-slate-200 animate-pulse" />
              <div className="h-4 flex-1 max-w-[200px] rounded bg-slate-100 animate-pulse" />
              <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Leads
        </h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          Real leads via Gemini + Hunter. Filter, reorder, and run bulk actions.
        </p>
      </div>

      {/* Filters & actions bar */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-600 hidden sm:inline">Score</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-0.5">
              {[
                { value: '', label: 'All' },
                { value: '60', label: '≥60 Qualified' },
                { value: '70', label: '≥70 Hot' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setFilterMinScore(value); onFilterChange(); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterMinScore === value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={filterSource}
              onChange={(e) => { setFilterSource(e.target.value); onFilterChange(); }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            >
              {SOURCES.map((s) => (
                <option key={s.value || 'all'} value={s.value}>{s.label}</option>
              ))}
            </select>
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search company, industry, location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={runScrape}
              disabled={scraping}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 disabled:opacity-60 transition-all"
            >
              <RefreshCw size={18} className={scraping ? 'animate-spin' : ''} />
              {scraping ? 'Starting…' : 'Search leads (Gemini)'}
            </button>
            <button
              type="button"
              onClick={enrichContacts}
              disabled={enriching}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium shadow-lg shadow-emerald-500/25 hover:bg-emerald-700 disabled:opacity-60 transition-all"
              title="Fetch email/phone/LinkedIn from Hunter"
            >
              <Sparkles size={18} className={enriching ? 'animate-pulse' : ''} />
              {enriching ? 'Running…' : 'Enrich contacts'}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-3">
          <span className="text-sm font-semibold text-indigo-900">{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={bulkDelete}
            disabled={actionLoading === 'bulk-delete'}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 size={16} />
            Delete selected
          </button>
          <button
            type="button"
            onClick={moveSelectedToTop}
            disabled={actionLoading === 'reorder'}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            <ChevronUp size={16} />
            Move to top
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-sm font-medium text-indigo-700 hover:text-indigo-900"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden table-wrap relative">
        {loading && leads.length > 0 && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl transition-opacity duration-200">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 text-white text-sm font-medium shadow-lg">
              <RefreshCw size={18} className="animate-spin" />
              Loading…
            </div>
          </div>
        )}
        <div className="overflow-x-auto leads-table-content" key={currentPage}>
          <table className="w-full text-left min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={leads.length > 0 && leads.every((l: any) => selectedIds.has(getLeadId(l)))}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Industry</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tier</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Website</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[130px]">Phone</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">LinkedIn</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead: any, index: number) => {
                const id = getLeadId(lead);
                const s = score(lead);
                const tier = displayTier(lead);
                const busy = actionLoading === id;
                return (
                  <tr
                    key={id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(id)}
                        onChange={() => toggleSelect(id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900">{lead.companyName}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{lead.industry ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{lead.location ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{lead.source ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900 tabular-nums">{s}</span>
                      <span className="text-slate-400 text-sm">/100</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${tierStyle(tier)}`}>
                        {tier === 'Hot' && '🟢 '}
                        {tier === 'Qualified' && '🟡 '}
                        {tier === 'Low' && '🔴 '}
                        {tier}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:underline truncate max-w-[180px]"
                        >
                          <Link2 size={14} className="shrink-0" />
                          <span className="truncate">Link</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:underline truncate max-w-[200px]"
                        >
                          <Mail size={14} className="shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 min-w-[130px] whitespace-nowrap">
                      {lead.phone ? (
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          <Phone size={14} className="shrink-0 text-slate-500" />
                          <span className="truncate" title={lead.phone}>{lead.phone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {lead.linkedIn ? (
                        <a
                          href={lead.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          <Link2 size={14} className="shrink-0" />
                          LinkedIn
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveLead(index, 'up')}
                          disabled={index === 0 || actionLoading !== null}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 transition-colors"
                          title="Move up"
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveLead(index, 'down')}
                          disabled={index === leads.length - 1 || actionLoading !== null}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 transition-colors"
                          title="Move down"
                        >
                          <ChevronDown size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLead(id)}
                          disabled={busy}
                          className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-colors"
                          title="Remove lead"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && !loading && pages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-sm text-slate-600">
              Showing{' '}
              <span className="font-semibold text-slate-900">{(currentPage - 1) * PER_PAGE + 1}</span>
              –<span className="font-semibold text-slate-900">{Math.min(currentPage * PER_PAGE, total)}</span>
              {' '}of <span className="font-semibold text-slate-900">{total}</span> leads
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                aria-label="Previous page"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-0.5 mx-1">
                {Array.from({ length: Math.min(7, pages) }, (_, i) => {
                  let pageNum: number;
                  if (pages <= 7) pageNum = i + 1;
                  else if (currentPage <= 4) pageNum = i + 1;
                  else if (currentPage >= pages - 3) pageNum = pages - 6 + i;
                  else pageNum = currentPage - 3 + i;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => goToPage(pageNum)}
                      className={`min-w-[2.25rem] h-9 px-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                          : 'text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= pages}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                aria-label="Next page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {total === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Building2 size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              No leads yet
            </h3>
            <p className="text-slate-500 mt-1 max-w-sm text-sm">
              {leads.length === 0
                ? 'Click “Search leads (Gemini)” to find companies. Then use “Enrich contacts” to fetch email and phone.'
                : 'Try changing filters or search term.'}
            </p>
            {total === 0 && (
              <button
                type="button"
                onClick={runScrape}
                disabled={scraping}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                <RefreshCw size={18} />
                Search leads
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
