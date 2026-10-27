import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Phone, 
  Mail, 
  MessageSquare, 
  Building, 
  Edit3, 
  CheckCircle2, 
  Send, 
  Clock, 
  TrendingUp, 
  Plus,
  Trash2,
  Zap,
  Tag,
  Flame,
  Brain,
  Layers,
  HelpCircle,
  ShieldAlert,
  Target,
  FileCheck,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, getSmartFollowUpRecommendation } from '../utils/crmUtils';
import { ScheduleFollowupModal } from '../components/modals/ScheduleFollowupModal';
import { ActivityType, ActivityLogChannel, LeadActivityLog } from '../types';

export const LeadDetailPage: React.FC = () => {
  const { 
    selectedLeadId, 
    leads, 
    stages, 
    followups, 
    activities, 
    messages, 
    setCurrentView, 
    openAIModal, 
    openScoreWhyModal,
    openAnalyzeModal,
    openSequenceModal,
    completeFollowup, 
    cancelFollowup,
    updateLead,
    addActivity,
    deleteLead,
    leadActivityLogs,
    fetchLeadActivityLogs,
    logLeadActivity,
    showToast,
    user 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'activity_logs' | 'followups' | 'messages'>('overview');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  
  // Quick activity logger state
  const [newActivityContent, setNewActivityContent] = useState('');
  const [newActivityType, setNewActivityType] = useState<ActivityType>('note');
  const [submittingAct, setSubmittingAct] = useState(false);

  // Audited activity logs state (public.lead_activity_logs)
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logChannel, setLogChannel] = useState<ActivityLogChannel>('whatsapp');
  const [logAgentName, setLogAgentName] = useState<string>(user?.full_name || 'Alex Rivera');
  const [logMessageBody, setLogMessageBody] = useState<string>('');
  const [logExecutedAt, setLogExecutedAt] = useState<string>('');
  const [submittingLog, setSubmittingLog] = useState<boolean>(false);

  // Edit lead modal
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  const lead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  useEffect(() => {
    if (lead?.id) {
      setLogsLoading(true);
      setLogsError(null);
      fetchLeadActivityLogs(lead.id)
        .catch((err) => setLogsError(err.message || 'Failed to load activity logs'))
        .finally(() => setLogsLoading(false));
    }
  }, [lead?.id, fetchLeadActivityLogs]);

  const handleRecordAuditedLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !logMessageBody.trim() || submittingLog) return;
    setSubmittingLog(true);
    setLogsError(null);
    try {
      await logLeadActivity(lead.id, {
        agent_name: logAgentName.trim() || user?.full_name || 'Sales Agent',
        channel: logChannel,
        message_body: logMessageBody.trim(),
        executed_at: logExecutedAt ? new Date(logExecutedAt).toISOString() : new Date().toISOString(),
      });
      setLogMessageBody('');
      setLogExecutedAt('');
    } catch (err: any) {
      setLogsError(err.message || 'Failed to record activity log');
    } finally {
      setSubmittingLog(false);
    }
  };

  if (!lead) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">Lead not found.</p>
        <button
          onClick={() => setCurrentView('leads')}
          className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
        >
          ← Back to Leads
        </button>
      </div>
    );
  }

  const stage = stages.find((s) => s.id === lead.stage_id);
  const leadFollowups = followups.filter((f) => f.lead_id === lead.id);
  const leadActivities = activities.filter((a) => a.lead_id === lead.id);
  const leadMessages = messages.filter((m) => m.lead_id === lead.id);
  const currentLeadLogs = leadActivityLogs[lead.id] || [];

  const smartRec = getSmartFollowUpRecommendation(lead, followups);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityContent.trim()) return;
    setSubmittingAct(true);
    try {
      await addActivity(lead.id, newActivityType, newActivityContent.trim(), newActivityType);
      setNewActivityContent('');
    } catch (err: any) {
      showToast(err.message || 'Failed to add activity', 'error');
    } finally {
      setSubmittingAct(false);
    }
  };

  const handleSaveNotes = async () => {
    await updateLead(lead.id, { notes: editNotes });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('leads')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Leads</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete lead ${lead.name}?`)) {
                deleteLead(lead.id);
                setCurrentView('leads');
              }
            }}
            className="rounded-xl border border-slate-200 p-2 text-rose-500 hover:bg-rose-50 transition"
            title="Delete Lead"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setEditNotes(lead.notes || '');
              setIsEditing(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => openAnalyzeModal(lead)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
          >
            <Brain className="h-3.5 w-3.5" />
            <span>Analyze Deal</span>
          </button>
          <button
            onClick={() => openSequenceModal(lead)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-800 hover:bg-violet-100 transition"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Cadence Sequence</span>
          </button>
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Schedule Follow-up</span>
          </button>
          <button
            onClick={() => openAIModal(lead)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
            <span>Generate AI Follow-up</span>
          </button>
        </div>
      </div>

      {/* Lead Profile Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{lead.name}</h1>
              <select
                value={lead.stage_id}
                onChange={(e) => updateLead(lead.id, { stage_id: e.target.value })}
                className="rounded-lg px-2.5 py-1 text-xs font-bold text-white uppercase focus:outline-none"
                style={{ backgroundColor: stage?.color || '#6366f1' }}
              >
                {stages.map((st) => (
                  <option key={st.id} value={st.id} className="text-slate-900 bg-white">{st.name}</option>
                ))}
              </select>
              <button
                onClick={() => openScoreWhyModal(lead)}
                title="Click to view AI score breakdown"
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase transition hover:scale-105 ${
                  lead.priority_score === null || lead.priority_score === undefined
                    ? 'bg-slate-100 text-slate-500'
                    : (lead.temperature || lead.score_category) === 'HOT'
                    ? 'bg-rose-100 text-rose-700'
                    : (lead.temperature || lead.score_category) === 'WARM'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Flame className="h-3 w-3" />
                {lead.priority_score !== null && lead.priority_score !== undefined ? (
                  <>
                    <span>{lead.priority_score}/100</span>
                    <span>{lead.temperature || lead.score_category || (lead.priority_score >= 75 ? 'HOT' : lead.priority_score >= 45 ? 'WARM' : 'COLD')}</span>
                  </>
                ) : (
                  <span>Insufficient Data</span>
                )}
                <span className="underline ml-0.5 text-[9px]">Why?</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
              {lead.company && (
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  {lead.company}
                </span>
              )}
              {lead.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline">{lead.email}</a>
                </span>
              )}
              {lead.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{lead.phone}</span>
                </span>
              )}
              <span className="flex items-center gap-1 text-slate-400">
                <Tag className="h-3 w-3" />
                Source: {lead.source}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deal Value</span>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{formatCurrency(lead.deal_value, lead.currency)}</p>
              <span className="text-[11px] text-slate-400">{lead.service || 'Consulting'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-indigo-50/30 to-white p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-600 p-2 text-white flex-shrink-0">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Smart Follow-up Recommendation • {smartRec.when_text}
              </span>
            </div>
            <p className="text-xs text-indigo-900/80 mt-0.5">{smartRec.reason}</p>
          </div>
        </div>
        <button
          onClick={() => openAIModal(lead)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition flex-shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Generate Message</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview & Notes' },
          { id: 'timeline', label: `Activity Timeline (${leadActivities.length})` },
          { id: 'activity_logs', label: `Audited Execution Logs (${currentLeadLogs.length})` },
          { id: 'followups', label: `Follow-ups (${leadFollowups.length})` },
          { id: 'messages', label: `Messages (${leadMessages.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-5">
            {/* Notes Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Lead Notes & Discussion Summary</h3>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setEditNotes(lead.notes || '');
                      setIsEditing(true);
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Edit notes
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="rounded-lg border px-3 py-1 text-xs text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      className="rounded-lg bg-indigo-600 px-3 py-1 text-xs text-white"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {lead.notes || 'No notes added yet. Click edit to add context about this lead.'}
                </p>
              )}
            </div>

            {/* Quick Activity Logger */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Quick Log Activity</h3>
              <form onSubmit={handleAddActivity} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(['note', 'call', 'whatsapp', 'email', 'meeting'] as ActivityType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewActivityType(t)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${
                        newActivityType === t
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  placeholder={`Log details about this ${newActivityType}...`}
                  value={newActivityContent}
                  onChange={(e) => setNewActivityContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingAct || !newActivityContent.trim()}
                    className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    Log {newActivityType}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Lead Meta Details */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Interaction History</h3>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Last Contacted:</span>
                <span className="font-semibold text-slate-800">
                  {lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : 'Never'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Next Follow-up:</span>
                <span className="font-semibold text-indigo-600">
                  {lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleDateString() : 'None scheduled'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Lead Created:</span>
                <span className="font-semibold text-slate-800">{new Date(lead.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total Activities:</span>
                <span className="font-semibold text-slate-800">{leadActivities.length}</span>
              </div>
            </div>

            {/* AI Deal Intelligence & Memory */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">AI Deal Intelligence</h3>
                </div>
                <button
                  onClick={() => openAnalyzeModal(lead)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                >
                  Analyze
                </button>
              </div>

              {lead.memory ? (
                <div className="space-y-3">
                  {/* Buying Intent */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Buying Intent</span>
                    <div className="mt-0.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        lead.buying_intent === 'high' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Target className="h-3 w-3" />
                        {lead.buying_intent || 'Medium'} Intent
                      </span>
                    </div>
                  </div>

                  {/* Customer Needs / Pain Points */}
                  {lead.memory.pain_points && lead.memory.pain_points.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Pain Points & Needs</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lead.memory.pain_points.map((pt, i) => (
                          <span key={i} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-700 font-medium shadow-2xs">
                            • {pt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Objections */}
                  {lead.memory.objections && lead.memory.objections.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Active Objections</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lead.memory.objections.map((obj, i) => (
                          <span key={i} className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] text-rose-800 font-medium">
                            ⚠️ {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Decision Maker */}
                  {lead.memory.decision_maker && (
                    <div className="flex justify-between py-1 border-t border-slate-100 pt-2">
                      <span className="text-slate-500">Decision Maker:</span>
                      <span className="font-semibold text-slate-800">{lead.memory.decision_maker}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2 text-center space-y-2">
                  <p className="text-[11px] text-slate-500">
                    No conversation intelligence extracted yet for this prospect.
                  </p>
                  <button
                    onClick={() => openAnalyzeModal(lead)}
                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-2xs"
                  >
                    <Brain className="h-3 w-3" />
                    <span>Run Deal Doctor</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-6">Activity Timeline</h3>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {leadActivities.length === 0 ? (
              <p className="text-xs text-slate-400">No activities recorded yet.</p>
            ) : (
              leadActivities.map((act) => (
                <div key={act.id} className="relative group">
                  <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-600 shadow-xs" />
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs text-slate-800">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span className="font-bold uppercase tracking-wider text-indigo-700">{act.type}</span>
                      <span>{new Date(act.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{act.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Audited Activity Logs Tab (public.lead_activity_logs with RLS) */}
      {activeTab === 'activity_logs' && (
        <div className="space-y-6">
          {/* Header & Security Notice */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-slate-50 to-white p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-indigo-600 p-2 text-white flex-shrink-0 mt-0.5">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      Audited Activity Logs (<code className="font-mono text-indigo-600">public.lead_activity_logs</code>)
                    </h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      RLS Protected
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Records verified executed customer interactions. Access strictly governed by workspace membership via Row-Level Security.
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-500 bg-white/80 border border-slate-200 rounded-xl px-3 py-1.5 self-start sm:self-auto font-medium">
                {currentLeadLogs.length} {currentLeadLogs.length === 1 ? 'logged event' : 'logged events'}
              </div>
            </div>
          </div>

          {/* Database Error Alert */}
          {logsError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>{logsError}</span>
            </div>
          )}

          {/* Quick Manual Activity Logger Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Record Verified Executed Activity</h4>
                <p className="text-[11px] text-slate-500">Log genuine communications dispatched to this lead.</p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Audited Insertion
              </span>
            </div>

            <form onSubmit={handleRecordAuditedLog} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Channel Selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Channel (Constrained)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['whatsapp', 'email', 'phone', 'sms'] as ActivityLogChannel[]).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setLogChannel(ch)}
                        className={`rounded-lg px-2 py-1.5 text-xs font-semibold capitalize transition flex items-center justify-center gap-1.5 border ${
                          logChannel === ch
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {ch === 'whatsapp' && <MessageSquare className="h-3 w-3" />}
                        {ch === 'email' && <Mail className="h-3 w-3" />}
                        {ch === 'phone' && <Phone className="h-3 w-3" />}
                        {ch === 'sms' && <Send className="h-3 w-3" />}
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Agent Name */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Executing Agent
                  </label>
                  <input
                    type="text"
                    value={logAgentName}
                    onChange={(e) => setLogAgentName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Execution Timestamp */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Executed At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={logExecutedAt}
                    onChange={(e) => setLogExecutedAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Message Body / Discussion Summary <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={logMessageBody}
                  onChange={(e) => setLogMessageBody(e.target.value)}
                  placeholder={`Enter the full text or verified summary of the ${logChannel} communication...`}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 font-sans leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 items-center">
                <span className="text-[11px] text-slate-400 italic">
                  Prevents duplicate submissions within 10s window.
                </span>
                <button
                  type="submit"
                  disabled={submittingLog || !logMessageBody.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{submittingLog ? 'Recording Log...' : 'Record Executed Activity'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Activity Logs History List (Sorted newest first) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm">Execution History (Newest First)</h4>
              <span className="text-xs text-slate-400">Total: {currentLeadLogs.length}</span>
            </div>

            {logsLoading ? (
              <div className="space-y-3 py-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse space-y-2 rounded-xl border border-slate-100 p-4 bg-slate-50">
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : currentLeadLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <FileCheck className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No verified activity logs recorded yet.</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  AI drafts are kept in preview mode until you click &ldquo;Confirm Sent &amp; Log&rdquo; or record an executed communication above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...currentLeadLogs]
                  .sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime())
                  .map((log) => {
                    const channelStyles: Record<ActivityLogChannel, { badge: string; icon: any }> = {
                      whatsapp: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: MessageSquare },
                      email: { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Mail },
                      phone: { badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: Phone },
                      sms: { badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: Send },
                    };
                    const style = channelStyles[log.channel] || channelStyles.email;
                    const IconComp = style.icon;

                    return (
                      <div
                        key={log.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 hover:border-slate-300 transition shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${style.badge}`}>
                              <IconComp className="h-3 w-3" />
                              {log.channel}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              Agent: <span className="text-slate-900 font-bold">{log.agent_name}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(log.executed_at).toLocaleString()}</span>
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold ml-1">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Audited
                            </span>
                          </div>
                        </div>

                        <div className="rounded-lg bg-slate-50/80 p-3 text-xs text-slate-800 leading-relaxed whitespace-pre-line border border-slate-100 font-sans">
                          {log.message_body}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow-ups Tab */}
      {activeTab === 'followups' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Scheduled Follow-ups</h3>
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Plus className="h-3.5 w-3.5" /> Schedule New
            </button>
          </div>

          <div className="space-y-3">
            {leadFollowups.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No follow-ups recorded. Click "Schedule New" or "Generate AI Follow-up".
              </div>
            ) : (
              leadFollowups.map((f) => (
                <div
                  key={f.id}
                  className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {new Date(f.scheduled_at).toLocaleString()}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                        {f.channel}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          f.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : f.status === 'overdue'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>
                    {f.message && <p className="text-xs text-slate-600 italic">"{f.message}"</p>}
                  </div>

                  {f.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => completeFollowup(f.id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => cancelFollowup(f.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Conversation Thread</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto p-2">
            {leadMessages.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No inbound/outbound messages logged yet.</p>
            ) : (
              leadMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.direction === 'outbound' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-md rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.direction === 'outbound'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.direction === 'outbound' ? 'Sent' : 'Received'} via {msg.channel} •{' '}
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      <ScheduleFollowupModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        lead={lead}
      />
    </div>
  );
};
