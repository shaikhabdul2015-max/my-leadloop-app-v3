-- ==============================================================================
-- LeadLoop AI: Production-Grade AI Scoring & Revenue Predictions Migration
-- Migration: 20260927010000_ai_scoring_and_predictions_upgrade.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. UPGRADE LEADS TABLE WITH AUDITED AI SCORING & BEHAVIORAL ATTRIBUTES
-- ------------------------------------------------------------------------------

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Safely alter columns on public.leads
ALTER TABLE public.leads
  -- Priority score: Drop hardcoded fake default 50 to allow distinguishing uncalculated leads
  ALTER COLUMN priority_score DROP DEFAULT,
  -- Add temperature column (aligned with score_category 'HOT' | 'WARM' | 'COLD')
  ADD COLUMN IF NOT EXISTS temperature TEXT,
  -- Add AI score explanation rationale
  ADD COLUMN IF NOT EXISTS score_reason TEXT,
  -- Add AI close probability (nullable without fabricated default 50)
  ADD COLUMN IF NOT EXISTS ai_close_probability INT,
  -- Add immediate working message draft scratchpad
  ADD COLUMN IF NOT EXISTS message_draft TEXT,
  -- Add next follow-up date (synchronized with existing next_followup_at)
  ADD COLUMN IF NOT EXISTS next_followup_date TIMESTAMPTZ,
  -- Add dynamic sentiment (controlled 'positive' | 'neutral' | 'negative')
  ADD COLUMN IF NOT EXISTS dynamic_sentiment TEXT DEFAULT 'neutral',
  -- Add competitor tracks array cache (normalized records live in public.competitor_mentions)
  ADD COLUMN IF NOT EXISTS competitor_tracks TEXT[] DEFAULT '{}',
  -- Add auditing timestamp for AI prediction computations
  ADD COLUMN IF NOT EXISTS ai_prediction_updated_at TIMESTAMPTZ;

-- Ensure score_updated_at exists
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ DEFAULT NOW();

-- ------------------------------------------------------------------------------
-- 2. ADD DATABASE CONSTRAINTS ON LEADS TABLE
-- ------------------------------------------------------------------------------

DO $$ 
BEGIN
  -- Constraint for priority_score (0 to 100 or NULL)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_leads_priority_score'
  ) THEN
    ALTER TABLE public.leads 
      ADD CONSTRAINT chk_leads_priority_score 
      CHECK (priority_score IS NULL OR (priority_score >= 0 AND priority_score <= 100));
  END IF;

  -- Constraint for ai_close_probability (0 to 100 or NULL)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_leads_ai_close_probability'
  ) THEN
    ALTER TABLE public.leads 
      ADD CONSTRAINT chk_leads_ai_close_probability 
      CHECK (ai_close_probability IS NULL OR (ai_close_probability >= 0 AND ai_close_probability <= 100));
  END IF;

  -- Constraint for temperature ('HOT', 'WARM', 'COLD' or NULL)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_leads_temperature'
  ) THEN
    ALTER TABLE public.leads 
      ADD CONSTRAINT chk_leads_temperature 
      CHECK (temperature IS NULL OR temperature IN ('HOT', 'WARM', 'COLD'));
  END IF;

  -- Constraint for dynamic_sentiment ('positive', 'neutral', 'negative' or NULL)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_leads_dynamic_sentiment'
  ) THEN
    ALTER TABLE public.leads 
      ADD CONSTRAINT chk_leads_dynamic_sentiment 
      CHECK (dynamic_sentiment IS NULL OR dynamic_sentiment IN ('positive', 'neutral', 'negative'));
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. SAFE NON-DESTRUCTIVE BACKFILL & SYNCHRONIZATION FOR EXISTING DATA
-- ------------------------------------------------------------------------------

-- Synchronize temperature with existing score_category
UPDATE public.leads 
SET temperature = score_category 
WHERE temperature IS NULL AND score_category IS NOT NULL;

-- Synchronize ai_close_probability with existing probability_score
UPDATE public.leads 
SET ai_close_probability = probability_score 
WHERE ai_close_probability IS NULL AND probability_score IS NOT NULL;

-- Synchronize next_followup_date with existing next_followup_at
UPDATE public.leads 
SET next_followup_date = next_followup_at 
WHERE next_followup_date IS NULL AND next_followup_at IS NOT NULL;

-- Synchronize dynamic_sentiment from existing sentiment_score if unassigned
UPDATE public.leads 
SET dynamic_sentiment = CASE 
  WHEN sentiment_score > 15 THEN 'positive'
  WHEN sentiment_score < -15 THEN 'negative'
  ELSE 'neutral'
END 
WHERE dynamic_sentiment IS NULL OR dynamic_sentiment = 'neutral';

-- Populate competitor_tracks from lead_memories if available
UPDATE public.leads l
SET competitor_tracks = m.competitors
FROM public.lead_memories m
WHERE m.lead_id = l.id 
  AND (l.competitor_tracks IS NULL OR l.competitor_tracks = '{}')
  AND m.competitors IS NOT NULL 
  AND array_length(m.competitors, 1) > 0;

-- ------------------------------------------------------------------------------
-- 4. SCORE HISTORY TABLE (AUDIT TRAIL & SCORE DECAY HISTORY)
-- ------------------------------------------------------------------------------

-- Create score_history if not existing
CREATE TABLE IF NOT EXISTS public.score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    previous_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    change_amount INTEGER NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    source TEXT DEFAULT 'leadloop_ai',
    activity_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure source and change_amount exist on pre-existing score_history tables
ALTER TABLE public.score_history
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'leadloop_ai',
  ADD COLUMN IF NOT EXISTS change_amount INTEGER DEFAULT 0;

