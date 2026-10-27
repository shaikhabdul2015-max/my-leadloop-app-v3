import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Calendar, Clock, Send } from 'lucide-react';
import { ChannelOption, Lead } from '../../types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export const ScheduleFollowupModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, lead }) => {
  const { scheduleFollowup, showToast } = useApp();

  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 16);
  });
  const [channel, setChannel] = useState<ChannelOption>('whatsapp');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setSubmitting(true);
    try {
      await scheduleFollowup(
        lead.id,
        new Date(date).toISOString(),
        message.trim() || `Follow-up check-in with ${lead.name}`,
        channel,
        false
      );
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Schedule Follow-up</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs">
            <span className="text-slate-400 font-medium">Recipient: </span>
            <span className="font-bold text-slate-800">{lead.name}</span>
            {lead.company && <span className="text-slate-500"> • {lead.company}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as ChannelOption)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="call">Phone Call</option>
              <option value="sms">SMS</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Message or Reminder Note</label>
            <textarea
              rows={3}
              placeholder="e.g. Check in regarding proposal terms or pricing clarification..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submitting ? 'Scheduling...' : 'Save Follow-up'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
