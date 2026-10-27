-- ==============================================================================
-- LeadLoop AI: Production-Grade Enterprise Upgrade Migration
-- Migration: 20260927000000_enterprise_upgrade.sql
-- ==============================================================================

-- 1. Upgrade LEADS table with behavioral attributes and organization_id alias
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS intent_score INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS sentiment_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS probability_score INTEGER DEFAULT 40,
  ADD COLUMN IF NOT EXISTS risk_status TEXT DEFAULT 'HEALTHY' CHECK (risk_status IN ('HEALTHY', 'WATCH', 'AT_RISK', 'CRITICAL')),
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Sync organization_id with workspace_id if null
UPDATE public.leads SET organization_id = workspace_id WHERE organization_id IS NULL;

-- 2. ACTIVITIES Table (Behavioral Signals & Omnichannel Events)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'crm',
    metadata JSONB DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SCORE HISTORY Table (Auditable scoring changes & decay logs)
CREATE TABLE IF NOT EXISTS public.score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    previous_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    change_amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    activity_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FORECAST Table (Predictive revenue forecasting records)
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

-- 5. COMPETITOR MENTIONS Table (Deal Doctor Intelligence)
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

-- 6. BATTLECARDS Table (Database-driven competitor counter-strategies)
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

-- 7. CADENCES Table (Omnichannel campaign sequences)
CREATE TABLE IF NOT EXISTS public.cadences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CADENCE STEPS Table (Multi-step actions with fallback channels)
CREATE TABLE IF NOT EXISTS public.cadence_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cadence_id UUID NOT NULL REFERENCES public.cadences(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'linkedin', 'call', 'sms')),
    delay INTEGER NOT NULL DEFAULT 24, -- delay in hours
    message_template TEXT NOT NULL,
    fallback_channel TEXT CHECK (fallback_channel IN ('whatsapp', 'email', 'linkedin', 'call', 'sms')),
    fallback_after_hours INTEGER DEFAULT 24,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'sent', 'fallback_triggered', 'skipped', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MESSAGES Table (Idempotent delivery tracking & fallback status)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_lead ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_score_history_lead ON public.score_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_forecast_org ON public.forecast(organization_id);
