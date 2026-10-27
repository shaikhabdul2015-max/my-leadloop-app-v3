export type ToneOption = 
  | 'professional'
  | 'friendly'
  | 'professional-friendly'
  | 'casual'
  | 'short'
  | 'persuasive';

export type ChannelOption = 'whatsapp' | 'email' | 'call' | 'sms' | 'linkedin';

export type OmnichannelType = 'email' | 'whatsapp' | 'sms' | 'webchat' | 'instagram' | 'facebook';

export type LeadStatus = 'active' | 'won' | 'lost' | 'archived';

export type PriorityLevel = 'low' | 'medium' | 'high';

export type LeadScoreCategory = 'HOT' | 'WARM' | 'COLD';

export type RiskLevel = 'low' | 'medium' | 'high';

export type RiskStatus = 'HEALTHY' | 'WATCH' | 'AT_RISK' | 'CRITICAL';

export type BehavioralSignalType =
  | 'website_visit'
  | 'pricing_page_visit'
  | 'email_open'
  | 'email_click'
  | 'email_reply'
  | 'link_click'
  | 'demo_request'
  | 'meeting_booked'
  | 'meeting_attended'
  | 'meeting_no_show'
  | 'document_view'
  | 'whatsapp_message'
  | 'whatsapp_reply'
  | 'linkedin_engagement'
  | 'call_completed'
  | 'call_missed'
  | 'form_submission'
  | 'competitor_mention'
  | 'score_decay';

export type ActivityType = 
  | 'call' 
  | 'email' 
  | 'whatsapp' 
  | 'sms'
  | 'meeting' 
  | 'note' 
  | 'followup' 
  | 'status_change'
  | 'ai_analysis'
  | 'task_completed'
  | 'sequence_started';

export type FollowupStatus = 'pending' | 'completed' | 'cancelled' | 'overdue';

export type PlanType = 'free' | 'pro' | 'business' | 'agency';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  business_type: string;
  product_description: string;
  preferred_tone: ToneOption;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  ai_generations_used: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatar_url?: string;
  created_at: string;
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  color: string;
  created_at?: string;
}

export interface Pipeline {
  id: string;
  workspace_id: string;
  name: string;
  stages: PipelineStage[];
  created_at?: string;
}

export interface LeadScoreFactor {
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  points: number;
  description: string;
}

export interface LeadMemory {
  customer_needs: string[];
  pain_points: string[];
  preferences: string[];
  objections: string[];
  budget?: string;
  timeline?: string;
  decision_maker?: string;
  competitors?: string[];
  important_notes?: string;
  last_analyzed_at?: string;
}

export interface Lead {
  id: string;
  workspace_id: string;
  organization_id?: string; // Supabase multi-tenant alias
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  service: string;
  deal_value: number;
  currency: string;
  stage_id: string;
  status: LeadStatus;
  last_contacted_at: string | null;
  last_activity_at?: string | null;
  next_followup_at: string | null;
  notes: string;
  priority: PriorityLevel;
  priority_score?: number | null;
  score_category?: LeadScoreCategory | null;
  temperature?: LeadScoreCategory | null;
  score_reason?: string | null;
  score_factors?: LeadScoreFactor[];
  intent_score?: number; // 0 - 100
  engagement_score?: number; // 0 - 100
  sentiment_score?: number; // -100 to 100
  probability_score?: number; // 0 - 100% close probability
  ai_close_probability?: number | null; // 0 - 100% close probability (audited)
  message_draft?: string | null;
  next_followup_date?: string | null;
  dynamic_sentiment?: 'positive' | 'neutral' | 'negative' | null;
  competitor_tracks?: string[];
  risk_status?: RiskStatus; // 'HEALTHY' | 'WATCH' | 'AT_RISK' | 'CRITICAL'
  risk_level?: RiskLevel;
  risk_reasons?: string[];
  score_updated_at?: string;
  ai_prediction_updated_at?: string | null;
  buying_intent?: 'high' | 'medium' | 'low';
  memory?: LeadMemory;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  workspace_id: string;
  lead_id: string;
  type: ActivityType;
  content: string;
  channel?: ChannelOption | string;
  created_at: string;
}

export type ActivityLogChannel = 'email' | 'whatsapp' | 'phone' | 'sms';

export interface LeadActivityLog {
  id: string;
  lead_id: string;
  agent_name: string;
  channel: ActivityLogChannel;
  message_body: string;
  executed_at: string;
}

