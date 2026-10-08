/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { AuthWrapper } from './components/AuthWrapper';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { BacklogView } from './components/BacklogView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ProjectsView } from './components/ProjectsView';
import { TeamView } from './components/TeamView';
import { IssueDetailModal } from './components/IssueDetailModal';
import { CreateIssueModal } from './components/CreateIssueModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ClerkAuthModal } from './components/ClerkAuthModal';
import { Activity, ShieldCheck } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, recentActivity, realtimeStatus, activeProject } = useProject();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'board':
        return <KanbanBoard />;
      case 'backlog':
        return <BacklogView />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'projects':
        return <ProjectsView />;
      case 'team':
        return <TeamView />;
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 antialiased select-none">
      {/* Top Navbar with Project Switcher */}
      <Navbar />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/60">
          {renderActiveView()}
        </main>
      </div>

      {/* Bottom Real-Time Event & Supabase Broadcast Ticker */}
      <footer className="h-7 bg-white border-t border-slate-200/90 px-4 flex items-center justify-between text-[11px] text-slate-500 select-none shrink-0 z-20">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-1.5 shrink-0 text-slate-700">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                realtimeStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="font-mono text-[10px] text-slate-500 font-medium">
              Supabase Realtime [{activeProject.key}:broadcast-channel]
            </span>
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* Recent Activity Ticker item */}
          <div className="flex items-center gap-2 truncate">
            <Activity className="w-3 h-3 text-blue-600 shrink-0" />
            <span className="truncate text-slate-700 font-medium">
              {recentActivity.length > 0 ? recentActivity[0].text : 'Engine online and listening for events...'}
            </span>
            <span className="text-slate-400 text-[10px] shrink-0 font-mono">
              ({recentActivity.length > 0 ? recentActivity[0].time : 'now'})
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 shrink-0 font-mono text-[10px] text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Clerk RBAC: Active</span>
          </span>
        </div>
      </footer>

      {/* Global Modals */}
      <IssueDetailModal />
      <CreateIssueModal />
      <CreateProjectModal />
      <ClerkAuthModal />
    </div>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <AuthWrapper>
        <AppContent />
      </AuthWrapper>
    </ProjectProvider>
  );
}
