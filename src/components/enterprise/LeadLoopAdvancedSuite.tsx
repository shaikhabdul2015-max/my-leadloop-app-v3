import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Lead, 
  Battlecard, 
  CompetitorMention, 
  Cadence, 
  ChannelOption, 
  AIMessageDraft, 
  ErrorState,
  TranscriptionResult
} from '../../types';
import { formatCurrency } from '../../utils/crmUtils';
import { 
  TrendingUp, 
  ShieldAlert, 
  Flame, 
  Brain, 
  Zap, 
  Clock, 
  Layers, 
  Radio, 
  Mic, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  HelpCircle,
  Sparkles,
  Search,
  ExternalLink,
  MessageSquare,
  Code2
} from 'lucide-react';
import { CodePanel } from './CodePanel';

interface LeadLoopAdvancedSuiteProps {
  onClose?: () => void;
  initialTab?: 'forecast' | 'competitor' | 'decay' | 'cadence' | 'audio' | 'code';
}

export const LeadLoopAdvancedSuite: React.FC<LeadLoopAdvancedSuiteProps> = ({
  onClose,
  initialTab = 'forecast'
}) => {
  const { 
    leads, 
    stages, 
    forecast, 
    realtimeStatus,
    battlecards, 
    scoreHistory,
    competitorMentions,
    cadences,
    triggerScoreDecay,
    detectCompetitor,
    saveBattlecard,
    triggerCadenceFallbacks,
    sendOmnichannelMessage,
    transcribeAudio,
    openAIModal,
    setSelectedLeadId,
    setCurrentView,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'forecast' | 'competitor' | 'decay' | 'cadence' | 'audio' | 'code'>(initialTab);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('Salesforce');
  const [competitorInputText, setCompetitorInputText] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectedResult, setDetectedResult] = useState<{ mention?: CompetitorMention; battlecard?: Battlecard } | null>(null);

  // Audio / Transcript State
  const [audioTranscriptInput, setAudioTranscriptInput] = useState<string>(
    'The client mentioned they love the HubSpot marketing hub, but their sales reps find the CRM too clunky on WhatsApp. They are asking whether LeadLoop can integrate or replace it.'
  );
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptResult, setTranscriptResult] = useState<TranscriptionResult | null>(null);

  // Decay engine state
  const [decayThresholdDays, setDecayThresholdDays] = useState<number>(4);
  const [decayPercent, setDecayPercent] = useState<number>(5);
  const [isDecaying, setIsDecaying] = useState<boolean>(false);

  // Message test state
  const [testLeadId, setTestLeadId] = useState<string>(leads[0]?.id || '');
  const [testChannel, setTestChannel] = useState<ChannelOption>('whatsapp');
  const [testMessage, setTestMessage] = useState<string>('Hi Rahul, following up on our proposal discussion! Did you get a chance to review?');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);

  const [errorState, setErrorState] = useState<ErrorState>({ hasError: false, message: '' });

  const activeLeads = leads.filter((l) => l.status === 'active');
  const currentBattlecard = battlecards.find((b) => b.competitor.toLowerCase() === selectedCompetitor.toLowerCase()) || battlecards[0];

  // Forecast Confidence signals
  const confidenceSignals = forecast?.metadata?.signals || [
    'Historical win rate (42% trailing 90 days)',
    'Live conversation sentiment & objection status',
    'Pipeline stage progression velocity',
    'Server-side inactivity decay index'
  ];

  // Competitor detection handler
  const handleDetectCompetitor = async () => {
    if (!competitorInputText.trim()) return;
    setIsDetecting(true);
    setErrorState({ hasError: false, message: '' });
    try {
      const res = await detectCompetitor(competitorInputText);
      if (res.detected) {
        setDetectedResult({ mention: res.mention, battlecard: res.battlecard });
        if (res.battlecard) {
          setSelectedCompetitor(res.battlecard.competitor);
        }
      } else {
        setDetectedResult(null);
        showToast('No known or unlisted competitor mentioned in snippet', 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Competitor analysis failed';
      setErrorState({ hasError: true, message: msg });
    } finally {
      setIsDetecting(false);
    }
  };

  // Score decay handler
  const handleRunScoreDecay = async () => {
    setIsDecaying(true);
    try {
      await triggerScoreDecay(decayThresholdDays, decayPercent);
    } finally {
      setIsDecaying(false);
    }
  };

  // Audio transcription handler
  const handleTranscribeAudio = async () => {
    if (!audioTranscriptInput.trim()) return;
    setIsTranscribing(true);
    try {
      const res = await transcribeAudio(audioTranscriptInput, testLeadId);
      setTranscriptResult(res);
      if (res.detected_competitors && res.detected_competitors.length > 0) {
        setSelectedCompetitor(res.detected_competitors[0]);
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  // Omnichannel message test handler
  const handleSendMessage = async () => {
    if (!testMessage.trim() || !testLeadId) return;
    setIsSendingMessage(true);
    try {
      const idempotencyKey = `idemp-manual-${testLeadId}-${Date.now().toString().slice(-4)}`;
      await sendOmnichannelMessage({
        lead_id: testLeadId,
        channel: testChannel,
        message: testMessage,
        idempotency_key: idempotencyKey,
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden text-slate-800">
      {/* Header with Title and Realtime Connection Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                LeadLoop Revenue Intelligence Suite
              </h2>
              {/* Phase 4: Realtime Lead Sync Indicator (Only 'Live Sync Active' if connected!) */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  realtimeStatus === 'connected'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : realtimeStatus === 'connecting'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                    : 'bg-slate-200 text-slate-600 border border-slate-300'
                }`}
                title={
                  realtimeStatus === 'connected'
                    ? 'Live Realtime websocket channel connected to Supabase'
                    : 'Realtime is not connected; fallback state active'
                }
              >
                <Radio className={`h-3 w-3 ${realtimeStatus === 'connected' ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
                {realtimeStatus === 'connected' ? 'Live Sync Active' : realtimeStatus === 'connecting' ? 'Connecting Realtime...' : 'Realtime: Offline'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Predictive revenue modeling, behavioral scoring decay, Deal Doctor battlecards, and omnichannel cadences.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Close
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-100 px-6 gap-2 bg-white">
        {[
          { id: 'forecast', label: 'AI Revenue Forecast', icon: <TrendingUp className="h-4 w-4" /> },
          { id: 'competitor', label: 'Deal Doctor & Battlecards', icon: <Brain className="h-4 w-4" /> },
          { id: 'decay', label: 'Score Decay & Risk Engine', icon: <Clock className="h-4 w-4" /> },
          { id: 'cadence', label: 'Omnichannel Cadences', icon: <Layers className="h-4 w-4" /> },
          { id: 'audio', label: 'Transcript Pipeline', icon: <Mic className="h-4 w-4" /> },
          { id: 'code', label: 'SQL & Code Inspector', icon: <Code2 className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'forecast' | 'competitor' | 'decay' | 'cadence' | 'audio' | 'code')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Body */}
      <div className="p-6">
        {/* ========================================================================= */}
        {/* TAB 1: AI PREDICTIVE REVENUE FORECAST & BREAKDOWN (Phases 8 & 9) */}
        {/* ========================================================================= */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            {activeLeads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-2">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                <h4 className="font-bold text-slate-800">Insufficient historical data</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add active leads with deal values to initialize the AI Predictive Revenue Forecast engine.
                </p>
              </div>
            ) : (
              <>
                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                      AI Probable Close Value
                    </span>
                    <p className="text-2xl font-black text-indigo-950 mt-1">
                      {formatCurrency(forecast?.forecast_value || 0)}
                    </p>
                    <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                      Σ (Deal Value × ML Close Probability)
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Forecast Confidence
                    </span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">
                        {forecast?.confidence || 78}%
                      </span>
                      <span className="text-xs font-bold text-emerald-600">High Reliability</span>
                    </div>
                    {/* Animated Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${forecast?.confidence || 78}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Weighted Pipeline (Stage-Based)
                    </span>
                    <p className="text-2xl font-black text-slate-800 mt-1">
                      {formatCurrency(forecast?.weighted_pipeline || 0)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Stage baseline probability applied
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Total Active Pipeline
                    </span>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {formatCurrency(forecast?.pipeline_value || 0)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {activeLeads.length} active opportunities
                    </p>
                  </div>
                </div>

                {/* Contributing Signals Box */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>Contributing Signals to AI Forecast Confidence</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {confidenceSignals.map((sig, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{sig}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transparent Deal-by-Deal Forecast Breakdown Table (Phase 9) */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">
                      Transparent Forecast Deal Breakdown
                    </h3>
                    <span className="text-xs font-bold text-slate-500">
                      {activeLeads.length} active deals evaluated
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="py-2.5 px-4">Deal & Company</th>
                          <th className="py-2.5 px-4">Stage</th>
                          <th className="py-2.5 px-4">Deal Value</th>
                          <th className="py-2.5 px-4">Close Prob.</th>
                          <th className="py-2.5 px-4">AI Probable Close</th>
                          <th className="py-2.5 px-4">Risk Status</th>
                          <th className="py-2.5 px-4">Key Signals</th>
                          <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeLeads.map((lead) => {
                          const stage = stages.find((s) => s.id === lead.stage_id);
                          const prob = lead.probability_score || 40;
                          const val = Number(lead.deal_value) || 0;
                          const probableVal = Math.round(val * (prob / 100));

                          return (
                            <tr key={lead.id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 px-4 font-bold text-slate-900">
                                <div>{lead.name}</div>
                                <div className="text-[10px] font-normal text-slate-500">{lead.company || 'Direct'}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                  {stage?.name || 'New'}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-800">
                                {formatCurrency(val)}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 font-bold ${
                                  prob >= 70 ? 'text-emerald-700' : prob >= 40 ? 'text-amber-700' : 'text-rose-700'
                                }`}>
                                  {prob}%
                                </span>
                              </td>
                              <td className="py-3 px-4 font-black text-indigo-700">
                                {formatCurrency(probableVal)}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                  lead.risk_status === 'CRITICAL'
                                    ? 'bg-rose-100 text-rose-800'
                                    : lead.risk_status === 'AT_RISK'
                                    ? 'bg-amber-100 text-amber-800'
                                    : lead.risk_status === 'WATCH'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {lead.risk_status || 'HEALTHY'}
                                </span>
                              </td>
                              <td className="py-3 px-4 max-w-xs text-[11px] text-slate-600 truncate">
                                {lead.risk_reasons?.[0] || (lead.memory?.objections?.[0] ? `Objection: ${lead.memory.objections[0]}` : 'Active dialogue')}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => openAIModal(lead)}
                                  className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition"
                                >
                                  AI Message
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DEAL DOCTOR COMPETITOR INTELLIGENCE & BATTLECARDS (Phases 10 & 11) */}
        {/* ========================================================================= */}
        {activeTab === 'competitor' && (
          <div className="space-y-6">
            {/* Realtime Competitor Mention Detection Box */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-sm">Deal Doctor Competitor Detector</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Detects Salesforce, HubSpot, Zoho, Pipedrive, Dynamics, or unlisted software
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={competitorInputText}
                  onChange={(e) => setCompetitorInputText(e.target.value)}
                  placeholder="Paste email snippet, transcript, or objection (e.g. 'The client is comparing us to Salesforce Einstein')..."
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  onClick={handleDetectCompetitor}
                  disabled={isDetecting || !competitorInputText.trim()}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5"
                >
                  {isDetecting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  <span>Analyze</span>
                </button>
              </div>

              {detectedResult?.mention && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs flex items-start justify-between gap-3 animate-fadeIn">
                  <div className="space-y-1">
                    <span className="font-bold text-emerald-900">
                      🎯 Competitor Identified: {detectedResult.mention.competitor} ({detectedResult.mention.confidence}% confidence)
                    </span>
                    <p className="text-emerald-800 text-[11px]">
                      Context: "{detectedResult.mention.context}"
                    </p>
                    <p className="text-emerald-700 text-[10px]">
                      Objection: {detectedResult.mention.objection}
                    </p>
                  </div>
                  <span className="rounded-md bg-emerald-200 text-emerald-900 px-2 py-0.5 text-[10px] font-black uppercase">
                    Saved to Database
                  </span>
                </div>
              )}
            </div>

            {/* Competitor Selector Pills */}
            <div className="flex flex-wrap gap-2">
              {['Salesforce', 'HubSpot', 'Zoho', 'Pipedrive', 'Microsoft Dynamics'].map((name) => (
                <button
                  key={name}
                  onClick={() => setSelectedCompetitor(name)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    selectedCompetitor.toLowerCase() === name.toLowerCase()
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Database-Driven Battlecard Viewer (Phase 11) */}
            {currentBattlecard ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                      Verified Competitive Strategy
                    </span>
                    <h3 className="text-lg font-black text-slate-900">
                      {currentBattlecard.competitor} Battlecard
                    </h3>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Database-Driven
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Common Objection */}
                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 space-y-1">
                    <span className="font-bold text-rose-900 text-[11px] uppercase tracking-wider">
                      Likely Prospect Objection
                    </span>
                    <p className="text-rose-800 font-medium">"{currentBattlecard.objection}"</p>
                  </div>

                  {/* Key Differentiation */}
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-1">
                    <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider">
                      LeadLoop AI Differentiation
                    </span>
                    <p className="text-emerald-800 font-medium">{currentBattlecard.differentiation}</p>
                  </div>
                </div>

                {/* Suggested Response */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-1.5 text-xs">
                  <span className="font-bold text-indigo-950 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Suggested High-Converting Rep Response</span>
                  </span>
                  <p className="text-slate-800 leading-relaxed font-normal bg-white p-3 rounded-lg border border-indigo-100">
                    "{currentBattlecard.suggested_response}"
                  </p>
                </div>

                {/* Discovery Questions & Recommended Action */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                      Targeted Discovery Questions
                    </span>
                    <ul className="space-y-1.5 text-slate-600">
                      {currentBattlecard.discovery_questions?.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-indigo-600 font-bold">•</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                      Recommended Next Sales Action
                    </span>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-800">
                      {currentBattlecard.recommended_action}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                No battlecard found for {selectedCompetitor}.
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SCORE DECAY ENGINE & AT-RISK DEALS (Phases 5, 6, 7) */}
        {/* ========================================================================= */}
        {activeTab === 'decay' && (
          <div className="space-y-6">
            {/* Server-Side Score Decay Controller */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Server-Side Score Decay Engine</h3>
                  <p className="text-xs text-slate-500">
                    Automatically decays lead scores when no meaningful touchpoint occurs for 4+ consecutive days.
                  </p>
                </div>
                <button
                  onClick={handleRunScoreDecay}
                  disabled={isDecaying}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isDecaying ? 'animate-spin' : ''}`} />
                  <span>Execute Decay Pass</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Inactivity Threshold:</span>
                  <select
                    value={decayThresholdDays}
                    onChange={(e) => setDecayThresholdDays(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-bold text-slate-800"
                  >
                    <option value={3}>3 Days</option>
                    <option value={4}>4 Days (Default)</option>
                    <option value={7}>7 Days</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Decay Rate:</span>
                  <select
                    value={decayPercent}
                    onChange={(e) => setDecayPercent(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-bold text-slate-800"
                  >
                    <option value={3}>3% per day</option>
                    <option value={5}>5% per day (Default)</option>
                    <option value={10}>10% per day</option>
                  </select>
                </div>
              </div>
            </div>

            {/* At-Risk Deals & Losing Momentum Section (Phase 7) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-rose-950 text-xs">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    <span>Critical & At-Risk Opportunities</span>
                  </div>
                  <span className="rounded-full bg-rose-200 text-rose-900 px-2 py-0.5 text-[10px] font-black">
                    {leads.filter((l) => l.risk_status === 'CRITICAL' || l.risk_status === 'AT_RISK').length}
                  </span>
                </div>

                <div className="space-y-2">
                  {leads
                    .filter((l) => l.risk_status === 'CRITICAL' || l.risk_status === 'AT_RISK')
                    .map((l) => (
                      <div key={l.id} className="rounded-xl border border-rose-200 bg-white p-3 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">{l.name}</span>
                          <span className="ml-2 text-slate-500 font-semibold">{formatCurrency(Number(l.deal_value) || 0)}</span>
                          <p className="text-[11px] text-rose-700 mt-0.5">{l.risk_reasons?.[0] || 'Dormant without touchpoint'}</p>
                        </div>
                        <button
                          onClick={() => openAIModal(l)}
                          className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-800 hover:bg-rose-100 transition"
                        >
                          Rescue
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Score History Audit Trail (Phase 6) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <span>Auditable Score History Log</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">{scoreHistory.length} events</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {scoreHistory.slice(0, 10).map((h) => (
                    <div key={h.id} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`font-black text-[11px] ${h.change_amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {h.change_amount > 0 ? `+${h.change_amount}` : h.change_amount} pts ({h.previous_score} → {h.new_score})
                        </span>
                        <span className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">{h.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: OMNICHANNEL CADENCE ENGINE & FALLBACK AUTOMATION (Phases 13 & 14) */}
        {/* ========================================================================= */}
        {activeTab === 'cadence' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Automated Omnichannel Cadences</h3>
                <p className="text-xs text-slate-500">
                  Reliable multi-channel follow-up sequences with backend fallback routing (WhatsApp → Email → LinkedIn).
                </p>
              </div>
              <button
                onClick={triggerCadenceFallbacks}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
              >
                Trigger Fallback Audit
              </button>
            </div>

            {/* Active Cadences List */}
            <div className="space-y-3">
              {cadences.map((cad) => (
                <div key={cad.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{cad.name}</span>
                      <p className="text-[11px] text-slate-500">Target Lead ID: {cad.lead_id}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black uppercase">
                      {cad.status}
                    </span>
                  </div>

                  {/* Steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                    {cad.steps?.map((step) => (
                      <div key={step.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="uppercase text-indigo-600">Step {step.step_number}: {step.channel}</span>
                          <span className="text-slate-400">{step.delay}h delay</span>
                        </div>
                        <p className="text-slate-700 text-[11px] line-clamp-2">"{step.message_template}"</p>
                        <div className="text-[10px] text-amber-700 font-semibold pt-1 border-t border-slate-100">
                          Fallback: {step.fallback_channel} if unread after {step.fallback_after_hours}h
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Idempotent Message Sender Test Box (Phase 14) */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 text-xs">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Send className="h-4 w-4 text-indigo-600" />
                <span>Test Idempotent Omnichannel Dispatcher</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={testLeadId}
                  onChange={(e) => setTestLeadId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.company || 'Direct'})
                    </option>
                  ))}
                </select>

                <select
                  value={testChannel}
                  onChange={(e) => setTestChannel(e.target.value as ChannelOption)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="call">Call Task</option>
                  <option value="sms">SMS</option>
                </select>

                <button
                  onClick={handleSendMessage}
                  disabled={isSendingMessage}
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition shadow-xs"
                >
                  {isSendingMessage ? 'Dispatching...' : 'Send with Idempotency Key'}
                </button>
              </div>

              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: AUDIO / TRANSCRIPT PIPELINE (Phase 12) */}
        {/* ========================================================================= */}
        {activeTab === 'audio' && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Call & Audio Transcript Ingestion Pipeline</h3>
              <p className="text-xs text-slate-500">
                Architecture: Audio → Transcription → Competitor Detection → Objection Detection → Battlecard → CRM Activity
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-700">Paste Call Transcript or Voice Memo Text</label>
              <textarea
                value={audioTranscriptInput}
                onChange={(e) => setAudioTranscriptInput(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleTranscribeAudio}
                  disabled={isTranscribing || !audioTranscriptInput.trim()}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5"
                >
                  {isTranscribing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
                  <span>Ingest & Process Transcript</span>
                </button>
              </div>
            </div>

            {transcriptResult && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <span className="font-bold text-emerald-950 text-sm">
                    Pipeline Execution Complete (Provider: {transcriptResult.provider})
                  </span>
                  <span className="rounded-md bg-emerald-200 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-900">
                    Logged to Activity Timeline
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white border border-emerald-200 p-3 space-y-1">
                    <span className="font-bold text-slate-900 text-[11px] uppercase">Competitors Detected</span>
                    <p className="font-semibold text-slate-700">
                      {transcriptResult.detected_competitors?.join(', ') || 'None detected'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-emerald-200 p-3 space-y-1">
                    <span className="font-bold text-slate-900 text-[11px] uppercase">Objections Detected</span>
                    <p className="font-semibold text-slate-700">
                      {transcriptResult.detected_objections?.join(', ') || 'None detected'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: SQL & CODE INSPECTOR (Interactive Copy/Download & Search) */}
        {/* ========================================================================= */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <CodePanel />
          </div>
        )}
      </div>
    </div>
  );
};
