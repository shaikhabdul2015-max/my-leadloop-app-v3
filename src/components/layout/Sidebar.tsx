import React from 'react';
import { useApp, AppView } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  CalendarCheck2, 
  BarChart3, 
  Settings, 
  Sparkles, 
  Repeat, 
  Flame,
  Globe,
  Command,
  Bot,
  Brain
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    followups, 
    leads,
    subscription, 
    workspace, 
    setIsUpgradeModalOpen,
    setIsCommandBarOpen,
    setIsAskAIOpen 
  } = useApp();

  const now = new Date();
  const todayDueCount = followups.filter(
    (f) => f.status === 'pending' && new Date(f.scheduled_at).toDateString() === now.toDateString()
  ).length;

  const overdueCount = followups.filter(
    (f) => f.status === 'overdue' || (f.status === 'pending' && new Date(f.scheduled_at) < now)
  ).length;

  const atRiskCount = leads.filter((l) => l.status === 'active' && (l.risk_level === 'high' || l.risk_level === 'medium')).length;

  const navItems: { view: AppView; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    {
      view: 'dashboard',
      label: 'Sales Command',
      icon: <LayoutDashboard className="h-5 w-5" />,
      badge: atRiskCount > 0 ? atRiskCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      view: 'leads',
      label: 'Leads & Scoring',
      icon: <Users className="h-5 w-5" />,
    },
    {
      view: 'pipeline',
      label: 'Sales Pipeline',
      icon: <Kanban className="h-5 w-5" />,
    },
    {
      view: 'followups',
      label: 'Follow-up Center',
      icon: <CalendarCheck2 className="h-5 w-5" />,
      badge: overdueCount > 0 ? overdueCount : todayDueCount > 0 ? todayDueCount : undefined,
      badgeColor: overdueCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white',
    },
    {
      view: 'analytics',
      label: 'Revenue Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      view: 'suite',
      label: 'Intelligence Suite',
      icon: <Brain className="h-5 w-5" />,
    },
    {
      view: 'settings',
      label: 'Settings & Team',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const aiUsed = workspace.ai_generations_used || 0;
  const aiLimit = subscription.ai_limit || 50;
  const usagePercent = Math.min(100, Math.round((aiUsed / aiLimit) * 100));

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-200 bg-white min-h-screen justify-between flex-shrink-0">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200">
            <Repeat className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              LeadLoop <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">AI</span>
            </span>
            <p className="text-[10px] text-slate-400 font-medium leading-none">Revenue Intelligence Suite</p>
          </div>
        </div>

        {/* AI Quick Triggers */}
        <div className="p-3 space-y-1 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setIsCommandBarOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Command className="h-3.5 w-3.5 text-indigo-600" />
              <span>AI Command Bar</span>
            </div>
            <kbd className="rounded border bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
              Ctrl+K
            </kbd>
          </button>

          <button
            onClick={() => setIsAskAIOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Bot className="h-3.5 w-3.5 text-indigo-600" />
              <span>Ask LeadLoop AI</span>
            </div>
            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-bold">
              Copilot
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = currentView === item.view || (item.view === 'leads' && currentView === 'lead-detail');
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      isActive ? 'bg-white text-indigo-700' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Usage Card */}
      <div className="p-4 space-y-3">
        {/* Landing Page link */}
        <button
          onClick={() => setCurrentView('landing')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
        >
          <Globe className="h-3.5 w-3.5 text-slate-500" />
          <span>View Public Site</span>
        </button>

        {/* AI Usage Card */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/60 to-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              AI Intelligence
            </span>
            <span className="text-[11px] font-bold text-indigo-700 uppercase">{subscription.plan}</span>
          </div>

          <div className="mt-2.5">
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>{aiUsed} of {subscription.plan === 'free' ? aiLimit : '∞'} used</span>
              <span>{usagePercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-indigo-100 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          {subscription.plan === 'free' && (
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              <Flame className="h-3.5 w-3.5 text-amber-300" />
              <span>Upgrade to Pro</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
