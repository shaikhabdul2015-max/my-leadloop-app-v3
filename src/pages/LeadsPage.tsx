import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Filter, 
  Plus, 
  Sparkles, 
  Calendar, 
  Trash2, 
  Edit3, 
  Eye, 
  ArrowUpDown, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Building,
  Flame,
  Brain,
  Layers,
  HelpCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/crmUtils';
import { Lead } from '../types';
import { ScheduleFollowupModal } from '../components/modals/ScheduleFollowupModal';

export const LeadsPage: React.FC = () => {
  const { 
    leads, 
    stages, 
    setCurrentView, 
    setSelectedLeadId, 
    setIsAddLeadModalOpen, 
    openAIModal, 
    openScoreWhyModal,
    openAnalyzeModal,
    openSequenceModal,
    deleteLead,
    updateLead,
    searchQuery,
    setSearchQuery 
  } = useApp();

  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created' | 'value' | 'priority' | 'name'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Schedule modal state
  const [scheduleLead, setScheduleLead] = useState<Lead | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Edit lead modal state
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Filter & Sort
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesCompany = lead.company?.toLowerCase().includes(q);
        const matchesEmail = lead.email?.toLowerCase().includes(q);
        const matchesPhone = lead.phone?.includes(q);
        const matchesService = lead.service?.toLowerCase().includes(q);
        if (!matchesName && !matchesCompany && !matchesEmail && !matchesPhone && !matchesService) {
          return false;
        }
      }

      // Stage
      if (stageFilter !== 'all' && lead.stage_id !== stageFilter) return false;

      // Status
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;

      // Source
      if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false;

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'priority') {
        comparison = (b.priority_score || 0) - (a.priority_score || 0);
      } else if (sortBy === 'value') {
        comparison = (Number(b.deal_value) || 0) - (Number(a.deal_value) || 0);
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }, [leads, searchQuery, stageFilter, statusFilter, sourceFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / itemsPerPage));
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    await updateLead(editingLead.id, editingLead);
    setEditingLead(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Leads Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track, qualify, and never let a prospective client slip through the cracks.
          </p>
        </div>
        <button
          onClick={() => setIsAddLeadModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Lead</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company, email, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stage */}
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Stages</option>
              {stages.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>

            {/* Source */}
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Sources</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="linkedin">LinkedIn</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>

            {/* Sort */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none bg-transparent"
              >
                <option value="priority">Priority Score</option>
                <option value="value">Deal Value</option>
                <option value="created">Created Date</option>
                <option value="name">Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 text-slate-400 hover:text-slate-700 transition border-l border-slate-200"
                title="Toggle sort direction"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Lead Name</th>
                <th className="py-3 px-4">Company & Service</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Deal Value</th>
                <th className="py-3 px-4">Last Contact</th>
                <th className="py-3 px-4">Next Follow-up</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-600">No leads match current filters.</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing search or add a new lead.</p>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  const stage = stages.find((s) => s.id === lead.stage_id);

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setCurrentView('lead-detail');
                          }}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-left transition"
                        >
                          {lead.name}
                        </button>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          {lead.email && <span className="truncate max-w-[130px]">{lead.email}</span>}
                          {lead.phone && <span>• {lead.phone}</span>}
                        </div>
                      </td>

                      {/* Company & Service */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{lead.company || '—'}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{lead.service || 'General'}</div>
                      </td>

                      {/* Stage Selector */}
                      <td className="py-3.5 px-4">
                        <select
                          value={lead.stage_id}
                          onChange={(e) => updateLead(lead.id, { stage_id: e.target.value })}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          style={{ borderLeftColor: stage?.color || '#6366f1', borderLeftWidth: 4 }}
                        >
                          {stages.map((st) => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Deal Value */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(lead.deal_value, lead.currency)}
                      </td>

                      {/* Last Contact */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {lead.last_contacted_at ? (
                          <span>{new Date(lead.last_contacted_at).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-slate-400 italic">Never</span>
                        )}
                      </td>

                      {/* Next Follow-up */}
                      <td className="py-3.5 px-4">
                        {lead.next_followup_at ? (
                          <span className="font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {new Date(lead.next_followup_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Priority Score 2.0 & Category */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openScoreWhyModal(lead)}
                            title="Click to view Why This Score"
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase transition hover:scale-105 ${
                              lead.priority_score === null || lead.priority_score === undefined
                                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                : (lead.temperature || lead.score_category) === 'HOT'
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                : (lead.temperature || lead.score_category) === 'WARM'
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Flame className="h-3 w-3" />
                            {lead.priority_score !== null && lead.priority_score !== undefined ? (
                              <>
                                <span>{lead.priority_score}/100</span>
                                <span className="font-black">{lead.temperature || lead.score_category || (lead.priority_score >= 75 ? 'HOT' : lead.priority_score >= 45 ? 'WARM' : 'COLD')}</span>
                              </>
                            ) : (
                              <span className="font-semibold text-slate-500">Insufficient Data</span>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openAIModal(lead)}
                            title="Generate AI Follow-up Message"
                            className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 hover:bg-indigo-100 transition"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openAnalyzeModal(lead)}
                            title="Analyze Deal & Conversation"
                            className="rounded-lg bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100 transition"
                          >
                            <Brain className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openSequenceModal(lead)}
                            title="Generate Multi-Day Follow-up Sequence"
                            className="rounded-lg bg-violet-50 p-1.5 text-violet-700 hover:bg-violet-100 transition"
                          >
                            <Layers className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setScheduleLead(lead);
                              setIsScheduleOpen(true);
                            }}
                            title="Schedule Follow-up"
                            className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 transition"
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingLead(lead)}
                            title="Edit Lead"
                            className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 transition"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            title="Delete Lead"
                            className="rounded-lg bg-slate-100 p-1.5 text-rose-500 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{filteredLeads.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</span> of{' '}
            <span className="font-semibold text-slate-700">{filteredLeads.length}</span> leads
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Follow-up Modal */}
      <ScheduleFollowupModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        lead={scheduleLead}
      />

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3.5">
              <h3 className="font-bold text-slate-900 text-sm">Edit Lead: {editingLead.name}</h3>
              <button onClick={() => setEditingLead(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingLead.name}
                  onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={editingLead.company || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Value</label>
                  <input
                    type="number"
                    value={editingLead.deal_value || 0}
                    onChange={(e) => setEditingLead({ ...editingLead, deal_value: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingLead.email || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingLead.phone || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stage</label>
                <select
                  value={editingLead.stage_id}
                  onChange={(e) => setEditingLead({ ...editingLead, stage_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  {stages.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={editingLead.notes || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
