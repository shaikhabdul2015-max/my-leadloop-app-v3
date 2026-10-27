import React, { useState, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  Search, 
  Code2, 
  FileCode, 
  Database, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  X,
  ExternalLink,
  Terminal
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CodePanel: React.FC = () => {
  const { showToast } = useApp();
  const [activeCodeTab, setActiveCodeTab] = useState<'migration' | 'schema' | 'types' | 'heuristics'>('migration');
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Embedded authoritative code snippets from the verified codebase
  const codeSnippets: Record<string, { title: string; filename: string; language: string; content: string; description: string }> = {
    migration: {
      title: 'Production AI Scoring & Revenue Predictions Migration',
      filename: '20260927010000_ai_scoring_and_predictions_upgrade.sql',
      language: 'sql',
      description: 'Zero-downtime PostgreSQL migration enforcing priority_score constraints, audit timestamps, and multi-tenant ai_revenue_predictions table.',
      content: `-- ==============================================================================
-- LeadLoop AI: Production-Grade AI Scoring & Revenue Predictions Migration
-- Migration: 20260927010000_ai_scoring_and_predictions_upgrade.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UPGRADE LEADS TABLE WITH AUDITED AI SCORING & BEHAVIORAL ATTRIBUTES
ALTER TABLE public.leads
  ALTER COLUMN priority_score DROP DEFAULT,
  ADD COLUMN IF NOT EXISTS temperature TEXT,
  ADD COLUMN IF NOT EXISTS score_reason TEXT,
  ADD COLUMN IF NOT EXISTS ai_close_probability INT,
  ADD COLUMN IF NOT EXISTS message_draft TEXT,
  ADD COLUMN IF NOT EXISTS next_followup_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dynamic_sentiment TEXT DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS competitor_tracks TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS ai_prediction_updated_at TIMESTAMPTZ;

-- 2. ADD DATABASE CONSTRAINTS ON LEADS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_leads_priority_score') THEN
    ALTER TABLE public.leads 
      ADD CONSTRAINT chk_leads_priority_score 
      CHECK (priority_score IS NULL OR (priority_score >= 0 AND priority_score <= 100));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_leads_ai_close_probability') THEN
    ALTER TABLE public.leads 
      ADD CONSTRAINT chk_leads_ai_close_probability 
      CHECK (ai_close_probability IS NULL OR (ai_close_probability >= 0 AND ai_close_probability <= 100));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_leads_temperature') THEN
    ALTER TABLE public.leads 
      ADD CONSTRAINT chk_leads_temperature 
      CHECK (temperature IS NULL OR temperature IN ('HOT', 'WARM', 'COLD'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_leads_dynamic_sentiment') THEN
    ALTER TABLE public.leads 
      ADD CONSTRAINT chk_leads_dynamic_sentiment 
      CHECK (dynamic_sentiment IS NULL OR dynamic_sentiment IN ('positive', 'neutral', 'negative'));
  END IF;
END $$;

-- 3. SCORE HISTORY AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    previous_score INTEGER NOT NULL CHECK (previous_score >= 0 AND previous_score <= 100),
    new_score INTEGER NOT NULL CHECK (new_score >= 0 AND new_score <= 100),
    change_amount INTEGER NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    source TEXT DEFAULT 'leadloop_ai',
    activity_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MULTI-TENANT PERIOD AI REVENUE PREDICTIONS
CREATE TABLE IF NOT EXISTS public.ai_revenue_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL,
    target_month DATE NOT NULL DEFAULT CURRENT_DATE,
    forecast_period TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
    raw_pipeline_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (raw_pipeline_value >= 0),
    ai_predicted_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (ai_predicted_value >= 0),
    weighted_pipeline_value NUMERIC(12, 2) DEFAULT 0.00,
    confidence_percentage INT CHECK (confidence_percentage IS NULL OR (confidence_percentage >= 0 AND confidence_percentage <= 100)),
    model_version TEXT DEFAULT 'leadloop-forecast-v2',
    methodology TEXT DEFAULT 'stage_weighted_momentum',
    metadata JSONB DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_revenue_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can access score history"
    ON public.score_history FOR ALL 
    USING (public.is_workspace_member(organization_id));

CREATE POLICY "Workspace members can access ai_revenue_predictions"
    ON public.ai_revenue_predictions FOR ALL 
    USING (public.is_workspace_member(organization_id));`,
    },
    schema: {
      title: 'Supabase Full Relational Schema',
      filename: 'schema.sql',
      language: 'sql',
      description: 'Core PostgreSQL schema covering profiles, workspaces, leads, pipelines, cadences, competitor battlecards, and forecasts.',
      content: `-- LeadLoop AI Core Supabase Production Schema
-- Supports Multi-tenant Row-Level Security (RLS)

CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_generations_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    source TEXT DEFAULT 'direct',
    service TEXT,
    deal_value NUMERIC(12, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'INR',
    stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'archived')),
    last_contacted_at TIMESTAMPTZ,
    next_followup_at TIMESTAMPTZ,
    next_followup_date TIMESTAMPTZ,
    notes TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    priority_score INTEGER CHECK (priority_score IS NULL OR (priority_score >= 0 AND priority_score <= 100)),
    score_category TEXT CHECK (score_category IS NULL OR score_category IN ('HOT', 'WARM', 'COLD')),
    temperature TEXT CHECK (temperature IS NULL OR temperature IN ('HOT', 'WARM', 'COLD')),
    score_reason TEXT,
    ai_close_probability INTEGER CHECK (ai_close_probability IS NULL OR (ai_close_probability >= 0 AND ai_close_probability <= 100)),
    message_draft TEXT,
    dynamic_sentiment TEXT DEFAULT 'neutral' CHECK (dynamic_sentiment IS NULL OR dynamic_sentiment IN ('positive', 'neutral', 'negative')),
    competitor_tracks TEXT[] DEFAULT '{}',
    buying_intent TEXT DEFAULT 'medium' CHECK (buying_intent IN ('high', 'medium', 'low')),
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    risk_status TEXT DEFAULT 'HEALTHY' CHECK (risk_status IN ('HEALTHY', 'WATCH', 'AT_RISK', 'CRITICAL')),
    intent_score INTEGER DEFAULT 50,
    engagement_score INTEGER DEFAULT 50,
    sentiment_score INTEGER DEFAULT 0,
    probability_score INTEGER DEFAULT 40,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    score_updated_at TIMESTAMPTZ DEFAULT NOW(),
    ai_prediction_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_leads_priority_score ON public.leads(priority_score) WHERE priority_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_ai_close_prob ON public.leads(ai_close_probability) WHERE ai_close_probability IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_next_followup_date ON public.leads(next_followup_date) WHERE next_followup_date IS NOT NULL;`,
    },
    types: {
      title: 'TypeScript Domain Models & Contracts',
      filename: 'types.ts',
      language: 'typescript',
      description: 'Strongly-typed contracts for Lead, Forecast, AI Follow-ups, Quota Notices, and Omnichannel Cadences.',
      content: `// LeadLoop AI Core Type Definitions
export interface Lead {
  id: string;
  workspace_id: string;
  organization_id?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  service: string;
  deal_value: number;
  currency: string;
  stage_id: string;
  status: 'active' | 'won' | 'lost' | 'archived';
  last_contacted_at: string | null;
  last_activity_at?: string | null;
  next_followup_at: string | null;
  next_followup_date?: string | null;
  notes: string;
  priority: 'low' | 'medium' | 'high';
  priority_score?: number | null; // Nullable for uncalculated leads
  score_category?: 'HOT' | 'WARM' | 'COLD' | null;
  temperature?: 'HOT' | 'WARM' | 'COLD' | null;
  score_reason?: string | null;
  ai_close_probability?: number | null; // Nullable without fabricated defaults
  message_draft?: string | null;
  dynamic_sentiment?: 'positive' | 'neutral' | 'negative' | null;
  competitor_tracks?: string[];
  risk_status?: 'HEALTHY' | 'WATCH' | 'AT_RISK' | 'CRITICAL';
  risk_level?: 'low' | 'medium' | 'high';
  risk_reasons?: string[];
  score_updated_at?: string;
  ai_prediction_updated_at?: string | null;
}

export interface QuotaNotice {
  is_quota_exceeded: boolean;
  message: string;
  engine_fallback: boolean;
  model?: string;
  suggestion?: string;
}

export interface AIRevenuePrediction {
  id: string;
  organization_id: string;
  pipeline_id?: string | null;
  target_month: string;
  forecast_period: string;
  raw_pipeline_value: number;
  ai_predicted_value: number;
  weighted_pipeline_value?: number;
  confidence_percentage?: number | null;
  model_version?: string;
  methodology?: string;
  metadata?: Record<string, any>;
  calculated_at: string;
  created_at: string;
}`,
    },
    heuristics: {
      title: 'Deterministic Heuristic Fallback Engine',
      filename: 'crmHeuristics.ts',
      language: 'typescript',
      description: 'Zero-hallucination deterministic sales algorithms activated when external cloud AI quotas or rate limits occur.',
      content: `// Deterministic Follow-up Generator
// Activated on Cloud AI Rate-limits or Quota Exceeded

export function generateFallbackFollowup(params: {
  lead_name: string;
  company?: string;
  service?: string;
  deal_value?: number;
  stage?: string;
  last_message?: string;
  notes?: string;
  tone?: string;
  channel?: string;
}): AIFollowUpResponse {
  const { lead_name, company, service = 'our consulting services', stage = 'Interested', tone = 'professional-friendly' } = params;

  let message = \`Hi \${lead_name}, checking in regarding \${service}. Let me know if you had any questions on the scope!\`;
  let reason = 'Standard milestone check-in based on stage velocity.';
  let urgency: 'low' | 'medium' | 'high' = 'medium';
  let days = 2;

  if (stage.toLowerCase().includes('negotiat') || stage.toLowerCase().includes('proposal')) {
    message = \`Hi \${lead_name}, following up on the proposal for \${company || 'your team'}. Happy to hop on a quick 5-min sync to finalize the details.\`;
    reason = 'High-value negotiation stage: timely touchpoint prevents deal stall.';
    urgency = 'high';
    days = 1;
  }

  return {
    lead_intent: 'interested',
    recommended_action: 'follow_up',
    urgency,
    follow_up_after_days: days,
    reason,
    suggested_channel: (params.channel as any) || 'whatsapp',
    message,
    quota_notice: {
      is_quota_exceeded: true,
      engine_fallback: true,
      message: 'Generated using LeadLoop deterministic heuristics.'
    }
  };
}`,
    },
  };

  const activeSnippet = codeSnippets[activeCodeTab];

  // Search filter across lines
  const lines = useMemo(() => {
    const rawLines = activeSnippet.content.split('\n');
    if (!searchFilter.trim()) return rawLines;
    const lower = searchFilter.toLowerCase();
    return rawLines.filter((l) => l.toLowerCase().includes(lower));
  }, [activeSnippet.content, searchFilter]);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSnippet.content);
    setCopied(true);
    showToast(`${activeSnippet.title} copied to clipboard!`, 'success');
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownload = () => {
    const blob = new Blob([activeSnippet.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeSnippet.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${activeSnippet.filename} successfully!`, 'success');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-indigo-400 font-mono shadow-xs">
              <Code2 className="h-4 w-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Developer & Code Inspector
            </h3>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-800">
              Verified Production
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect, copy, or download the full Supabase migrations, schemas, and typed contracts.
          </p>
        </div>

        {/* Copy & Download Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-white" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition"
            title={`Download ${activeSnippet.filename}`}
          >
            <Download className="h-3.5 w-3.5 text-indigo-200" />
            <span>Download ({activeSnippet.filename.split('.').pop()?.toUpperCase()})</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher & Search Filter */}
      <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => { setActiveCodeTab('migration'); setSearchFilter(''); }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeCodeTab === 'migration'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>AI Migration SQL</span>
          </button>

          <button
            onClick={() => { setActiveCodeTab('schema'); setSearchFilter(''); }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeCodeTab === 'schema'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Schema SQL</span>
          </button>

          <button
            onClick={() => { setActiveCodeTab('types'); setSearchFilter(''); }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeCodeTab === 'types'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Typescript Types</span>
          </button>

          <button
            onClick={() => { setActiveCodeTab('heuristics'); setSearchFilter(''); }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              activeCodeTab === 'heuristics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Deterministic Engine</span>
          </button>
        </div>

        {/* In-code Search Filter */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search code lines..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Snippet Context Bar */}
      <div className="bg-slate-900 px-6 py-2.5 flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
            <Terminal className="h-3.5 w-3.5" />
            {activeSnippet.filename}
          </span>
          <span className="text-slate-600">|</span>
          <span>{activeSnippet.language.toUpperCase()}</span>
          <span className="text-slate-600">|</span>
          <span>{lines.length} lines {searchFilter && `(filtered)`}</span>
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:inline truncate max-w-sm">
          {activeSnippet.description}
        </span>
      </div>

      {/* Code Editor Styled Pre Container */}
      <div className="relative bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[500px]">
        <pre className="leading-relaxed">
          {lines.map((line, idx) => (
            <div key={idx} className="flex hover:bg-slate-900/60 px-2 rounded">
              <span className="w-10 select-none text-right pr-4 text-slate-600 text-[11px] font-sans">
                {idx + 1}
              </span>
              <span className={`flex-1 ${
                line.startsWith('--') || line.startsWith('//')
                  ? 'text-slate-500 italic'
                  : line.includes('CREATE TABLE') || line.includes('ALTER TABLE') || line.includes('export interface')
                  ? 'text-indigo-400 font-bold'
                  : line.includes('CHECK') || line.includes('CONSTRAINT') || line.includes('POLICY')
                  ? 'text-amber-300'
                  : line.includes('TEXT') || line.includes('UUID') || line.includes('TIMESTAMPTZ') || line.includes('string') || line.includes('number')
                  ? 'text-sky-300'
                  : 'text-slate-300'
              }`}>
                {line || ' '}
              </span>
            </div>
          ))}
        </pre>
      </div>

      {/* Code Panel Footer */}
      <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>Production SQL schemas strictly audited with PostgreSQL constraints & RLS</span>
        </div>
        <button
          onClick={handleCopy}
          className="font-bold text-indigo-600 hover:underline"
        >
          Quick Copy Entire File
        </button>
      </div>
    </div>
  );
};
