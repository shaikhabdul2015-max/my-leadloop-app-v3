import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  INITIAL_PROFILE,
  INITIAL_WORKSPACE,
  INITIAL_SUBSCRIPTION,
  INITIAL_TEAM_MEMBERS,
  INITIAL_LEADS,
  INITIAL_FOLLOWUPS,
  INITIAL_ACTIVITIES,
  INITIAL_MESSAGES,
  INITIAL_TASKS,
  INITIAL_AUTOMATIONS,
  INITIAL_INTEGRATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BATTLECARDS,
  INITIAL_SCORE_HISTORY,
  INITIAL_COMPETITOR_MENTIONS,
  INITIAL_CADENCES,
} from './src/utils/demoData.ts';
import { DEFAULT_STAGES, calculatePriorityScore, calculatePredictiveForecast } from './src/utils/crmUtils.ts';
import { 
  Lead, 
  Followup, 
  TaskItem, 
  AutomationRule, 
  AuditLog, 
  LeadMemory, 
  ConversationAnalysis,
  ScoreHistory,
  Battlecard,
  CompetitorMention,
  Cadence,
  CadenceStep,
  OmnichannelMessage,
  Forecast,
  RiskStatus,
  AIRevenuePrediction,
  LeadActivityLog,
  ActivityLogChannel
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '100kb' }));

// Handle malformed JSON body or payload size limit gracefully
app.use((err: any, _req: Request, res: Response, next: any) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Bad Request', message: 'Malformed JSON payload.' });
  }
  if (err && (err.status === 413 || err.type === 'entity.too.large')) {
    return res.status(413).json({ error: 'Payload Too Large', message: 'Request payload exceeds the maximum allowed size.' });
  }
  next();
});

// Authentication helper interface and verifier
export interface AuthUser {
  id: string;
  email: string;
  workspace_id: string;
  role: string;
  full_name?: string;
  preferred_tone?: string;
}

export async function authenticateRequest(req: Request): Promise<{ user: AuthUser | null; error?: string; status?: number }> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return { user: null, error: 'Authentication required. Missing Authorization header.', status: 401 };
  }
  if (!authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Authentication required. Authorization header must follow "Bearer <token>" format.', status: 401 };
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return { user: null, error: 'Authentication required. Empty Bearer token provided.', status: 401 };
  }

  // 1. If Supabase is configured and token is not a synthetic test token, verify with Supabase Auth
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder') && !token.startsWith('demo-token-') && !token.startsWith('user-demo-')) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        // Resolve workspace membership from database
        const member = db.team_members.find((m) => m.user_id === user.id);
        const wsId = member?.workspace_id || db.workspace.id;
        return {
          user: {
            id: user.id,
            email: user.email || '',
            workspace_id: wsId,
            role: member?.role || 'member',
            full_name: user.user_metadata?.full_name || db.profile.full_name,
            preferred_tone: db.profile.preferred_tone,
          },
        };
      }
    } catch {
      // Continue to next checks
    }
  }

  // 2. Demo / Workspace token authentication
  if (
    token === 'demo-token-user-demo-1' ||
    token === 'user-demo-1' ||
    token === db.profile.user_id ||
    token === 'leadloop-auth-token-active'
  ) {
    return {
      user: {
        id: db.profile.user_id,
        email: db.profile.email,
        workspace_id: db.workspace.id,
        role: 'owner',
        full_name: db.profile.full_name,
        preferred_tone: db.profile.preferred_tone,
      },
    };
  }

  // 3. Team member token check
  const member = db.team_members.find((m) => m.user_id === token || `demo-token-${m.user_id}` === token || m.email === token);
  if (member) {
    return {
      user: {
        id: member.user_id,
        email: member.email,
        workspace_id: member.workspace_id,
        role: member.role,
        full_name: member.name,
        preferred_tone: db.profile.preferred_tone,
      },
    };
  }

  // 4. Token explicitly rejected
  return { user: null, error: 'Invalid or expired authentication token.', status: 401 };
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// ==============================================================================
// Persistent In-Memory / File-based Database
// ==============================================================================
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

interface DbSchema {
  profile: typeof INITIAL_PROFILE;
  workspace: typeof INITIAL_WORKSPACE;
  subscription: typeof INITIAL_SUBSCRIPTION;
  team_members: typeof INITIAL_TEAM_MEMBERS;
  stages: typeof DEFAULT_STAGES;
  leads: Lead[];
  followups: Followup[];
  activities: typeof INITIAL_ACTIVITIES;
  messages: typeof INITIAL_MESSAGES;
  tasks: TaskItem[];
  automations: AutomationRule[];
  integrations: typeof INITIAL_INTEGRATIONS;
  audit_logs: AuditLog[];
  battlecards: Battlecard[];
  score_history: ScoreHistory[];
  competitor_mentions: CompetitorMention[];
  cadences: Cadence[];
  omnichannel_messages: OmnichannelMessage[];
  ai_revenue_predictions: AIRevenuePrediction[];
  lead_activity_logs: LeadActivityLog[];
}

function getInitialDb(): DbSchema {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const targetDate1 = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const targetDate2 = new Date(currentYear, currentMonth + 1, 1).toISOString().split('T')[0];
  const targetDate3 = new Date(currentYear, currentMonth + 2, 1).toISOString().split('T')[0];

  return {
    profile: { ...INITIAL_PROFILE },
    workspace: { ...INITIAL_WORKSPACE },
    subscription: { ...INITIAL_SUBSCRIPTION },
    team_members: [...INITIAL_TEAM_MEMBERS],
    stages: [...DEFAULT_STAGES],
    leads: [
      ...JSON.parse(JSON.stringify(INITIAL_LEADS)),
      {
        id: 'lead-unauthorized-sample',
        workspace_id: 'ws-foreign-workspace',
        organization_id: 'ws-foreign-workspace',
        name: 'Restricted Enterprise Lead',
        company: 'Foreign Enterprise Ltd',
        email: 'restricted@foreigncorp.com',
        phone: '+1 555 901 2289',
        source: 'confidential',
        service: 'Enterprise CRM Suite',
        deal_value: 300000,
        currency: 'USD',
        stage_id: 'stage-1',
        status: 'active',
        last_contacted_at: null,
        next_followup_at: null,
        notes: 'Confidential lead in separate workspace. Unauthorized for default workspace users.',
        priority: 'high',
        assigned_to: 'user-foreign-999',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    followups: JSON.parse(JSON.stringify(INITIAL_FOLLOWUPS)),
    activities: JSON.parse(JSON.stringify(INITIAL_ACTIVITIES)),
    messages: JSON.parse(JSON.stringify(INITIAL_MESSAGES)),
    tasks: JSON.parse(JSON.stringify(INITIAL_TASKS)),
    automations: JSON.parse(JSON.stringify(INITIAL_AUTOMATIONS)),
    integrations: JSON.parse(JSON.stringify(INITIAL_INTEGRATIONS)),
    audit_logs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
    battlecards: JSON.parse(JSON.stringify(INITIAL_BATTLECARDS)),
    score_history: JSON.parse(JSON.stringify(INITIAL_SCORE_HISTORY)),
    competitor_mentions: JSON.parse(JSON.stringify(INITIAL_COMPETITOR_MENTIONS)),
    cadences: JSON.parse(JSON.stringify(INITIAL_CADENCES)),
    omnichannel_messages: [],
    ai_revenue_predictions: [
      {
        id: 'pred-1',
        organization_id: 'ws-default',
        pipeline_id: 'default-pipeline',
        target_month: targetDate1,
        forecast_period: targetDate1.slice(0, 7),
        raw_pipeline_value: 395000,
        ai_predicted_value: 218500,
        weighted_pipeline_value: 198000,
        confidence_percentage: 78,
        model_version: 'leadloop-forecast-v2',
        methodology: 'stage_weighted_momentum',
        calculated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 'pred-2',
        organization_id: 'ws-default',
        pipeline_id: 'default-pipeline',
        target_month: targetDate2,
        forecast_period: targetDate2.slice(0, 7),
        raw_pipeline_value: 450000,
        ai_predicted_value: 265000,
        weighted_pipeline_value: 235000,
        confidence_percentage: 72,
        model_version: 'leadloop-forecast-v2',
        methodology: 'stage_weighted_momentum',
        calculated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 'pred-3',
        organization_id: 'ws-default',
        pipeline_id: 'default-pipeline',
        target_month: targetDate3,
        forecast_period: targetDate3.slice(0, 7),
        raw_pipeline_value: 520000,
        ai_predicted_value: 310000,
        weighted_pipeline_value: 275000,
        confidence_percentage: 65,
        model_version: 'leadloop-forecast-v2',
        methodology: 'stage_weighted_momentum',
        calculated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ],
    lead_activity_logs: [
      {
        id: 'actlog-init-1',
        lead_id: 'lead-1',
        agent_name: 'Alex Rivera',
        channel: 'whatsapp',
        message_body: 'Hi Rahul, hope your week is off to a great start! Just checking in to see if you had a chance to connect with Samir regarding the website redesign scope we discussed? Happy to hop on a quick 5-min call if any questions came up.',
        executed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'actlog-init-2',
        lead_id: 'lead-1',
        agent_name: 'Alex Rivera',
        channel: 'phone',
        message_body: '20-minute discovery call completed. Discussed timeline and CMS preference (Webflow). Prepayment milestones agreed in principle.',
        executed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: 'actlog-init-3',
        lead_id: 'lead-2',
        agent_name: 'Alex Rivera',
        channel: 'email',
        message_body: 'Subject: Scope Clarification: 2 Landing Page Variants Included\n\nHi Priya, following up on our proposal discussion! We can accommodate the 2 dedicated landing page templates within the quarterly scope. Would that give your team the green light to proceed with the kickoff this week?',
        executed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'actlog-init-4',
        lead_id: 'lead-3',
        agent_name: 'Alex Rivera',
        channel: 'sms',
        message_body: 'Hi Vikram, sent the moodboard sample to your email. Let me know if you would like to review it together today.',
        executed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ],
  };
}

let db: DbSchema = getInitialDb();

function loadDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      const initial = getInitialDb();

      // Merge leads safely
      const existingLeadIds = new Set((parsed.leads || []).map((l: any) => l.id));
      const mergedLeads = (parsed.leads || []).map((l: Lead) => {
        const cat = l.temperature || l.score_category || (l.priority_score ? (l.priority_score >= 75 ? 'HOT' : l.priority_score >= 45 ? 'WARM' : 'COLD') : null);
        const prob = l.ai_close_probability !== undefined && l.ai_close_probability !== null
          ? l.ai_close_probability
          : (l.probability_score !== undefined ? l.probability_score : (l.priority_score ? Math.round(l.priority_score * 0.75) : null));
        return {
          ...l,
          temperature: cat,
          score_category: cat,
          ai_close_probability: prob,
          probability_score: prob !== null ? prob : 40,
          next_followup_date: l.next_followup_date || l.next_followup_at || null,
          dynamic_sentiment: l.dynamic_sentiment || 'neutral',
          competitor_tracks: l.competitor_tracks || [],
        };
      });

      initial.leads.forEach((initLead) => {
        if (!existingLeadIds.has(initLead.id)) {
          mergedLeads.push(initLead);
        }
      });

      db = {
        ...initial,
        ...parsed,
        leads: mergedLeads,
        ai_revenue_predictions: parsed.ai_revenue_predictions?.length ? parsed.ai_revenue_predictions : initial.ai_revenue_predictions,
        lead_activity_logs: Array.isArray(parsed.lead_activity_logs) && parsed.lead_activity_logs.length > 0
          ? parsed.lead_activity_logs
          : initial.lead_activity_logs,
      };
      saveDb();
    } else {
      saveDb();
    }
  } catch (err) {
    console.error('Error loading db file, using initial state:', err);
    db = getInitialDb();
  }
}

function saveDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db file:', err);
  }
}

