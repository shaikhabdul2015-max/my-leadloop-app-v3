import { 
  UserProfile, 
  Workspace, 
  Subscription, 
  PipelineStage, 
  Lead, 
  Followup, 
  LeadActivity, 
  LeadMessage, 
  AIFollowUpRequest, 
  AIFollowUpResponse,
  PlanType,
  TaskItem,
  AutomationRule,
  WorkspaceMember,
  OmnichannelIntegration,
  AuditLog,
  ConversationAnalysis,
  FollowupSequence,
  AskLeadLoopResponse,
  Battlecard,
  ScoreHistory,
  CompetitorMention,
  Cadence,
  OmnichannelMessage,
  Forecast,
  TranscriptionResult,
  CommandExecutionResult,
  CommandBarActionProposal,
  CadenceStep,
  AIRevenuePrediction,
  QuotaNotice,
  LeadActivityLog,
  ActivityLogChannel
} from '../types';

export interface WorkspaceDataResponse {
  profile: UserProfile;
  workspace: Workspace;
  subscription: Subscription;
  team_members: WorkspaceMember[];
  stages: PipelineStage[];
  leads: Lead[];
  followups: Followup[];
  activities: LeadActivity[];
  messages: LeadMessage[];
  tasks: TaskItem[];
  automations: AutomationRule[];
  integrations: OmnichannelIntegration[];
  audit_logs: AuditLog[];
  battlecards?: Battlecard[];
  score_history?: ScoreHistory[];
  competitor_mentions?: CompetitorMention[];
  cadences?: Cadence[];
  omnichannel_messages?: OmnichannelMessage[];
  forecast?: Forecast;
}

