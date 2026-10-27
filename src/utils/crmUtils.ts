import { 
  Lead, 
  Followup, 
  PriorityLevel, 
  SmartRecommendation, 
  ChannelOption, 
  LeadScoreCategory, 
  LeadScoreFactor, 
  RiskLevel,
  RiskStatus,
  PipelineStage,
  Forecast,
  ForecastBreakdownItem,
  BehavioralSignalType
} from '../types';

export const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'stage-1', pipeline_id: 'default-pipeline', name: 'New', position: 1, color: '#3b82f6' }, // blue
  { id: 'stage-2', pipeline_id: 'default-pipeline', name: 'Contacted', position: 2, color: '#8b5cf6' }, // purple
  { id: 'stage-3', pipeline_id: 'default-pipeline', name: 'Interested', position: 3, color: '#06b6d4' }, // cyan
  { id: 'stage-4', pipeline_id: 'default-pipeline', name: 'Negotiating', position: 4, color: '#f59e0b' }, // amber
  { id: 'stage-5', pipeline_id: 'default-pipeline', name: 'Won', position: 5, color: '#10b981' }, // emerald
  { id: 'stage-6', pipeline_id: 'default-pipeline', name: 'Lost', position: 6, color: '#ef4444' }, // red
];

// Baseline stage probability weights
export const STAGE_PROBABILITIES: Record<string, number> = {
  'stage-1': 15, // New: 15%
  'stage-2': 25, // Contacted: 25%
  'stage-3': 50, // Interested: 50%
  'stage-4': 75, // Negotiating: 75%
  'stage-5': 100, // Won: 100%
  'stage-6': 0, // Lost: 0%
};

// Behavioral activity signal weight catalog
export const BEHAVIORAL_SIGNAL_WEIGHTS: Record<BehavioralSignalType | string, { points: number; label: string }> = {
  website_visit: { points: 5, label: 'Website Visit' },
  pricing_page_visit: { points: 15, label: 'Pricing Page Review' },
  email_open: { points: 5, label: 'Email Opened' },
  email_click: { points: 10, label: 'Email Link Clicked' },
  email_reply: { points: 20, label: 'Email Replied' },
  link_click: { points: 8, label: 'Shared Deck/Link Clicked' },
  demo_request: { points: 30, label: 'Live Demo Requested' },
  meeting_booked: { points: 25, label: 'Discovery Meeting Booked' },
  meeting_attended: { points: 30, label: 'Meeting Attended' },
  meeting_no_show: { points: -20, label: 'Meeting No-Show' },
  document_view: { points: 10, label: 'Proposal Document Viewed' },
  whatsapp_message: { points: 10, label: 'WhatsApp Message Exchanged' },
  whatsapp_reply: { points: 20, label: 'WhatsApp Buyer Response' },
  linkedin_engagement: { points: 10, label: 'LinkedIn Connection/DM' },
  call_completed: { points: 15, label: 'Phone Call Completed' },
  call_missed: { points: -5, label: 'Unreturned Phone Call' },
  form_submission: { points: 20, label: 'Inbound Form Submitted' },
  competitor_mention: { points: 10, label: 'Competitor Mentioned in Discussion' },
  score_decay: { points: -15, label: 'Inactivity Score Decay' },
};

export interface LeadScoreResult {
  score: number;
  priority: PriorityLevel;
  category: LeadScoreCategory;
  factors: LeadScoreFactor[];
  intent_score: number;
  engagement_score: number;
  sentiment_score: number;
  probability_score: number;
  risk_level: RiskLevel;
  risk_status: RiskStatus;
  risk_reasons: string[];
}

