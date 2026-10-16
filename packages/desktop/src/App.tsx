import React from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { WorkerTeamBar } from './components/common/WorkerTeamBar';
import { ChatView } from './components/Chat/ChatView';
import { LiveActivityView } from './components/LiveActivity/LiveActivityView';
import { TasksView } from './components/Tasks/TasksView';
import { FilesView } from './components/Files/FilesView';
import { IntegrationsView } from './components/Integrations/IntegrationsView';
import { SettingsView } from './components/Settings/SettingsView';
import { ApprovalModal } from './components/Approvals/ApprovalModal';
import { WifiOff, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { activeTab, connected, refreshAll } = useApp();

  return (
    <div className="flex h-screen w-screen bg-surface-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Offline Banner if Cloud Backend is Disconnected */}
        {!connected && (
          <div className="bg-rose-950/80 border-b border-rose-800/80 px-4 py-2 flex items-center justify-between text-xs text-rose-200 z-40 backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <WifiOff size={15} className="text-rose-400" />
              <span>
                Backend disconnected. Attempting to reconnect to cloud orchestrator...
              </span>
            </div>
            <button
              onClick={refreshAll}
              className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-850 text-white font-semibold transition flex items-center space-x-1"
            >
              <RefreshCw size={12} />
              <span>Retry Now</span>
            </button>
          </div>
        )}

        {/* Global Autonomous Squad Roster Bar */}
        <WorkerTeamBar />

        {/* View Routing */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'CHAT' && <ChatView />}
          {activeTab === 'LIVE_ACTIVITY' && <LiveActivityView />}
          {activeTab === 'TASKS' && <TasksView />}
          {activeTab === 'FILES' && <FilesView />}
          {activeTab === 'INTEGRATIONS' && <IntegrationsView />}
          {activeTab === 'SETTINGS' && <SettingsView />}
        </div>

        {/* Global Action Approval Modal */}
        <ApprovalModal />
      </main>
    </div>
  );
};
