import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Toast } from './components/common/Toast';
import { AddLeadModal } from './components/modals/AddLeadModal';
import { AIFollowUpModal } from './components/modals/AIFollowUpModal';
import { UpgradeModal } from './components/modals/UpgradeModal';
import { ScoreWhyModal } from './components/modals/ScoreWhyModal';
import { AnalyzeConversationModal } from './components/modals/AnalyzeConversationModal';
import { SequenceModal } from './components/modals/SequenceModal';
import { CommandBarModal } from './components/modals/CommandBarModal';
import { AskLeadLoopDrawer } from './components/floating/AskLeadLoopDrawer';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { PipelinePage } from './pages/PipelinePage';
import { FollowupsPage } from './pages/FollowupsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LeadLoopAdvancedSuite } from './components/enterprise/LeadLoopAdvancedSuite';

const AppContent: React.FC = () => {
  const { currentView, isAuthenticated, setIsCommandBarOpen } = useApp();

  // Global keyboard shortcut for Command Bar (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCommandBarOpen]);

  // Full-page independent views
  if (currentView === 'landing') {
    return <LandingPage />;
  }

  if (currentView === 'auth') {
    return <AuthPage />;
  }

  if (currentView === 'onboarding') {
    return <OnboardingPage />;
  }

  // If unauthenticated and not on landing/auth/onboarding, redirect to landing
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Main Authenticated SaaS Layout
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 antialiased">
      {/* Desktop & Tablet Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
          <div className="mx-auto max-w-7xl">
            {currentView === 'dashboard' && <DashboardPage />}
            {currentView === 'leads' && <LeadsPage />}
            {currentView === 'lead-detail' && <LeadDetailPage />}
            {currentView === 'pipeline' && <PipelinePage />}
            {currentView === 'followups' && <FollowupsPage />}
            {currentView === 'analytics' && <AnalyticsPage />}
            {currentView === 'suite' && <LeadLoopAdvancedSuite />}
            {currentView === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>

      {/* Mobile Compact Navigation */}
      <MobileNav />

      {/* Global Modals, Drawers & Toasts */}
      <AddLeadModal />
      <AIFollowUpModal />
      <UpgradeModal />
      <ScoreWhyModal />
      <AnalyzeConversationModal />
      <SequenceModal />
      <CommandBarModal />
      <AskLeadLoopDrawer />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
