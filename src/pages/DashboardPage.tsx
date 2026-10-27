import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight, 
  PhoneCall, 
  MessageSquare, 
  Calendar, 
  Plus, 
  Zap, 
  ChevronRight, 
  Send,
  Flame,
  ShieldAlert,
  HelpCircle,
  Brain,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, getSmartFollowUpRecommendation } from '../utils/crmUtils';
import { Lead, SmartRecommendation } from '../types';

interface AIRecommendationCardProps {
  lead: Lead;
  rec: SmartRecommendation;
  isRisk: boolean;
}

const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({ lead, rec, isRisk }) => {
  const { setSelectedLeadId, setCurrentView, openScoreWhyModal, generateAIFollowup, logLeadActivity, showToast, user } = useApp();
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedMsg, setGeneratedMsg] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [loggingActivity, setLoggingActivity] = useState<boolean>(false);
  const [loggedSuccess, setLoggedSuccess] = useState<boolean>(false);

  const isHot = lead.score_category === 'HOT';
  const isWhatsApp = rec.suggested_channel === 'whatsapp';

  const handleGenerate = async () => {
    setLoading(true);
    setNotice(null);
    setLoggedSuccess(false);
    try {
      const response = await generateAIFollowup(lead, {
        channel: isWhatsApp ? 'whatsapp' : 'email',
      });
      setGeneratedMsg(response.body || response.message);
      if (response.subject) {
        setEmailSubject(response.subject);
      }
      if (response.quota_notice?.message) {
        setNotice(response.quota_notice.message);
      }
      showToast('AI message draft generated!', 'success');
    } catch (err: any) {
      setNotice(err.message || 'Failed to generate message');
      showToast(err.message || 'Generation notice', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedMsg) return;
    const textToCopy = (!isWhatsApp && emailSubject)
      ? `Subject: ${emailSubject}\n\n${generatedMsg}`
      : generatedMsg;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showToast('AI message copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const sendToWhatsApp = () => {
    if (!generatedMsg) return;
    const phone = (lead.phone || '').replace(/[^0-9]/g, '');
    const url = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(generatedMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(generatedMsg)}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const sendToEmail = () => {
    if (!generatedMsg) return;
    const subject = encodeURIComponent(emailSubject || `Following up regarding ${lead.service || 'our collaboration'}`);
    const body = encodeURIComponent(generatedMsg);
    window.location.href = `mailto:${lead.email || ''}?subject=${subject}&body=${body}`;
  };

  const handleConfirmAndLog = async () => {
    if (!generatedMsg || loggingActivity || loggedSuccess) return;
    setLoggingActivity(true);
    try {
      const fullMessage = (!isWhatsApp && emailSubject)
        ? `Subject: ${emailSubject}\n\n${generatedMsg}`
        : generatedMsg;
      await logLeadActivity(lead.id, {
        agent_name: user?.full_name || 'Sales Agent',
        channel: isWhatsApp ? 'whatsapp' : 'email',
        message_body: fullMessage,
      });
      setLoggedSuccess(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to log activity', 'error');
    } finally {
      setLoggingActivity(false);
    }
  };

  return (
    <article className="rounded-2xl border border-zinc-800 bg-[#18181B] p-5 shadow-xs flex flex-col justify-between hover:border-zinc-700 transition-all text-zinc-100">
      <div className="space-y-3">
        {/* WHO */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <button
              onClick={() => {
                setSelectedLeadId(lead.id);
                setCurrentView('lead-detail');
              }}
              className="font-extrabold text-white text-sm hover:text-indigo-400 text-left transition"
            >
              {lead.name}
            </button>
            <p className="text-xs text-zinc-400 font-medium">
              {lead.company || 'Direct Account'} • {formatCurrency(lead.deal_value, lead.currency)}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => openScoreWhyModal(lead)}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                isHot
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                  : lead.score_category === 'WARM'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
              title="Click to view why this score was assigned"
            >
              <Flame className="h-3 w-3" />
              <span>{lead.priority_score} {lead.score_category}</span>
            </button>
          </div>
        </div>

        {/* WHY */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-xs text-zinc-300 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 block">
            Why Attention Needed:
          </span>
          <p className="font-semibold text-zinc-100 leading-snug">
            {isRisk && lead.risk_reasons?.[0] ? lead.risk_reasons[0] : rec.reason}
          </p>
        </div>

        {/* WHAT & WHEN */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-indigo-950/40 border border-indigo-900/40 p-2 text-indigo-200">
            <span className="text-[9px] font-extrabold uppercase text-indigo-400 block">Recommended Action:</span>
            <p className="font-bold text-[11px] mt-0.5 capitalize">
              Follow up via {rec.suggested_channel}
            </p>
          </div>
          <div className="rounded-lg bg-amber-950/40 border border-amber-900/40 p-2 text-amber-200">
            <span className="text-[9px] font-extrabold uppercase text-amber-400 block">Timeframe:</span>
            <p className="font-bold text-[11px] mt-0.5">{rec.when_text}</p>
          </div>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="mb-3 rounded-lg border border-indigo-900/50 bg-indigo-950/30 p-3 text-sm text-indigo-300"
        >
          {notice}
        </div>
      )}

      {/* Loading Skeleton Placeholder (Interactive Dashboard Rule) */}
      {loading && (
        <div className="mt-3 space-y-2 animate-pulse bg-zinc-900 p-3 rounded-lg border border-zinc-800">
          <div className="h-3 bg-zinc-700 rounded w-3/4"></div>
          <div className="h-3 bg-zinc-700 rounded w-5/6"></div>
          <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
        </div>
      )}

      {/* AI Context Preview Block */}
      {generatedMsg && !loading && (
        <div className="mt-3 bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-zinc-300 text-xs">
          <p className="font-semibold text-zinc-400 mb-1">✨ AI Suggested Message:</p>
          <div className="max-h-40 overflow-y-auto mb-2 text-zinc-300 pr-1 whitespace-pre-line selection:bg-indigo-500">
            {generatedMsg}
          </div>
          
          <div className="mt-3 pt-2 border-t border-zinc-800 flex flex-wrap gap-2 justify-end items-center">
            <button 
              onClick={handleCopy}
              className="text-[11px] text-zinc-400 hover:text-white border border-zinc-700 px-2.5 py-1 rounded transition"
            >
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
            
            {/* Contextual App Triggers */}
            {isWhatsApp ? (
              <button 
                onClick={sendToWhatsApp}
                className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 py-1 rounded transition"
                title="Open WhatsApp draft"
              >
                Send via WhatsApp 🚀
              </button>
            ) : (
              <button 
                onClick={sendToEmail}
                className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-2.5 py-1 rounded transition"
                title="Open default email client"
              >
                Send via Email ✉️
              </button>
            )}

            {/* Explicit Execution Logger */}
            <button
              onClick={handleConfirmAndLog}
              disabled={loggingActivity || loggedSuccess}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded transition border ${
                loggedSuccess
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border-emerald-900/50'
              } disabled:opacity-60`}
              title="Confirm interaction has been dispatched and record to audited lead activity logs"
            >
              {loggingActivity ? 'Logging...' : loggedSuccess ? '✓ Activity Logged' : 'Confirm & Log Sent'}
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 italic mt-1.5 text-right">
            Draft preview only. Clicking send triggers external client; click &ldquo;Confirm &amp; Log Sent&rdquo; to persist to verified lead history.
          </p>
        </div>
      )}

      <div className="mt-4 flex justify-between items-center">
        <button 
          onClick={() => {
            setSelectedLeadId(lead.id);
            setCurrentView('lead-detail');
          }}
          className="text-xs text-zinc-400 hover:text-white underline focus:outline-none"
        >
          View Lead
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-1.5 px-3 rounded-lg transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#18181B]"
        >
          {loading ? 'Generating...' : 'Generate Message'}
        </button>
      </div>
    </article>
  );
};

export const DashboardPage: React.FC = () => {
  const { 
    user, 
    leads, 
    followups, 
    activities, 
    stages, 
    setCurrentView, 
    setSelectedLeadId, 
    openAIModal, 
    openScoreWhyModal,
    openAnalyzeModal,
    completeFollowup, 
    setIsAddLeadModalOpen,
    setIsCommandBarOpen,
    setIsAskAIOpen 
  } = useApp();

  const now = new Date();
  const greetingTime = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user.full_name?.split(' ')[0] || 'there';

  // Core metrics
  const totalLeads = leads.length;
  const activeLeads = leads.filter((l) => l.status === 'active');
  const wonLeads = leads.filter((l) => l.status === 'won');
  const wonRevenue = wonLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0), 0);
  const pipelineValue = activeLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0), 0);

  // Hot Leads & At-Risk Deals
  const hotLeads = activeLeads.filter((l) => l.score_category === 'HOT');
  const atRiskDeals = activeLeads.filter((l) => l.risk_level === 'high' || l.risk_level === 'medium');

  const todayFollowups = followups.filter((f) => {
    if (f.status === 'completed' || f.status === 'cancelled') return false;
    const sch = new Date(f.scheduled_at);
    return sch.toDateString() === now.toDateString() || sch < now;
  });

  const overdueFollowups = followups.filter((f) => {
    return f.status === 'overdue' || (f.status === 'pending' && new Date(f.scheduled_at) < now);
  });

  // Pipeline Momentum calculation
  const negotiatingDeals = leads.filter((l) => l.stage_id === 'stage-4' && l.status === 'active');
  const momentumScore = Math.min(100, Math.round((wonLeads.length * 15 + negotiatingDeals.length * 20 + hotLeads.length * 10)));

  // Dynamic AI Recommendations (Who, Why, What, When)
  const aiRecommendations = activeLeads
    .map((lead) => {
      const rec = getSmartFollowUpRecommendation(lead, followups);
      const isRisk = lead.risk_level === 'high' || lead.risk_level === 'medium';
      return {
        lead,
        rec,
        isRisk,
      };
    })
    .sort((a, b) => (b.lead.priority_score || 0) - (a.lead.priority_score || 0))
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            {greetingTime}, {firstName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome to your <span className="font-semibold text-indigo-600">AI Sales Command Center</span>. Here is who needs attention right now.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCommandBarOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <span>Command Bar</span>
            <kbd className="rounded border bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
              Ctrl+K
            </kbd>
          </button>
          <button
            onClick={() => setIsAddLeadModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* UPGRADE #1: AI SALES COMMAND CENTER KPI BANNER */}
      {/* ============================================================================== */}
      <div className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 text-white font-black text-xs shadow-md">
                ⚡
              </span>
              <h2 className="text-sm font-extrabold tracking-wider uppercase text-indigo-300">
                AI Sales Command Center
              </h2>
            </div>
            <button
              onClick={() => setIsAskAIOpen(true)}
              className="text-xs font-bold text-indigo-200 hover:text-white flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-xl transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Ask AI Copilot</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
            {/* Hot Leads */}
            <div 
              onClick={() => setCurrentView('leads')}
              className="rounded-2xl border border-white/10 bg-white/5 p-3.5 hover:bg-white/10 cursor-pointer transition"
            >
              <div className="flex items-center gap-1.5 text-rose-300 text-xs font-bold">
                <Flame className="h-4 w-4 text-rose-400" />
                <span>Hot Leads</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-white">{hotLeads.length}</span>
                <span className="text-[10px] text-slate-400">ready to close</span>
              </div>
            </div>

            {/* At-Risk Deals */}
            <div 
              onClick={() => setCurrentView('leads')}
              className="rounded-2xl border border-white/10 bg-white/5 p-3.5 hover:bg-white/10 cursor-pointer transition"
            >
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span>Deals At Risk</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-white">{atRiskDeals.length}</span>
                <span className="text-[10px] text-slate-400">cooling off</span>
              </div>
            </div>

            {/* Follow-ups Due */}
            <div 
              onClick={() => setCurrentView('followups')}
              className="rounded-2xl border border-white/10 bg-white/5 p-3.5 hover:bg-white/10 cursor-pointer transition"
            >
              <div className="flex items-center gap-1.5 text-sky-300 text-xs font-bold">
                <Clock className="h-4 w-4 text-sky-400" />
                <span>Follow-ups Due</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-white">{todayFollowups.length}</span>
                <span className="text-[10px] text-slate-400">today</span>
              </div>
            </div>

            {/* Pipeline Value */}
            <div 
              onClick={() => setCurrentView('pipeline')}
              className="rounded-2xl border border-white/10 bg-white/5 p-3.5 hover:bg-white/10 cursor-pointer transition"
            >
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>Pipeline Value</span>
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black text-white">{formatCurrency(pipelineValue, 'INR')}</span>
              </div>
            </div>

            {/* Pipeline Momentum */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-xs font-bold text-violet-300">
                <span>Momentum</span>
                <span>{momentumScore}%</span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-full"
                  style={{ width: `${momentumScore}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">High conversion activity</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* AI RECOMMENDATIONS: WHO, WHY, WHAT, WHEN, MESSAGE */}
      {/* ============================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-base">AI Sales Recommendations</h3>
          </div>
          <span className="text-xs text-slate-500">Grounded in live CRM intent & interaction logs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiRecommendations.map(({ lead, rec, isRisk }) => (
            <AIRecommendationCard
              key={lead.id}
              lead={lead}
              rec={rec}
              isRisk={isRisk}
            />
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Today's Follow-ups */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Today's Scheduled Follow-ups</h2>
              <p className="text-xs text-slate-500">Touchpoints scheduled or overdue requiring execution</p>
            </div>
            <button
              onClick={() => setCurrentView('followups')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View all ({followups.length}) <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todayFollowups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center space-y-3">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                <h4 className="font-bold text-slate-800 text-sm">All clear for today!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No overdue or pending follow-ups right now. Review AI suggestions above or add new prospects.
                </p>
              </div>
            ) : (
              todayFollowups.map((f) => {
                const lead = leads.find((l) => l.id === f.lead_id);
                if (!lead) return null;
                const stage = stages.find((s) => s.id === lead.stage_id);
                const isOverdue = f.status === 'overdue' || new Date(f.scheduled_at) < now;

                return (
                  <div
                    key={f.id}
                    className={`rounded-2xl border bg-white p-4.5 shadow-xs transition-all hover:shadow-md ${
                      isOverdue ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{lead.name}</span>
                          {lead.company && (
                            <span className="text-xs font-medium text-slate-500">• {lead.company}</span>
                          )}
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-bold text-white uppercase"
                            style={{ backgroundColor: stage?.color || '#6366f1' }}
                          >
                            {stage?.name || 'Lead'}
                          </span>
                          <button
                            onClick={() => openScoreWhyModal(lead)}
                            className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 underline flex items-center gap-0.5"
                          >
                            Score: {lead.priority_score}
                          </button>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Value: {formatCurrency(lead.deal_value, lead.currency)}
                          </span>
                          <span>•</span>
                          <span className="capitalize flex items-center gap-1">
                            Via <span className="font-medium text-slate-700">{f.channel}</span>
                          </span>
                          <span>•</span>
                          <span className={isOverdue ? 'font-bold text-rose-600' : 'text-slate-600'}>
                            {new Date(f.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                        <button
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setCurrentView('lead-detail');
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          View Lead
                        </button>
                        <button
                          onClick={() => openAIModal(lead)}
                          className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Generate Message</span>
                        </button>
                        <button
                          onClick={() => completeFollowup(f.id)}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition"
                        >
                          Complete
                        </button>
                      </div>
                    </div>

                    {/* Message Preview or AI Suggestion */}
                    {f.message ? (
                      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs text-slate-700">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Follow-up Message Draft:
                        </span>
                        <p className="line-clamp-2 italic">"{f.message}"</p>
                      </div>
                    ) : f.ai_reason ? (
                      <div className="mt-3 rounded-xl border border-indigo-50 bg-indigo-50/50 p-2 text-xs text-indigo-900">
                        <span className="font-semibold text-indigo-950">AI Context: </span>
                        {f.ai_reason}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Pipeline Overview & Recent Activity */}
        <div className="space-y-6">
          {/* Pipeline Mini-Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Pipeline Stages</h3>
              <button
                onClick={() => setCurrentView('pipeline')}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Kanban Board
              </button>
            </div>
            <div className="mt-3 space-y-2.5">
              {stages.map((st) => {
                const count = leads.filter((l) => l.stage_id === st.id).length;
                const stageVal = leads
                  .filter((l) => l.stage_id === st.id)
                  .reduce((acc, l) => acc + (Number(l.deal_value) || 0), 0);
                const percent = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;

                return (
                  <div key={st.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                        {st.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{count}</span>
                        <span className="text-[11px] text-slate-400">({formatCurrency(stageVal, 'INR')})</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: st.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Recent Activity</h3>
              <span className="text-[11px] text-slate-400">Live Feed</span>
            </div>
            <div className="mt-3 space-y-3.5">
              {activities.slice(0, 5).map((act) => {
                const lead = leads.find((l) => l.id === act.lead_id);
                return (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="mt-0.5 rounded-lg bg-indigo-50 p-1.5 text-indigo-600 flex-shrink-0">
                      {act.type === 'call' && <PhoneCall className="h-3.5 w-3.5" />}
                      {act.type === 'whatsapp' && <MessageSquare className="h-3.5 w-3.5" />}
                      {act.type === 'followup' && <Send className="h-3.5 w-3.5" />}
                      {act.type === 'status_change' && <TrendingUp className="h-3.5 w-3.5" />}
                      {act.type === 'ai_analysis' && <Brain className="h-3.5 w-3.5" />}
                      {act.type === 'note' && <Calendar className="h-3.5 w-3.5" />}
                      {act.type === 'meeting' && <Users className="h-3.5 w-3.5" />}
                      {act.type === 'email' && <MessageSquare className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 line-clamp-2">{act.content}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        {lead && <span className="font-semibold text-slate-600">{lead.name}</span>}
                        <span>•</span>
                        <span>{new Date(act.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
