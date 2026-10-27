import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User, 
  Building2, 
  Sparkles, 
  Bell, 
  CreditCard, 
  Sliders, 
  Save, 
  RefreshCw, 
  Check, 
  ShieldCheck,
  Flame,
  Zap,
  FileText,
  Clock,
  ToggleLeft,
  ToggleRight,
  Code2,
  Search,
  Download,
  Copy,
  Filter,
  X
} from 'lucide-react';
import { ToneOption, ChannelOption } from '../types';
import { CodePanel } from '../components/enterprise/CodePanel';

export const SettingsPage: React.FC = () => {
  const { 
    user, 
    workspace, 
    subscription, 
    stages, 
    automations,
    auditLogs,
    toggleAutomation,
    finishOnboarding, 
    upgradePlan, 
    resetDemo, 
    setIsUpgradeModalOpen, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'ai' | 'automations' | 'audit' | 'code' | 'billing'>('profile');

  // Logs Search & Filter State
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState<'all' | 'lead' | 'ai' | 'status' | 'auth'>('all');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (logCategoryFilter !== 'all') {
        const act = log.action.toLowerCase();
        if (logCategoryFilter === 'lead' && !act.includes('lead')) return false;
        if (logCategoryFilter === 'ai' && !act.includes('ai') && !act.includes('prediction') && !act.includes('forecast')) return false;
        if (logCategoryFilter === 'status' && !act.includes('stage') && !act.includes('status') && !act.includes('decay')) return false;
        if (logCategoryFilter === 'auth' && !act.includes('auth') && !act.includes('workspace') && !act.includes('user')) return false;
      }
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesDetails = log.details.toLowerCase().includes(q);
        const matchesUser = log.user_name.toLowerCase().includes(q);
        const matchesEntity = log.entity_type.toLowerCase().includes(q);
        return matchesAction || matchesDetails || matchesUser || matchesEntity;
      }
      return true;
    });
  }, [auditLogs, logSearchQuery, logCategoryFilter]);

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `leadloop_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported ${filteredLogs.length} logs successfully!`, 'success');
  };

  const handleCopyLog = (log: any) => {
    const text = `[${new Date(log.created_at).toLocaleString()}] ${log.action} (${log.entity_type}): ${log.details} by ${log.user_name}`;
    navigator.clipboard.writeText(text);
    setCopiedLogId(log.id);
    showToast('Log entry copied to clipboard', 'info');
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  // Form states
  const [fullName, setFullName] = useState(user.full_name || '');
  const [businessType, setBusinessType] = useState(user.business_type || 'agency');
  const [productDesc, setProductDesc] = useState(user.product_description || '');
  const [preferredTone, setPreferredTone] = useState<ToneOption>(user.preferred_tone || 'professional-friendly');
  const [workspaceName, setWorkspaceName] = useState(workspace.name || '');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await finishOnboarding({
      full_name: fullName,
      business_type: businessType,
      product_description: productDesc,
      preferred_tone: preferredTone,
      workspace_name: workspaceName,
    });
  };

  const aiUsed = workspace.ai_generations_used || 0;
  const aiLimit = subscription.ai_limit || 50;
  const usagePct = Math.min(100, Math.round((aiUsed / aiLimit) * 100));

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Workspace Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your profile, AI tone preferences, team workspace, and billing plan.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'profile', label: 'Profile & Brand', icon: <User className="h-4 w-4" /> },
          { id: 'ai', label: 'AI Follow-up Preferences', icon: <Sparkles className="h-4 w-4" /> },
          { id: 'automations', label: 'Automations', icon: <Zap className="h-4 w-4" /> },
          { id: 'audit', label: 'Audit Trail', icon: <FileText className="h-4 w-4" /> },
          { id: 'code', label: 'Developer & Code', icon: <Code2 className="h-4 w-4" /> },
          { id: 'workspace', label: 'Workspace & Team', icon: <Building2 className="h-4 w-4" /> },
          { id: 'billing', label: 'Billing & Limits', icon: <CreditCard className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile & Brand Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <h3 className="font-bold text-slate-900 text-base">Personal & Service Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="freelance">Freelancer / Independent Consultant</option>
                <option value="agency">Agency / Studio</option>
                <option value="sales_team">B2B Sales Team</option>
                <option value="small_business">Small Business Owner</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service / Product Description</label>
            <textarea
              rows={3}
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              placeholder="e.g. Custom Webflow & Shopify design sprints for high-growth tech startups"
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-400">
              The AI engine references this service context when drafting personalized follow-up messages.
            </span>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* AI Preferences Tab */}
      {activeTab === 'ai' && (
        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="border-b pb-3 border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">AI Generation Preferences</h3>
            <p className="text-xs text-slate-500">Fine-tune how LeadLoop AI writes and schedules follow-ups.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Tone</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'professional-friendly', label: 'Professional-Friendly', desc: 'Warm yet business-appropriate' },
                  { id: 'professional', label: 'Professional', desc: 'Formal, concise & corporate' },
                  { id: 'friendly', label: 'Friendly', desc: 'Warm, personable & conversational' },
                  { id: 'casual', label: 'Casual', desc: 'Relaxed, modern & peer-to-peer' },
                  { id: 'short', label: 'Short & Direct', desc: '1-2 punchy sentences' },
                  { id: 'persuasive', label: 'Persuasive', desc: 'Focuses on ROI & urgency' },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setPreferredTone(tone.id as ToneOption)}
                    className={`rounded-xl border p-3 text-left transition ${
                      preferredTone === tone.id
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 block">{tone.label}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{tone.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-2">
              <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                Anti-Spam & Fact Integrity Rules Active
              </h4>
              <p className="text-xs text-indigo-900/80 leading-relaxed">
                LeadLoop AI strictly forbids fabricated customer claims or fake urgency. Every generated follow-up
                is constrained to provided context and always requires explicit user review before scheduling.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
            >
              <Save className="h-4 w-4" />
              <span>Save AI Preferences</span>
            </button>
          </div>
        </form>
      )}

      {/* Automations Tab */}
      {activeTab === 'automations' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Proactive Follow-up Automations</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rules that continuously inspect stage updates, inactivity, and overdue follow-ups to keep pipeline velocity high.
            </p>
          </div>

          <div className="space-y-3">
            {automations.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{rule.name}</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      rule.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {rule.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{rule.description}</p>
                  <p className="text-[10px] text-slate-400">
                    Trigger: <span className="font-medium text-slate-600">{rule.trigger_type.replace('_', ' ')}</span> • Executions: {rule.executions_count}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAutomation(rule.id, !rule.is_active)}
                  className="p-1 text-indigo-600 hover:text-indigo-800 transition"
                  title={rule.is_active ? 'Pause Rule' : 'Activate Rule'}
                >
                  {rule.is_active ? (
                    <ToggleRight className="h-7 w-7 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-slate-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Trail Tab with Advanced Search Filter */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Security & Action Audit Trail</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                  {filteredLogs.length} of {auditLogs.length} logs
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable ledger of lead modifications, AI message generations, stage transitions, and auth events.
              </p>
            </div>

            <button
              onClick={handleExportLogs}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition self-start sm:self-auto"
              title="Download JSON of filtered logs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export JSON</span>
            </button>
          </div>

          {/* Search Filter & Category Chips */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs by action, details, user, or entity..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition shadow-2xs"
              />
              {logSearchQuery && (
                <button
                  onClick={() => setLogSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Events' },
                  { id: 'lead', label: 'Lead Operations' },
                  { id: 'status', label: 'Stage & Status' },
                  { id: 'ai', label: 'AI Intelligence' },
                  { id: 'auth', label: 'Auth & Workspace' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setLogCategoryFilter(cat.id as any)}
                    className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
                      logCategoryFilter === cat.id
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {(logSearchQuery || logCategoryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setLogSearchQuery('');
                    setLogCategoryFilter('all');
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Logs List */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
                <Search className="mx-auto h-7 w-7 text-slate-400" />
                <p className="text-xs font-bold text-slate-700">No matching log records found</p>
                <p className="text-[11px] text-slate-400">Try adjusting your search keywords or clear the category filter.</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isAI = log.action.toLowerCase().includes('ai') || log.action.toLowerCase().includes('prediction') || log.action.toLowerCase().includes('forecast');
                const isStage = log.action.toLowerCase().includes('stage') || log.action.toLowerCase().includes('decay');

                return (
                  <div
                    key={log.id}
                    className="group rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-200 hover:shadow-xs p-3 text-xs space-y-1.5 transition-all"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isAI
                            ? 'bg-indigo-100 text-indigo-700'
                            : isStage
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Target: {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(-6)})` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">{new Date(log.created_at).toLocaleString()}</span>
                        <button
                          onClick={() => handleCopyLog(log)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition"
                          title="Copy log entry"
                        >
                          {copiedLogId === log.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="font-semibold text-slate-800 leading-snug">{log.details}</p>

                    <div className="text-[10px] text-slate-400 flex items-center gap-3">
                      <span>Recorded by: <span className="font-medium text-slate-600">{log.user_name}</span></span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">ID: {log.id}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Developer & Code Panel Tab */}
      {activeTab === 'code' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <CodePanel />
        </div>
      )}

      {/* Workspace Tab */}
      {activeTab === 'workspace' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <h3 className="font-bold text-slate-900 text-base">Workspace & Demo Controls</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Workspace Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveProfile}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Update
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs">Reset Sample Data</h4>
            <p className="text-xs text-slate-500">
              Restore the original realistic demo leads (Rahul Sharma, Priya Digital, Apex Interiors) to test clean workflows.
            </p>
            <button
              type="button"
              onClick={resetDemo}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Sample Leads & Activities</span>
            </button>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Subscription Plan & Limits</h3>
              <p className="text-xs text-slate-500">Track monthly resource usage across your workspace.</p>
            </div>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase text-indigo-700">
              {subscription.plan} Plan
            </span>
          </div>

          {/* Meter */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">AI Follow-up Generations</span>
              <span className="font-semibold text-slate-600">
                {aiUsed} / {subscription.plan === 'free' ? aiLimit : 'Unlimited'}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {subscription.plan === 'free'
                ? 'Free plan is limited to 50 AI follow-up generations per month and 25 leads.'
                : 'Unlimited AI follow-up generations enabled on your tier.'}
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              <Flame className="h-4 w-4 text-amber-300" />
              <span>Change / Upgrade Plan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
