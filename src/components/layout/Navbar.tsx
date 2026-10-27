import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Bell, 
  Plus, 
  Building2, 
  Sparkles, 
  LogOut, 
  Settings as SettingsIcon, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  Clock,
  UserX,
  Command,
  Bot,
  ShieldAlert,
  CalendarCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    user, 
    workspace, 
    subscription, 
    notifications, 
    leads,
    searchQuery, 
    setSearchQuery, 
    setSelectedLeadId, 
    setCurrentView,
    setIsAddLeadModalOpen, 
    setIsUpgradeModalOpen,
    setIsCommandBarOpen,
    setIsAskAIOpen,
    markNotificationRead,
    clearAllNotifications,
    resetDemo,
    logout 
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredSearchResults = searchQuery.trim()
    ? leads.filter(
        (l) =>
          l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.phone?.includes(searchQuery)
      ).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 md:px-6 backdrop-blur-md">
      {/* Search Input & Command Shortcut */}
      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, companies, emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-14 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          <button
            type="button"
            onClick={() => setIsCommandBarOpen(true)}
            title="Open AI Command Bar"
            className="absolute right-2 hidden sm:flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-900 shadow-2xs"
          >
            <Command className="h-3 w-3" />
            <span>K</span>
          </button>
        </div>

        {/* Quick Search Dropdown */}
        {isSearchFocused && searchQuery.trim() && (
          <div className="absolute left-0 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
            {filteredSearchResults.length > 0 ? (
              <div className="space-y-1">
                <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Matching Leads
                </div>
                {filteredSearchResults.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setSelectedLeadId(l.id);
                      setCurrentView('lead-detail');
                      setIsSearchFocused(false);
                      setSearchQuery('');
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm hover:bg-slate-50 transition"
                  >
                    <div>
                      <span className="font-medium text-slate-900">{l.name}</span>
                      {l.company && <span className="ml-2 text-xs text-slate-500">• {l.company}</span>}
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {l.score_category || 'LEAD'} ({l.priority_score})
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-slate-500">
                No matching leads found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Ask LeadLoop Button */}
        <button
          onClick={() => setIsAskAIOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
        >
          <Bot className="h-3.5 w-3.5 text-indigo-600" />
          <span>Ask LeadLoop</span>
        </button>

        {/* Workspace Pill */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          <Building2 className="h-3.5 w-3.5 text-indigo-600" />
          <span className="truncate max-w-[130px]">{workspace.name}</span>
          <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-bold uppercase text-indigo-700">
            {subscription.plan}
          </span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-800 text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-slate-500 hover:text-slate-800 transition"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    <Check className="mx-auto h-8 w-8 text-emerald-500 mb-1" />
                    All caught up! No pending alerts.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        if (notif.lead_id) {
                          setSelectedLeadId(notif.lead_id);
                          setCurrentView('lead-detail');
                        }
                        setIsNotifOpen(false);
                      }}
                      className={`flex items-start gap-3 p-3.5 hover:bg-slate-50 cursor-pointer transition ${
                        !notif.read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {notif.type === 'overdue' && (
                          <div className="rounded-lg bg-rose-100 p-1.5 text-rose-600">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                        )}
                        {notif.type === 'due' && (
                          <div className="rounded-lg bg-amber-100 p-1.5 text-amber-600">
                            <Clock className="h-4 w-4" />
                          </div>
                        )}
                        {notif.type === 'at_risk' && (
                          <div className="rounded-lg bg-rose-100 p-1.5 text-rose-600">
                            <ShieldAlert className="h-4 w-4" />
                          </div>
                        )}
                        {notif.type === 'task_due' && (
                          <div className="rounded-lg bg-violet-100 p-1.5 text-violet-600">
                            <CalendarCheck className="h-4 w-4" />
                          </div>
                        )}
                        {notif.type === 'inactive' && (
                          <div className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                            <UserX className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-900 truncate">{notif.title}</p>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-indigo-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA: + Add Lead */}
        <button
          onClick={() => setIsAddLeadModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Lead</span>
        </button>

        {/* Profile Avatar / Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-xl p-1 text-left hover:bg-slate-100 transition"
          >
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={user.full_name}
              className="h-8 w-8 rounded-full object-cover border border-slate-200"
            />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900 text-sm">{user.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setCurrentView('settings');
                    setIsProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <SettingsIcon className="h-4 w-4 text-slate-500" />
                  Settings & Preferences
                </button>
                <button
                  onClick={() => {
                    setIsUpgradeModalOpen(true);
                    setIsProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  Upgrade Plan ({subscription.plan})
                </button>
                <button
                  onClick={() => {
                    resetDemo();
                    setIsProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <RefreshCw className="h-4 w-4 text-slate-500" />
                  Reset Sample Data
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
