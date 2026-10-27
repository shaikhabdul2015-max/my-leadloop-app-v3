import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Sparkles, 
  X, 
  ArrowRight, 
  Command, 
  Check, 
  AlertCircle, 
  Send,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Lead, CommandExecutionResult } from '../../types';
import { formatCurrency } from '../../utils/crmUtils';

export const CommandBarModal: React.FC = () => {
  const { 
    isCommandBarOpen, 
    setIsCommandBarOpen, 
    executeCommand, 
    setSelectedLeadId, 
    setCurrentView,
    openAIModal 
  } = useApp();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CommandExecutionResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandBarOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setResult(null);
      setQuery('');
    }
  }, [isCommandBarOpen]);

  if (!isCommandBarOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await executeCommand(query.trim());
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBatch = async () => {
    if (!result?.write_proposal?.items) return;
    setLoading(true);
    try {
      await executeCommand(query, true, result.write_proposal.items);
      setIsCommandBarOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const quickSuggestions = [
    'Show overdue leads',
    'Find leads above ₹1 lakh',
    'Show inactive leads',
    'Create follow-ups for interested leads',
    'Summarize Rahul Sharma',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Command Input Bar */}
        <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b border-slate-200 px-4 py-3.5 bg-white">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Command className="h-4 w-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command (e.g. 'Show overdue leads' or 'Create follow-ups for interested leads')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-40 transition"
          >
            {loading ? 'Thinking...' : 'Run'}
          </button>
          <button
            type="button"
            onClick={() => setIsCommandBarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </form>

        {/* Results Area */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {!result ? (
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Suggested Commands
              </span>
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((sugg, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(sugg);
                      executeCommand(sugg).then(setResult);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition"
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Interpretation Header */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs text-indigo-950 font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                <span>{result.interpretation}</span>
              </div>

              {/* WRITE OPERATION: Proposal with Approval */}
              {result.intent_type === 'batch_action' && result.write_proposal && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span>Write Confirmation Required</span>
                  </div>
                  <p className="text-xs text-amber-800">{result.write_proposal.description}</p>

                  {/* Preview Items */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {result.write_proposal.items.map((item: any, idx: number) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{item.lead_name}</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            Scheduled for {new Date(item.recommended_date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic">"{item.message_preview}"</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
                    <button
                      onClick={() => setResult(null)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApproveBatch}
                      disabled={loading}
                      className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{loading ? 'Executing...' : 'Approve & Schedule All'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* READ / FILTER OPERATION: List Matching Leads */}
              {result.leads && result.leads.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Matching Results ({result.leads.length})
                  </span>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
                    {result.leads.map((l: Lead) => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between p-3 hover:bg-slate-50 transition text-xs"
                      >
                        <div>
                          <button
                            onClick={() => {
                              setSelectedLeadId(l.id);
                              setCurrentView('lead-detail');
                              setIsCommandBarOpen(false);
                            }}
                            className="font-bold text-slate-900 hover:text-indigo-600 text-left"
                          >
                            {l.name}
                          </button>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {l.company || 'Direct'} • {formatCurrency(l.deal_value, l.currency)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                              l.priority === 'high'
                                ? 'bg-rose-100 text-rose-700'
                                : l.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {l.priority}
                          </span>
                          <button
                            onClick={() => {
                              setIsCommandBarOpen(false);
                              openAIModal(l);
                            }}
                            className="p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            title="Generate Message"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLeadId(l.id);
                              setCurrentView('lead-detail');
                              setIsCommandBarOpen(false);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>Press ESC or click ✕ to dismiss</span>
          <span>Shortcut: Ctrl + K</span>
        </div>
      </div>
    </div>
  );
};
