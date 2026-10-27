import React from 'react';
import { useApp, AppView } from '../../context/AppContext';
import { LayoutDashboard, Users, Kanban, CalendarCheck2, BarChart3 } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentView, setCurrentView, followups } = useApp();

  const now = new Date();
  const alertCount = followups.filter(
    (f) => f.status === 'overdue' || (f.status === 'pending' && new Date(f.scheduled_at).toDateString() === now.toDateString())
  ).length;

  const items: { view: AppView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { view: 'dashboard', label: 'Home', icon: <LayoutDashboard className="h-5 w-5" /> },
    { view: 'leads', label: 'Leads', icon: <Users className="h-5 w-5" /> },
    { view: 'pipeline', label: 'Pipeline', icon: <Kanban className="h-5 w-5" /> },
    { 
      view: 'followups', 
      label: 'Follow-ups', 
      icon: <CalendarCheck2 className="h-5 w-5" />,
      badge: alertCount > 0 ? alertCount : undefined
    },
    { view: 'analytics', label: 'Metrics', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-slate-200 bg-white/95 px-2 backdrop-blur-lg md:hidden">
      {items.map((item) => {
        const isActive = currentView === item.view || (item.view === 'leads' && currentView === 'lead-detail');
        return (
          <button
            key={item.view}
            onClick={() => setCurrentView(item.view)}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all ${
              isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
