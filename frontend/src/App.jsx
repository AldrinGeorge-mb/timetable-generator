import { useState } from 'react';
import LandingPage from './components/LandingPage';
import TimetableGrid from './components/TimetableGrid';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [currentProject, setCurrentProject] = useState(null);
  const [activeTab, setActiveTab] = useState('grid');

  const tabs = [
    { id: 'grid',  label: 'Timetable',      icon: '📅' },
    { id: 'admin', label: 'Admin Dashboard', icon: '⚙️' },
  ];

  // Show landing page if no project is selected
  if (!currentProject) {
    return <LandingPage onSelectProject={(project) => { setCurrentProject(project); setActiveTab('grid'); }} />;
  }

  return (
    <div className="flex h-screen bg-[#f4f7f9] font-sans selection:bg-brand-200 selection:text-brand-900 overflow-hidden">
      
      {/* ── DARK SIDEBAR ── */}
      <aside className="w-64 bg-[#1e293b] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 relative z-20">
        <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg tracking-wider">S</span>
            </div>
            <h1 className="text-white font-bold tracking-wide text-lg">Schedulify</h1>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
            <button
              onClick={() => setCurrentProject(null)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all mb-4"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
              All Workspaces
            </button>

            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">Main</div>
            <button
                onClick={() => setActiveTab('grid')}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-6
                    ${activeTab === 'grid'
                        ? 'bg-brand-600/20 text-brand-400'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                Timetable Grid
            </button>

            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">Admin Dashboard</div>
            <div className="space-y-1">
                {[
                    { id: 'teachers', label: 'Teachers', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
                    { id: 'subjects', label: 'Subjects', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg> },
                    { id: 'classes', label: 'Classes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> }
                ].map(tab => {
                    const isActive = activeTab === 'admin' && window.currentAdminTab === tab.id;
                    // We will just let AdminDashboard handle its own state for now, but we can sync it or just pass it down.
                    // To keep it simple without changing logic too much, let's just make 'admin' open the dashboard and let it handle its tabs internally.
                    // Wait, if we render them here, clicking them should change the tab IN AdminDashboard.
                    return (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab('admin'); window.dispatchEvent(new CustomEvent('setAdminTab', { detail: tab.id })); }}
                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                                ${isActive || (activeTab === 'admin' && tab.id === 'teachers' && !window.currentAdminTab) // Fallback highlight
                                    ? 'bg-[#293649] text-white shadow-sm border border-white/5'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                }`}
                        >
                            <span className="opacity-80">{tab.icon}</span>
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="p-4 border-t border-white/10">
            <div className="text-xs text-slate-500 font-medium">Workspace</div>
            <div className="text-sm text-slate-300 font-bold truncate mt-1">{currentProject.name}</div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200 shrink-0 bg-white z-10">
            <h2 className="text-lg font-bold text-slate-800">
                {activeTab === 'grid' ? 'Timetable Grid' : 'Admin Dashboard'}
            </h2>
            <div className="flex items-center gap-4 text-slate-400">
                <button className="hover:text-slate-600 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                </button>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
            </div>
        </header>

        {/* Page Content Area */}
        <div className="flex-1 overflow-auto bg-[#f8fafc]">
            {activeTab === 'grid'  && <TimetableGrid projectId={currentProject._id} />}
            {activeTab === 'admin' && <AdminDashboard projectId={currentProject._id} />}
        </div>
      </main>
    </div>
  );
}