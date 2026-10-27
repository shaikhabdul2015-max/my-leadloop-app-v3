-- ==============================================================================
-- LeadLoop AI - PostgreSQL / Supabase Schema & Row-Level-Security (RLS)
-- Upgraded: AI Sales Intelligence & Follow-up Platform
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    business_type TEXT DEFAULT 'freelance',
    product_description TEXT,
    preferred_tone TEXT DEFAULT 'professional-friendly',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_generations_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORKSPACE MEMBERS
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 4. PIPELINES
CREATE TABLE IF NOT EXISTS public.pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Default Sales Pipeline',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PIPELINE STAGES
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LEADS (Upgraded with AI Scoring 2.0, Risk Attributes & Auditability)
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

-- 7. LEAD MEMORIES
CREATE TABLE IF NOT EXISTS public.lead_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID UNIQUE NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    customer_needs TEXT[] DEFAULT '{}',
    pain_points TEXT[] DEFAULT '{}',
    preferences TEXT[] DEFAULT '{}',
    objections TEXT[] DEFAULT '{}',
    budget TEXT,
    timeline TEXT,
    decision_maker TEXT,
    competitors TEXT[] DEFAULT '{}',
    important_notes TEXT,
    last_analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CONVERSATION ANALYSES
CREATE TABLE IF NOT EXISTS public.conversation_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    intent TEXT NOT NULL,
    buying_stage TEXT NOT NULL,
    objection TEXT,
    decision_maker TEXT,
    competitor_mentioned BOOLEAN DEFAULT FALSE,
    customer_needs TEXT[] DEFAULT '{}',
    next_step TEXT,
    recommended_followup_days INTEGER DEFAULT 2,
    summary TEXT NOT NULL,
    transcript TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LEAD ACTIVITIES
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    channel TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FOLLOWUPS
CREATE TABLE IF NOT EXISTS public.followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'overdue')),
    message TEXT,
    channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('email', 'whatsapp', 'call', 'sms', 'linkedin')),
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_intent TEXT,
    ai_reason TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AI FOLLOW-UP SEQUENCES
CREATE TABLE IF NOT EXISTS public.ai_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 7,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_ai_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUTOMATIONS
CREATE TABLE IF NOT EXISTS public.automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,
    condition JSONB DEFAULT '{}'::jsonb,
    action_type TEXT NOT NULL,
    action_config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    executions_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    followup_id UUID REFERENCES public.followups(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business', 'agency')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    subscription_id TEXT,
    current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_workspace ON public.leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_score_cat ON public.leads(score_category);
CREATE INDEX IF NOT EXISTS idx_leads_risk ON public.leads(risk_level);
CREATE INDEX IF NOT EXISTS idx_followups_lead ON public.followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_scheduled ON public.followups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_lead ON public.tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ws ON public.audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_priority_score ON public.leads(priority_score) WHERE priority_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_ai_close_prob ON public.leads(ai_close_probability) WHERE ai_close_probability IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_next_followup_date ON public.leads(next_followup_date) WHERE next_followup_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_dynamic_sentiment ON public.leads(dynamic_sentiment);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON public.leads(temperature);
CREATE INDEX IF NOT EXISTS idx_score_history_lead ON public.score_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_score_history_org_created ON public.score_history(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_rev_pred_org ON public.ai_revenue_predictions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_rev_pred_target_month ON public.ai_revenue_predictions(organization_id, target_month);
CREATE INDEX IF NOT EXISTS idx_ai_rev_pred_period ON public.ai_revenue_predictions(organization_id, forecast_period);
CREATE INDEX IF NOT EXISTS idx_ai_rev_pred_created_at ON public.ai_revenue_predictions(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Workspace members can access leads"
    ON public.leads FOR ALL USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can access memories"
    ON public.lead_memories FOR ALL USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can access conversation analyses"
    ON public.conversation_analyses FOR ALL USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can access tasks"
    ON public.tasks FOR ALL USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can access sequences"
    ON public.ai_sequences FOR ALL USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can access automations"
    ON public.automations FOR ALL USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Workspace members can access audit logs"
    ON public.audit_logs FOR SELECT USING (public.is_workspace_member(workspace_id));

-- ==============================================================================
-- 17. SCORE HISTORY
-- ==============================================================================
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
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can access score history"
    ON public.score_history FOR ALL USING (public.is_workspace_member(organization_id));

-- ==============================================================================
-- 18. FORECAST & PERIOD-SPECIFIC AI REVENUE PREDICTIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.forecast (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    forecast_value NUMERIC(12, 2) NOT NULL,
    pipeline_value NUMERIC(12, 2) NOT NULL,
    weighted_pipeline NUMERIC(12, 2) NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    methodology TEXT NOT NULL DEFAULT 'deal_value_times_probability',
    metadata JSONB DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.forecast ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can access forecast"
    ON public.forecast FOR ALL USING (public.is_workspace_member(organization_id));

CREATE TABLE IF NOT EXISTS public.ai_revenue_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
ALTER TABLE public.ai_revenue_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can access ai_revenue_predictions"
    ON public.ai_revenue_predictions FOR ALL USING (public.is_workspace_member(organization_id));

-- ==============================================================================
-- 19. COMPETITOR MENTIONS & BATTLECARDS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.competitor_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    competitor TEXT NOT NULL,
    context TEXT NOT NULL,
    sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    source TEXT NOT NULL DEFAULT 'note',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.competitor_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can access competitor mentions"
    ON public.competitor_mentions FOR ALL USING (public.is_workspace_member(organization_id));

CREATE TABLE IF NOT EXISTS public.battlecards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    competitor TEXT NOT NULL,
    objection TEXT NOT NULL,
    suggested_response TEXT NOT NULL,
    differentiation TEXT NOT NULL,
    discovery_questions TEXT[] DEFAULT '{}',
    recommended_action TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.battlecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can access battlecards"
    ON public.battlecards FOR ALL USING (organization_id IS NULL OR public.is_workspace_member(organization_id));

-- ==============================================================================
-- 20. CADENCES & OMNICHANNEL MESSAGES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cadences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cadences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can access cadences"
    ON public.cadences FOR ALL USING (public.is_workspace_member(organization_id));

CREATE TABLE IF NOT EXISTS public.cadence_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cadence_id UUID NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'linkedin', 'call', 'sms')),
    delay INTEGER NOT NULL DEFAULT 24,
    message_template TEXT NOT NULL,
    fallback_channel TEXT CHECK (fallback_channel IN ('whatsapp', 'email', 'linkedin', 'call', 'sms')),
    fallback_after_hours INTEGER DEFAULT 24,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'sent', 'fallback_triggered', 'skipped', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cadence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can access cadence steps"
    ON public.cadence_steps FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.cadences c
            WHERE c.id = cadence_id AND public.is_workspace_member(c.organization_id)
        )
    );