CREATE INDEX IF NOT EXISTS idx_comp_mentions_lead ON public.competitor_mentions(lead_id);
CREATE INDEX IF NOT EXISTS idx_cadences_lead ON public.cadences(lead_id);
CREATE INDEX IF NOT EXISTS idx_cadence_steps_cad ON public.cadence_steps(cadence_id);
CREATE INDEX IF NOT EXISTS idx_omni_messages_idemp ON public.omnichannel_messages(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_leads_risk_status ON public.leads(risk_status);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battlecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omnichannel_messages ENABLE ROW LEVEL SECURITY;

-- Workspace-scoped RLS policies
CREATE POLICY "Workspace members can access activities"
    ON public.activities FOR ALL USING (public.is_workspace_member(organization_id));

CREATE POLICY "Workspace members can access score history"
    ON public.score_history FOR ALL USING (public.is_workspace_member(organization_id));

CREATE POLICY "Workspace members can access forecast"
    ON public.forecast FOR ALL USING (public.is_workspace_member(organization_id));

CREATE POLICY "Workspace members can access competitor mentions"
    ON public.competitor_mentions FOR ALL USING (public.is_workspace_member(organization_id));

CREATE POLICY "Workspace members can access battlecards"
    ON public.battlecards FOR ALL USING (organization_id IS NULL OR public.is_workspace_member(organization_id));

CREATE POLICY "Workspace members can access cadences"
    ON public.cadences FOR ALL USING (public.is_workspace_member(organization_id));

CREATE POLICY "Workspace members can access cadence steps"
    ON public.cadence_steps FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.cadences c
            WHERE c.id = cadence_id AND public.is_workspace_member(c.organization_id)
        )
    );

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
        SELECT id, organization_id, priority_score, last_contacted_at, updated_at
        FROM public.leads 
        WHERE status = 'active'
    LOOP
        -- Calculate inactive days based on last_contacted_at or updated_at
        days_inactive := EXTRACT(DAY FROM (NOW() - COALESCE(lead_rec.last_contacted_at, lead_rec.updated_at)));
        
        -- Threshold: 4+ consecutive days of inactivity
        IF days_inactive >= 4 AND lead_rec.priority_score > 0 THEN
            decay_days := days_inactive - 3;
            -- 5% decay per inactive day after 4 days threshold
            decay_factor := POWER(0.95, decay_days);
            new_calculated_score := GREATEST(0, ROUND(lead_rec.priority_score * decay_factor));

            IF new_calculated_score < lead_rec.priority_score THEN
                -- Insert into score history
                INSERT INTO public.score_history (
                    organization_id,
                    lead_id,
                    previous_score,
                    new_score,
                    change_amount,
                    reason,
                    activity_type
                ) VALUES (
                    lead_rec.organization_id,
                    lead_rec.id,
                    lead_rec.priority_score,
                    new_calculated_score,
                    new_calculated_score - lead_rec.priority_score,
                    format('Score decayed by 5%% per day due to %s days of inactivity', days_inactive),
                    'score_decay'
                );

                -- Update lead score & risk status
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
-- SEED INITIAL BATTLECARDS
-- ==============================================================================
INSERT INTO public.battlecards (competitor, objection, suggested_response, differentiation, discovery_questions, recommended_action, enabled)
VALUES 
(
  'Salesforce',
  'We are already heavily invested in Salesforce and looking at their built-in Einstein AI features.',
  'Salesforce Einstein is powerful for global enterprises with 1,000+ reps, but requires months of custom Apex development, $150+/seat consulting, and complex prompt setup. LeadLoop AI activates immediately with WhatsApp-first native workflows, instant deal doctoring, and zero configuration lag.',
  'Ultra-fast onboarding (<5 mins vs 6 months), native WhatsApp & Indian regional sales cadence support, zero complex administrative overhead, and fraction of total cost of ownership.',
  ARRAY['How long does your team currently spend updating fields in Salesforce daily?', 'Are your reps getting real-time WhatsApp response alerts and automated draft responses from Einstein?'],
  'Offer a 7-day side-by-side trial with a single sales pod to prove 3x faster response times.',
  TRUE
),
(
  'HubSpot',
  'We use HubSpot CRM for our inbound marketing and email sequences.',
  'HubSpot is fantastic for top-of-funnel inbound forms and email sequences, but when buyers go quiet on email, reps are stranded. LeadLoop AI provides intelligent omnichannel fallback—if an email or WhatsApp is unread within 24 hours, it dynamically routes follow-ups without manual rep intervention.',
  'True multi-channel fallback automation (WhatsApp -> Email -> LinkedIn), AI behavioral momentum scoring, and automated objection battlecards.',
  ARRAY['What is your email open rate on second and third follow-ups?', 'How do your reps currently follow up with prospects who prefer WhatsApp over email?'],
  'Demonstrate LeadLoop omnichannel cadence generator comparing standard HubSpot email vs multi-channel rescue sequence.',
  TRUE
),
(
  'Zoho',
  'Zoho CRM is significantly cheaper and offers an all-in-one suite for our business.',
  'While Zoho offers a broad bundle of applications, sales teams frequently report high friction, cluttered UI, and rudimentary Zia AI suggestions that lack real deal context. LeadLoop AI is laser-focused on deal velocity: proactive who-to-call intelligence, automated transcripts digestion, and high-converting message generation.',
  'Modern zero-clutter user experience, deeper conversation context extraction, predictive close forecasting, and tailored Indian SMB workflows.',
  ARRAY['How often do your sales reps actually use Zia AI suggestions in Zoho?', 'Do you have automated score decay alerting you when a high-value prospect has cooled off for 4+ days?'],
  'Highlight our AI Deal Doctor analysis and automated score decay alerts.',
  TRUE
),
(
  'Pipedrive',
  'We love Pipedrive for its simple kanban board layout.',
  'Pipedrive has a clean visual pipeline, but it is purely passive—it requires reps to manually remember to move cards and write every follow-up. LeadLoop AI is an active Sales Command Center that continuously audits deal health, predicts close values, flags competitor risks, and drafts the exact follow-up message.',
  'Proactive AI Sales Command Center vs passive visual board, built-in competitor detection, automated multi-channel sequences, and AI predictive revenue forecasting.',
  ARRAY['How many deals slipped through the cracks last month because a rep forgot to follow up?', 'Does Pipedrive automatically calculate close confidence based on buyer sentiment?'],
  'Walk through the AI Sales Command Center dashboard showing automated At-Risk and Losing Momentum flags.',
  TRUE
),
(
  'Microsoft Dynamics',
  'Our enterprise IT department mandates Microsoft Dynamics 365 for compliance.',
  'Dynamics 365 offers deep ERP integration, but frontline sales reps find it heavy, slow on mobile, and complex for rapid lead follow-up. LeadLoop AI serves as a high-velocity sales engagement acceleration layer that keeps reps productive while maintaining full audit logging.',
  'Agile sales execution speed, instant mobile responsiveness, native WhatsApp conversation intelligence, and intuitive AI copilot.',
  ARRAY['How compliant are reps with logging daily follow-ups in Dynamics?', 'Can your reps generate a personalized follow-up in under 5 seconds from their phone?'],
  'Demonstrate our Command Bar and 1-click sequence generator for high-velocity sales reps.',
  TRUE
)
ON CONFLICT DO NOTHING;
