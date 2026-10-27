import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Clock, 
  Check, 
  Edit2, 
  Layers, 
  RefreshCw,
  Send,
  CheckCircle2
} from 'lucide-react';
import { FollowupSequence, SequenceStep } from '../../types';

export const SequenceModal: React.FC = () => {
  const { 
    isSequenceModalOpen, 
    closeSequenceModal, 
    sequenceModalLead, 
    generateSequence, 
    scheduleFollowup,
    showToast 
  } = useApp();

  const [durationDays, setDurationDays] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [sequence, setSequence] = useState<FollowupSequence | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState<string>('');

  if (!isSequenceModalOpen || !sequenceModalLead) return null;

  const handleGenerate = async (days = durationDays) => {
    setLoading(true);
    try {
      const res = await generateSequence(sequenceModalLead.id, days);
      setSequence(res);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleStep = async (step: SequenceStep, index: number) => {
    if (!sequenceModalLead) return;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + step.day);

    await scheduleFollowup(
      sequenceModalLead.id,
      targetDate.toISOString(),
      step.message,
      step.channel,
      true,
      'sequence_cadence',
      `Sequence step: ${step.title}`
    );

    if (sequence) {
      const updatedSteps = [...sequence.steps];
      updatedSteps[index] = { ...step, status: 'scheduled' };
      setSequence({ ...sequence, steps: updatedSteps });
    }
  };

  const handleSaveEdit = (index: number) => {
    if (sequence) {
      const updatedSteps = [...sequence.steps];
      updatedSteps[index] = { ...updatedSteps[index], message: editedText };
      setSequence({ ...sequence, steps: updatedSteps });
      setEditingIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                AI Follow-up Sequence Engine
              </h3>
              <p className="text-xs text-slate-500">
                Multi-touch cadence for <span className="font-semibold text-slate-700">{sequenceModalLead.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={closeSequenceModal}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!sequence ? (
            <div className="space-y-5 text-center py-6">
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-bold text-slate-900 text-base">Select Sequence Duration</h4>
                <p className="text-xs text-slate-500">
                  AI will draft personalized touchpoints for each cadence interval. Every message requires your explicit approval.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                {[
                  { days: 3, label: '3 Days', desc: 'High Urgency / Fast Close' },
                  { days: 7, label: '7 Days', desc: 'Standard B2B Cadence' },
                  { days: 14, label: '14 Days', desc: 'Consultative Relationship' },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => {
                      setDurationDays(item.days);
                      handleGenerate(item.days);
                    }}
                    className={`rounded-xl border p-4 text-center transition ${
                      durationDays === item.days
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="block font-black text-lg text-slate-900">{item.label}</span>
                    <span className="text-[10px] text-slate-500 block mt-1">{item.desc}</span>
                  </button>
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 pt-4">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>AI is crafting sequence milestones...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{sequence.name}</h4>
                  <span className="text-xs text-slate-500">{sequence.steps.length} touchpoints generated</span>
                </div>
                <button
                  onClick={() => handleGenerate(durationDays)}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Regenerate Sequence</span>
                </button>
              </div>

              <div className="space-y-3">
                {sequence.steps.map((step, idx) => {
                  const isEditingThis = editingIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-black text-indigo-700">
                            Day {step.day}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{step.title}</span>
                          <span className="text-[11px] text-slate-400 capitalize">• via {step.channel}</span>
                        </div>

                        {step.status === 'scheduled' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> Scheduled
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingIndex(idx);
                                setEditedText(step.message);
                              }}
                              className="rounded-lg border px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                            >
                              <Edit2 className="h-3 w-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleScheduleStep(step, idx)}
                              className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-500 flex items-center gap-1 shadow-xs"
                            >
                              <Send className="h-3 w-3" /> Approve & Schedule
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditingThis ? (
                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="rounded px-2.5 py-1 text-xs text-slate-500"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(idx)}
                              className="rounded bg-indigo-600 px-3 py-1 text-xs text-white"
                            >
                              Save Draft
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg italic border border-slate-100">
                          "{step.message}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex justify-between items-center text-xs">
          <span className="text-slate-400">Strict Human-in-the-Loop policy enforced.</span>
          <button
            onClick={closeSequenceModal}
            className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
