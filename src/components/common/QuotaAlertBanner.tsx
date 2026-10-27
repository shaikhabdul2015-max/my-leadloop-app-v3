import React from 'react';
import { AlertTriangle, Sparkles, CheckCircle2, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { QuotaNotice } from '../../types';

interface QuotaAlertBannerProps {
  notice?: QuotaNotice | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  compact?: boolean;
}

export const QuotaAlertBanner: React.FC<QuotaAlertBannerProps> = ({
  notice,
  onDismiss,
  onRetry,
  compact = false,
}) => {
  if (!notice || !notice.is_quota_exceeded) return null;

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 shadow-2xs">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="font-semibold">
            API Quota Reached: Switched to intelligent offline fallback engine.
          </span>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="rounded p-1 text-amber-500 hover:bg-amber-100 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50/50 p-4 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h5 className="font-extrabold text-amber-950 text-xs sm:text-sm">
                AI Model Quota Alert & Engine Fallback
              </h5>
              <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800 tracking-wide">
                Seamless Failover Active
              </span>
            </div>

            <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
              {notice.message || 'Google Gemini model token quota temporarily exceeded. LeadLoop has automatically activated its deterministic heuristic sales engine.'}
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-amber-800 font-semibold">
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Zero interruption: Workflow is 100% operational
              </span>
              <span>•</span>
              <span className="text-amber-700">Deterministic contextual generation</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry Cloud API</span>
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="rounded-xl p-1.5 text-amber-600 hover:bg-amber-100 transition"
              title="Dismiss Notice"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
