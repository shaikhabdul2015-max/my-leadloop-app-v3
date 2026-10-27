import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UserProfile, 
  Workspace, 
  Subscription, 
  PipelineStage, 
  Lead, 
  Followup, 
  LeadActivity, 
  LeadMessage, 
  InAppNotification, 
  AIFollowUpResponse,
  PlanType,
  ToneOption,
  ChannelOption,
  ActivityType,
  BehavioralSignalType,
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
  CommandBarActionProposal,
  CommandExecutionResult,
  LeadActivityLog,
  ActivityLogChannel
} from '../types';
import { api } from '../services/api';
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
  INITIAL_CADENCES
} from '../utils/demoData';
import { DEFAULT_STAGES, calculatePriorityScore, calculatePredictiveForecast } from '../utils/crmUtils';
import { subscribeToLeadRealtime, RealtimeStatus } from '../utils/supabaseClient';

export type AppView = 
  | 'landing' 
  | 'onboarding' 
  | 'dashboard' 
  | 'leads' 
  | 'lead-detail' 
  | 'pipeline' 
  | 'followups' 
  | 'analytics' 
  | 'settings' 
  | 'auth'
  | 'suite';

export type AuthMode = 'login' | 'signup' | 'forgot';

interface AppContextType {
  isAuthenticated: boolean;
  user: UserProfile;
  workspace: Workspace;
  subscription: Subscription;
  teamMembers: WorkspaceMember[];
  stages: PipelineStage[];
  leads: Lead[];
  followups: Followup[];
  activities: LeadActivity[];
  messages: LeadMessage[];
  tasks: TaskItem[];
  automations: AutomationRule[];
  integrations: OmnichannelIntegration[];
  auditLogs: AuditLog[];
  notifications: InAppNotification[];
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  
  // Modals & Panels
  isAddLeadModalOpen: boolean;
  setIsAddLeadModalOpen: (open: boolean) => void;
  isAIModalOpen: boolean;
  aiModalLead: Lead | null;
  openAIModal: (lead: Lead) => void;
  closeAIModal: () => void;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;

  // New Modals for Intelligence features
  isAnalyzeModalOpen: boolean;
  analyzeModalLead: Lead | null;
  openAnalyzeModal: (lead: Lead) => void;
  closeAnalyzeModal: () => void;

  isSequenceModalOpen: boolean;
  sequenceModalLead: Lead | null;
  openSequenceModal: (lead: Lead) => void;
  closeSequenceModal: () => void;

  isScoreWhyModalOpen: boolean;
  scoreWhyLead: Lead | null;
  openScoreWhyModal: (lead: Lead) => void;
  closeScoreWhyModal: () => void;

  isCommandBarOpen: boolean;
  setIsCommandBarOpen: (open: boolean) => void;
  isAskAIOpen: boolean;
  setIsAskAIOpen: (open: boolean) => void;