export interface Followup {
  id: string;
  workspace_id: string;
  lead_id: string;
  scheduled_at: string;
  status: FollowupStatus;
  message: string;
  channel: ChannelOption;
  ai_generated: boolean;
  ai_intent?: string;
  ai_reason?: string;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
  // Hydrated helper
  lead?: Lead;
}

export interface LeadMessage {
  id: string;
  workspace_id: string;
  lead_id: string;
  followup_id?: string | null;
  content: string;
  channel: ChannelOption;
  direction: 'inbound' | 'outbound';
  created_at: string;
}

export interface ConversationAnalysis {
  id: string;
  workspace_id: string;
  lead_id: string;
  intent: 'high' | 'medium' | 'low';
  buying_stage: 'awareness' | 'consideration' | 'decision' | 'negotiation';
  objection: string;
  decision_maker: string;
  competitor_mentioned: boolean;
  customer_needs: string[];
  next_step: string;
  recommended_followup_days: number;
  summary: string;
  transcript?: string;
  quota_notice?: QuotaNotice;
  created_at: string;
}

export interface SequenceStep {
  day: number;
  title: string;
  objective: string;
  channel: ChannelOption;
  message: string;
  status: 'draft' | 'approved' | 'scheduled' | 'sent';
}

export interface FollowupSequence {
  id: string;
  workspace_id: string;
  lead_id: string;
  name: string;
  duration_days: number;
  status: 'active' | 'completed' | 'paused';
  steps: SequenceStep[];
  created_at: string;
}

export interface AutomationRule {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  trigger_type: 'stage_change' | 'inactivity_days' | 'deal_negotiating' | 'followup_overdue';
  condition: {
    stage_id?: string;
    days?: number;
    min_deal_value?: number;
  };
  action_type: 'schedule_followup' | 'create_recommendation' | 'increase_priority' | 'send_notification';
  action_config: {
    delay_days?: number;
    channel?: ChannelOption;
    message_note?: string;
  };
  is_active: boolean;
  executions_count: number;
  last_executed_at?: string;
}

export interface TaskItem {
  id: string;
  workspace_id: string;
  lead_id?: string;
  title: string;
  description?: string;
  due_date: string;
  priority: PriorityLevel;
  status: TaskStatus;
  assigned_to?: string;
  is_ai_recommended?: boolean;
  created_at: string;
}

export interface OmnichannelIntegration {
  id: string;
  channel: OmnichannelType;
  name: string;
  connected: boolean;
  status_label: string;
  configured_at?: string;
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  user_name: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  workspace_id: string;
  plan: PlanType;
  status: 'active' | 'past_due' | 'canceled';
  ai_generations_used: number;
  ai_limit: number;
  lead_limit: number;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface AIFollowUpRequest {
  lead_id?: string;
  leadId?: string;
  lead_name?: string;
  company?: string;
  service?: string;
  deal_value?: number;
  stage?: string;
  last_contacted_at?: string | null;
  last_message?: string;
  notes?: string;
  tone?: ToneOption;
  channel?: ChannelOption;
  memory?: LeadMemory;
}

export interface QuotaNotice {
  is_quota_exceeded: boolean;
  message: string;
  engine_fallback: boolean;
  model?: string;
  suggestion?: string;
}

export interface AIFollowUpResponse {
  lead_intent: 'interested' | 'evaluating' | 'price_sensitive' | 'hesitant' | 'ready_to_buy' | 'unresponsive' | string;
  recommended_action: 'follow_up' | 'send_proposal' | 'offer_demo' | 'check_in' | 're_engage' | string;
  urgency: 'low' | 'medium' | 'high';
  follow_up_after_days: number;
  reason: string;
  suggested_channel: ChannelOption;
  message: string;
  subject?: string | null;
  body?: string;
  is_draft?: boolean;
  status?: 'draft' | 'sent';
  quota_notice?: QuotaNotice;
}

export interface SmartRecommendation {
  lead_id: string;
  should_follow_up: boolean;
  when_text: string;
  reason: string;
  suggested_channel: ChannelOption;
  urgency: 'low' | 'medium' | 'high';
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  lead_id?: string;
  type: 'due' | 'overdue' | 'inactive' | 'scheduled' | 'system' | 'high_priority' | 'at_risk' | 'task_due';
  read: boolean;
  created_at: string;
}

export interface AskLeadLoopResponse {
  answer: string;
  related_lead_ids?: string[];
  suggested_actions?: {
    label: string;
    action_type: 'view_lead' | 'generate_message' | 'filter_leads' | 'schedule_followup';
    lead_id?: string;
  }[];
}

export interface CommandBarActionProposal {
  description: string;
  items: {
    lead_id: string;
    lead_name: string;
    recommended_date: string;
    channel: ChannelOption;
    message_preview: string;
  }[];
}

export interface CommandExecutionResult {
  requires_confirmation?: boolean;
  message?: string;
  interpretation?: string;
  intent_type?: 'filter_leads' | 'batch_action' | 'navigation' | 'ai_draft' | 'unknown' | string;
  write_proposal?: CommandBarActionProposal;
  results?: Array<{ lead_id: string; success: boolean; action: string }>;
  action_summary?: string;
  leads?: Lead[];
  matched_leads?: Lead[];
}

// Enterprise Behavioral Activity & Score History
export interface Activity {
  id: string;
  organization_id: string;
  lead_id: string;
  activity_type: BehavioralSignalType | ActivityType | string;
  source: string;
  metadata?: Record<string, any>;
  occurred_at: string;
  created_at: string;
}

export interface ScoreHistory {
  id: string;
  organization_id: string;
  lead_id: string;
  previous_score: number;
  new_score: number;
  change_amount: number;
  reason: string;
  source?: string;
  activity_type?: string;
  created_at: string;
}

// Multi-tenant Period-Specific AI Revenue Prediction Record
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
}