CREATE TABLE IF NOT EXISTS public.omnichannel_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    cadence_id UUID REFERENCES public.cadences(id) ON DELETE SET NULL,
    cadence_step_id UUID REFERENCES public.cadence_steps(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'linkedin', 'call', 'sms')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'replied', 'failed', 'skipped', 'fallback_triggered')),
    provider_message_id TEXT,
    idempotency_key TEXT UNIQUE NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.omnichannel_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can access omnichannel messages"
    ON public.omnichannel_messages FOR ALL USING (public.is_workspace_member(organization_id));

-- ==============================================================================
-- SCORE DECAY ENGINE: PostgreSQL Server-Side Function
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.apply_score_decay()
RETURNS INTEGER AS $$
DECLARE
    decay_count INTEGER := 0;
    lead_rec RECORD;
    days_inactive INTEGER;
    decay_days INTEGER;
    new_calculated_score INTEGER;
    decay_factor NUMERIC;
BEGIN
    FOR lead_rec IN 
        SELECT id, workspace_id, priority_score, last_contacted_at, updated_at
        FROM public.leads 
        WHERE status = 'active'
    LOOP
        days_inactive := EXTRACT(DAY FROM (NOW() - COALESCE(lead_rec.last_contacted_at, lead_rec.updated_at)));
        
        IF days_inactive >= 4 AND lead_rec.priority_score > 0 THEN
            decay_days := days_inactive - 3;
            decay_factor := POWER(0.95, decay_days);
            new_calculated_score := GREATEST(0, ROUND(lead_rec.priority_score * decay_factor));

            IF new_calculated_score < lead_rec.priority_score THEN
                INSERT INTO public.score_history (
                    organization_id,
                    lead_id,
                    previous_score,
                    new_score,
                    change_amount,
                    reason,
                    activity_type
                ) VALUES (
                    lead_rec.workspace_id,
                    lead_rec.id,
                    lead_rec.priority_score,
                    new_calculated_score,
                    new_calculated_score - lead_rec.priority_score,
                    format('Score decayed by 5%% per day due to %s days of inactivity', days_inactive),
                    'score_decay'
                );

                UPDATE public.leads SET
                    priority_score = new_calculated_score,
                    risk_status = CASE 
                        WHEN new_calculated_score < 30 THEN 'CRITICAL'
                        WHEN new_calculated_score < 50 THEN 'AT_RISK'
                        ELSE 'WATCH'
                    END,
                    score_updated_at = NOW()
                WHERE id = lead_rec.id;

                decay_count := decay_count + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN decay_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 23. LEAD ACTIVITY LOGS (Audited Communication History)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.lead_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'phone', 'sms')),
    message_body TEXT NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activity_logs_lead_id ON public.lead_activity_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activity_logs_executed_at ON public.lead_activity_logs(executed_at DESC);

ALTER TABLE public.lead_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view lead activity logs"
    ON public.lead_activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_activity_logs.lead_id
              AND public.is_workspace_member(l.workspace_id)
        )
    );

CREATE POLICY "Workspace members can insert lead activity logs"
    ON public.lead_activity_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_activity_logs.lead_id
              AND public.is_workspace_member(l.workspace_id)
        )
    );