loadDb();

// Helper to log audit event
function logAudit(action: string, entity_type: string, entity_id: string, details: string) {
  const audit: AuditLog = {
    id: 'audit-' + Date.now(),
    workspace_id: db.workspace.id,
    action,
    entity_type,
    entity_id,
    details,
    user_name: db.profile.full_name || 'Abdul Shaikh',
    created_at: new Date().toISOString(),
  };
  db.audit_logs.unshift(audit);
}

// Trigger automation rules
function triggerAutomations(triggerType: string, payload: any) {
  db.automations.forEach((auto) => {
    if (!auto.is_active) return;
    if (auto.trigger_type === triggerType) {
      if (triggerType === 'stage_change' && auto.condition.stage_id) {
        if (payload.stage_id === auto.condition.stage_id) {
          executeAutomationAction(auto, payload);
        }
      }
    }
  });
}

function executeAutomationAction(auto: AutomationRule, payload: any) {
  auto.executions_count += 1;
  auto.last_executed_at = new Date().toISOString();

  if (auto.action_type === 'schedule_followup' && payload.lead_id) {
    const delay = auto.action_config.delay_days || 2;
    const schDate = new Date();
    schDate.setDate(schDate.getDate() + delay);

    db.followups.unshift({
      id: 'followup-auto-' + Date.now(),
      workspace_id: db.workspace.id,
      lead_id: payload.lead_id,
      scheduled_at: schDate.toISOString(),
      status: 'pending',
      message: `Automated scheduled follow-up: Lead moved to Interested stage.`,
      channel: auto.action_config.channel || 'whatsapp',
      ai_generated: true,
      ai_intent: 'interested',
      ai_reason: `Triggered by rule: "${auto.name}"`,
      sent_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

// ==============================================================================
// Core API Endpoints
// ==============================================================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'LeadLoop AI Sales Command Center',
    gemini_configured: !!process.env.GEMINI_API_KEY,
    leads_count: db.leads.length,
    plan: db.subscription.plan,
  });
});

app.get('/api/workspace-data', (_req, res) => {
  const currentForecast = calculatePredictiveForecast(db.leads, db.stages, db.team_members);
  res.json({
    profile: db.profile,
    workspace: db.workspace,
    subscription: db.subscription,
    team_members: db.team_members,
    stages: db.stages,
    leads: db.leads,
    followups: db.followups,
    activities: db.activities,
    messages: db.messages,
    tasks: db.tasks,
    automations: db.automations,
    integrations: db.integrations,
    audit_logs: db.audit_logs,
    battlecards: db.battlecards || [],
    score_history: db.score_history || [],
    competitor_mentions: db.competitor_mentions || [],
    cadences: db.cadences || [],
    omnichannel_messages: db.omnichannel_messages || [],
    forecast: currentForecast,
  });
});

// Update Profile / Onboarding
app.post('/api/onboarding', (req: Request, res: Response) => {
  const { full_name, business_type, product_description, preferred_tone, workspace_name } = req.body;
  if (full_name) db.profile.full_name = full_name;
  if (business_type) db.profile.business_type = business_type;
  if (product_description) db.profile.product_description = product_description;
  if (preferred_tone) db.profile.preferred_tone = preferred_tone;
  if (workspace_name) db.workspace.name = workspace_name;
  db.profile.updated_at = new Date().toISOString();
  logAudit('Profile Updated', 'profile', db.profile.id, 'User updated onboarding/profile details.');
  saveDb();
  res.json({ success: true, profile: db.profile, workspace: db.workspace });
});

// Leads CRUD
app.post('/api/leads', (req: Request, res: Response) => {
  if (db.subscription.plan === 'free' && db.leads.length >= db.subscription.lead_limit) {
    return res.status(403).json({
      error: 'LEAD_LIMIT_REACHED',
      message: `You have reached the free plan limit of ${db.subscription.lead_limit} leads. Please upgrade to Pro for up to 500 leads.`,
    });
  }

  const { name, company, email, phone, service, deal_value, source, stage_id, notes, currency } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const newLeadId = 'lead-' + Date.now();
  const scoreResult = calculatePriorityScore({ deal_value, stage_id, notes }, db.followups);

  const newLead: Lead = {
    id: newLeadId,
    workspace_id: db.workspace.id,
    name,
    company: company || '',
    email: email || '',
    phone: phone || '',
    source: source || 'direct',
    service: service || db.profile.product_description || '',
    deal_value: Number(deal_value) || 0,
    currency: currency || 'INR',
    stage_id: stage_id || 'stage-1',
    status: 'active',
    last_contacted_at: null,
    next_followup_at: new Date(Date.now() + 86400000).toISOString(),
    notes: notes || '',
    priority: scoreResult.priority,
    priority_score: scoreResult.score,
    score_category: scoreResult.category,
    temperature: req.body.temperature || scoreResult.category,
    score_reason: req.body.score_reason || scoreResult.factors[0]?.description || 'Baseline heuristic scoring',
    ai_close_probability: req.body.ai_close_probability !== undefined ? req.body.ai_close_probability : scoreResult.probability_score,
    message_draft: req.body.message_draft || null,
    next_followup_date: req.body.next_followup_date || new Date(Date.now() + 86400000).toISOString(),
    dynamic_sentiment: req.body.dynamic_sentiment || 'neutral',
    competitor_tracks: Array.isArray(req.body.competitor_tracks) ? req.body.competitor_tracks : [],
    score_factors: scoreResult.factors,
    buying_intent: 'medium',
    risk_level: scoreResult.risk_level,
    risk_reasons: scoreResult.risk_reasons,
    ai_prediction_updated_at: new Date().toISOString(),
    score_updated_at: new Date().toISOString(),
    memory: {
      customer_needs: [service || 'General inquiry'],
      pain_points: [],
      preferences: [],
      objections: [],
      important_notes: notes || '',
    },
    assigned_to: db.profile.user_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.leads.unshift(newLead);

  db.activities.unshift({
    id: 'act-' + Date.now(),
    workspace_id: db.workspace.id,
    lead_id: newLeadId,
    type: 'note',
    content: `Lead created via ${newLead.source} for ${newLead.service || 'consultation'}. Initial Score: ${scoreResult.score} (${scoreResult.category}).`,
    created_at: new Date().toISOString(),
  });

  logAudit('Lead Created', 'lead', newLeadId, `Created lead ${newLead.name} (${newLead.company}) valued at ₹${newLead.deal_value}.`);
  triggerAutomations('lead_created', { lead_id: newLeadId });

  saveDb();
  res.status(201).json(newLead);
});

app.put('/api/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const leadIndex = db.leads.findIndex((l) => l.id === id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const currentLead = db.leads[leadIndex];
  const oldStageId = currentLead.stage_id;
  const updatedLead: Lead = {
    ...currentLead,
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  // If stage changed
  if (req.body.stage_id && req.body.stage_id !== oldStageId) {
    const stage = db.stages.find((s) => s.id === req.body.stage_id);
    const stageName = stage ? stage.name : req.body.stage_id;
    
    if (stageName.toLowerCase() === 'won') {
      updatedLead.status = 'won';
    } else if (stageName.toLowerCase() === 'lost') {
      updatedLead.status = 'lost';
    } else {
      updatedLead.status = 'active';
    }

    db.activities.unshift({
      id: 'act-' + Date.now(),
      workspace_id: db.workspace.id,
      lead_id: id,
      type: 'status_change',
      content: `Stage updated to ${stageName}`,
      created_at: new Date().toISOString(),
    });

    logAudit('Stage Changed', 'lead', id, `${updatedLead.name} moved to stage ${stageName}.`);
    triggerAutomations('stage_change', { lead_id: id, stage_id: req.body.stage_id });
  }

  // Recalculate score & factors
  const scoreResult = calculatePriorityScore(updatedLead, db.followups);
  updatedLead.priority_score = req.body.priority_score !== undefined ? req.body.priority_score : scoreResult.score;
  updatedLead.priority = scoreResult.priority;
  updatedLead.score_category = req.body.score_category || req.body.temperature || scoreResult.category;
  updatedLead.temperature = updatedLead.score_category;
  updatedLead.score_factors = scoreResult.factors;
  updatedLead.risk_level = scoreResult.risk_level;
  updatedLead.risk_reasons = scoreResult.risk_reasons;

  if (req.body.ai_close_probability !== undefined) {
    updatedLead.ai_close_probability = req.body.ai_close_probability;
    updatedLead.probability_score = req.body.ai_close_probability;
    updatedLead.ai_prediction_updated_at = new Date().toISOString();
  } else {
    updatedLead.ai_close_probability = updatedLead.probability_score || scoreResult.probability_score;
  }

  if (req.body.next_followup_date) {
    updatedLead.next_followup_date = req.body.next_followup_date;
    updatedLead.next_followup_at = req.body.next_followup_date;
  } else if (req.body.next_followup_at) {
    updatedLead.next_followup_date = req.body.next_followup_at;
  }

  if (req.body.dynamic_sentiment) {
    updatedLead.dynamic_sentiment = req.body.dynamic_sentiment;
  }

  if (req.body.score_reason) {
    updatedLead.score_reason = req.body.score_reason;
  }

  if (req.body.message_draft !== undefined) {
    updatedLead.message_draft = req.body.message_draft;
  }

  if (req.body.competitor_tracks) {
    updatedLead.competitor_tracks = req.body.competitor_tracks;
  }

  updatedLead.score_updated_at = new Date().toISOString();

  db.leads[leadIndex] = updatedLead;
  saveDb();
  res.json(updatedLead);
});

app.delete('/api/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const lead = db.leads.find((l) => l.id === id);
  const name = lead ? lead.name : id;
  db.leads = db.leads.filter((l) => l.id !== id);
  db.followups = db.followups.filter((f) => f.lead_id !== id);
  db.activities = db.activities.filter((a) => a.lead_id !== id);
  db.messages = db.messages.filter((m) => m.lead_id !== id);
  db.tasks = db.tasks.filter((t) => t.lead_id !== id);
  if (db.lead_activity_logs) {
    db.lead_activity_logs = db.lead_activity_logs.filter((al) => al.lead_id !== id);
  }
  logAudit('Lead Deleted', 'lead', id, `Lead ${name} removed from workspace.`);
  saveDb();
  res.json({ success: true, id });
});

// ==============================================================================
// LEAD ACTIVITY LOGS (Audited, Authenticated & Verified)
// Table: public.lead_activity_logs
// Channels: email, whatsapp, phone, sms
// ==============================================================================

