-- ==============================================================================
-- Migration: Lead Activity Logs Table & Row Level Security (RLS)
-- File: 20261024020000_lead_activity_logs.sql
-- ==============================================================================

-- 1. Create table public.lead_activity_logs
CREATE TABLE IF NOT EXISTS public.lead_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'phone', 'sms')),
    message_body TEXT NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add indexes on lead_id and executed_at for high-performance timeline queries
CREATE INDEX IF NOT EXISTS idx_lead_activity_logs_lead_id 
    ON public.lead_activity_logs(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_activity_logs_executed_at 
    ON public.lead_activity_logs(executed_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.lead_activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. SECURITY & OWNERSHIP MODEL DOCUMENTATION:
-- In LeadLoop AI, leads belong to workspaces (leads.workspace_id).
-- Users access data based on their verified membership in the workspace
-- (checked via public.workspace_members and public.is_workspace_member(workspace_id)).
--
-- auth.uid() alone DOES NOT prove lead ownership, because leads are multi-tenant
-- workspace-level assets shared among authorized team members with roles (owner, admin, member).
--
-- Therefore, policies join against public.leads and verify workspace membership.
-- Unrestricted policies such as "WITH CHECK (true)" are strictly forbidden.

-- 5. RLS Policy for Reading Lead Activity Logs
CREATE POLICY "Workspace members can view lead activity logs"
    ON public.lead_activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.leads l
            WHERE l.id = lead_activity_logs.lead_id
              AND public.is_workspace_member(l.workspace_id)
        )
    );

-- 6. RLS Policy for Inserting Lead Activity Logs
CREATE POLICY "Workspace members can insert lead activity logs"
    ON public.lead_activity_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.leads l
            WHERE l.id = lead_activity_logs.lead_id
              AND public.is_workspace_member(l.workspace_id)
        )
    );

-- 7. Add helpful column comments for schema introspection
COMMENT ON TABLE public.lead_activity_logs IS 'Audit log of verified executed sales interactions (email, whatsapp, phone, sms) linked to leads.';
COMMENT ON COLUMN public.lead_activity_logs.agent_name IS 'Full name of the sales representative or AI agent executing the communication.';
COMMENT ON COLUMN public.lead_activity_logs.channel IS 'Channel over which communication was executed. Allowed: email, whatsapp, phone, sms.';
COMMENT ON COLUMN public.lead_activity_logs.message_body IS 'Full text or summary of the message executed or discussed.';
COMMENT ON COLUMN public.lead_activity_logs.executed_at IS 'Timestamp when the communication genuinely took place.';