-- Add range constraints for score history
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_score_history_previous_score') THEN
    ALTER TABLE public.score_history 
      ADD CONSTRAINT chk_score_history_previous_score 
      CHECK (previous_score >= 0 AND previous_score <= 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_score_history_new_score') THEN
    ALTER TABLE public.score_history 
      ADD CONSTRAINT chk_score_history_new_score 
      CHECK (new_score >= 0 AND new_score <= 100);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5. MULTI-TENANT AI REVENUE PREDICTIONS TABLE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_revenue_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Multi-tenant isolation: strictly linked to the workspace/organization
    organization_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL,
    target_month DATE NOT NULL DEFAULT CURRENT_DATE,
    forecast_period TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),
    raw_pipeline_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    ai_predicted_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    weighted_pipeline_value NUMERIC(12, 2) DEFAULT 0.00,
    confidence_percentage INT,
    model_version TEXT DEFAULT 'leadloop-forecast-v2',
    methodology TEXT DEFAULT 'stage_weighted_momentum',
    metadata JSONB DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add database constraints on ai_revenue_predictions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ai_rev_pred_confidence') THEN
    ALTER TABLE public.ai_revenue_predictions 
      ADD CONSTRAINT chk_ai_rev_pred_confidence 
      CHECK (confidence_percentage IS NULL OR (confidence_percentage >= 0 AND confidence_percentage <= 100));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ai_rev_pred_raw_value') THEN
    ALTER TABLE public.ai_revenue_predictions 
      ADD CONSTRAINT chk_ai_rev_pred_raw_value 
      CHECK (raw_pipeline_value >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ai_rev_pred_ai_value') THEN
    ALTER TABLE public.ai_revenue_predictions 
      ADD CONSTRAINT chk_ai_rev_pred_ai_value 
      CHECK (ai_predicted_value >= 0);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. INDEXES FOR PRODUCTION QUERY PATTERNS
-- ------------------------------------------------------------------------------

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_priority_score ON public.leads(priority_score) WHERE priority_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_ai_close_prob ON public.leads(ai_close_probability) WHERE ai_close_probability IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_next_followup_date ON public.leads(next_followup_date) WHERE next_followup_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_dynamic_sentiment ON public.leads(dynamic_sentiment);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON public.leads(temperature);

-- Indexes for score history
CREATE INDEX IF NOT EXISTS idx_score_history_lead ON public.score_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_score_history_org_created ON public.score_history(organization_id, created_at DESC);

-- Indexes for ai_revenue_predictions
CREATE INDEX IF NOT EXISTS idx_ai_rev_pred_org ON public.ai_revenue_predictions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_rev_pred_target_month ON public.ai_revenue_predictions(organization_id, target_month);
CREATE INDEX IF NOT EXISTS idx_ai_rev_pred_period ON public.ai_revenue_predictions(organization_id, forecast_period);
CREATE INDEX IF NOT EXISTS idx_ai_rev_pred_created_at ON public.ai_revenue_predictions(created_at DESC);

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_revenue_predictions ENABLE ROW LEVEL SECURITY;

-- Score History Policy
DROP POLICY IF EXISTS "Workspace members can access score history" ON public.score_history;
CREATE POLICY "Workspace members can access score history"
    ON public.score_history FOR ALL 
    USING (public.is_workspace_member(organization_id));

-- AI Revenue Predictions Policy (Workspace isolation)
DROP POLICY IF EXISTS "Workspace members can access ai_revenue_predictions" ON public.ai_revenue_predictions;
CREATE POLICY "Workspace members can access ai_revenue_predictions"
    ON public.ai_revenue_predictions FOR ALL 
    USING (public.is_workspace_member(organization_id));

-- ------------------------------------------------------------------------------
-- 8. AUTOMATIC FIELD SYNCHRONIZATION TRIGGER FUNCTION
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_lead_ai_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Synchronize temperature and score_category
  IF NEW.temperature IS NOT NULL AND (OLD.temperature IS NULL OR NEW.temperature <> OLD.temperature) THEN
    NEW.score_category := NEW.temperature;
  ELSIF NEW.score_category IS NOT NULL AND (OLD.score_category IS NULL OR NEW.score_category <> OLD.score_category) THEN
    NEW.temperature := NEW.score_category;
  END IF;

  -- Synchronize next_followup_date and next_followup_at
  IF NEW.next_followup_date IS NOT NULL AND (OLD.next_followup_date IS NULL OR NEW.next_followup_date <> OLD.next_followup_date) THEN
    NEW.next_followup_at := NEW.next_followup_date;
  ELSIF NEW.next_followup_at IS NOT NULL AND (OLD.next_followup_at IS NULL OR NEW.next_followup_at <> OLD.next_followup_at) THEN
    NEW.next_followup_date := NEW.next_followup_at;
  END IF;

  -- Synchronize ai_close_probability and probability_score
  IF NEW.ai_close_probability IS NOT NULL AND (OLD.ai_close_probability IS NULL OR NEW.ai_close_probability <> OLD.ai_close_probability) THEN
    NEW.probability_score := NEW.ai_close_probability;
    NEW.ai_prediction_updated_at := NOW();
  ELSIF NEW.probability_score IS NOT NULL AND (OLD.probability_score IS NULL OR NEW.probability_score <> OLD.probability_score) THEN
    NEW.ai_close_probability := NEW.probability_score;
    NEW.ai_prediction_updated_at := NOW();
  END IF;

  -- Audit timestamp on score update
  IF NEW.priority_score IS NOT NULL AND (OLD.priority_score IS NULL OR NEW.priority_score <> OLD.priority_score) THEN
    NEW.score_updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_lead_ai_fields ON public.leads;
CREATE TRIGGER trg_sync_lead_ai_fields
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_lead_ai_fields();