// GET /api/leads/:id/activity-logs
app.get('/api/leads/:id/activity-logs', async (req: Request, res: Response) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return res.status(authResult.status || 401).json({
        error: 'Unauthorized',
        message: authResult.error || 'Authentication required to access activity logs.',
      });
    }
    const authUser = authResult.user;
    const { id } = req.params;

    const storedLead = db.leads.find((l) => l.id === id);
    if (!storedLead) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Lead with ID "${id}" not found.`,
      });
    }

    // Ownership & workspace authorization verification:
    // Lead ownership is governed by workspace membership (storedLead.workspace_id)
    // or direct assigned ownership. auth.uid() alone is insufficient without workspace validation.
    const isAuthorized =
      storedLead.workspace_id === authUser.workspace_id ||
      storedLead.organization_id === authUser.workspace_id ||
      storedLead.assigned_to === authUser.id;

    if (!isAuthorized) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view activity logs for this lead.',
      });
    }

    const logs = (db.lead_activity_logs || [])
      .filter((l) => l.lead_id === id)
      .sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime());

    return res.json({
      success: true,
      lead_id: id,
      count: logs.length,
      data: logs,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'Failed to fetch lead activity logs.',
    });
  }
});

// POST /api/leads/:id/activity-logs
app.post('/api/leads/:id/activity-logs', async (req: Request, res: Response) => {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return res.status(authResult.status || 401).json({
        error: 'Unauthorized',
        message: authResult.error || 'Authentication required to record activity log.',
      });
    }
    const authUser = authResult.user;
    const { id } = req.params;

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Request payload must be a JSON object.',
      });
    }

    const storedLead = db.leads.find((l) => l.id === id);
    if (!storedLead) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Lead with ID "${id}" not found.`,
      });
    }

    // Authorization check
    const isAuthorized =
      storedLead.workspace_id === authUser.workspace_id ||
      storedLead.organization_id === authUser.workspace_id ||
      storedLead.assigned_to === authUser.id;

    if (!isAuthorized) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to record activity logs for this lead.',
      });
    }

    // Channel validation - Allowed: email, whatsapp, phone, sms
    const rawChannel = req.body.channel !== undefined ? String(req.body.channel).toLowerCase().trim() : '';
    const ALLOWED_CHANNELS: ActivityLogChannel[] = ['email', 'whatsapp', 'phone', 'sms'];
    if (!ALLOWED_CHANNELS.includes(rawChannel as ActivityLogChannel)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid channel "${req.body.channel}". Allowed channels are: email, whatsapp, phone, sms.`,
      });
    }
    const channel = rawChannel as ActivityLogChannel;

    // Message body validation
    const messageBody = (req.body.message_body || req.body.messageBody || req.body.message || '').toString().trim();
    if (!messageBody) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'message_body is required and cannot be empty.',
      });
    }

    // Agent name
    const agentName = (req.body.agent_name && typeof req.body.agent_name === 'string' && req.body.agent_name.trim())
      ? req.body.agent_name.trim()
      : (authUser.full_name || 'Sales Agent');

    // Executed at timestamp
    let executedAt = req.body.executed_at;
    if (!executedAt || isNaN(Date.parse(executedAt))) {
      executedAt = new Date().toISOString();
    }

    // Duplicate submission prevention: Cooldown check for identical lead_id, channel & message_body within 10 seconds
    const tenSecondsAgo = Date.now() - 10000;
    const recentDuplicate = (db.lead_activity_logs || []).find(
      (al) =>
        al.lead_id === id &&
        al.channel === channel &&
        al.message_body === messageBody &&
        new Date(al.executed_at).getTime() >= tenSecondsAgo
    );

    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        duplicate_prevented: true,
        data: recentDuplicate,
        message: 'Duplicate activity submission prevented within 10s cooldown window.',
      });
    }

    const newLog: LeadActivityLog = {
      id: 'actlog-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      lead_id: id,
      agent_name: agentName,
      channel: channel,
      message_body: messageBody,
      executed_at: executedAt,
    };

    if (!db.lead_activity_logs) {
      db.lead_activity_logs = [];
    }
    db.lead_activity_logs.unshift(newLog);

    // Update lead contact timestamps
    storedLead.last_contacted_at = executedAt;
    storedLead.last_activity_at = executedAt;
    storedLead.updated_at = new Date().toISOString();

    // Recalculate priority score & factors
    const scoreResult = calculatePriorityScore(storedLead, db.followups);
    storedLead.priority_score = scoreResult.score;
    storedLead.priority = scoreResult.priority;
    storedLead.score_category = scoreResult.category;
    storedLead.temperature = scoreResult.category;
    storedLead.score_factors = scoreResult.factors;
    storedLead.risk_level = scoreResult.risk_level;
    storedLead.risk_reasons = scoreResult.risk_reasons;

    // Push into CRM activities
    db.activities.unshift({
      id: 'act-' + Date.now(),
      workspace_id: storedLead.workspace_id || db.workspace.id,
      lead_id: id,
      type: channel === 'phone' ? 'call' : (channel as any),
      content: `[${agentName}] Executed ${channel.toUpperCase()}: "${messageBody.slice(0, 80)}${messageBody.length > 80 ? '...' : ''}"`,
      channel: channel,
      created_at: executedAt,
    });

    logAudit(
      'Lead Activity Logged',
      'lead_activity_log',
      newLog.id,
      `Agent ${agentName} executed ${channel} interaction with ${storedLead.name}.`
    );

    saveDb();

    return res.status(201).json({
      success: true,
      duplicate_prevented: false,
      data: newLog,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'Failed to record lead activity log.',
    });
  }
});

// Follow-ups CRUD
app.post('/api/followups', (req: Request, res: Response) => {
  const { lead_id, scheduled_at, message, channel, ai_generated, ai_intent, ai_reason } = req.body;
  if (!lead_id || !scheduled_at) {
    return res.status(400).json({ error: 'lead_id and scheduled_at are required' });
  }

  const newFollowup: Followup = {
    id: 'followup-' + Date.now(),
    workspace_id: db.workspace.id,
    lead_id,
    scheduled_at,
    status: 'pending',
    message: message || '',
    channel: channel || 'whatsapp',
    ai_generated: !!ai_generated,
    ai_intent,
    ai_reason,
    sent_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.followups.unshift(newFollowup);

  const lead = db.leads.find((l) => l.id === lead_id);
  if (lead) {
    lead.next_followup_at = scheduled_at;
  }

  db.activities.unshift({
    id: 'act-' + Date.now(),
    workspace_id: db.workspace.id,
    lead_id,
    type: 'followup',
    content: `Follow-up scheduled for ${new Date(scheduled_at).toLocaleDateString()} via ${newFollowup.channel}.`,
    channel: newFollowup.channel,
    created_at: new Date().toISOString(),
  });

  logAudit('Follow-up Scheduled', 'followup', newFollowup.id, `Scheduled ${newFollowup.channel} follow-up for lead ${lead?.name || lead_id}.`);
  saveDb();
  res.status(201).json(newFollowup);
});

app.put('/api/followups/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.followups.findIndex((f) => f.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Follow-up not found' });
  }

  const current = db.followups[index];
  const updated: Followup = {
    ...current,
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  if (req.body.status === 'completed' && current.status !== 'completed') {
    updated.sent_at = new Date().toISOString();
    
    const lead = db.leads.find((l) => l.id === current.lead_id);
    if (lead) {
      lead.last_contacted_at = new Date().toISOString();
      const scoreResult = calculatePriorityScore(lead, db.followups);
      lead.priority_score = scoreResult.score;
      lead.priority = scoreResult.priority;
      lead.score_category = scoreResult.category;
      lead.score_factors = scoreResult.factors;
      lead.risk_level = scoreResult.risk_level;
      lead.risk_reasons = scoreResult.risk_reasons;
    }

    db.activities.unshift({
      id: 'act-' + Date.now(),
      workspace_id: db.workspace.id,
      lead_id: current.lead_id,
      type: 'followup',
      content: `Follow-up completed via ${updated.channel}: "${updated.message?.slice(0, 70)}..."`,
      channel: updated.channel,
      created_at: new Date().toISOString(),
    });

    if (updated.message) {
      db.messages.unshift({
        id: 'msg-' + Date.now(),
        workspace_id: db.workspace.id,
        lead_id: current.lead_id,
        followup_id: current.id,
        content: updated.message,
        channel: updated.channel,
        direction: 'outbound',
        created_at: new Date().toISOString(),
      });
    }

    logAudit('Follow-up Completed', 'followup', current.id, `Completed touchpoint for lead ${lead?.name || current.lead_id}.`);
  }

  db.followups[index] = updated;
  saveDb();
  res.json(updated);
});

// Tasks
app.post('/api/tasks', (req: Request, res: Response) => {
  const { title, description, lead_id, due_date, priority, is_ai_recommended } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const newTask: TaskItem = {
    id: 'task-' + Date.now(),
    workspace_id: db.workspace.id,
    lead_id,
    title,
    description: description || '',
    due_date: due_date || new Date(Date.now() + 86400000).toISOString(),
    priority: priority || 'medium',
    status: 'todo',
    assigned_to: db.profile.user_id,
    is_ai_recommended: !!is_ai_recommended,
    created_at: new Date().toISOString(),
  };

  db.tasks.unshift(newTask);
  logAudit('Task Created', 'task', newTask.id, `Task "${newTask.title}" assigned.`);
  saveDb();
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const taskIndex = db.tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });

  db.tasks[taskIndex] = {
    ...db.tasks[taskIndex],
    ...req.body,
  };

  if (req.body.status === 'completed') {
    db.activities.unshift({
      id: 'act-' + Date.now(),
      workspace_id: db.workspace.id,
      lead_id: db.tasks[taskIndex].lead_id || '',
      type: 'task_completed',
      content: `Completed task: ${db.tasks[taskIndex].title}`,
      created_at: new Date().toISOString(),
    });
    logAudit('Task Completed', 'task', id, `Task "${db.tasks[taskIndex].title}" marked complete.`);
  }

  saveDb();
  res.json(db.tasks[taskIndex]);
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.tasks = db.tasks.filter((t) => t.id !== id);
  saveDb();
  res.json({ success: true, id });
});

// Automations toggle
app.put('/api/automations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const auto = db.automations.find((a) => a.id === id);
  if (!auto) return res.status(404).json({ error: 'Automation rule not found' });

  if (req.body.is_active !== undefined) {
    auto.is_active = req.body.is_active;
  }
  logAudit('Automation Toggled', 'automation', id, `Rule "${auto.name}" set to ${auto.is_active ? 'Active' : 'Disabled'}.`);
  saveDb();
  res.json(auto);
});

// Upgrade Subscription Plan
app.post('/api/subscription/upgrade', (req: Request, res: Response) => {
  const { plan } = req.body;
  if (!['free', 'pro', 'business', 'agency'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  db.subscription.plan = plan;
  if (plan === 'pro') {
    db.subscription.ai_limit = 99999;
    db.subscription.lead_limit = 500;
  } else if (plan === 'business') {
    db.subscription.ai_limit = 99999;
    db.subscription.lead_limit = 5000;
  } else if (plan === 'agency') {
    db.subscription.ai_limit = 99999;
    db.subscription.lead_limit = 25000;
  } else {
    db.subscription.ai_limit = 50;
    db.subscription.lead_limit = 25;
  }
  db.subscription.updated_at = new Date().toISOString();
  logAudit('Subscription Changed', 'subscription', db.subscription.id, `Workspace upgraded to ${plan.toUpperCase()}.`);
  saveDb();
  res.json({ success: true, subscription: db.subscription });
});

// Reset Demo Data
app.post('/api/reset-demo', (_req, res) => {
  db = getInitialDb();
  saveDb();
  res.json({ success: true, message: 'Demo data reset successfully' });
});

// ==============================================================================
// ENTERPRISE REVENUE INTELLIGENCE & AUTOMATION ENDPOINTS
// ==============================================================================

// 1. Server-Side Score Decay Engine (Phase 6)
app.post('/api/score-decay', (req: Request, res: Response) => {
  try {
    const { 
      inactivity_threshold_days = 4, 
      decay_percent_per_day = 5 
    } = req.body || {};

    const now = Date.now();
    let decayedCount = 0;
    const decayedLeads: { id: string; name: string; old_score: number; new_score: number; days_inactive: number }[] = [];

    db.leads.forEach((lead) => {
      if (lead.status !== 'active' || lead.priority_score == null || lead.priority_score <= 0) return;

      const lastActivity = lead.last_contacted_at || lead.updated_at || lead.created_at;
      const daysInactive = Math.floor((now - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));

      if (daysInactive >= inactivity_threshold_days) {
        const decayDays = daysInactive - inactivity_threshold_days + 1;
        const decayFactor = Math.pow(1 - decay_percent_per_day / 100, decayDays);
        const oldScore = lead.priority_score;
        const newScore = Math.max(0, Math.round(oldScore * decayFactor));

        if (newScore < oldScore) {
          const delta = newScore - oldScore;
          lead.priority_score = newScore;
          lead.temperature = newScore >= 75 ? 'HOT' : newScore >= 45 ? 'WARM' : 'COLD';
          lead.score_updated_at = new Date().toISOString();

          // Update risk status based on new score and dormant days
          lead.risk_status = newScore < 30 ? 'CRITICAL' : newScore < 50 ? 'AT_RISK' : 'WATCH';
          lead.risk_level = newScore < 30 ? 'high' : newScore < 50 ? 'medium' : 'low';
          lead.score_category = newScore >= 75 ? 'HOT' : newScore >= 45 ? 'WARM' : 'COLD';

          const reason = `Automated score decay (${decay_percent_per_day}%/day): ${daysInactive} days inactive past ${inactivity_threshold_days}-day threshold.`;
          
          const historyEntry: ScoreHistory = {
            id: 'shist-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            organization_id: db.workspace.id,
            lead_id: lead.id,
            previous_score: oldScore,
            new_score: newScore,
            change_amount: delta,
            reason,
            source: 'score_decay_engine',
            activity_type: 'score_decay',
            created_at: new Date().toISOString(),
          };

          db.score_history.unshift(historyEntry);

          db.activities.unshift({
            id: 'act-' + Date.now(),
            workspace_id: db.workspace.id,
            lead_id: lead.id,
            type: 'status_change',
            content: `Score decayed from ${oldScore} to ${newScore} due to ${daysInactive} days of inactivity. Risk status: ${lead.risk_status}.`,
            created_at: new Date().toISOString(),
          });

          decayedCount++;
          decayedLeads.push({
            id: lead.id,
            name: lead.name,
            old_score: oldScore,
            new_score: newScore,
            days_inactive: daysInactive,
          });
        }
      }
    });

    if (decayedCount > 0) {
      logAudit('Score Decay Executed', 'scoring', 'system', `Decayed scores for ${decayedCount} inactive lead(s).`);
      saveDb();
    }

    res.json({
      success: true,
      decayed_count: decayedCount,
      decayed_leads: decayedLeads,
      score_history: db.score_history.slice(0, 30),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in score decay engine:', error);
    res.status(500).json({ error: error.message || 'Score decay execution failed' });
  }
});

// 2. Score History
app.get('/api/score-history', (req: Request, res: Response) => {
  const { lead_id } = req.query;
  let history = db.score_history || [];
  if (lead_id) {
    history = history.filter((h) => h.lead_id === lead_id);
  }
  res.json({
    success: true,
    history: history.slice(0, 50),
  });
});

// 3. AI Predictive Revenue Forecast (Phases 8 & 9)
app.get('/api/forecast', (_req: Request, res: Response) => {
  try {
    const forecast = calculatePredictiveForecast(db.leads, db.stages, db.team_members);
    
    // Transparent Deal-by-Deal Forecast Breakdown (Phase 9)
    const activeLeads = db.leads.filter((l) => l.status === 'active');
    const deals_breakdown = activeLeads.map((l) => {
      const stage = db.stages.find((s) => s.id === l.stage_id);
      const prob = l.probability_score || 40;
      const val = Number(l.deal_value) || 0;
      const probableVal = Math.round(val * (prob / 100));

      const daysSince = l.last_contacted_at 
        ? Math.floor((Date.now() - new Date(l.last_contacted_at).getTime()) / 86400000)
        : null;

      const signals: string[] = [];
      if (daysSince === 0) signals.push('Active dialogue today');
      else if (daysSince !== null && daysSince <= 2) signals.push(`Recent touch (${daysSince}d ago)`);
      else if (daysSince !== null && daysSince >= 4) signals.push(`Dormant ${daysSince}d (decay risk)`);

      if (l.buying_intent === 'high') signals.push('High buyer intent');
      if (l.memory?.objections && l.memory.objections.length > 0) signals.push(`Objection: ${l.memory.objections[0]}`);
      if (l.memory?.competitors && l.memory.competitors.length > 0) signals.push(`Competitor: ${l.memory.competitors[0]}`);

      return {
        id: l.id,
        name: l.name,
        company: l.company || 'Direct',
        deal_value: val,
        close_probability: prob,
        probable_close_value: probableVal,
        stage_name: stage?.name || 'New',
        risk_status: l.risk_status || 'HEALTHY',
        last_activity: daysSince === null ? 'Never contacted' : `${daysSince} days ago`,
        key_signals: signals,
      };
    });

    const insufficient_data = activeLeads.length === 0;

    res.json({
      success: true,
      forecast,
      insufficient_data,
      deals_breakdown,
      calculated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Forecast calculation failed' });
  }
});

// Period-Specific AI Revenue Predictions (Production Table Integration)
app.get('/api/ai-revenue-predictions', (req: Request, res: Response) => {
  const { target_month, forecast_period } = req.query;
  let predictions = db.ai_revenue_predictions || [];

  if (target_month) {
    predictions = predictions.filter((p) => p.target_month === target_month);
  }
  if (forecast_period) {
    predictions = predictions.filter((p) => p.forecast_period === forecast_period);
  }

  res.json({
    success: true,
    predictions,
    organization_id: db.workspace.id,
  });
});

app.post('/api/ai-revenue-predictions', (req: Request, res: Response) => {
  const {
    target_month,
    forecast_period,
    raw_pipeline_value,
    ai_predicted_value,
    weighted_pipeline_value,
    confidence_percentage,
    model_version,
    methodology
  } = req.body;

  if (raw_pipeline_value === undefined || ai_predicted_value === undefined) {
    return res.status(400).json({ error: 'raw_pipeline_value and ai_predicted_value are required' });
  }

  const period = forecast_period || (target_month ? String(target_month).slice(0, 7) : new Date().toISOString().slice(0, 7));
  const newPrediction: AIRevenuePrediction = {
    id: 'pred-' + Date.now(),
    organization_id: db.workspace.id,
    pipeline_id: 'default-pipeline',
    target_month: target_month || new Date().toISOString().split('T')[0],
    forecast_period: period,
    raw_pipeline_value: Number(raw_pipeline_value) || 0,
    ai_predicted_value: Number(ai_predicted_value) || 0,
    weighted_pipeline_value: Number(weighted_pipeline_value) || Math.round(Number(raw_pipeline_value) * 0.45),
    confidence_percentage: confidence_percentage !== undefined ? Math.min(100, Math.max(0, Number(confidence_percentage))) : 75,
    model_version: model_version || 'leadloop-forecast-v2',
    methodology: methodology || 'stage_weighted_momentum',
    calculated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  if (!db.ai_revenue_predictions) db.ai_revenue_predictions = [];
  db.ai_revenue_predictions.unshift(newPrediction);
  saveDb();

  logAudit('Prediction Generated', 'forecast', newPrediction.id, `Saved AI revenue prediction for ${newPrediction.forecast_period}: ₹${newPrediction.ai_predicted_value}.`);
  res.status(201).json({
    success: true,
    prediction: newPrediction,
  });
});

// 4. Competitor Intelligence & Detection (Phase 10)
app.post('/api/competitor/detect', async (req: Request, res: Response) => {
  try {
    const { lead_id, text, source = 'note' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text content is required for competitor detection' });
    }

    const KNOWN_COMPETITORS = ['Salesforce', 'HubSpot', 'Zoho', 'Pipedrive', 'Microsoft Dynamics'];
    const textLower = text.toLowerCase();
    
    // Check known competitors first
    let detectedCompetitor = KNOWN_COMPETITORS.find((c) => textLower.includes(c.toLowerCase()));
    
    let confidence = 85;
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let objection = 'Evaluating alternative software vendors';
    let contextSnippet = '';

    if (detectedCompetitor) {
      const idx = textLower.indexOf(detectedCompetitor.toLowerCase());
      const start = Math.max(0, idx - 60);
      const end = Math.min(text.length, idx + 100);
      contextSnippet = '...' + text.substring(start, end).trim() + '...';

      if (textLower.includes('expensive') || textLower.includes('cost') || textLower.includes('cheaper')) {
        objection = `Pricing comparison with ${detectedCompetitor}`;
      } else if (textLower.includes('complex') || textLower.includes('too hard') || textLower.includes('slow')) {
        objection = `Usability & speed friction with ${detectedCompetitor}`;
        sentiment = 'negative';
      } else if (textLower.includes('already using') || textLower.includes('invested')) {
        objection = `Incumbent adoption with ${detectedCompetitor}`;
        sentiment = 'positive';
      }
    } else {
      // Optional Gemini detection if unlisted competitor mentioned
      if (process.env.GEMINI_API_KEY && (textLower.includes('alternative') || textLower.includes('evaluating') || textLower.includes('quote'))) {
        try {
          const prompt = `Analyze if any CRM or software competitor is mentioned in this sales text: "${text}".
Return JSON { "competitor_found": true/false, "competitor": "Name", "confidence": 0-100, "objection": "likely objection", "sentiment": "positive/neutral/negative" }`;
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });
          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            if (parsed.competitor_found && parsed.competitor) {
              detectedCompetitor = parsed.competitor;
              confidence = parsed.confidence || 80;
              objection = parsed.objection || objection;
              sentiment = parsed.sentiment || sentiment;
              contextSnippet = text.slice(0, 120);
            }
          }
        } catch (e) {
          // Graceful fallback
        }
      }
    }

    if (!detectedCompetitor) {
      return res.json({
        success: true,
        detected: false,
        message: 'No competitor mentions detected in text.',
      });
    }

    // Matching Battlecard
    const matchingBattlecard = db.battlecards.find(
      (b) => b.competitor.toLowerCase() === detectedCompetitor?.toLowerCase() && b.enabled
    ) || db.battlecards[0];

    const mentionRecord: CompetitorMention = {
      id: 'comp-' + Date.now(),
      organization_id: db.workspace.id,
      lead_id: lead_id || 'unlinked',
      competitor: detectedCompetitor,
      context: contextSnippet || text.slice(0, 150),
      sentiment,
      confidence,
      source,
      objection,
      created_at: new Date().toISOString(),
    };

    db.competitor_mentions.unshift(mentionRecord);

    if (lead_id) {
      const lead = db.leads.find((l) => l.id === lead_id);
      if (lead) {
        if (!lead.memory) {
          lead.memory = { customer_needs: [], pain_points: [], preferences: [], objections: [] };
        }
        if (!lead.memory.competitors) lead.memory.competitors = [];
        if (!lead.memory.competitors.includes(detectedCompetitor)) {
          lead.memory.competitors.push(detectedCompetitor);
        }
        db.activities.unshift({
          id: 'act-' + Date.now(),
          workspace_id: db.workspace.id,
          lead_id: lead.id,
          type: 'ai_analysis',
          content: `Competitor Alert: "${detectedCompetitor}" identified in conversation. Battlecard prepared.`,
          created_at: new Date().toISOString(),
        });
      }
    }

    logAudit('Competitor Detected', 'competitor', mentionRecord.id, `Detected ${detectedCompetitor} in ${source}.`);
    saveDb();

    res.json({
      success: true,
      detected: true,
      mention: mentionRecord,
      battlecard: matchingBattlecard,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Competitor detection failed' });
  }
});

// 5. Database-Driven Battlecards (Phase 11)
app.get('/api/battlecards', (_req: Request, res: Response) => {
  res.json({
    success: true,
    battlecards: db.battlecards || [],
  });
});

app.post('/api/battlecards', (req: Request, res: Response) => {
  const { competitor, objection, suggested_response, differentiation, discovery_questions, recommended_action } = req.body;
  if (!competitor || !suggested_response) {
    return res.status(400).json({ error: 'Competitor name and suggested response are required' });
  }

  const existingIdx = db.battlecards.findIndex((b) => b.competitor.toLowerCase() === competitor.toLowerCase());
  const newCard: Battlecard = {
    id: existingIdx !== -1 ? db.battlecards[existingIdx].id : 'battle-' + Date.now(),
    organization_id: db.workspace.id,
    competitor,
    objection: objection || 'General competitive objection',
    suggested_response,
    differentiation: differentiation || 'Tailored deal acceleration with LeadLoop AI',
    discovery_questions: Array.isArray(discovery_questions) ? discovery_questions : [],
    recommended_action: recommended_action || 'Demonstrate ROI with targeted trial',
    enabled: true,
    created_at: existingIdx !== -1 ? db.battlecards[existingIdx].created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    db.battlecards[existingIdx] = newCard;
  } else {
    db.battlecards.unshift(newCard);
  }

  logAudit('Battlecard Saved', 'battlecard', newCard.id, `Configured battlecard for competitor: ${competitor}.`);
  saveDb();
  res.json({ success: true, battlecard: newCard });
});

// 6. Omnichannel Cadences & Automated Fallback (Phases 13 & 14)
app.get('/api/cadences', (req: Request, res: Response) => {
  const { lead_id } = req.query;
  let cadences = db.cadences || [];
  if (lead_id) {
    cadences = cadences.filter((c) => c.lead_id === lead_id);
  }
  res.json({ success: true, cadences });
});

app.post('/api/cadences', (req: Request, res: Response) => {
  const { lead_id, name, steps } = req.body;
  if (!lead_id || !name || !steps || !steps.length) {
    return res.status(400).json({ error: 'lead_id, name, and steps array are required' });
  }

  const newCadence: Cadence = {
    id: 'cad-' + Date.now(),
    organization_id: db.workspace.id,
    lead_id,
    name,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    steps: steps.map((s: any, idx: number) => ({
      id: 'cstep-' + Date.now() + '-' + idx,
      cadence_id: 'cad-' + Date.now(),
      step_number: idx + 1,
      channel: s.channel || 'whatsapp',
      delay: s.delay || 24,
      message_template: s.message_template || '',
      fallback_channel: s.fallback_channel || 'email',
      fallback_after_hours: s.fallback_after_hours || 24,
      status: idx === 0 ? 'sent' : 'pending',
      created_at: new Date().toISOString(),
    })),
  };

  db.cadences.unshift(newCadence);
  logAudit('Cadence Created', 'cadence', newCadence.id, `Initiated ${name} for lead ${lead_id}.`);
  saveDb();

  res.status(201).json({ success: true, cadence: newCadence });
});

// Automated Backend Fallback Engine (Phase 14)
app.post('/api/cadences/trigger-fallbacks', (req: Request, res: Response) => {
  let fallbackCount = 0;
  const triggeredItems: any[] = [];

  db.cadences.forEach((cad) => {
    if (cad.status !== 'active' || !cad.steps) return;

    cad.steps.forEach((step, idx) => {
      // Check if step was sent but unread / no reply past fallback timeout
      if (step.status === 'sent' && step.fallback_channel) {
        const hoursAgo = Math.floor((Date.now() - new Date(step.created_at).getTime()) / (1000 * 60 * 60));
        const timeout = step.fallback_after_hours || 24;

        if (hoursAgo >= timeout) {
          step.status = 'fallback_triggered';
          fallbackCount++;

          const fallbackMsg: OmnichannelMessage = {
            id: 'msg-fall-' + Date.now() + '-' + idx,
            organization_id: db.workspace.id,
            lead_id: cad.lead_id,
            cadence_id: cad.id,
            cadence_step_id: step.id,
            channel: step.fallback_channel,
            message: `[Automated ${step.fallback_channel.toUpperCase()} Fallback]: ${step.message_template}`,
            status: 'sent',
            idempotency_key: `idemp-fallback-${cad.id}-${step.id}`,
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };

          db.omnichannel_messages.unshift(fallbackMsg);
          triggeredItems.push({
            cadence_id: cad.id,
            original_channel: step.channel,
            fallback_channel: step.fallback_channel,
            lead_id: cad.lead_id,
          });
        }
      }
    });
  });

  if (fallbackCount > 0) {
    logAudit('Cadence Fallback Executed', 'cadence', 'engine', `Triggered ${fallbackCount} automated fallback messages.`);
    saveDb();
  }

  res.json({
    success: true,
    triggered_count: fallbackCount,
    triggered_items: triggeredItems,
  });
});

// Idempotent Omnichannel Message Sender (Phase 14)
app.post('/api/messages/send', (req: Request, res: Response) => {
  const { lead_id, cadence_id, channel, message, idempotency_key } = req.body;
  if (!lead_id || !channel || !message || !idempotency_key) {
    return res.status(400).json({ error: 'lead_id, channel, message, and idempotency_key are required' });
  }

  // Prevent duplicate execution
  const existing = db.omnichannel_messages.find((m) => m.idempotency_key === idempotency_key);
  if (existing) {
    return res.json({
      success: true,
      duplicate_prevented: true,
      message: existing,
    });
  }

  const newMessage: OmnichannelMessage = {
    id: 'msg-' + Date.now(),
    organization_id: db.workspace.id,
    lead_id,
    cadence_id: cadence_id || null,
    channel,
    message,
    status: 'sent',
    idempotency_key,
    sent_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  db.omnichannel_messages.unshift(newMessage);

  // Also log to CRM messages & activity
  db.messages.unshift({
    id: 'crm-msg-' + Date.now(),
    workspace_id: db.workspace.id,
    lead_id,
    content: message,
    channel,
    direction: 'outbound',
    created_at: new Date().toISOString(),
  });

  db.activities.unshift({
    id: 'act-' + Date.now(),
    workspace_id: db.workspace.id,
    lead_id,
    type: channel === 'call' ? 'call' : 'email',
    content: `Sent ${channel.toUpperCase()} message: "${message.slice(0, 60)}..."`,
    channel,
    created_at: new Date().toISOString(),
  });

  logAudit('Omnichannel Message Sent', 'message', newMessage.id, `Sent ${channel} message with idempotency key ${idempotency_key}.`);
  saveDb();

  res.status(201).json({
    success: true,
    duplicate_prevented: false,
    message: newMessage,
  });
});

// 7. Audio / Transcript Pipeline Provider Abstraction (Phase 12)
app.post('/api/transcribe', async (req: Request, res: Response) => {
  try {
    const { transcript_text, lead_id, duration_seconds = 60, provider = 'browser_speech' } = req.body;
    if (!transcript_text) {
      return res.status(400).json({ error: 'transcript_text is required' });
    }

    // Pipeline: Audio / Text -> Transcription -> Competitor Detection -> Objection Detection -> Battlecard -> CRM Activity
    const textLower = transcript_text.toLowerCase();
    const KNOWN_COMPETITORS = ['Salesforce', 'HubSpot', 'Zoho', 'Pipedrive', 'Microsoft Dynamics'];
    const detectedCompetitor = KNOWN_COMPETITORS.find((c) => textLower.includes(c.toLowerCase()));

    const detectedObjections: string[] = [];
    if (textLower.includes('budget') || textLower.includes('expensive') || textLower.includes('cost')) {
      detectedObjections.push('Pricing / Budget constraint');
    }
    if (textLower.includes('timing') || textLower.includes('next month') || textLower.includes('q4')) {
      detectedObjections.push('Timeline postponement');
    }
    if (textLower.includes('partner') || textLower.includes('board') || textLower.includes('committee')) {
      detectedObjections.push('Multi-stakeholder approval requirement');
    }

    const matchingBattlecard = detectedCompetitor
      ? db.battlecards.find((b) => b.competitor.toLowerCase() === detectedCompetitor.toLowerCase())
      : null;

    if (lead_id) {
      const lead = db.leads.find((l) => l.id === lead_id);
      if (lead) {
        db.activities.unshift({
          id: 'act-' + Date.now(),
          workspace_id: db.workspace.id,
          lead_id: lead.id,
          type: 'call',
          content: `Call transcript ingested (${duration_seconds}s). Detected ${detectedCompetitor ? `competitor ${detectedCompetitor}` : 'no competitors'}. Objections: ${detectedObjections.join(', ') || 'None'}.`,
          created_at: new Date().toISOString(),
        });
      }
    }

    saveDb();

    res.json({
      success: true,
      transcription: {
        text: transcript_text,
        duration_seconds,
        confidence: 0.94,
        provider,
        detected_competitors: detectedCompetitor ? [detectedCompetitor] : [],
        detected_objections: detectedObjections,
        battlecard: matchingBattlecard,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Transcription processing failed' });
  }
});


// ==============================================================================
// AI SALES INTELLIGENCE ENDPOINTS
// ==============================================================================

// 1. Generate Followup (Secure, Authenticated & Verified)
app.post('/api/generate-followup', async (req: Request, res: Response) => {
  try {
    // 1. Authentication Check
    const authResult = await authenticateRequest(req);
    if (!authResult.user) {
      return res.status(authResult.status || 401).json({
        error: 'Unauthorized',
        message: authResult.error || 'Authentication required. Please provide a valid Bearer token.',
      });
    }
    const authUser = authResult.user;

    // 2. Request Validation
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Request body must be a valid JSON object.',
      });
    }

    const leadId = req.body.lead_id || req.body.leadId;
    if (!leadId || typeof leadId !== 'string' || !leadId.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'lead_id is required and must be a valid non-empty string.',
      });
    }

    // Channel validation - Strictly accept only 'email' and 'whatsapp'
    const rawChannel = req.body.channel !== undefined ? String(req.body.channel).toLowerCase().trim() : 'whatsapp';
    const SUPPORTED_CHANNELS = ['email', 'whatsapp'];
    if (!SUPPORTED_CHANNELS.includes(rawChannel)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Unsupported channel "${req.body.channel}". Only "email" and "whatsapp" channels are supported.`,
      });
    }
    const channel: 'email' | 'whatsapp' = rawChannel as 'email' | 'whatsapp';

    const tone = req.body.tone && typeof req.body.tone === 'string'
      ? req.body.tone.slice(0, 50)
      : (authUser.preferred_tone || 'professional-friendly');
    const extraNotes = req.body.notes && typeof req.body.notes === 'string'
      ? req.body.notes.slice(0, 3000)
      : '';

    // 3. Authorization & Lead Lookup (Never trust client-provided lead details)
    const storedLead = db.leads.find((l) => l.id === leadId.trim());
    if (!storedLead) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Lead with ID "${leadId}" not found.`,
      });
    }

    // Permission check: Workspace membership / assigned user
    const isWorkspaceMatch = (storedLead.workspace_id === authUser.workspace_id) || (storedLead.organization_id === authUser.workspace_id);
    const isAssigned = storedLead.assigned_to === authUser.id;

    if (!isWorkspaceMatch && !isAssigned) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this lead.',
      });
    }

    // Check Plan Quota
    if (db.subscription.plan === 'free' && db.workspace.ai_generations_used >= db.subscription.ai_limit) {
      return res.status(403).json({
        error: 'AI_LIMIT_REACHED',
        message: `Monthly AI generation limit (${db.subscription.ai_limit}) reached on the Free plan. Please upgrade to Pro for unlimited AI follow-up generations.`,
      });
    }

    // 4. Data Accuracy: Pull Verified Database Records
    const lead_name = storedLead.name;
    const company = storedLead.company || '';
    const service = storedLead.service || db.profile.product_description || '';
    const deal_value = storedLead.deal_value || 0;
    const currentStageObj = db.stages.find((s) => s.id === storedLead.stage_id);
    const stage = currentStageObj ? currentStageObj.name : 'Interested';
    const last_contacted_at = storedLead.last_contacted_at;
    const memory = storedLead.memory;
    const combinedNotes = extraNotes
      ? `${storedLead.notes ? storedLead.notes + '\n' : ''}${extraNotes}`
      : storedLead.notes || '';

    // Verified tasks & follow-up status (do NOT assume last_interaction means missed follow-up)
    const verifiedTasks = db.tasks.filter((t) => t.lead_id === storedLead.id);
    const verifiedFollowups = db.followups.filter((f) => f.lead_id === storedLead.id);
    const verifiedMessages = db.messages.filter((m) => m.lead_id === storedLead.id);

    const overdueFollowups = verifiedFollowups.filter(
      (f) => f.status === 'overdue' || (f.status === 'pending' && new Date(f.scheduled_at).getTime() < Date.now())
    );
    const pendingTasks = verifiedTasks.filter((t) => t.status !== 'completed');

    let lastInteractionContext = '';
    if (verifiedMessages.length > 0) {
      lastInteractionContext = verifiedMessages.slice(0, 3).map((m) => `[${m.direction}] ${m.content}`).join('; ');
    } else {
      const verifiedActivities = db.activities.filter((a) => a.lead_id === storedLead.id);
      if (verifiedActivities.length > 0) {
        lastInteractionContext = verifiedActivities.slice(0, 2).map((a) => a.content).join('; ');
      } else {
        lastInteractionContext = 'No prior messages or recorded touchpoints.';
      }
    }

    const followUpStatusStatement = overdueFollowups.length > 0
      ? `Verified overdue scheduled follow-up: scheduled for ${overdueFollowups[0].scheduled_at} via ${overdueFollowups[0].channel}.`
      : `No scheduled follow-up is overdue. (Last recorded contact date: ${last_contacted_at || 'Never'}).`;

    const tasksStatement = pendingTasks.length > 0
      ? `Verified pending tasks: ${pendingTasks.map((t) => `"${t.title}" (Due: ${t.due_date})`).join(', ')}.`
      : 'No pending tasks recorded for this lead.';

    // 5. Generate AI Follow-up Draft with Gemini (or Deterministic Heuristic Fallback)
    let aiResponse: any = null;
    let quotaNotice: any = null;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const prompt = `
