import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Sparkles, 
  Brain, 
  Check, 
  AlertCircle, 
  Target, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw,
  Send
} from 'lucide-react';
import { ConversationAnalysis } from '../../types';
import { AILoadingIndicator } from '../common/AILoadingIndicator';
import { QuotaAlertBanner } from '../common/QuotaAlertBanner';

export const AnalyzeConversationModal: React.FC = () => {
  const { 
    isAnalyzeModalOpen, 
    closeAnalyzeModal, 
    analyzeModalLead, 
    analyzeConversation, 
    openAIModal 
  } = useApp();

  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ConversationAnalysis | null>(null);

  if (!isAnalyzeModalOpen || !analyzeModalLead) return null;

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await analyzeConversation(analyzeModalLead.id, text.trim(), notes.trim());
      setAnalysisResult(res);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to analyze conversation.';
      if (errMsg.includes('quota') || errMsg.includes('resource_exhausted')) {
        setError('Cloud AI quota capacity reached. Switched to deterministic conversation intelligence.');
      } else if (errMsg.includes('permission') || errMsg.includes('caller does not have permission')) {
        setError('Google Gemini API authorization notice: "The caller does not have permission". Switched to deterministic conversation intelligence.');
      } else {
        setError(errMsg);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleProceedToFollowup = () => {
    closeAnalyzeModal();
    openAIModal(analyzeModalLead);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                Conversation Intelligence
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase">
                  AI Deep Analysis
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Extract intent, hidden objections, customer needs, and action steps for{' '}
                <span className="font-semibold text-slate-700">{analyzeModalLead.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={closeAnalyzeModal}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {analyzing ? (
            <AILoadingIndicator
              title={`Analyzing Dialogue for ${analyzeModalLead.name}`}
              subtitle="Extracting hidden objections, buying intent, decision makers, and required action items."
              stages={[
                'Parsing transcript text & conversational cadence...',
                'Classifying customer intent & procurement stage...',
                'Detecting competitor comparisons & pricing objections...',
                'Updating permanent behavioral lead memory...',
              ]}
            />
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 text-center space-y-3">
              <AlertCircle className="mx-auto h-7 w-7 text-rose-500" />
              <div>
                <h5 className="font-bold text-rose-900 text-sm">Conversation Analysis Notice</h5>
                <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">{error}</p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={handleAnalyze}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry Analysis</span>
                </button>
              </div>
            </div>
          ) : !analysisResult ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Paste Conversation Transcript or Email Thread <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste WhatsApp messages, call notes, or email dialogue here...&#10;e.g. Rahul: I like the design wireframe, but I have to review the pricing with my co-founder Samir. Can you guarantee delivery before next month?"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Context Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spoke over phone for 15 mins; seems keen on mobile speed."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 text-xs text-indigo-950 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p>
                  Gemini analyzes customer buying stage, surfaces friction points, and saves detected pain points directly to the lead’s permanent memory.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Quota Alert Banner if fallback engine was triggered */}
              {analysisResult.quota_notice && (
                <QuotaAlertBanner
                  notice={analysisResult.quota_notice}
                  onRetry={handleAnalyze}
                />
              )}

              {/* Executive Summary */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Conversation Summary
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Core Intelligence Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Buying Intent
                  </span>
                  <span
                    className={`inline-block mt-1 font-bold text-xs capitalize ${
                      analysisResult.intent === 'high'
                        ? 'text-emerald-700'
                        : analysisResult.intent === 'medium'
                        ? 'text-amber-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {analysisResult.intent} Intent
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Buying Stage
                  </span>
                  <span className="inline-block mt-1 font-bold text-xs text-indigo-700 capitalize">
                    {analysisResult.buying_stage}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Decision Maker
                  </span>
                  <span className="inline-block mt-1 font-bold text-xs text-slate-800 truncate max-w-full">
                    {analysisResult.decision_maker}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Competitor Mentions
                  </span>
                  <span className="inline-block mt-1 font-bold text-xs text-slate-800">
                    {analysisResult.competitor_mentioned ? '⚠️ Detected' : 'None Mentioned'}
                  </span>
                </div>
              </div>

              {/* Objections & Next Step */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                    Identified Objection / Friction
                  </span>
                  <p className="text-xs font-semibold text-rose-900">
                    {analysisResult.objection || 'No major objection recorded.'}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Recommended Next Step
                  </span>
                  <p className="text-xs font-semibold text-emerald-900">
                    {analysisResult.next_step}
                  </p>
                </div>
              </div>

              {/* Customer Needs */}
              {analysisResult.customer_needs && analysisResult.customer_needs.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700">Identified Customer Needs & Priorities:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.customer_needs.map((need, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700"
                      >
                        ✓ {need}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Saved to Lead Memory! Lead priority score automatically updated.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
          <button
            onClick={closeAnalyzeModal}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            {analysisResult ? 'Close' : 'Cancel'}
          </button>

          {!analysisResult ? (
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !text.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>AI Analyzing Conversation...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                  <span>Run Intelligence Analysis</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleProceedToFollowup}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Generate Follow-up From Insights</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
