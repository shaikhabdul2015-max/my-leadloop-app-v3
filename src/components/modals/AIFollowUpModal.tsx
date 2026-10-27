import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  Calendar, 
  RefreshCw, 
  MessageSquare, 
  AlertCircle, 
  Send,
  Zap,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ToneOption, ChannelOption, AIFollowUpResponse } from '../../types';
import { AILoadingIndicator } from '../common/AILoadingIndicator';
import { QuotaAlertBanner } from '../common/QuotaAlertBanner';

export const AIFollowUpModal: React.FC = () => {
  const { 
    isAIModalOpen, 
    aiModalLead, 
    closeAIModal, 
    generateAIFollowup, 
    scheduleFollowup,
    logLeadActivity,
    showToast,
    user 
  } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIFollowUpResponse | null>(null);
  const [editedMessage, setEditedMessage] = useState<string>('');
  const [editedSubject, setEditedSubject] = useState<string>('');
  const [selectedTone, setSelectedTone] = useState<ToneOption>(user.preferred_tone || 'professional-friendly');
  const [selectedChannel, setSelectedChannel] = useState<ChannelOption>('whatsapp');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);
  const [isLoggingActivity, setIsLoggingActivity] = useState<boolean>(false);

  // Trigger generation on open
  useEffect(() => {
    if (isAIModalOpen && aiModalLead) {
      handleGenerate();
    }
  }, [isAIModalOpen, aiModalLead]);

  const handleGenerate = async (overrideTone?: ToneOption, overrideChannel?: ChannelOption) => {
    if (!aiModalLead) return;
    setLoading(true);
    setError(null);
    try {
      const toneToUse = overrideTone || selectedTone;
      const channelToUse = overrideChannel || selectedChannel;
      const response = await generateAIFollowup(aiModalLead, {
        tone: toneToUse,
        channel: channelToUse,
      });
      setResult(response);
      setEditedMessage(response.body || response.message);
      setEditedSubject(response.subject || '');
      setSelectedChannel((response.suggested_channel as ChannelOption) || channelToUse);

      // Default scheduled date = today + follow_up_after_days
      const d = new Date();
      d.setDate(d.getDate() + (response.follow_up_after_days || 2));
      const formatted = d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
      setScheduledDate(formatted);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to generate AI follow-up message.';
      if (errMsg.includes('quota') || errMsg.includes('resource_exhausted')) {
        setError('Google Gemini API quota limit reached for your key/tier. Intelligent offline fallback engine is active.');
      } else if (errMsg.includes('permission') || errMsg.includes('caller does not have permission')) {
        setError('Google Gemini API authorization notice: "The caller does not have permission". Intelligent offline fallback engine is active.');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!editedMessage) return;
    const textToCopy = selectedChannel === 'email' && editedSubject
      ? `Subject: ${editedSubject}\n\n${editedMessage}`
      : editedMessage;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showToast('Follow-up draft copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSchedule = async () => {
    if (!aiModalLead || !scheduledDate) return;
    setIsScheduling(true);
    try {
      const messageToSave = selectedChannel === 'email' && editedSubject
        ? `Subject: ${editedSubject}\n\n${editedMessage}`
        : editedMessage;
      await scheduleFollowup(
        aiModalLead.id,
        new Date(scheduledDate).toISOString(),
        messageToSave,
        selectedChannel,
        true,
        result?.lead_intent,
        result?.reason
      );
      closeAIModal();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleLogActivity = async () => {
    if (!aiModalLead || !editedMessage || isLoggingActivity) return;
    setIsLoggingActivity(true);
    try {
      const messageToSave = selectedChannel === 'email' && editedSubject
        ? `Subject: ${editedSubject}\n\n${editedMessage}`
        : editedMessage;
      await logLeadActivity(aiModalLead.id, {
        agent_name: user.full_name || 'Sales Agent',
        channel: selectedChannel === 'email' ? 'email' : 'whatsapp',
        message_body: messageToSave,
      });
      closeAIModal();
    } catch (err: any) {
      setError(err.message || 'Failed to log lead activity');
    } finally {
      setIsLoggingActivity(false);
    }
  };

  if (!isAIModalOpen || !aiModalLead) return null;

  const toneOptions: { id: ToneOption; label: string }[] = [
    { id: 'professional-friendly', label: 'Professional-Friendly' },
    { id: 'professional', label: 'Professional' },
    { id: 'friendly', label: 'Friendly' },
    { id: 'casual', label: 'Casual' },
    { id: 'short', label: 'Short & Direct' },
    { id: 'persuasive', label: 'Persuasive' },
  ];

  const channelOptions: { id: ChannelOption; label: string }[] = [
    { id: 'whatsapp', label: 'WhatsApp (Direct & Concise)' },
    { id: 'email', label: 'Email (With Subject Line)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                AI Follow-up Assistant
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {result?.quota_notice?.engine_fallback ? 'Smart Rules Fallback' : 'Gemini 3.8 Flash'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Crafting targeted message for <span className="font-semibold text-slate-700">{aiModalLead.name}</span>
                {aiModalLead.company && ` (${aiModalLead.company})`}
              </p>
            </div>
          </div>
          <button
            onClick={closeAIModal}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <AILoadingIndicator
              title={`Synthesizing Follow-up for ${aiModalLead.name}`}
              subtitle="Evaluating current stage velocity, buyer objections, and optimal touchpoint timing."
              stages={[
                `Loading history for ${aiModalLead.name}...`,
                'Evaluating objection patterns & intent signals...',
                `Synthesizing ${selectedTone} touchpoint via ${selectedChannel}...`,
                'Calibrating conversion probability & response hook...',
              ]}
            />
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 text-center space-y-3">
              <AlertCircle className="mx-auto h-7 w-7 text-rose-500" />
              <div>
                <h5 className="font-bold text-rose-900 text-sm">Follow-up Generation Notice</h5>
                <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">{error}</p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => handleGenerate()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry Request</span>
                </button>
              </div>
            </div>
          ) : result ? (
            <>
              {/* Quota Alert Banner if fallback engine was triggered */}
              {result.quota_notice && (
                <QuotaAlertBanner
                  notice={result.quota_notice}
                  onRetry={() => handleGenerate()}
                />
              )}

              {/* Intelligence Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lead Intent</span>
                  <p className="text-xs font-bold text-slate-900 capitalize mt-0.5">{result.lead_intent.replace('_', ' ')}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Action</span>
                  <p className="text-xs font-bold text-indigo-700 capitalize mt-0.5">{result.recommended_action.replace('_', ' ')}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Urgency</span>
                  <p className="text-xs font-bold capitalize mt-0.5 flex items-center gap-1">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        result.urgency === 'high'
                          ? 'bg-rose-500'
                          : result.urgency === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className={result.urgency === 'high' ? 'text-rose-700' : 'text-slate-800'}>
                      {result.urgency}
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Channel</span>
                  <p className="text-xs font-bold text-slate-900 capitalize mt-0.5">{result.suggested_channel}</p>
                </div>
              </div>

              {/* Recommendation Callout */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 flex items-start gap-3">
                <Zap className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-indigo-950">Strategic Rationale</p>
                  <p className="text-xs text-indigo-900/80 mt-0.5">{result.reason}</p>
                </div>
              </div>

              {/* Tone & Channel Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Tone:</label>
                  <select
                    value={selectedTone}
                    onChange={(e) => {
                      const newTone = e.target.value as ToneOption;
                      setSelectedTone(newTone);
                      handleGenerate(newTone, selectedChannel);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    {toneOptions.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Channel:</label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => {
                      const newCh = e.target.value as ChannelOption;
                      setSelectedChannel(newCh);
                      handleGenerate(selectedTone, newCh);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    {channelOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleGenerate()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition ml-auto"
                >
                  <RefreshCw className="h-3 w-3 text-slate-500" />
                  Regenerate
                </button>
              </div>

              {/* Draft Status & Review Banner */}
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-50/80 border border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-200 text-amber-900">
                    Draft • Unsent
                  </span>
                  <span className="text-xs text-amber-900 font-medium">
                    {selectedChannel === 'email'
                      ? 'Email draft with subject line ready for review.'
                      : 'Concise WhatsApp message draft (no subject line).'}
                  </span>
                </div>
                <span className="text-[11px] text-amber-700 font-medium hidden sm:inline">
                  Will not send until approved
                </span>
              </div>

              {/* Email Subject Line (Only for Email Channel) */}
              {selectedChannel === 'email' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      Email Subject Line
                    </label>
                    <span className="text-[11px] text-slate-400">Clear & compelling subject</span>
                  </div>
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    placeholder="Enter email subject line..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
              )}

              {/* Message Body Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                    {selectedChannel === 'email' ? 'Email Body (Editable)' : 'WhatsApp Message (Concise Draft)'}
                  </label>
                  <span className="text-[11px] text-slate-400">Review and refine before scheduling</span>
                </div>
                <textarea
                  rows={selectedChannel === 'email' ? 5 : 3}
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition resize-y font-sans leading-relaxed"
                />
              </div>

              {/* Schedule Timing Input */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">Schedule Follow-up for:</span>
                </div>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={closeAIModal}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleCopy}
              disabled={loading || !editedMessage}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleSchedule}
              disabled={loading || !editedMessage || isScheduling || isLoggingActivity}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-700 focus:outline-none transition disabled:opacity-50"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{isScheduling ? 'Scheduling...' : 'Approve & Schedule'}</span>
            </button>

            <button
              onClick={handleLogActivity}
              disabled={loading || !editedMessage || isLoggingActivity || isScheduling}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none transition disabled:opacity-50"
              title="Confirm interaction has been executed and log to lead activity audit trail"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isLoggingActivity ? 'Logging...' : 'Confirm Sent & Log'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