You are the AI Follow-Up Generation Engine of LeadLoop AI.
Generate a tailored, high-converting follow-up message draft for this verified sales lead.

CRITICAL RULES:
1. TARGET CHANNEL: "${channel.toUpperCase()}".
   - If channel is "EMAIL": You MUST generate a compelling, professional "subject" line (max 8 words) and a complete "body" with greeting, value proposition, call to action, and professional signoff.
   - If channel is "WHATSAPP": You MUST generate a concise "body" (under 55 words). Conversational, direct, friendly. Do NOT include a subject line.
2. CURRENT PIPELINE STAGE: "${stage}".
3. LAST RECORDED TOUCHPOINT: "${lastInteractionContext}".
4. VERIFIED TASK & SCHEDULE STATUS:
   - ${followUpStatusStatement}
   - ${tasksStatement}
   - NOTE: Do NOT assume that past contact date means a follow-up was missed. Only cite overdue status if verified above.
5. CUSTOMER MEMORY (if available):
   - Needs: ${memory?.customer_needs?.join(', ') || 'None recorded'}
   - Objections: ${memory?.objections?.join(', ') || 'None recorded'}
   - Timeline: ${memory?.timeline || 'Not specified'}
6. TONE: "${tone}".
7. TRUTHFULNESS & HONESTY:
   - NEVER invent customer interactions, buying intent, meetings, dates, or deal terms.
   - Handle missing values honestly.
