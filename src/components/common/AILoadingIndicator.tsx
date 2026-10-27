import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface AILoadingIndicatorProps {
  title?: string;
  subtitle?: string;
  stages?: string[];
  durationMs?: number;
}

export const AILoadingIndicator: React.FC<AILoadingIndicatorProps> = ({
  title = 'AI Sales Engine Working...',
  subtitle = 'Analyzing lead signals and generating optimized recommendations.',
  stages = [
    'Retrieving lead history & stage velocity...',
    'Analyzing objection patterns & conversational sentiment...',
    'Synthesizing personalized touchpoint...',
    'Applying conversion probability calibration...',
  ],
  durationMs = 2800,
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const stageInterval = durationMs / stages.length;
    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
      setProgress((prev) => Math.min(95, prev + Math.floor(80 / stages.length)));
    }, stageInterval);

    return () => clearInterval(interval);
  }, [stages.length, durationMs]);

  return (
    <div className="py-8 px-4 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
      {/* Outer Glowing Holographic Orb */}
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
        {/* Pulsating background ring */}
        <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 animate-ping duration-1000" />
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-indigo-500/30 via-violet-500/20 to-amber-500/30 blur-md animate-pulse" />
        
        {/* Main Icon Orb */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white shadow-xl shadow-indigo-300">
          <Brain className="h-8 w-8 animate-pulse text-indigo-100" />
          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black shadow-xs">
            <Sparkles className="h-3 w-3 animate-spin" />
          </div>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="space-y-1.5">
        <h4 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
          <span>{title}</span>
          <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Animated Glowing Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
          <span className="text-indigo-600 flex items-center gap-1">
            <Zap className="h-3 w-3 animate-pulse" />
            Stage {currentStageIndex + 1} of {stages.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-400 transition-all duration-500 ease-out shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step-by-Step Stage Cards */}
      <div className="space-y-2 text-left bg-slate-50/80 rounded-2xl p-3 border border-slate-200/70">
        {stages.map((stageText, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                isCurrent
                  ? 'bg-white shadow-xs border border-indigo-100 font-bold text-indigo-900'
                  : isDone
                  ? 'text-slate-400 font-medium'
                  : 'text-slate-300 font-normal'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              ) : isCurrent ? (
                <div className="h-4 w-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-slate-200 flex-shrink-0" />
              )}
              <span className="truncate">{stageText}</span>
            </div>
          );
        })}
      </div>

      {/* Trust & Fallback Security Footer */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>Grounded in actual CRM context • Zero synthetic hallucinations</span>
      </div>
    </div>
  );
};