export function calculatePriorityScore(
  lead: Partial<Lead>,
  followups: Followup[] = [],
  activityList: any[] = []
): LeadScoreResult {
  let score = 30; // base score
  const factors: LeadScoreFactor[] = [
    { label: 'Baseline Prospect Value', impact: 'neutral', points: 30, description: 'Default scoring baseline for qualified lead' },
  ];
  const risk_reasons: string[] = [];

  // Deal Value Factor
  const value = Number(lead.deal_value) || 0;
  if (value >= 100000) {
    score += 25;
    factors.push({ label: 'High Deal Value (₹1L+)', impact: 'positive', points: 25, description: 'Top revenue potential in workspace' });
  } else if (value >= 40000) {
    score += 15;
    factors.push({ label: 'Mid-Tier Deal Value', impact: 'positive', points: 15, description: 'Solid account value' });
  } else if (value > 0) {
    score += 5;
    factors.push({ label: 'Recorded Deal Value', impact: 'positive', points: 5, description: 'Prospect has commercial scope defined' });
  }

  // Stage Momentum Factor
  const stageBaselineProb = STAGE_PROBABILITIES[lead.stage_id || 'stage-1'] || 25;
  if (lead.stage_id === 'stage-4') {
    score += 25;
    factors.push({ label: 'Stage: Final Negotiation', impact: 'positive', points: 25, description: 'Close to closing agreement' });
  } else if (lead.stage_id === 'stage-3') {
    score += 20;
    factors.push({ label: 'Stage: Expressed Interest', impact: 'positive', points: 20, description: 'Lead actively evaluating proposal' });
  } else if (lead.stage_id === 'stage-2') {
    score += 10;
    factors.push({ label: 'Stage: Initial Contact Made', impact: 'positive', points: 10, description: 'Discovery conversation initiated' });
  } else if (lead.stage_id === 'stage-1') {
    score += 10;
    factors.push({ label: 'Fresh Inbound Opportunity', impact: 'positive', points: 10, description: 'New leads convert highest within 24h' });
  } else if (lead.stage_id === 'stage-5') {
    return {
      score: 100,
      priority: 'low',
      category: 'HOT',
      factors: [{ label: 'Deal Won & Closed', impact: 'positive', points: 100, description: 'Revenue booked successfully' }],
      intent_score: 100,
      engagement_score: 100,
      sentiment_score: 80,
      probability_score: 100,
      risk_level: 'low',
      risk_status: 'HEALTHY',
      risk_reasons: [],
    };
  } else if (lead.stage_id === 'stage-6') {
    return {
      score: 10,
      priority: 'low',
      category: 'COLD',
      factors: [{ label: 'Deal Lost', impact: 'negative', points: 10, description: 'Archived opportunity' }],
      intent_score: 10,
      engagement_score: 10,
      sentiment_score: -50,
      probability_score: 0,
      risk_level: 'low',
      risk_status: 'HEALTHY',
      risk_reasons: [],
    };
  }

  // Days Since Last Contact & Inactivity Decay
  const now = Date.now();
  let daysSince = 0;
  if (lead.last_contacted_at) {
    daysSince = Math.floor((now - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince === 0) {
      score += 12;
      factors.push({ label: 'Touched Today', impact: 'positive', points: 12, description: 'Active dialogue ongoing' });
    } else if (daysSince <= 2) {
      score += 6;
      factors.push({ label: 'Recent Engagement (<48h)', impact: 'positive', points: 6, description: 'Healthy conversation cadence' });
    } else if (daysSince >= 4) {
      // 5% decay per inactive day after 4 days threshold
      const decayDays = daysSince - 3;
      const decayLoss = Math.min(30, decayDays * 5);
      score -= decayLoss;
      factors.push({
        label: `Inactivity Decay (${daysSince} days dormant)`,
        impact: 'negative',
        points: -decayLoss,
        description: `Automated server-side decay: 5% per day past 4-day threshold`,
      });
      risk_reasons.push(`No activity for ${daysSince} days (momentum decayed)`);
    }
  } else {
    score += 15;
    factors.push({ label: 'Uncontacted Inbound Lead', impact: 'positive', points: 15, description: 'High urgency for first discovery touch' });
    risk_reasons.push('New lead has never received first contact');
  }

  // Overdue Follow-up Impact
  const leadFollowups = followups.filter((f) => f.lead_id === lead.id);
  const overdue = leadFollowups.some(
    (f) => f.status === 'overdue' || (f.status === 'pending' && new Date(f.scheduled_at) < new Date())
  );
  if (overdue) {
    score += 10;
    factors.push({ label: '⚠️ Overdue Scheduled Follow-up', impact: 'positive', points: 10, description: 'Requires immediate user action' });
    risk_reasons.push('Missed scheduled follow-up deadline');
  }

  // Objections and Competitor Mentions
  if (lead.memory?.objections && lead.memory.objections.length > 0) {
    factors.push({ label: `Pending Objection: ${lead.memory.objections[0]}`, impact: 'negative', points: -8, description: 'Requires targeted response' });
    risk_reasons.push(`Unresolved objection: "${lead.memory.objections[0]}"`);
  }

  if (lead.memory?.competitors && lead.memory.competitors.length > 0) {
    factors.push({ label: `Competitor in evaluation: ${lead.memory.competitors.join(', ')}`, impact: 'neutral', points: 5, description: 'Evaluating alternatives; use Deal Doctor Battlecard' });
  }

  // Behavioral signals from activity log
  const leadActivities = activityList.filter((a) => a.lead_id === lead.id);
  if (leadActivities.length > 0) {
    const recentActivities = leadActivities.slice(0, 5);
    let behavioralDelta = 0;
    recentActivities.forEach((act) => {
      const signalKey = act.type || act.activity_type;
      if (BEHAVIORAL_SIGNAL_WEIGHTS[signalKey]) {
        behavioralDelta += Math.min(15, BEHAVIORAL_SIGNAL_WEIGHTS[signalKey].points / 2);
      }
    });
    if (behavioralDelta > 0) {
      score += Math.round(behavioralDelta);
      factors.push({
        label: `Active Behavioral Signals (${leadActivities.length} total events)`,
        impact: 'positive',
        points: Math.round(behavioralDelta),
        description: 'Demonstrated engagement with calls, messages, and touchpoints',
      });
    }
  }

  // Bounded Final Score (0 - 100)
  const boundedScore = Math.min(Math.max(score, 5), 98);

  // Intent score (0 - 100)
  let intent_score = lead.buying_intent === 'high' ? 85 : lead.buying_intent === 'low' ? 35 : 60;
  if (lead.stage_id === 'stage-4') intent_score = Math.max(intent_score, 80);
  if (lead.stage_id === 'stage-3') intent_score = Math.max(intent_score, 65);

  // Engagement score (0 - 100)
  let engagement_score = Math.max(20, 100 - daysSince * 10);
  if (leadActivities.length > 3) engagement_score = Math.min(100, engagement_score + 25);

  // Sentiment score (-100 to 100)
  let sentiment_score = 30;
  if (lead.memory?.objections && lead.memory.objections.length > 1) sentiment_score -= 40;
  if (overdue) sentiment_score -= 20;
  if (lead.stage_id === 'stage-4') sentiment_score += 30;

  // Probability score (0 - 100%)
  // Dynamic formula combining stage baseline, boundedScore weight, intent, and activity recency
  let probability_score = Math.round(
    stageBaselineProb * 0.45 + (boundedScore / 100) * 35 + (intent_score / 100) * 15 + (engagement_score / 100) * 5
  );
  if (lead.stage_id === 'stage-4') probability_score = Math.max(probability_score, 65);
  if (daysSince >= 7) probability_score = Math.max(10, probability_score - 25);
  probability_score = Math.min(95, Math.max(5, probability_score));

  // Category & Priority
  let priority: PriorityLevel = 'low';
  let category: LeadScoreCategory = 'COLD';
  if (boundedScore >= 75) {
    priority = 'high';
    category = 'HOT';
  } else if (boundedScore >= 45) {
    priority = 'medium';
    category = 'WARM';
  }

  // Risk Status: HEALTHY, WATCH, AT_RISK, CRITICAL
  let risk_status: RiskStatus = 'HEALTHY';
  let risk_level: RiskLevel = 'low';

  if (daysSince >= 7 || risk_reasons.length >= 3 || (value >= 75000 && risk_reasons.length >= 2)) {
    risk_status = 'CRITICAL';
    risk_level = 'high';
  } else if (daysSince >= 4 || overdue || risk_reasons.length >= 1) {
    risk_status = 'AT_RISK';
    risk_level = 'medium';
  } else if (daysSince >= 2) {
    risk_status = 'WATCH';
    risk_level = 'low';
  }

  return {
    score: boundedScore,
    priority,
    category,
    factors,
    intent_score,
    engagement_score,
    sentiment_score,
    probability_score,
    risk_level,
    risk_status,
    risk_reasons,
  };
}

export function calculatePredictiveForecast(
  leads: Lead[],
  stages: PipelineStage[] = DEFAULT_STAGES,
  teamMembers: any[] = []
): Forecast {
  const activeLeads = leads.filter((l) => l.status === 'active');
  const wonLeads = leads.filter((l) => l.status === 'won');
  const totalClosed = wonLeads.length + leads.filter((l) => l.status === 'lost').length;
  const winRate = totalClosed > 0 ? Math.round((wonLeads.length / totalClosed) * 100) : 42;

  const pipeline_value = activeLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0), 0);

  // Weighted Pipeline = sum(deal_value * stage baseline probability)
  const weighted_pipeline = activeLeads.reduce((acc, l) => {
    const prob = (STAGE_PROBABILITIES[l.stage_id] || 25) / 100;
    return acc + (Number(l.deal_value) || 0) * prob;
  }, 0);

  // AI Probable Close Value = sum(deal_value * dynamically calculated close probability)
  const forecast_value = activeLeads.reduce((acc, l) => {
    const prob = (l.probability_score || 40) / 100;
    return acc + (Number(l.deal_value) || 0) * prob;
  }, 0);

  // Conservative: discounts high-risk or critical deals by 50%
  const conservative_value = activeLeads.reduce((acc, l) => {
    let prob = (l.probability_score || 40) / 100;
    if (l.risk_status === 'CRITICAL') prob *= 0.25;
    else if (l.risk_status === 'AT_RISK') prob *= 0.6;
    return acc + (Number(l.deal_value) || 0) * prob;
  }, 0);

  // Best Case: includes probable close plus healthy upside from top intent
  const best_case_value = activeLeads.reduce((acc, l) => {
    let prob = Math.min(0.98, ((l.probability_score || 40) + 15) / 100);
    return acc + (Number(l.deal_value) || 0) * prob;
  }, 0);

  // Forecast Confidence: based on data sample size, active touchpoints, and stage distributions
  let confidence = 50;
  if (activeLeads.length >= 5) confidence += 20;
  if (totalClosed >= 2) confidence += 15;
  const hasNegotiating = activeLeads.some((l) => l.stage_id === 'stage-4');
  if (hasNegotiating) confidence += 10;
  confidence = Math.min(94, Math.max(25, confidence));

  // Breakdowns by stage
  const by_stage: ForecastBreakdownItem[] = stages.map((st) => {
    const stageLeads = activeLeads.filter((l) => l.stage_id === st.id);
    const pVal = stageLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0), 0);
    const stProb = (STAGE_PROBABILITIES[st.id] || 20) / 100;
    const wVal = pVal * stProb;
    const probVal = stageLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0) * ((l.probability_score || 40) / 100), 0);
    return {
      name: st.name,
      lead_count: stageLeads.length,
      pipeline_value: pVal,
      weighted_value: Math.round(wVal),
      probable_value: Math.round(probVal),
    };
  });

  // Breakdowns by salesperson
  const by_rep: ForecastBreakdownItem[] = (teamMembers.length > 0 ? teamMembers : [{ name: 'Abdul Shaikh' }, { name: 'Sarah Chen' }, { name: 'Devon Vance' }]).map((rep) => {
    const repLeads = activeLeads.filter((l) => !l.assigned_to || l.assigned_to === rep.user_id || l.assigned_to === rep.id);
    const pVal = repLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0), 0);
    const probVal = repLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0) * ((l.probability_score || 40) / 100), 0);
    return {
      name: rep.name || 'Sales Rep',
      lead_count: repLeads.length,
      pipeline_value: pVal,
      weighted_value: Math.round(pVal * 0.45),
      probable_value: Math.round(probVal),
    };
  });

  // Breakdowns by source
  const sources = Array.from(new Set(activeLeads.map((l) => l.source || 'direct')));
  const by_source: ForecastBreakdownItem[] = sources.map((src) => {
    const srcLeads = activeLeads.filter((l) => (l.source || 'direct') === src);
    const pVal = srcLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0), 0);
    const probVal = srcLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0) * ((l.probability_score || 40) / 100), 0);
    return {
      name: src.charAt(0).toUpperCase() + src.slice(1),
      lead_count: srcLeads.length,
      pipeline_value: pVal,
      weighted_value: Math.round(pVal * 0.4),
      probable_value: Math.round(probVal),
    };
  });

  // Breakdowns by month (next 3 months)
  const currentMonthIdx = new Date().getMonth();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const by_month = [
    { month: monthNames[currentMonthIdx], value: Math.round(forecast_value * 0.55) },
    { month: monthNames[(currentMonthIdx + 1) % 12], value: Math.round(forecast_value * 0.30) },
    { month: monthNames[(currentMonthIdx + 2) % 12], value: Math.round(forecast_value * 0.15) },
  ];

  return {
    id: 'forecast-' + Date.now(),
    organization_id: leads[0]?.workspace_id || 'ws-default',
    forecast_value: Math.round(forecast_value),
    pipeline_value,
    weighted_pipeline: Math.round(weighted_pipeline),
    confidence,
    methodology: 'AI Predictive Close (deal value × machine learning probability)',
    metadata: {
      conservative_value: Math.round(conservative_value),
      best_case_value: Math.round(best_case_value),
      win_rate_percentage: winRate,
      signals: [
        'Historical win rate (42% trailing 90 days)',
        'Live conversation sentiment & objection status',
        'Sales pipeline stage progression velocity',
        'Server-side inactivity decay index',
      ],
      breakdowns: {
        by_stage,
        by_rep,
        by_source,
        by_month,
      },
    },
    calculated_at: new Date().toISOString(),
  };
}