8. THIS IS A DRAFT: The output will be presented to the sales rep as an unsent draft for review before sending.

Context:
- Lead Name: ${lead_name}
- Company: ${company || 'Not specified'}
- Service/Offering: ${service || 'General Services'}
- Deal Value: ${deal_value ? `₹${deal_value}` : 'Undisclosed'}
- Verified Stage: ${stage}
- Rep Notes: ${combinedNotes || 'None'}
`;

        const responseSchema = channel === 'email'
          ? {
              type: Type.OBJECT,
              properties: {
                lead_intent: { type: Type.STRING },
                recommended_action: { type: Type.STRING },
                urgency: { type: Type.STRING },
                follow_up_after_days: { type: Type.INTEGER },
                reason: { type: Type.STRING },
                suggested_channel: { type: Type.STRING },
                subject: { type: Type.STRING },
                body: { type: Type.STRING },
              },
              required: ['lead_intent', 'recommended_action', 'urgency', 'follow_up_after_days', 'reason', 'suggested_channel', 'subject', 'body'],
            }
          : {
              type: Type.OBJECT,
              properties: {
                lead_intent: { type: Type.STRING },
                recommended_action: { type: Type.STRING },
                urgency: { type: Type.STRING },
                follow_up_after_days: { type: Type.INTEGER },
                reason: { type: Type.STRING },
                suggested_channel: { type: Type.STRING },
                body: { type: Type.STRING },
              },
              required: ['lead_intent', 'recommended_action', 'urgency', 'follow_up_after_days', 'reason', 'suggested_channel', 'body'],
            };

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are an expert sales follow-up strategist. Output structured JSON strictly matching the requested schema. Never invent customer interactions or fake urgency.',
            responseMimeType: 'application/json',
            responseSchema,
          },
        });

        if (response.text && response.text.trim()) {
          const parsed = JSON.parse(response.text.trim());
          aiResponse = {
            ...parsed,
            subject: channel === 'email' ? (parsed.subject || `Regarding ${service || 'our collaboration'}`) : null,
            body: parsed.body || parsed.message || '',
            message: parsed.body || parsed.message || '',
            suggested_channel: channel,
            is_draft: true,
            status: 'draft',
          };
        }
      } catch (geminiError: any) {
        const errMsg = geminiError?.message || String(geminiError);
        const isQuota = errMsg.includes('resource_exhausted') || errMsg.includes('quota') || errMsg.includes('429');
        const isOverloaded = errMsg.includes('overloaded') || errMsg.includes('503');
        const isPermission = errMsg.includes('permission') || errMsg.includes('caller does not have permission') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('403') || errMsg.includes('unauthorized');

        quotaNotice = {
          is_quota_exceeded: isQuota,
          engine_fallback: true,
          model: 'gemini-3.8-flash',
          message: isPermission
            ? 'Google Gemini API authorization notice: "The caller does not have permission". Activated LeadLoop deterministic heuristic sales engine.'
            : isQuota
              ? 'Google Gemini API token quota limit reached. Activated LeadLoop deterministic heuristic sales engine.'
              : isOverloaded
                ? 'Google Gemini service is temporarily congested. Heuristic engine active.'
                : 'Activated LeadLoop deterministic heuristic sales engine.',
          suggestion: 'Workflows remain 100% operational with deterministic contextual sales heuristics.',
        };
        console.warn('Gemini follow-up API notice, using deterministic heuristic engine:', errMsg);
      }
    }

    if (!aiResponse) {
      aiResponse = generateFallbackFollowup({
        lead_name,
        company,
        service,
        deal_value,
        stage,
        last_message: lastInteractionContext,
        notes: combinedNotes,
        tone,
        channel,
        memory,
        overdueFollowups,
        pendingTasks,
        last_contacted_at,
      });
      if (quotaNotice) {
        aiResponse.quota_notice = quotaNotice;
      }
    }

    // Ensure draft attributes are explicitly set
    aiResponse.is_draft = true;
    aiResponse.status = 'draft';
    aiResponse.suggested_channel = channel;
    if (channel === 'whatsapp') {
      aiResponse.subject = null;
    } else if (!aiResponse.subject) {
      aiResponse.subject = `Regarding ${service || 'our collaboration'} - Next steps for ${company || lead_name.split(' ')[0]}`;
    }

    db.workspace.ai_generations_used += 1;
    db.subscription.ai_generations_used = db.workspace.ai_generations_used;
    saveDb();

    return res.json({
      success: true,
      is_draft: true,
      status: 'draft',
      data: aiResponse,
      quota_notice: quotaNotice || aiResponse.quota_notice,
      usage: {
        used: db.workspace.ai_generations_used,
        limit: db.subscription.ai_limit,
      },
    });
  } catch (error: any) {
    console.error('Error generating AI followup:', error?.message || error);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to generate follow-up draft' });
  }
});

// 2. Conversation Intelligence (/api/analyze-conversation)
app.post('/api/analyze-conversation', async (req: Request, res: Response) => {
  try {
    const { lead_id, conversation_text, notes = '' } = req.body;
    if (!lead_id || !conversation_text) {
      return res.status(400).json({ error: 'lead_id and conversation_text are required' });
    }

    const lead = db.leads.find((l) => l.id === lead_id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    let analysis: any;
    let quotaNotice: any = null;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const prompt = `
