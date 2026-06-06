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
    <div className="min-h-screen bg-[#fcfdff] font-sans pb-16 selection:bg-brand-500/30 selection:text-brand-900 relative">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="glass-panel sticky top-0 z-40 border-b border-white/50 border-x-0 border-t-0 shadow-sm shadow-slate-200/40">
        <div className="max-w-[96rem] mx-auto px-6 py-4 flex items-center justify-between">
          {/* Brand + Back */}
          <div className="flex items-center gap-6">
            {/* Back button */}
            <button
              onClick={() => setCurrentProject(null)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 font-semibold transition-all px-3 py-1.5 rounded-xl hover:bg-brand-50"
              title="Back to all projects"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Projects
            </button>

            <div className="w-px h-8 bg-slate-200" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 border border-white/20">
                <span className="text-white font-black text-sm">AS</span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                  {currentProject.name}
                </h1>
                <p className="text-[10px] text-brand-600 font-bold tracking-[0.2em] uppercase mt-0.5">AutoSchedule Pro</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                  ${activeTab === tab.id
                    ? 'bg-white shadow-md text-brand-700 border border-slate-100 scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="relative z-10">
        {activeTab === 'grid'  && <TimetableGrid projectId={currentProject._id} />}
        {activeTab === 'admin' && <AdminDashboard projectId={currentProject._id} />}
      </div>
    </div>
  );
}