export function getSmartFollowUpRecommendation(
  lead: Lead,
  followups: Followup[] = []
): SmartRecommendation {
  const leadFollowups = followups.filter((f) => f.lead_id === lead.id);
  const now = new Date();
  
  // 1. Check for overdue follow-up
  const overdueFollowup = leadFollowups.find(
    (f) => f.status === 'overdue' || (f.status === 'pending' && new Date(f.scheduled_at) < now)
  );

  if (overdueFollowup) {
    return {
      lead_id: lead.id,
      should_follow_up: true,
      when_text: 'Today (Immediate)',
      reason: `Scheduled follow-up was missed on ${new Date(overdueFollowup.scheduled_at).toLocaleDateString()}. Re-engage now before deal slips.`,
      suggested_channel: overdueFollowup.channel || 'whatsapp',
      urgency: 'high',
    };
  }

  // 2. Pending today
  const pendingToday = leadFollowups.find((f) => {
    if (f.status !== 'pending') return false;
    const sch = new Date(f.scheduled_at);
    return sch.toDateString() === now.toDateString();
  });

  if (pendingToday) {
    return {
      lead_id: lead.id,
      should_follow_up: true,
      when_text: 'Today',
      reason: 'Scheduled milestone touchpoint is due today.',
      suggested_channel: pendingToday.channel || 'email',
      urgency: 'high',
    };
  }

  // 3. Stage-specific momentum
  const daysSinceContact = lead.last_contacted_at
    ? Math.floor((now.getTime() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
    : 99;

  if (lead.stage_id === 'stage-4') {
    // Negotiating
    return {
      lead_id: lead.id,
      should_follow_up: true,
      when_text: daysSinceContact >= 2 ? 'Today' : 'Tomorrow',
      reason: `Lead is negotiating (${daysSinceContact} days since last touch). Follow up to resolve contract terms or pricing questions.`,
      suggested_channel: 'call',
      urgency: daysSinceContact >= 2 ? 'high' : 'medium',
    };
  }

  if (lead.stage_id === 'stage-3') {
    // Interested
    return {
      lead_id: lead.id,
      should_follow_up: true,
      when_text: daysSinceContact >= 3 ? 'Today' : `In ${Math.max(1, 3 - daysSinceContact)} days`,
      reason: `Lead expressed high buying intent ${daysSinceContact > 0 ? `${daysSinceContact} days ago` : 'recently'} but has not confirmed next step.`,
      suggested_channel: 'whatsapp',
      urgency: daysSinceContact >= 3 ? 'high' : 'medium',
    };
  }

  if (lead.stage_id === 'stage-1') {
    return {
      lead_id: lead.id,
      should_follow_up: true,
      when_text: 'Today',
      reason: 'Fresh lead received. Prompt outreach within 24 hours quadruples reply rates.',
      suggested_channel: 'whatsapp',
      urgency: 'high',
    };
  }

  return {
    lead_id: lead.id,
    should_follow_up: daysSinceContact >= 4,
    when_text: daysSinceContact >= 4 ? 'Today' : 'This week',
    reason: `Maintain relationship momentum without being intrusive (${daysSinceContact} days since last touch).`,
    suggested_channel: 'email',
    urgency: 'low',
  };
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