// AI Predictive Revenue Forecast
export interface ForecastBreakdownItem {
  name: string;
  lead_count: number;
  pipeline_value: number;
  weighted_value: number;
  probable_value: number;
}

export interface Forecast {
  id: string;
  organization_id: string;
  forecast_value: number; // AI Probable Close Value
  pipeline_value: number;
  weighted_pipeline: number;
  confidence: number; // 0 - 100%
  methodology: string;
  metadata: {
    conservative_value: number;
    best_case_value: number;
    win_rate_percentage: number;
    signals: string[];
    breakdowns?: {
      by_stage: ForecastBreakdownItem[];
      by_rep: ForecastBreakdownItem[];
      by_source: ForecastBreakdownItem[];
      by_month: { month: string; value: number }[];
    };
  };
  calculated_at: string;
}

// Deal Doctor Competitor Intelligence & Battlecards
export interface CompetitorMention {
  id: string;
  organization_id: string;
  lead_id: string;
  competitor: string;
  context: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0 - 100%
  source: string;
  objection?: string;
  created_at: string;
}

export interface Battlecard {
  id: string;
  organization_id?: string;
  competitor: string;
  objection: string;
  suggested_response: string;
  differentiation: string;
  discovery_questions: string[];
  recommended_action: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Omnichannel Cadences & Messages
export interface Cadence {
  id: string;
  organization_id: string;
  lead_id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
  steps?: CadenceStep[];
}

export interface CadenceStep {
  id: string;
  cadence_id: string;
  step_number: number;
  channel: ChannelOption;
  delay: number; // in hours or days
  message_template: string;
  fallback_channel?: ChannelOption;
  fallback_after_hours?: number;
  status: 'pending' | 'executing' | 'sent' | 'fallback_triggered' | 'skipped' | 'completed' | 'failed';
  created_at: string;
}

export interface OmnichannelMessage {
  id: string;
  organization_id: string;
  lead_id: string;
  cadence_id?: string | null;
  cadence_step_id?: string | null;
  channel: ChannelOption;
  message: string;
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed' | 'skipped' | 'fallback_triggered';
  provider_message_id?: string;
  idempotency_key: string;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  replied_at?: string | null;
  failed_at?: string | null;
  created_at: string;
}

// Conversation Context Layer
export interface ConversationContext {
  lead_id: string;
  lead_name: string;
  company?: string;
  deal_value?: number;
  stage_name?: string;
  risk_status?: RiskStatus;
  key_needs: string[];
  known_objections: string[];
  competitor_notes: string[];
  recent_touchpoints_summary: string;
  latest_sentiment?: string;
  recommended_channel: ChannelOption;
}

export interface AIMessageDraft {
  lead_id: string;
  channel: ChannelOption;
  message: string;
  intent: string;
  reason: string;
  suggested_action: string;
  urgency: 'high' | 'medium' | 'low';
  context_summary?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
  retry?: () => void;
}

export interface TranscriptionResult {
  text: string;
  duration_seconds: number;
  confidence: number;
  provider: 'browser_speech' | 'gemini_audio' | 'whisper_api' | 'mock';
  detected_competitors?: string[];
  detected_objections?: string[];
}