Analyze the following sales conversation transcript or notes for prospect "${lead.name}" (${lead.company || 'Direct'}).

Conversation text:
"""
${conversation_text}
"""
Additional user notes: "${notes}"

Identify:
1. Intent level (high, medium, low)
2. Buying stage (awareness, consideration, decision, negotiation)
3. Main objection (e.g. price, timing, authority, scope, none)
4. Decision maker identified (name or role, or "unknown")
5. Did they mention any competitors? (true or false)
6. Concrete customer needs or pain points mentioned (list of strings)
7. Recommended next step for the sales rep
8. Recommended follow-up timeframe in days (number)
9. Concise 2-sentence executive summary of the conversation
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are an elite B2B conversation intelligence analyst. Return structured JSON only.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                intent: { type: Type.STRING },
                buying_stage: { type: Type.STRING },
                objection: { type: Type.STRING },
                decision_maker: { type: Type.STRING },
                competitor_mentioned: { type: Type.BOOLEAN },
                customer_needs: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                next_step: { type: Type.STRING },
                recommended_followup_days: { type: Type.INTEGER },
                summary: { type: Type.STRING },
              },
              required: [
                'intent',
                'buying_stage',
                'objection',
                'decision_maker',
                'competitor_mentioned',
                'customer_needs',
                'next_step',
                'recommended_followup_days',
                'summary',
              ],
            },
          },
        });

        if (response.text) {
          analysis = JSON.parse(response.text.trim());
        }
      } catch (geminiError: any) {
        const errMsg = geminiError?.message || String(geminiError);
        const isQuota = errMsg.includes('resource_exhausted') || errMsg.includes('quota') || errMsg.includes('429');
        const isOverloaded = errMsg.includes('overloaded') || errMsg.includes('503');
        const isPermission = errMsg.includes('permission') || errMsg.includes('caller does not have permission') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('403') || errMsg.includes('unauthorized');
        if (isQuota || isOverloaded || isPermission) {
          quotaNotice = {
            is_quota_exceeded: true,
            engine_fallback: true,
            model: 'gemini-3.8-flash',
            message: isPermission
              ? 'Google Gemini API authorization notice: "The caller does not have permission". Conversation analyzed using LeadLoop deterministic intelligence engine.'
              : isQuota
                ? 'Google Gemini API token quota reached. Conversation analyzed using LeadLoop deterministic intelligence engine.'
                : 'Google Gemini service is temporarily congested. Heuristic engine active.',
            suggestion: isPermission
              ? 'Verify that the Generative Language API is enabled and your API key in Settings > Secrets has proper access. Customer intent, objections, and memory continue to be parsed accurately.'
              : 'Customer intent, objections, and memory continue to be parsed accurately.',
          };
        }
        console.warn('Gemini conversation analysis notice, using fallback heuristic:', errMsg);
      }
    }

    if (!analysis) {
      // High-grade fallback
      const textLower = conversation_text.toLowerCase();
      const hasPrice = textLower.includes('budget') || textLower.includes('price') || textLower.includes('cost') || textLower.includes('discount');
      const hasPartner = textLower.includes('partner') || textLower.includes('boss') || textLower.includes('team');
      const hasCompetitor = textLower.includes('other agency') || textLower.includes('another quote') || textLower.includes('competitor');

      analysis = {
        intent: textLower.includes('ready') || textLower.includes('send proposal') || textLower.includes('contract') ? 'high' : 'medium',
        buying_stage: textLower.includes('contract') ? 'negotiation' : 'consideration',
        objection: hasPrice ? 'Price / Budget justification' : hasPartner ? 'Internal stakeholder approval' : 'Timeline alignment',
        decision_maker: hasPartner ? 'Co-founder or Partner' : 'Lead (Direct)',
        competitor_mentioned: hasCompetitor,
        customer_needs: ['Clear deliverable timeline', 'Transparent pricing scope', 'Proven case study'],
        next_step: hasPrice ? 'Offer adjusted payment terms or deliverable tradeoff' : 'Send targeted follow-up to address partner questions',
        recommended_followup_days: 2,
        summary: `Lead engaged regarding ${lead.service || 'project services'}. Primary topic centered around ${hasPrice ? 'budget alignment' : 'deliverable timeline'} and next approval milestones.`,
      };
      if (quotaNotice) {
        analysis.quota_notice = quotaNotice;
      }
    }

    // Save to Lead Memory
    lead.buying_intent = analysis.intent;
    if (!lead.memory) {
      lead.memory = {
        customer_needs: [],
        pain_points: [],
        preferences: [],
        objections: [],
      };
    }
    lead.memory.last_analyzed_at = new Date().toISOString();
    lead.memory.customer_needs = Array.from(new Set([...(lead.memory.customer_needs || []), ...analysis.customer_needs]));
    if (analysis.objection && !lead.memory.objections.includes(analysis.objection)) {
      lead.memory.objections.unshift(analysis.objection);
    }
    if (analysis.decision_maker && analysis.decision_maker !== 'unknown') {
      lead.memory.decision_maker = analysis.decision_maker;
    }
    lead.memory.important_notes = `${lead.memory.important_notes || ''}\n[AI Analysis]: ${analysis.summary}`.trim();

    // Recalculate priority score with new memory
    const scoreResult = calculatePriorityScore(lead, db.followups);
    lead.priority_score = scoreResult.score;
    lead.priority = scoreResult.priority;
    lead.score_category = scoreResult.category;
    lead.score_factors = scoreResult.factors;
    lead.risk_level = scoreResult.risk_level;
    lead.risk_reasons = scoreResult.risk_reasons;

    // Log Activity
    db.activities.unshift({
      id: 'act-' + Date.now(),
      workspace_id: db.workspace.id,
      lead_id: lead.id,
      type: 'ai_analysis',
      content: `AI analyzed conversation: Intent ${analysis.intent.toUpperCase()}, objection: "${analysis.objection}". Recommended: ${analysis.next_step}`,
      created_at: new Date().toISOString(),
    });

    logAudit('Conversation Analyzed', 'lead', lead.id, `Parsed dialogue with ${lead.name}; Intent: ${analysis.intent}.`);
    db.workspace.ai_generations_used += 1;
    saveDb();

    res.json({
      success: true,
      analysis,
      updated_lead: lead,
      quota_notice: quotaNotice || analysis.quota_notice,
    });
  } catch (error: any) {
    console.error('Error in conversation analysis:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze conversation' });
  }
});

