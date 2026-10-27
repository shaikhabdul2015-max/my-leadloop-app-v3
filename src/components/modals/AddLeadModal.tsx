import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, UserPlus, AlertCircle, Sparkles } from 'lucide-react';

export const AddLeadModal: React.FC = () => {
  const { 
    isAddLeadModalOpen, 
    setIsAddLeadModalOpen, 
    addLead, 
    stages, 
    subscription, 
    leads, 
    setIsUpgradeModalOpen 
  } = useApp();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [source, setSource] = useState('website');
  const [stageId, setStageId] = useState(stages[0]?.id || 'stage-1');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAddLeadModalOpen) return null;

  const isAtFreeLimit = subscription.plan === 'free' && leads.length >= subscription.lead_limit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a lead name');
      return;
    }

    if (isAtFreeLimit) {
      setIsAddLeadModalOpen(false);
      setIsUpgradeModalOpen(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await addLead({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        service: service.trim(),
        deal_value: Number(dealValue) || 0,
        currency,
        source,
        stage_id: stageId,
        notes: notes.trim(),
      });
      // Reset form
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setService('');
      setDealValue('');
      setNotes('');
      setIsAddLeadModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add lead');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Add New Lead</h3>
              <p className="text-xs text-slate-500">Track prospect and automatically schedule follow-ups</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddLeadModalOpen(false)}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {isAtFreeLimit && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">Free Plan Limit Reached ({subscription.lead_limit} leads)</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Upgrade to Pro to add up to 500 leads and unlock unlimited AI follow-up generations.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddLeadModalOpen(false);
                    setIsUpgradeModalOpen(true);
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:underline"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Upgrade Workspace Now
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Org</label>
              <input
                type="text"
                placeholder="e.g. XYZ Digital"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="rahul@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp</label>
              <input
                type="text"
                placeholder="+91 98201 44521"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service / Project</label>
              <input
                type="text"
                placeholder="e.g. Website Redesign & SEO"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Value</label>
              <div className="flex">
                <input
                  type="number"
                  placeholder="75000"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="w-full rounded-l-xl border border-r-0 border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-r-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="AED">AED</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              >
                <option value="website">Website Inquiry</option>
                <option value="referral">Referral / Word of Mouth</option>
                <option value="linkedin">LinkedIn</option>
                <option value="inbound">Inbound Email / Call</option>
                <option value="outbound">Outbound Prospecting</option>
                <option value="ads">Paid Ads (Google / Meta)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pipeline Stage</label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              >
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Context Notes & Key Discussions</label>
            <textarea
              rows={3}
              placeholder="e.g. Discussed budget constraints, client wants delivery before Diwali, partner needs to approve proposal."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddLeadModalOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isAtFreeLimit}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
