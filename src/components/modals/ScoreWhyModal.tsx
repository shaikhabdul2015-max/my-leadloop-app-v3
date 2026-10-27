import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Flame, AlertCircle, TrendingUp, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../../utils/crmUtils';

export const ScoreWhyModal: React.FC = () => {
  const { isScoreWhyModalOpen, closeScoreWhyModal, scoreWhyLead } = useApp();

  if (!isScoreWhyModalOpen || !scoreWhyLead) return null;

  const isUncalculated = scoreWhyLead.priority_score === null || scoreWhyLead.priority_score === undefined;
  const score: number | null = isUncalculated ? null : (scoreWhyLead.priority_score as number);
  const category = scoreWhyLead.temperature || scoreWhyLead.score_category || (score !== null ? (score >= 75 ? 'HOT' : score >= 45 ? 'WARM' : 'COLD') : null);
  const factors = scoreWhyLead.score_factors || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white ${
              category === 'HOT' ? 'bg-rose-500 shadow-rose-200' : category === 'WARM' ? 'bg-amber-500' : 'bg-slate-500'
            }`}>
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                AI Lead Score Analysis: {scoreWhyLead.name}
              </h3>
              <p className="text-xs text-slate-500">{scoreWhyLead.company || 'Direct Account'}</p>
            </div>
          </div>
          <button
            onClick={closeScoreWhyModal}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Score Badge Callout */}
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Calculated Priority</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                {score !== null ? (
                  <>
                    <span className="text-3xl font-black text-slate-900">{score}</span>
                    <span className="text-xs font-bold text-slate-400">/ 100</span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-slate-600">Insufficient Data</span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                  category === 'HOT'
                    ? 'bg-rose-100 text-rose-700'
                    : category === 'WARM'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                {category ? `${category} Opportunity` : 'Pending Scoring'}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Value: {formatCurrency(scoreWhyLead.deal_value, scoreWhyLead.currency)}
              </p>
            </div>
          </div>

          {scoreWhyLead.score_reason && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs text-indigo-950">
              <span className="font-bold block text-indigo-900 mb-0.5">Scoring Audit Rationale:</span>
              <p className="text-slate-700">{scoreWhyLead.score_reason}</p>
            </div>
          )}

          {/* Factor Breakdown */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Scoring Factors & Heuristics
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {factors.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                  Standard baseline priority applied based on current stage and contact history.
                </div>
              ) : (
                factors.map((f, i) => (
                  <div
                    key={i}
                    className={`flex items-start justify-between rounded-xl border p-3 text-xs ${
                      f.impact === 'positive'
                        ? 'border-emerald-100 bg-emerald-50/40 text-emerald-950'
                        : f.impact === 'negative'
                        ? 'border-rose-100 bg-rose-50/40 text-rose-950'
                        : 'border-slate-100 bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        {f.impact === 'positive' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                        ) : f.impact === 'negative' ? (
                          <AlertCircle className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
                        ) : (
                          <TrendingUp className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                        )}
                        <span>{f.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 pl-5">{f.description}</p>
                    </div>

                    <span
                      className={`font-black text-xs px-2 py-0.5 rounded-md ${
                        f.points > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {f.points > 0 ? `+${f.points}` : f.points}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Risk Alert if any */}
          {scoreWhyLead.risk_reasons && scoreWhyLead.risk_reasons.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 space-y-1">
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                Deal Risk Signals
              </span>
              <ul className="text-xs text-rose-800 space-y-0.5 pl-5 list-disc">
                {scoreWhyLead.risk_reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
            Heuristic priority score calculated dynamically from CRM velocity, deal scope, and response gaps.
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex justify-end">
          <button
            onClick={closeScoreWhyModal}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