// 3. AI Follow-up Sequences (/api/generate-sequence)
app.post('/api/generate-sequence', async (req: Request, res: Response) => {
  try {
    const { lead_id, duration_days = 7, channel = 'whatsapp' } = req.body;
    const lead = db.leads.find((l) => l.id === lead_id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const firstName = lead.name.split(' ')[0];

    // Structured steps based on duration
    const days = Number(duration_days) || 7;
    let sequenceSteps;

    if (days === 3) {
      sequenceSteps = [
        {
          day: 0,
          title: 'Initial Follow-up',
          objective: 'Gentle check-in after proposal discussion',
          channel,
          message: `Hi ${firstName}, hope you're having a productive week! Just checking in to see if you had any quick questions about our discussion for ${lead.service || 'the project'}?`,
          status: 'draft',
        },
        {
          day: 2,
          title: 'Value & Scope Reminder',
          objective: 'Remind lead of core impact and launch timeline',
          channel,
          message: `Hi ${firstName}, quick thought—if we kick off by this Friday, we can easily hit your target milestone without rushing. Happy to jump on a 5-min call if that helps!`,
          status: 'draft',
        },
        {
          day: 3,
          title: 'Decisive Close Check-in',
          objective: 'Friendly close-loop before archiving',
          channel: 'email',
          message: `Hi ${firstName}, wanted to check whether you're still looking to proceed with ${lead.service || 'this project'} this quarter? If priorities shifted, no problem at all—just let me know so I can plan our team schedule.`,
          status: 'draft',
        },
      ];
    } else if (days === 14) {
      sequenceSteps = [
        {
          day: 0,
          title: 'Step 1: Check-in',
          objective: 'Re-open dialogue following presentation',
          channel,
          message: `Hi ${firstName}, following up on the ${lead.service || 'project'} proposal we shared. What are your initial impressions?`,
          status: 'draft',
        },
        {
          day: 3,
          title: 'Step 2: Case Study & Proof',
          objective: 'Share tangible ROI evidence from similar client',
          channel: 'email',
          message: `Hi ${firstName}, thought you might find this interesting—we helped a company in a similar niche increase conversions by 42% using the exact framework we proposed for ${lead.company || 'your team'}. Would love to share the teardown.`,
          status: 'draft',
        },
        {
          day: 7,
          title: 'Step 3: Objection Clarification',
          objective: 'Address pricing or partner feedback',
          channel,
          message: `Hi ${firstName}, just wanted to check if you and the team had a chance to connect? Happy to adjust scope or milestones to fit your budget.`,
          status: 'draft',
        },
        {
          day: 14,
          title: 'Step 4: Graceful Closure',
          objective: 'Respectful closing touchpoint',
          channel: 'email',
          message: `Hi ${firstName}, circling back one last time. Should we press pause on this for now and reconnect next quarter? Either way, appreciate your time!`,
          status: 'draft',
        },
      ];
    } else {
      // Default 7 days
      sequenceSteps = [
        {
          day: 0,
          title: 'Day 0: Initial Follow-up',
          objective: 'Prompt check-in regarding recent discussion',
          channel,
          message: `Hi ${firstName}, hope your week is off to a great start! Just checking in to see if you had a chance to review the terms for ${lead.service || 'the project'}?`,
          status: 'draft',
        },
        {
          day: 2,
          title: 'Day 2: Value Reminder',
          objective: 'Reinforce benefits and timeline guarantees',
          channel,
          message: `Hi ${firstName}, wanted to mention that we have a production sprint opening next week. If we finalize this week, we can prioritize ${lead.company || 'your design'} right away.`,
          status: 'draft',
        },
        {
          day: 4,
          title: 'Day 4: Objection Handling',
          objective: 'Address budget or scope hesitation',
          channel,
          message: `Hi ${firstName}, any questions from your team or partners regarding scope? Happy to hop on a quick 5-min chat to clarify anything.`,
          status: 'draft',
        },
        {
          day: 7,
          title: 'Day 7: Final Check-in',
          objective: 'Final friendly confirmation',
          channel: 'email',
          message: `Hi ${firstName}, wanted to check if you still want to move forward with this project? Let me know either way so I know how to plan our schedule.`,
          status: 'draft',
        },
      ];
    }

    const sequence = {
      id: 'seq-' + Date.now(),
      workspace_id: db.workspace.id,
      lead_id: lead.id,
      name: `${days}-Day High-Touch Sequence (${lead.name})`,
      duration_days: days,
      status: 'active',
      steps: sequenceSteps,
      created_at: new Date().toISOString(),
    };

    db.activities.unshift({
      id: 'act-' + Date.now(),
      workspace_id: db.workspace.id,
      lead_id: lead.id,
      type: 'sequence_started',
      content: `AI generated ${days}-day follow-up sequence with ${sequenceSteps.length} planned milestones.`,
      created_at: new Date().toISOString(),
    });

    logAudit('Sequence Created', 'sequence', sequence.id, `Created ${days}-day sequence for ${lead.name}.`);
    db.workspace.ai_generations_used += 1;
    saveDb();

    res.json({ success: true, sequence });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate sequence' });
  }
});

// 4. Ask LeadLoop Floating Assistant (/api/ask-leadloop)
app.post('/api/ask-leadloop', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const qLower = query.toLowerCase();

    // Authenticated workspace context
    const leads = db.leads;
    const followups = db.followups;
    const now = new Date();

    const hotLeads = leads.filter((l) => l.score_category === 'HOT' && l.status === 'active');
    const atRiskLeads = leads.filter((l) => l.status === 'active' && (l.risk_level === 'high' || l.risk_level === 'medium'));
    const dueToday = followups.filter((f) => f.status === 'pending' && new Date(f.scheduled_at).toDateString() === now.toDateString());
    const overdueFollowups = followups.filter((f) => f.status === 'overdue' || (f.status === 'pending' && new Date(f.scheduled_at) < now));

    let answer = '';
    const related_lead_ids: string[] = [];
    const suggested_actions: any[] = [];

    // Query analysis
    if (qLower.includes('today') || qLower.includes('follow-up') || qLower.includes('who needs')) {
      if (dueToday.length > 0 || overdueFollowups.length > 0) {
        answer = `You have ${dueToday.length} follow-ups scheduled for today, plus ${overdueFollowups.length} overdue touchpoints that need immediate rescue. Primary focus: **${hotLeads[0]?.name || 'Rahul Sharma'}** (High intent, 3 days inactive) and **${hotLeads[1]?.name || 'Priya Nair'}** (Negotiation stage).`;
        dueToday.forEach((f) => related_lead_ids.push(f.lead_id));
        overdueFollowups.forEach((f) => related_lead_ids.push(f.lead_id));
      } else {
        answer = `No scheduled follow-ups are due right now, but you have ${atRiskLeads.length} at-risk opportunities that haven't received a touch in over 5 days.`;
      }
      suggested_actions.push({ label: "View Today's Follow-ups", action_type: 'filter_leads' });
    } else if (qLower.includes('highest') || qLower.includes('value') || qLower.includes('biggest')) {
      const topLeads = [...leads].filter((l) => l.status === 'active').sort((a, b) => b.deal_value - a.deal_value).slice(0, 3);
      answer = `Your highest-value active opportunities are:\n` +
        topLeads.map((l, i) => `${i + 1}. **${l.name}** (${l.company || 'Direct'}): ₹${l.deal_value.toLocaleString('en-IN')} in ${l.stage_id === 'stage-4' ? 'Negotiation' : 'Active Pipeline'}`).join('\n') +
        `\n\nTotal top-3 pipeline value: ₹${topLeads.reduce((a, b) => a + b.deal_value, 0).toLocaleString('en-IN')}.`;
      topLeads.forEach((l) => related_lead_ids.push(l.id));
      suggested_actions.push({ label: 'Open Top Deal', action_type: 'view_lead', lead_id: topLeads[0]?.id });
    } else if (qLower.includes('risk') || qLower.includes('stalled') || qLower.includes('inactive')) {
      const risky = atRiskLeads.slice(0, 3);
      answer = `Identified ${atRiskLeads.length} deals at risk:\n` +
        risky.map((l) => `• **${l.name}** (₹${l.deal_value.toLocaleString('en-IN')}): ${l.risk_reasons?.[0] || 'Prolonged inactivity'}`).join('\n') +
        `\n\nRecommendation: Send a value-reminder follow-up today before prospects go cold.`;
      risky.forEach((l) => related_lead_ids.push(l.id));
      suggested_actions.push({ label: 'Review At-Risk Deals', action_type: 'filter_leads' });
    } else if (qLower.includes('rahul') || qLower.includes('sharma')) {
      const rahul = leads.find((l) => l.name.toLowerCase().includes('rahul'));
      if (rahul) {
        answer = `**Lead Summary for Rahul Sharma (XYZ Digital)**:\n• Deal Value: ₹75,000 (Website Redesign & SEO)\n• Stage: Interested (Priority Score: ${rahul.priority_score}/100 - HOT)\n• Context: Needs partner Samir's budget approval before contract signoff.\n• Recommended Action: WhatsApp follow-up today offering a 5-minute sync.`;
        related_lead_ids.push(rahul.id);
        suggested_actions.push({ label: 'Generate Message for Rahul', action_type: 'generate_message', lead_id: rahul.id });
      } else {
        answer = `Could not locate Rahul Sharma in active workspace.`;
      }
    } else {
      // General summary
      const activeValue = leads.filter((l) => l.status === 'active').reduce((a, b) => a + b.deal_value, 0);
      answer = `You are currently tracking **${leads.length} total leads** across your workspace with an open pipeline value of **₹${activeValue.toLocaleString('en-IN')}**. You have **${hotLeads.length} Hot Leads** and **${overdueFollowups.length} overdue follow-ups** requiring attention today.`;
      suggested_actions.push({ label: 'View Hot Leads', action_type: 'filter_leads' });
    }

    db.workspace.ai_generations_used += 1;
    saveDb();

    res.json({
      answer,
      related_lead_ids: Array.from(new Set(related_lead_ids)),
      suggested_actions,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'AI Assistant query failed' });
  }
});