  // Actions
  addLead: (leadData: Partial<Lead>) => Promise<Lead>;
  updateLead: (id: string, leadData: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  changeLeadStage: (leadId: string, newStageId: string) => Promise<void>;
  scheduleFollowup: (
    leadId: string, 
    scheduledAt: string, 
    message: string, 
    channel: ChannelOption,
    aiGenerated?: boolean,
    aiIntent?: string,
    aiReason?: string
  ) => Promise<Followup>;
  completeFollowup: (followupId: string) => Promise<void>;
  cancelFollowup: (followupId: string) => Promise<void>;
  rescheduleFollowup: (followupId: string, newDate: string) => Promise<void>;
  addActivity: (leadId: string, type: ActivityType | BehavioralSignalType | string, content: string, channel?: string) => Promise<void>;
  generateAIFollowup: (lead: Lead, overrides?: { tone?: ToneOption; channel?: ChannelOption; notes?: string }) => Promise<AIFollowUpResponse>;
  analyzeConversation: (leadId: string, text: string, notes?: string) => Promise<ConversationAnalysis>;
  generateSequence: (leadId: string, days: number, channel?: string) => Promise<FollowupSequence>;
  askLeadLoop: (query: string) => Promise<AskLeadLoopResponse>;
  executeCommand: (command: string, confirmed?: boolean, items?: CommandBarActionProposal['items']) => Promise<CommandExecutionResult>;
  createTask: (data: Partial<TaskItem>) => Promise<TaskItem>;
  updateTask: (id: string, data: Partial<TaskItem>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleAutomation: (id: string, isActive: boolean) => Promise<void>;
  finishOnboarding: (data: {
    full_name: string;
    business_type: string;
    product_description: string;
    preferred_tone: ToneOption;
    workspace_name: string;
  }) => Promise<void>;
  upgradePlan: (plan: PlanType) => Promise<void>;
  resetDemo: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Enterprise Intelligence & Automation (Phases 4, 6, 8, 10, 11, 13, 14)
  realtimeStatus: RealtimeStatus;
  battlecards: Battlecard[];
  scoreHistory: ScoreHistory[];
  competitorMentions: CompetitorMention[];
  cadences: Cadence[];
  forecast: Forecast | null;
  triggerScoreDecay: (thresholdDays?: number, decayPct?: number) => Promise<void>;
  detectCompetitor: (text: string, leadId?: string) => Promise<{ detected: boolean; mention?: CompetitorMention; battlecard?: Battlecard }>;
  saveBattlecard: (card: Partial<Battlecard>) => Promise<void>;
  createCadence: (data: { lead_id: string; name: string; steps: any[] }) => Promise<Cadence>;
  triggerCadenceFallbacks: () => Promise<number>;
  sendOmnichannelMessage: (data: { lead_id: string; cadence_id?: string; channel: string; message: string; idempotency_key: string }) => Promise<void>;
  transcribeAudio: (text: string, leadId?: string) => Promise<TranscriptionResult>;

  // Verified Lead Activity Logs (Audited Execution History)
  leadActivityLogs: Record<string, LeadActivityLog[]>;
  fetchLeadActivityLogs: (leadId: string) => Promise<LeadActivityLog[]>;
  logLeadActivity: (leadId: string, data: { agent_name?: string; channel: ActivityLogChannel; message_body: string; executed_at?: string }) => Promise<LeadActivityLog>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile>(INITIAL_PROFILE);
  const [workspace, setWorkspace] = useState<Workspace>(INITIAL_WORKSPACE);
  const [subscription, setSubscription] = useState<Subscription>(INITIAL_SUBSCRIPTION);
  const [teamMembers, setTeamMembers] = useState<WorkspaceMember[]>(INITIAL_TEAM_MEMBERS);
  const [stages, setStages] = useState<PipelineStage[]>(DEFAULT_STAGES);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [followups, setFollowups] = useState<Followup[]>(INITIAL_FOLLOWUPS);
  const [activities, setActivities] = useState<LeadActivity[]>(INITIAL_ACTIVITIES);
  const [messages, setMessages] = useState<LeadMessage[]>(INITIAL_MESSAGES);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [automations, setAutomations] = useState<AutomationRule[]>(INITIAL_AUTOMATIONS);
  const [integrations, setIntegrations] = useState<OmnichannelIntegration[]>(INITIAL_INTEGRATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // Enterprise Intelligence & Automation States
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('disabled');
  const [battlecards, setBattlecards] = useState<Battlecard[]>(INITIAL_BATTLECARDS);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>(INITIAL_SCORE_HISTORY);
  const [competitorMentions, setCompetitorMentions] = useState<CompetitorMention[]>(INITIAL_COMPETITOR_MENTIONS);
  const [cadences, setCadences] = useState<Cadence[]>(INITIAL_CADENCES);
  const [forecast, setForecast] = useState<Forecast | null>(() => 
    calculatePredictiveForecast(INITIAL_LEADS, DEFAULT_STAGES, INITIAL_TEAM_MEMBERS)
  );
  const [leadActivityLogs, setLeadActivityLogs] = useState<Record<string, LeadActivityLog[]>>({});

  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Modals state
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiModalLead, setAiModalLead] = useState<Lead | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Intelligence Modals
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [analyzeModalLead, setAnalyzeModalLead] = useState<Lead | null>(null);
  const [isSequenceModalOpen, setIsSequenceModalOpen] = useState(false);
  const [sequenceModalLead, setSequenceModalLead] = useState<Lead | null>(null);
  const [isScoreWhyModalOpen, setIsScoreWhyModalOpen] = useState(false);
  const [scoreWhyLead, setScoreWhyLead] = useState<Lead | null>(null);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isAskAIOpen, setIsAskAIOpen] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Compute In-App Notifications
  const refreshNotifications = useCallback((leadList: Lead[], followupList: Followup[], taskList: TaskItem[]) => {
    const list: InAppNotification[] = [];
    const now = new Date();

    followupList.forEach((f) => {
      const lead = leadList.find((l) => l.id === f.lead_id);
      const leadName = lead ? lead.name : 'Lead';
      const scheduled = new Date(f.scheduled_at);

      if (f.status === 'overdue' || (f.status === 'pending' && scheduled < now)) {
        list.push({
          id: `notif-overdue-${f.id}`,
          title: `Overdue Touch: ${leadName}`,
          message: `Scheduled follow-up for ${leadName} was missed on ${scheduled.toLocaleDateString()}. Re-engage now!`,
          lead_id: f.lead_id,
          type: 'overdue',
          read: false,
          created_at: f.scheduled_at,
        });
      } else if (f.status === 'pending' && scheduled.toDateString() === now.toDateString()) {
        list.push({
          id: `notif-today-${f.id}`,
          title: `Follow-up Due Today: ${leadName}`,
          message: `You have a ${f.channel} follow-up scheduled with ${leadName} today.`,
          lead_id: f.lead_id,
          type: 'due',
          read: false,
          created_at: f.created_at,
        });
      }
    });

    // High Priority & At-Risk Deals
    leadList.forEach((l) => {
      if (l.status === 'active' && l.risk_level === 'high') {
        list.push({
          id: `notif-risk-${l.id}`,
          title: `⚠️ Deal at Risk: ${l.name}`,
          message: `${l.name} (${l.company || 'Direct'}): ${l.risk_reasons?.[0] || 'No recent activity on high-value opportunity'}.`,
          lead_id: l.id,
          type: 'at_risk',
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    });

    // Tasks due
    taskList.forEach((t) => {
      if (t.status !== 'completed' && new Date(t.due_date).toDateString() === now.toDateString()) {
        list.push({
          id: `notif-task-${t.id}`,
          title: `Task Due Today: ${t.title}`,
          message: t.description || 'Assigned sales task needs action.',
          lead_id: t.lead_id,
          type: 'task_due',
          read: false,
          created_at: t.created_at,
        });
      }
    });

    setNotifications(list);
  }, []);

  // Fetch initial data from server
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getWorkspaceData();
      setUser(data.profile);
      setWorkspace(data.workspace);
      setSubscription(data.subscription);
      setTeamMembers(data.team_members || INITIAL_TEAM_MEMBERS);
      setStages(data.stages);
      setLeads(data.leads);
      setFollowups(data.followups);
      setActivities(data.activities);
      setMessages(data.messages);
      setTasks(data.tasks || INITIAL_TASKS);
      setAutomations(data.automations || INITIAL_AUTOMATIONS);
      setIntegrations(data.integrations || INITIAL_INTEGRATIONS);
      setAuditLogs(data.audit_logs || INITIAL_AUDIT_LOGS);
      if (data.battlecards) setBattlecards(data.battlecards);
      if (data.score_history) setScoreHistory(data.score_history);
      if (data.competitor_mentions) setCompetitorMentions(data.competitor_mentions);
      if (data.cadences) setCadences(data.cadences);
      if (data.forecast) setForecast(data.forecast);
      refreshNotifications(data.leads, data.followups, data.tasks || INITIAL_TASKS);
    } catch (err) {
      console.warn('Backend data load note: Using demo store fallback', err);
      refreshNotifications(INITIAL_LEADS, INITIAL_FOLLOWUPS, INITIAL_TASKS);
    } finally {
      setIsLoading(false);
    }
  }, [refreshNotifications]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Phase 4: Proper Supabase Realtime synchronization for lead changes
  useEffect(() => {
    const unsubscribe = subscribeToLeadRealtime({
      onInsert: (newLead) => {
        setLeads((prev) => (prev.some((l) => l.id === newLead.id) ? prev : [newLead, ...prev]));
        showToast(`Realtime Sync: New lead "${newLead.name}" synced`, 'info');
      },
      onUpdate: (updatedLead) => {
        setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? { ...l, ...updatedLead } : l)));
      },
      onDelete: (deletedId) => {
        setLeads((prev) => prev.filter((l) => l.id !== deletedId));
      },
      onStatusChange: (status) => {
        setRealtimeStatus(status);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [showToast]);

  // Global Keyboard Shortcut for Command Bar (Ctrl + K or Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandBarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Actions
  const addLead = async (leadData: Partial<Lead>): Promise<Lead> => {
    try {
      const created = await api.createLead(leadData);
      setLeads((prev) => [created, ...prev]);
      showToast(`Lead "${created.name}" created with Score: ${created.priority_score} (${created.score_category})`, 'success');
      return created;
    } catch (err: any) {
      if (err.message && err.message.includes('free plan limit')) {
        setIsUpgradeModalOpen(true);
      }
      showToast(err.message || 'Failed to add lead', 'error');
      throw err;
    }
  };

  const updateLead = async (id: string, leadData: Partial<Lead>) => {
    try {
      const updated = await api.updateLead(id, leadData);
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      showToast('Lead intelligence & stage updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update lead', 'error');
      throw err;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      await api.deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setFollowups((prev) => prev.filter((f) => f.lead_id !== id));
      setActivities((prev) => prev.filter((a) => a.lead_id !== id));
      setMessages((prev) => prev.filter((m) => m.lead_id !== id));
      setTasks((prev) => prev.filter((t) => t.lead_id !== id));
      if (selectedLeadId === id) setSelectedLeadId(null);
      showToast('Lead deleted from workspace', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete lead', 'error');
    }
  };

  const changeLeadStage = async (leadId: string, newStageId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const stage = stages.find((s) => s.id === newStageId);
    const stageName = stage ? stage.name : 'Updated';

    try {
      const updated = await api.updateLead(leadId, { stage_id: newStageId });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      
      const newAct: LeadActivity = {
        id: 'act-' + Date.now(),
        workspace_id: workspace.id,
        lead_id: leadId,
        type: 'status_change',
        content: `Stage changed to ${stageName}. Priority recalculated: ${updated.priority_score} (${updated.score_category}).`,
        created_at: new Date().toISOString(),
      };
      setActivities((prev) => [newAct, ...prev]);

      showToast(`${lead.name} moved to ${stageName}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update stage', 'error');
    }
  };

  const scheduleFollowup = async (
    leadId: string, 
    scheduledAt: string, 
    message: string, 
    channel: ChannelOption,
    aiGenerated = false,
    aiIntent?: string,
    aiReason?: string
  ): Promise<Followup> => {
    try {
      const created = await api.createFollowup({
        lead_id: leadId,
        scheduled_at: scheduledAt,
        message,
        channel,
        ai_generated: aiGenerated,
        ai_intent: aiIntent,
        ai_reason: aiReason,
      });

      setFollowups((prev) => [created, ...prev]);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, next_followup_at: scheduledAt } : l))
      );

      const act: LeadActivity = {
        id: 'act-' + Date.now(),
        workspace_id: workspace.id,
        lead_id: leadId,
        type: 'followup',
        content: `Follow-up scheduled for ${new Date(scheduledAt).toLocaleDateString()} via ${channel}`,
        channel,
        created_at: new Date().toISOString(),
      };
      setActivities((prev) => [act, ...prev]);

      showToast('Follow-up approved & scheduled!', 'success');
      return created;
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule follow-up', 'error');
      throw err;
    }
  };

  const completeFollowup = async (followupId: string) => {
    try {
      const updated = await api.updateFollowup(followupId, { status: 'completed' });
      setFollowups((prev) => prev.map((f) => (f.id === followupId ? updated : f)));
      
      const nowIso = new Date().toISOString();
      const followup = followups.find((f) => f.id === followupId);
      if (followup) {
        setLeads((prev) =>
          prev.map((l) => {
            if (l.id === followup.lead_id) {
              const recalculated = calculatePriorityScore({ ...l, last_contacted_at: nowIso }, followups);
              return {
                ...l,
                last_contacted_at: nowIso,
                priority: recalculated.priority,
                priority_score: recalculated.score,
                score_category: recalculated.category,
                score_factors: recalculated.factors,
                risk_level: recalculated.risk_level,
                risk_reasons: recalculated.risk_reasons,
              };
            }
            return l;
          })
        );

        const newAct: LeadActivity = {
          id: 'act-' + Date.now(),
          workspace_id: workspace.id,
          lead_id: followup.lead_id,
          type: 'followup',
          content: `Follow-up completed via ${followup.channel}: "${followup.message?.slice(0, 60)}..."`,
          channel: followup.channel,
          created_at: nowIso,
        };
        setActivities((prev) => [newAct, ...prev]);

        if (followup.message) {
          const newMsg: LeadMessage = {
            id: 'msg-' + Date.now(),
            workspace_id: workspace.id,
            lead_id: followup.lead_id,
            followup_id: followup.id,
            content: followup.message,
            channel: followup.channel,
            direction: 'outbound',
            created_at: nowIso,
          };
          setMessages((prev) => [newMsg, ...prev]);
        }
      }

      showToast('Follow-up marked completed & logged to timeline!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to complete follow-up', 'error');
    }
  };

  const cancelFollowup = async (followupId: string) => {
    try {
      const updated = await api.updateFollowup(followupId, { status: 'cancelled' });
      setFollowups((prev) => prev.map((f) => (f.id === followupId ? updated : f)));
      showToast('Follow-up cancelled', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel follow-up', 'error');
    }
  };

  const rescheduleFollowup = async (followupId: string, newDate: string) => {
    try {
      const updated = await api.updateFollowup(followupId, {
        scheduled_at: newDate,
        status: 'pending',
      });
      setFollowups((prev) => prev.map((f) => (f.id === followupId ? updated : f)));
      showToast(`Follow-up rescheduled to ${new Date(newDate).toLocaleDateString()}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reschedule follow-up', 'error');
    }
  };

  const addActivity = async (leadId: string, type: any, content: string, channel?: string) => {
    try {
      const created = {
        id: 'act-' + Date.now(),
        workspace_id: workspace.id,
        lead_id: leadId,
        type,
        content,
        channel,
        created_at: new Date().toISOString(),
      };
      setActivities((prev) => [created, ...prev]);
      
      if (['call', 'email', 'whatsapp', 'meeting'].includes(type)) {
        const nowIso = new Date().toISOString();
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, last_contacted_at: nowIso } : l))
        );
      }
      showToast('Activity logged', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add activity', 'error');
    }
  };

  const fetchLeadActivityLogs = useCallback(async (leadId: string): Promise<LeadActivityLog[]> => {
    try {
      const res = await api.getLeadActivityLogs(leadId);
      const logs = res.data || [];
      setLeadActivityLogs((prev) => ({
        ...prev,
        [leadId]: logs,
      }));
      return logs;
    } catch (err: any) {
      console.error('Error fetching lead activity logs:', err);
      return [];
    }
  }, []);

  const logLeadActivity = async (
    leadId: string,
    data: { agent_name?: string; channel: ActivityLogChannel; message_body: string; executed_at?: string }
  ): Promise<LeadActivityLog> => {
    try {
      const res = await api.logLeadActivity(leadId, {
        agent_name: data.agent_name || user.full_name || 'Sales Agent',
        channel: data.channel,
        message_body: data.message_body,
        executed_at: data.executed_at,
      });

      const loggedItem = res.data;

      // Update state for this lead
      setLeadActivityLogs((prev) => {
        const existing = prev[leadId] || [];
        if (existing.some((l) => l.id === loggedItem.id)) {
          return prev;
        }
        return {
          ...prev,
          [leadId]: [loggedItem, ...existing],
        };
      });

      // Update lead last_contacted_at
      const executedAt = loggedItem.executed_at;
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, last_contacted_at: executedAt } : l))
      );