export const api = {
  async getWorkspaceData(): Promise<WorkspaceDataResponse> {
    const res = await fetch('/api/workspace-data');
    if (!res.ok) throw new Error('Failed to load workspace data');
    return res.json();
  },

  async createLead(leadData: Partial<Lead>): Promise<Lead> {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create lead');
    }
    return res.json();
  },

  async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    });
    if (!res.ok) throw new Error('Failed to update lead');
    return res.json();
  },

  async deleteLead(id: string): Promise<void> {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete lead');
  },

  async createFollowup(data: Partial<Followup>): Promise<Followup> {
    const res = await fetch('/api/followups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to schedule follow-up');
    return res.json();
  },

  async updateFollowup(id: string, data: Partial<Followup>): Promise<Followup> {
    const res = await fetch(`/api/followups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update follow-up');
    return res.json();
  },

  async generateFollowup(request: AIFollowUpRequest): Promise<{
    success: boolean;
    is_draft: boolean;
    data: AIFollowUpResponse;
    usage: { used: number; limit: number };
    quota_notice?: QuotaNotice;
  }> {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('leadloop_auth_token') || 'demo-token-user-demo-1')
      : 'demo-token-user-demo-1';

    const res = await fetch('/api/generate-followup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'AI follow-up generation failed');
    }
    return res.json();
  },

  // Conversation Intelligence
  async analyzeConversation(leadId: string, conversationText: string, notes?: string): Promise<{
    analysis: ConversationAnalysis;
    updated_lead: Lead;
    quota_notice?: QuotaNotice;
  }> {
    const res = await fetch('/api/analyze-conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId, conversation_text: conversationText, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Conversation analysis failed');
    }
    return res.json();
  },

  // AI Sequence Generation
  async generateSequence(leadId: string, durationDays: number, channel?: string): Promise<{ sequence: FollowupSequence }> {
    const res = await fetch('/api/generate-sequence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId, duration_days: durationDays, channel }),
    });
    if (!res.ok) throw new Error('Failed to generate sequence');
    return res.json();
  },

  // Ask LeadLoop Assistant
  async askLeadLoop(query: string): Promise<AskLeadLoopResponse> {
    const res = await fetch('/api/ask-leadloop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('Failed to query AI assistant');
    return res.json();
  },

  // AI Command Bar execution
  async executeCommand(
    command: string, 
    confirmed = false, 
    proposalItems: CommandBarActionProposal['items'] = []
  ): Promise<CommandExecutionResult> {
    const res = await fetch('/api/command-execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, confirmed, proposal_items: proposalItems }),
    });
    if (!res.ok) throw new Error('Command execution failed');
    return res.json();
  },

  // Task API
  async createTask(taskData: Partial<TaskItem>): Promise<TaskItem> {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(id: string, data: Partial<TaskItem>): Promise<TaskItem> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  // Automation API
  async toggleAutomation(id: string, isActive: boolean): Promise<AutomationRule> {
    const res = await fetch(`/api/automations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) throw new Error('Failed to toggle automation');
    return res.json();
  },

  async saveOnboarding(data: {
    full_name: string;
    business_type: string;
    product_description: string;
    preferred_tone: string;
    workspace_name: string;
  }): Promise<{ profile: UserProfile; workspace: Workspace }> {
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save onboarding');
    return res.json();
  },

  async upgradePlan(plan: PlanType): Promise<{ subscription: Subscription }> {
    const res = await fetch('/api/subscription/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) throw new Error('Failed to upgrade subscription');
    return res.json();
  },

  async resetDemoData(): Promise<void> {
    const res = await fetch('/api/reset-demo', {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset demo data');
  },

  // Enterprise Server-Side Score Decay
  async triggerScoreDecay(inactivityThresholdDays = 4, decayPercent = 5): Promise<{
    decayed_count: number;
    decayed_leads: Lead[];
    score_history: ScoreHistory[];
  }> {
    const res = await fetch('/api/score-decay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inactivity_threshold_days: inactivityThresholdDays,
        decay_percent_per_day: decayPercent,
      }),
    });
    if (!res.ok) throw new Error('Failed to run score decay engine');
    return res.json();
  },

  // Score History
  async getScoreHistory(leadId?: string): Promise<{ history: ScoreHistory[] }> {
    const url = leadId ? `/api/score-history?lead_id=${encodeURIComponent(leadId)}` : '/api/score-history';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch score history');
    return res.json();
  },

  // AI Predictive Revenue Forecast
  async getForecast(): Promise<{
    forecast: Forecast;
    insufficient_data: boolean;
    deals_breakdown: Array<{
      id: string;
      name: string;
      stage: string;
      deal_value: number;
      probability: number;
      probable_value: number;
    }>;
  }> {
    const res = await fetch('/api/forecast');
    if (!res.ok) throw new Error('Failed to load forecast data');
    return res.json();
  },

  // Period-Specific AI Revenue Predictions (Production Table Integration)
  async getRevenuePredictions(targetMonth?: string): Promise<{ predictions: AIRevenuePrediction[] }> {
    const url = targetMonth ? `/api/ai-revenue-predictions?target_month=${encodeURIComponent(targetMonth)}` : '/api/ai-revenue-predictions';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load AI revenue predictions');
    return res.json();
  },

  async createRevenuePrediction(data: Partial<AIRevenuePrediction>): Promise<{ prediction: AIRevenuePrediction }> {
    const res = await fetch('/api/ai-revenue-predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save AI revenue prediction');
    return res.json();
  },

  // Competitor Intelligence & Detection
  async detectCompetitor(text: string, leadId?: string, source = 'manual_input'): Promise<{
    detected: boolean;
    mention?: CompetitorMention;
    battlecard?: Battlecard;
    message?: string;
  }> {
    const res = await fetch('/api/competitor/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lead_id: leadId, source }),
    });
    if (!res.ok) throw new Error('Failed to detect competitor');
    return res.json();
  },

  // Battlecards
  async getBattlecards(): Promise<{ battlecards: Battlecard[] }> {
    const res = await fetch('/api/battlecards');
    if (!res.ok) throw new Error('Failed to fetch battlecards');
    return res.json();
  },

  async saveBattlecard(cardData: Partial<Battlecard>): Promise<{ battlecard: Battlecard }> {
    const res = await fetch('/api/battlecards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData),
    });
    if (!res.ok) throw new Error('Failed to save battlecard');
    return res.json();
  },

  // Omnichannel Cadences
  async getCadences(leadId?: string): Promise<{ cadences: Cadence[] }> {
    const url = leadId ? `/api/cadences?lead_id=${encodeURIComponent(leadId)}` : '/api/cadences';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch cadences');
    return res.json();
  },

  async createCadence(data: { lead_id: string; name: string; steps: CadenceStep[] }): Promise<{ cadence: Cadence }> {
    const res = await fetch('/api/cadences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create cadence');
    return res.json();
  },

  async triggerCadenceFallbacks(): Promise<{ 
    triggered_count: number; 
    triggered_items: Array<{ step_id: string; fallback_channel: string; reason: string }> 
  }> {
    const res = await fetch('/api/cadences/trigger-fallbacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to trigger cadence fallbacks');
    return res.json();
  },

  // Idempotent Omnichannel Messages
  async sendOmnichannelMessage(data: {
    lead_id: string;
    cadence_id?: string;
    channel: string;
    message: string;
    idempotency_key: string;
  }): Promise<{ message: OmnichannelMessage; duplicate_prevented: boolean }> {
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send omnichannel message');
    return res.json();
  },

  // Audio / Speech-to-Text Pipeline
  async transcribeAudio(
    transcriptText: string,
    leadId?: string,
    durationSeconds = 60
  ): Promise<{ transcription: TranscriptionResult }> {
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript_text: transcriptText,
        lead_id: leadId,
        duration_seconds: durationSeconds,
      }),
    });
    if (!res.ok) throw new Error('Failed to transcribe audio');
    return res.json();
  },

  // Lead Activity Logs (Audited Execution Trail)
  async getLeadActivityLogs(leadId: string): Promise<{ success: boolean; lead_id: string; count: number; data: LeadActivityLog[] }> {
    const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/activity-logs`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('leadloop_token') || 'demo-token-user-demo-1'}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch lead activity logs');
    }
    return res.json();
  },

  async logLeadActivity(leadId: string, data: {
    agent_name?: string;
    channel: ActivityLogChannel;
    message_body: string;
    executed_at?: string;
  }): Promise<{ success: boolean; duplicate_prevented?: boolean; data: LeadActivityLog }> {
    const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/activity-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('leadloop_token') || 'demo-token-user-demo-1'}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to log lead activity');
    }
    return res.json();
  },
};
