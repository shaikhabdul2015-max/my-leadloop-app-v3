import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CalendarCheck2, 
  Sparkles, 
  Check, 
  Clock, 
  AlertTriangle, 
  X, 
  Edit3, 
  Calendar,
  Send,
  Building,
  Phone,
  MessageSquare
} from 'lucide-react';
import { formatCurrency } from '../utils/crmUtils';
import { Followup } from '../types';

export const FollowupsPage: React.FC = () => {
  const { 
    followups, 
    leads, 
    stages, 
    completeFollowup, 
    cancelFollowup, 
    rescheduleFollowup, 
    updateLead,
    setSelectedLeadId, 
    setCurrentView, 
    openAIModal 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  
  // Reschedule state
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string>('');

  const now = new Date();

  // Categorize follow-ups
  const categorized = {
    today: followups.filter((f) => {
      if (f.status === 'completed' || f.status === 'cancelled') return false;
      const sch = new Date(f.scheduled_at);
      return sch.toDateString() === now.toDateString();
    }),
    overdue: followups.filter((f) => {
      if (f.status === 'completed' || f.status === 'cancelled') return false;
      const sch = new Date(f.scheduled_at);
      return f.status === 'overdue' || (sch < now && sch.toDateString() !== now.toDateString());
    }),
    upcoming: followups.filter((f) => {
      if (f.status === 'completed' || f.status === 'cancelled') return false;
      const sch = new Date(f.scheduled_at);
      return sch > now && sch.toDateString() !== now.toDateString();
    }),
    completed: followups.filter((f) => f.status === 'completed'),
  };

  const currentList = categorized[activeTab];

  const handleRescheduleSubmit = async (fId: string) => {
    if (!newDate) return;
    await rescheduleFollowup(fId, new Date(newDate).toISOString());
    setReschedulingId(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Follow-up Command Center</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Never miss a touchpoint. Review overdue items, today's schedule, and approve AI follow-up copies.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'today', label: "Today's Follow-ups", count: categorized.today.length, color: 'text-indigo-600 bg-indigo-50' },
          { id: 'overdue', label: 'Overdue', count: categorized.overdue.length, color: 'text-rose-700 bg-rose-100' },
          { id: 'upcoming', label: 'Upcoming', count: categorized.upcoming.length, color: 'text-slate-700 bg-slate-100' },
          { id: 'completed', label: 'Completed', count: categorized.completed.length, color: 'text-emerald-700 bg-emerald-100' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${tab.color}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Follow-ups List */}
      <div className="space-y-3.5">
        {currentList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-2">
            <Check className="mx-auto h-8 w-8 text-emerald-500" />
            <h4 className="font-bold text-slate-800 text-sm">No follow-ups in this section!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === 'overdue'
                ? 'Great job keeping your pipeline active without falling behind.'
                : 'Schedule a follow-up directly from any lead in your Leads or Pipeline tab.'}
            </p>
          </div>
        ) : (
          currentList.map((f) => {
            const lead = leads.find((l) => l.id === f.lead_id);
            if (!lead) return null;
            const stage = stages.find((s) => s.id === lead.stage_id);

            return (
              <div
                key={f.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        setSelectedLeadId(lead.id);
                        setCurrentView('lead-detail');
                      }}
                      className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition"
                    >
                      {lead.name}
                    </button>
                    {lead.company && (
                      <span className="text-xs text-slate-500 font-medium">({lead.company})</span>
                    )}
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold text-white uppercase"
                      style={{ backgroundColor: stage?.color || '#6366f1' }}
                    >
                      {stage?.name || 'Lead'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        lead.priority === 'high'
                          ? 'bg-rose-100 text-rose-700'
                          : lead.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lead.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                      via {f.channel}
                    </span>
                    <span>•</span>
                    <span className="text-slate-800">
                      {new Date(f.scheduled_at).toLocaleDateString()} at{' '}
                      {new Date(f.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Message preview / Reason */}
                {f.message && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Message Content:
                    </span>
                    <p className="italic">"{f.message}"</p>
                  </div>
                )}

                {f.ai_reason && !f.message && (
                  <div className="rounded-xl border border-indigo-50 bg-indigo-50/40 p-2.5 text-xs text-indigo-900">
                    <span className="font-semibold text-indigo-950">AI Strategic Reason: </span>
                    {f.ai_reason}
                  </div>
                )}

                {/* Reschedule inline form */}
                {reschedulingId === f.id && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <input
                      type="datetime-local"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                    />
                    <button
                      onClick={() => handleRescheduleSubmit(f.id)}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Save Date
                    </button>
                    <button
                      onClick={() => setReschedulingId(null)}
                      className="rounded-lg border px-2.5 py-1.5 text-xs text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Actions row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">
                    Deal: {formatCurrency(lead.deal_value, lead.currency)} • {lead.service || 'Service'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAIModal(lead)}
                      className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 font-bold text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generate AI Message</span>
                    </button>

                    {f.status !== 'completed' && (
                      <>
                        <button
                          onClick={() => {
                            setReschedulingId(f.id);
                            setNewDate(new Date(f.scheduled_at).toISOString().slice(0, 16));
                          }}
                          className="rounded-xl border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => completeFollowup(f.id)}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-500 transition"
                        >
                          Mark Completed
                        </button>
                        <button
                          onClick={() => cancelFollowup(f.id)}
                          className="rounded-xl border border-slate-200 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition"
                          title="Cancel Follow-up"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