      // Add to CRM activities feed as well
      const crmAct: LeadActivity = {
        id: 'act-' + Date.now(),
        workspace_id: workspace.id,
        lead_id: leadId,
        type: loggedItem.channel === 'phone' ? 'call' : (loggedItem.channel as any),
        content: `[${loggedItem.agent_name}] Executed ${loggedItem.channel.toUpperCase()}: "${loggedItem.message_body.slice(0, 75)}${loggedItem.message_body.length > 75 ? '...' : ''}"`,
        channel: loggedItem.channel,
        created_at: executedAt,
      };
      setActivities((prev) => [crmAct, ...prev]);

      if (res.duplicate_prevented) {
        showToast('Activity already logged moments ago (duplicate prevented)', 'info');
      } else {
        showToast(`Activity logged successfully via ${loggedItem.channel.toUpperCase()}`, 'success');
      }

      return loggedItem;
    } catch (err: any) {
      showToast(err.message || 'Failed to log lead activity', 'error');
      throw err;
    }
  };

  const generateAIFollowup = async (
    lead: Lead, 
    overrides?: { tone?: ToneOption; channel?: ChannelOption; notes?: string }
  ): Promise<AIFollowUpResponse> => {
    const stage = stages.find((s) => s.id === lead.stage_id)?.name || 'Interested';
    const leadMsgs = messages.filter((m) => m.lead_id === lead.id);
    const lastMsg = leadMsgs.length > 0 ? leadMsgs[0].content : '';

    const targetChannel = (overrides?.channel === 'email' ? 'email' : 'whatsapp') as ChannelOption;
    try {
      const result = await api.generateFollowup({
        lead_id: lead.id,
        leadId: lead.id,
        lead_name: lead.name,
        company: lead.company,
        service: lead.service,
        deal_value: lead.deal_value,
        stage,
        last_contacted_at: lead.last_contacted_at,
        last_message: lastMsg,
        notes: overrides?.notes || lead.notes,
        tone: overrides?.tone || user.preferred_tone,
        channel: targetChannel,
        memory: lead.memory,
      });

      setWorkspace((prev) => ({
        ...prev,
        ai_generations_used: result.usage?.used ?? prev.ai_generations_used + 1,
      }));
      setSubscription((prev) => ({
        ...prev,
        ai_generations_used: result.usage?.used ?? prev.ai_generations_used + 1,
      }));

      return result.data;
    } catch (err: any) {
      if (err.message && err.message.includes('AI generation limit')) {
        setIsUpgradeModalOpen(true);
      }
      throw err;
    }
  };

  // Conversation Analysis
  const analyzeConversation = async (leadId: string, text: string, notes?: string): Promise<ConversationAnalysis> => {
    try {
      const res = await api.analyzeConversation(leadId, text, notes);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? res.updated_lead : l)));

      const newAct: LeadActivity = {
        id: 'act-' + Date.now(),
        workspace_id: workspace.id,
        lead_id: leadId,
        type: 'ai_analysis',
        content: `AI analyzed conversation: Intent ${res.analysis.intent.toUpperCase()}; Objection: "${res.analysis.objection}". Next: ${res.analysis.next_step}`,
        created_at: new Date().toISOString(),
      };
      setActivities((prev) => [newAct, ...prev]);

      showToast(`Conversation analyzed! Lead score updated to ${res.updated_lead.priority_score} (${res.updated_lead.score_category})`, 'success');
      return res.analysis;
    } catch (err: any) {
      showToast(err.message || 'Failed to analyze conversation', 'error');
      throw err;
    }
  };

  // Sequence Generation
  const generateSequence = async (leadId: string, days: number, channel?: string): Promise<FollowupSequence> => {
    try {
      const res = await api.generateSequence(leadId, days, channel);
      showToast(`AI generated ${days}-day follow-up sequence with ${res.sequence.steps.length} touchpoints!`, 'success');
      return res.sequence;
    } catch (err: any) {
      showToast(err.message || 'Failed to generate sequence', 'error');
      throw err;
    }
  };

  // Ask LeadLoop
  const askLeadLoop = async (query: string): Promise<AskLeadLoopResponse> => {
    return api.askLeadLoop(query);
  };

  // Execute Command
  const executeCommand = async (
    command: string, 
    confirmed = false, 
    items: CommandBarActionProposal['items'] = []
  ): Promise<CommandExecutionResult> => {
    const res = await api.executeCommand(command, confirmed, items);
    if (confirmed) {
      await loadData();
      showToast(res.message || 'Changes executed successfully', 'success');
    }
    return res;
  };

  // Tasks
  const createTask = async (data: Partial<TaskItem>): Promise<TaskItem> => {
    try {
      const created = await api.createTask(data);
      setTasks((prev) => [created, ...prev]);
      showToast(`Task "${created.title}" created`, 'success');
      return created;
    } catch (err: any) {
      showToast(err.message || 'Failed to create task', 'error');
      throw err;
    }
  };

  const updateTask = async (id: string, data: Partial<TaskItem>) => {
    try {
      const updated = await api.updateTask(id, data);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast('Task updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update task', 'error');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast('Task removed', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  // Automations
  const toggleAutomation = async (id: string, isActive: boolean) => {
    try {
      const updated = await api.toggleAutomation(id, isActive);
      setAutomations((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(`Automation "${updated.name}" is now ${isActive ? 'Active' : 'Disabled'}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle automation', 'error');
    }
  };

  const finishOnboarding = async (data: {
    full_name: string;
    business_type: string;
    product_description: string;
    preferred_tone: ToneOption;
    workspace_name: string;
  }) => {
    try {
      const res = await api.saveOnboarding(data);
      setUser(res.profile);
      setWorkspace(res.workspace);
      setCurrentView('dashboard');
      showToast(`Welcome to LeadLoop AI, ${data.full_name}! Workspace created.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile', 'error');
    }
  };

  const upgradePlan = async (plan: PlanType) => {
    try {
      const res = await api.upgradePlan(plan);
      setSubscription(res.subscription);
      showToast(`Workspace upgraded to ${plan.toUpperCase()} plan! 🎉`, 'success');
      setIsUpgradeModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update plan', 'error');
    }
  };

  const resetDemo = async () => {
    try {
      await api.resetDemoData();
      await loadData();
      showToast('Demo data & sales intelligence refreshed', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset demo data', 'error');
    }
  };

  const login = async (email: string) => {
    setIsAuthenticated(true);
    setUser((prev) => ({ ...prev, email }));
    setCurrentView('dashboard');
    showToast(`Logged in as ${email}`, 'success');
  };

  const signup = async (email: string, _pass: string, name: string) => {
    setIsAuthenticated(true);
    setUser((prev) => ({ ...prev, email, full_name: name || 'Sales Pro' }));
    setCurrentView('onboarding');
    showToast('Account created! Let’s personalize your sales loop.', 'success');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentView('landing');
    showToast('You have been logged out', 'info');
  };

  const openAIModal = (lead: Lead) => {
    setAiModalLead(lead);
    setIsAIModalOpen(true);
  };

  const closeAIModal = () => {
    setIsAIModalOpen(false);
    setAiModalLead(null);
  };

  const openAnalyzeModal = (lead: Lead) => {
    setAnalyzeModalLead(lead);
    setIsAnalyzeModalOpen(true);
  };

  const closeAnalyzeModal = () => {
    setIsAnalyzeModalOpen(false);
    setAnalyzeModalLead(null);
  };

  const openSequenceModal = (lead: Lead) => {
    setSequenceModalLead(lead);
    setIsSequenceModalOpen(true);
  };

  const closeSequenceModal = () => {
    setIsSequenceModalOpen(false);
    setSequenceModalLead(null);
  };

  const openScoreWhyModal = (lead: Lead) => {
    setScoreWhyLead(lead);
    setIsScoreWhyModalOpen(true);
  };

  const closeScoreWhyModal = () => {
    setIsScoreWhyModalOpen(false);
    setScoreWhyLead(null);
  };

  const triggerScoreDecay = async (thresholdDays = 4, decayPct = 5) => {
    try {
      const res = await api.triggerScoreDecay(thresholdDays, decayPct);
      if (res.decayed_count > 0) {
        showToast(`Server Decay Engine: ${res.decayed_count} dormant leads decayed by ${decayPct}%`, 'info');
        setScoreHistory((prev) => [...res.score_history, ...prev]);
        await loadData();
      } else {
        showToast('All leads have recent activity; no decay applied.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to trigger score decay', 'error');
    }
  };

  const detectCompetitor = async (text: string, leadId?: string) => {
    try {
      const res = await api.detectCompetitor(text, leadId);
      if (res.detected && res.mention) {
        setCompetitorMentions((prev) => [res.mention!, ...prev]);
        showToast(`Deal Doctor: Competitor "${res.mention.competitor}" detected! Battlecard ready.`, 'info');
      }
      return res;
    } catch (err: any) {
      showToast(err.message || 'Competitor detection failed', 'error');
      throw err;
    }
  };

  const saveBattlecard = async (card: Partial<Battlecard>) => {
    try {
      const res = await api.saveBattlecard(card);
      setBattlecards((prev) => {
        const idx = prev.findIndex((b) => b.id === res.battlecard.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = res.battlecard;
          return updated;
        }
        return [res.battlecard, ...prev];
      });
      showToast(`Battlecard for "${res.battlecard.competitor}" saved`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save battlecard', 'error');
      throw err;
    }
  };

  const createCadence = async (data: { lead_id: string; name: string; steps: any[] }) => {
    try {
      const res = await api.createCadence(data);
      setCadences((prev) => [res.cadence, ...prev]);
      showToast(`Omnichannel cadence "${res.cadence.name}" initiated`, 'success');
      return res.cadence;
    } catch (err: any) {
      showToast(err.message || 'Failed to create cadence', 'error');
      throw err;
    }
  };

  const triggerCadenceFallbacks = async () => {
    try {
      const res = await api.triggerCadenceFallbacks();
      if (res.triggered_count > 0) {
        showToast(`Omnichannel Engine: ${res.triggered_count} unread fallback messages routed`, 'info');
        await loadData();
      } else {
        showToast('All cadence steps currently on schedule', 'info');
      }
      return res.triggered_count;
    } catch (err: any) {
      showToast(err.message || 'Failed to run cadence fallbacks', 'error');
      return 0;
    }
  };

  const sendOmnichannelMessage = async (data: {
    lead_id: string;
    cadence_id?: string;
    channel: string;
    message: string;
    idempotency_key: string;
  }) => {
    try {
      const res = await api.sendOmnichannelMessage(data);
      if (res.duplicate_prevented) {
        showToast(`Duplicate message prevented by idempotency lock.`, 'info');
      } else {
        showToast(`Message sent via ${data.channel.toUpperCase()}!`, 'success');
        await loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
      throw err;
    }
  };

  const transcribeAudio = async (text: string, leadId?: string) => {
    try {
      const res = await api.transcribeAudio(text, leadId);
      showToast('Audio transcript analyzed & added to CRM timeline', 'success');
      await loadData();
      return res.transcription;
    } catch (err: any) {
      showToast(err.message || 'Audio transcription processing failed', 'error');
      throw err;
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        user,
        workspace,
        subscription,
        teamMembers,
        stages,
        leads,
        followups,
        activities,
        messages,
        tasks,
        automations,
        integrations,
        auditLogs,
        notifications,
        currentView,
        setCurrentView,
        authMode,
        setAuthMode,
        selectedLeadId,
        setSelectedLeadId,
        searchQuery,
        setSearchQuery,
        isLoading,
        toast,
        showToast,
        isAddLeadModalOpen,
        setIsAddLeadModalOpen,
        isAIModalOpen,
        aiModalLead,
        openAIModal,
        closeAIModal,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        isAnalyzeModalOpen,
        analyzeModalLead,
        openAnalyzeModal,
        closeAnalyzeModal,
        isSequenceModalOpen,
        sequenceModalLead,
        openSequenceModal,
        closeSequenceModal,
        isScoreWhyModalOpen,
        scoreWhyLead,
        openScoreWhyModal,
        closeScoreWhyModal,
        isCommandBarOpen,
        setIsCommandBarOpen,
        isAskAIOpen,
        setIsAskAIOpen,
        addLead,
        updateLead,
        deleteLead,
        changeLeadStage,
        scheduleFollowup,
        completeFollowup,
        cancelFollowup,
        rescheduleFollowup,
        addActivity,
        generateAIFollowup,
        analyzeConversation,
        generateSequence,
        askLeadLoop,
        executeCommand,
        createTask,
        updateTask,
        deleteTask,
        toggleAutomation,
        finishOnboarding,
        upgradePlan,
        resetDemo,
        login,
        signup,
        logout,
        markNotificationRead,
        clearAllNotifications,
        realtimeStatus,
        battlecards,
        scoreHistory,
        competitorMentions,
        cadences,
        forecast,
        triggerScoreDecay,
        detectCompetitor,
        saveBattlecard,
        createCadence,
        triggerCadenceFallbacks,
        sendOmnichannelMessage,
        transcribeAudio,
        leadActivityLogs,
        fetchLeadActivityLogs,
        logLeadActivity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