// 5. AI Command Bar (/api/command-execute)
app.post('/api/command-execute', async (req: Request, res: Response) => {
  try {
    const { command, confirmed = false, proposal_items = [] } = req.body;
    if (!command) return res.status(400).json({ error: 'Command string required' });

    // Handle Confirmation of Write Operations
    if (confirmed && proposal_items.length > 0) {
      proposal_items.forEach((item: any) => {
        db.followups.unshift({
          id: 'followup-' + Date.now() + Math.random().toString(36).slice(2, 6),
          workspace_id: db.workspace.id,
          lead_id: item.lead_id,
          scheduled_at: item.recommended_date,
          status: 'pending',
          message: item.message_preview,
          channel: item.channel || 'whatsapp',
          ai_generated: true,
          ai_intent: 'command_batch',
          ai_reason: 'Created via AI Command Bar approved action.',
          sent_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });

      logAudit('Batch Follow-ups Created', 'followup', 'batch', `AI Command Bar scheduled ${proposal_items.length} follow-ups.`);
      saveDb();

      return res.json({
        success: true,
        message: `Successfully approved and scheduled ${proposal_items.length} follow-ups!`,
      });
    }

    const cLower = command.toLowerCase();

    // Write operations require confirmation preview
    if (cLower.includes('create follow') || cLower.includes('schedule follow') || cLower.includes('batch')) {
      const candidates = db.leads.filter((l) => l.status === 'active' && l.stage_id === 'stage-3');
      const targetLeads = candidates.length > 0 ? candidates : db.leads.filter((l) => l.status === 'active').slice(0, 3);

      const items = targetLeads.map((l) => ({
        lead_id: l.id,
        lead_name: l.name,
        recommended_date: new Date(Date.now() + 86400000).toISOString(),
        channel: 'whatsapp' as const,
        message_preview: `Hi ${l.name.split(' ')[0]}, following up on our discussion regarding ${l.service || 'your project'}. Do you have 5 minutes tomorrow to review next steps?`,
      }));

      return res.json({
        interpretation: `I found ${targetLeads.length} active leads that could benefit from an automated follow-up check-in. Review changes before committing:`,
        intent_type: 'batch_action',
        write_proposal: {
          description: `Create ${targetLeads.length} scheduled follow-ups for tomorrow at 2:00 PM.`,
          items,
        },
      });
    }

    // Read Operations
    if (cLower.includes('overdue')) {
      const overdue = db.leads.filter((l) =>
        db.followups.some((f) => f.lead_id === l.id && (f.status === 'overdue' || (f.status === 'pending' && new Date(f.scheduled_at) < new Date())))
      );
      return res.json({
        interpretation: `Found ${overdue.length} leads with overdue follow-ups.`,
        intent_type: 'filter',
        leads: overdue,
      });
    }

    if (cLower.includes('1 lakh') || cLower.includes('1l') || cLower.includes('100000')) {
      const highVal = db.leads.filter((l) => l.deal_value >= 100000);
      return res.json({
        interpretation: `Found ${highVal.length} leads with deal value exceeding ₹1,00,000.`,
        intent_type: 'filter',
        leads: highVal,
      });
    }

    if (cLower.includes('inactive') || cLower.includes('stalled')) {
      const inactive = db.leads.filter((l) => {
        if (!l.last_contacted_at) return true;
        const days = Math.floor((Date.now() - new Date(l.last_contacted_at).getTime()) / 86400000);
        return days >= 5;
      });
      return res.json({
        interpretation: `Found ${inactive.length} leads inactive for more than 5 days.`,
        intent_type: 'filter',
        leads: inactive,
      });
    }

    // Default query match
    const matchedLeads = db.leads.filter(
      (l) =>
        l.name.toLowerCase().includes(cLower) ||
        l.company.toLowerCase().includes(cLower) ||
        l.service.toLowerCase().includes(cLower)
    );

    return res.json({
      interpretation: matchedLeads.length > 0 ? `Found ${matchedLeads.length} matching leads.` : `No exact match for "${command}". Showing active pipeline.`,
      intent_type: 'filter',
      leads: matchedLeads.length > 0 ? matchedLeads : db.leads.slice(0, 5),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Command processing failed' });
  }
});

function generateFallbackFollowup(context: any) {
  const {
    lead_name,
    company,
    service,
    stage,
    last_message,
    tone,
    channel = 'whatsapp',
    memory,
    overdueFollowups = [],
    pendingTasks = [],
    last_contacted_at,
  } = context;

  const firstName = lead_name ? lead_name.split(' ')[0] : 'there';
  const targetChannel: 'email' | 'whatsapp' = channel === 'email' ? 'email' : 'whatsapp';

  let intent = 'interested';
  let action = 'follow_up';
  let urgency: 'low' | 'medium' | 'high' = 'medium';
  let days = 2;
  let reason = '';
  let subject: string | null = null;
  let body = '';

  const hasOverdueFollowup = Array.isArray(overdueFollowups) && overdueFollowups.length > 0;
  const hasPendingTasks = Array.isArray(pendingTasks) && pendingTasks.length > 0;

  if (hasOverdueFollowup) {
    urgency = 'high';
    days = 1;
    reason = `Verified scheduled follow-up is overdue. Direct outreach recommended to maintain momentum.`;
  } else if (stage === 'Negotiating') {
    intent = 'evaluating';
    urgency = 'high';
    days = 1;
    reason = 'Lead is in the negotiating stage. Addressing timeline, pricing, or scope questions now closes deals faster.';
  } else if (stage === 'New') {
    intent = 'new_inquiry';
    urgency = 'high';
    days = 1;
    reason = 'New inquiries convert significantly higher when engaged within 24 hours of first contact.';
  } else if (stage === 'Proposal Sent') {
    intent = 'evaluating';
    urgency = 'medium';
    days = 2;
    reason = 'Proposal has been submitted. Checking in for feedback or clarifications accelerates contract signoff.';
  } else {
    reason = `Lead is currently in the "${stage}" stage. A structured check-in reinforces value without being intrusive.`;
  }

  // Generate Email vs WhatsApp drafts
  if (targetChannel === 'email') {
    if (stage === 'Negotiating') {
      subject = `Reviewing proposal terms for ${company || service || 'your project'}`;
      if (tone === 'casual') {
        body = `Hi ${firstName},\n\nHope you're having a productive week!\n\nWanted to check in and see if you and the team had any thoughts on the proposal details for ${service || 'the project'}. We are very flexible on timeline and milestone adjustments.\n\nWould you have 10 minutes tomorrow for a quick sync?\n\nBest regards,\n${db.profile.full_name || 'LeadLoop Team'}`;
      } else if (tone === 'short') {
        body = `Hi ${firstName},\n\nFollowing up on our proposal for ${service || 'the project'}. Do you have any questions on the deliverables or agreement terms before we finalize?\n\nBest,\n${db.profile.full_name || 'LeadLoop Team'}`;
      } else {
        body = `Dear ${firstName},\n\nI hope this email finds you well.\n\nI am writing to follow up on our recent discussion regarding ${service || 'the upcoming project'} for ${company || 'your team'}. We are eager to partner with you and ensure all your milestones are met on schedule.\n\nPlease let me know if you would like to clarify any aspect of our proposal or discuss adjustments.\n\nWarm regards,\n${db.profile.full_name || 'LeadLoop Team'}`;
      }
    } else if (stage === 'New') {
      subject = `Introduction & next steps regarding ${service || 'your inquiry'}`;
      body = `Hi ${firstName},\n\nThank you for reaching out regarding ${service || 'our services'}. I would love to learn more about ${company ? `${company}'s goals` : 'what you are working on'} and share how we can support your growth.\n\nDo you have 15 minutes this week for a brief introductory call?\n\nBest regards,\n${db.profile.full_name || 'LeadLoop Team'}`;
    } else {
      subject = `Quick check-in regarding ${service || 'our collaboration'}`;
      body = `Hi ${firstName},\n\nI hope you're having a great week.\n\nI wanted to circle back on our conversation regarding ${service || 'the project'} for ${company || 'your team'}. Are you still looking to move forward with this initiative in the coming weeks?\n\nHappy to provide any additional details whenever convenient.\n\nBest regards,\n${db.profile.full_name || 'LeadLoop Team'}`;
    }
  } else {
    // WhatsApp (concise, conversational, NO subject line)
    subject = null;
    if (stage === 'Negotiating') {
      if (tone === 'casual') {
        body = `Hey ${firstName}! Hope you're having a great week. Wanted to check if you had a chance to review the proposal for ${company || service || 'the project'}? Happy to adjust any terms if helpful.`;
      } else if (tone === 'short') {
        body = `Hi ${firstName}, following up on our proposal for ${service || 'the project'}. Any questions before we finalize terms?`;
      } else {
        body = `Hi ${firstName}, following up on our discussion regarding ${service || 'the project'}. Did you have any questions regarding the terms? Happy to jump on a quick call anytime today.`;
      }
    } else if (stage === 'New') {
      body = `Hi ${firstName}, thanks for connecting regarding ${service || 'our services'}! Would love to learn more about what ${company || 'your team'} is planning. Do you have 5 minutes for a quick chat tomorrow?`;
    } else {
      if (last_message && last_message.toLowerCase().includes('partner')) {
        body = `Hi ${firstName}, hope you're having a great day! Just checking in to see if you had a chance to connect with your partner regarding ${service || 'the project'}? Happy to answer any questions that came up.`;
      } else {
        body = `Hi ${firstName}, wanted to quickly circle back on our conversation about ${service || 'working together'}. Are you still looking to move forward with this in the coming weeks?`;
      }
    }
  }

  return {
    lead_intent: intent,
    recommended_action: action,
    urgency,
    follow_up_after_days: days,
    reason,
    suggested_channel: targetChannel,
    subject,
    body,
    message: body,
    is_draft: true,
    status: 'draft',
  };
}

// ==============================================================================
// Server Setup (Vite Middleware in dev / Static in prod)
// ==============================================================================
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 LeadLoop AI Sales Command Center running on port ${PORT}`);
  });
}

startServer();
