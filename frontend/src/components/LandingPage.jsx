import { useState, useEffect } from 'react';
import Toast from './Toast';

const API = 'http://localhost:5000';

const PROJECT_COLORS = [
    { bg: 'from-brand-600 to-indigo-500',   light: 'bg-brand-50',     text: 'text-brand-700',   border: 'border-brand-200/50' },
    { bg: 'from-emerald-500 to-teal-400',   light: 'bg-emerald-50',   text: 'text-emerald-700', border: 'border-emerald-200/50' },
    { bg: 'from-violet-600 to-fuchsia-500', light: 'bg-violet-50',    text: 'text-violet-700',  border: 'border-violet-200/50' },
    { bg: 'from-rose-500 to-pink-500',      light: 'bg-rose-50',      text: 'text-rose-700',    border: 'border-rose-200/50' },
    { bg: 'from-amber-500 to-orange-400',   light: 'bg-amber-50',     text: 'text-amber-700',   border: 'border-amber-200/50' },
    { bg: 'from-sky-500 to-cyan-400',       light: 'bg-sky-50',       text: 'text-sky-700',     border: 'border-sky-200/50' },
];

function getColorIndex(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % PROJECT_COLORS.length;
}

export default function LandingPage({ onSelectProject }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [toast, setToast] = useState({ message: '', type: 'info' });
    const showToast = (message, type = 'info') => setToast({ message, type });

    useEffect(() => {
        fetch(`${API}/api/projects`)
            .then(r => r.json())
            .then(data => setProjects(data))
            .catch(() => showToast('Failed to connect to backend', 'error'))
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            const resp = await fetch(`${API}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() })
            });
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || 'Failed');
            }
            const project = await resp.json();
            setProjects(prev => [project, ...prev]);
            setNewName('');
            setNewDesc('');
            setShowForm(false);
            showToast(`Project "${project.name}" created!`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (project, e) => {
        e.stopPropagation();
        if (!window.confirm(`Delete project "${project.name}" and all its data? This cannot be undone.`)) return;
        try {
            await fetch(`${API}/api/projects/${project._id}`, { method: 'DELETE' });
            setProjects(prev => prev.filter(p => p._id !== project._id));
            showToast(`Project "${project.name}" deleted.`, 'warning');
        } catch {
            showToast('Failed to delete project.', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] font-sans relative overflow-hidden selection:bg-brand-500/30 selection:text-white">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

            {/* Premium Dynamic Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
            
            {/* Grid overlay for texture */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] pointer-events-none opacity-50"></div>

            {/* Hero Header */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
                {/* Logo */}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-[24px] shadow-2xl shadow-brand-500/40 mb-10 border border-white/10 backdrop-blur-sm group hover:scale-105 transition-transform duration-500">
                    <span className="text-white font-black text-3xl tracking-tighter">AS</span>
                </div>

                <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                    AutoSchedule <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">Pro</span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
                    Intelligent, collision-free timetable generation for modern educational institutions.
                </p>

                <div className="mt-10 flex items-center justify-center gap-3">
                    <div className="relative flex h-3 w-3 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="text-sm text-slate-400 font-medium tracking-wide uppercase">System Online</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
                {/* Section header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">Your Workspaces</h2>
                        <p className="text-slate-400 text-sm mt-2 font-medium">{projects.length} timetable{projects.length !== 1 ? 's' : ''} synchronized</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 text-sm font-bold rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95"
                    >
                        <span className="text-lg leading-none">+</span> Create New
                    </button>
                </div>

                {/* Create Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-[#18181b] border border-white/10 rounded-[28px] shadow-2xl w-full max-w-md p-8 relative overflow-hidden">
                            {/* Decorative blur in modal */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-[40px] pointer-events-none" />
                            
                            <h3 className="text-2xl font-extrabold text-white mb-2 relative z-10">New Timetable</h3>
                            <p className="text-slate-400 text-sm mb-8 relative z-10">Initialize a new scheduling workspace.</p>
                            
                            <div className="flex flex-col gap-5 mb-8 relative z-10">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Workspace Name <span className="text-rose-500">*</span></label>
                                    <input
                                        autoFocus
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                        placeholder="e.g. St. Mary's High School"
                                        className="w-full bg-[#27272a]/50 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:bg-[#27272a] transition-all placeholder:text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Description</label>
                                    <input
                                        value={newDesc}
                                        onChange={e => setNewDesc(e.target.value)}
                                        placeholder="e.g. 2024–25 Academic Year"
                                        className="w-full bg-[#27272a]/50 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:bg-[#27272a] transition-all placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end relative z-10">
                                <button
                                    onClick={() => { setShowForm(false); setNewName(''); setNewDesc(''); }}
                                    className="px-5 py-2.5 bg-transparent text-slate-300 text-sm font-bold rounded-xl hover:bg-white/5 transition-colors"
                                >Cancel</button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newName.trim() || creating}
                                    className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-500 text-white text-sm font-bold rounded-xl hover:from-brand-500 hover:to-indigo-400 transition-all shadow-lg shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {creating && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Initialize
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Projects Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-400 font-medium text-sm tracking-wide">Syncing workspaces…</p>
                        </div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-32 border border-white/5 bg-white/[0.02] backdrop-blur-sm rounded-[32px]">
                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-xl">
                            <span className="text-4xl opacity-50">✦</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">No Workspaces Found</h3>
                        <p className="text-slate-400 mb-8 max-w-sm mx-auto">Initialize your first workspace to begin generating intelligent timetables.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-8 py-3.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                        >
                            Create Workspace
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(project => {
                            const color = PROJECT_COLORS[getColorIndex(project.name)];
                            const date = new Date(project.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                            return (
                                <div
                                    key={project._id}
                                    onClick={() => onSelectProject(project)}
                                    className="group relative cursor-pointer bg-[#18181b]/80 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-[28px] overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-500/10 flex flex-col"
                                >
                                    {/* Subtle gradient glow inside card */}
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color.bg} opacity-5 blur-[50px] group-hover:opacity-20 transition-opacity duration-500`} />

                                    <div className="p-8 flex-1 flex flex-col relative z-10">
                                        {/* Icon */}
                                        <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${color.bg} rounded-[18px] shadow-lg shadow-black/20 mb-6 border border-white/10`}>
                                            <span className="text-white text-2xl drop-shadow-md">🏫</span>
                                        </div>

                                        <h3 className="text-2xl font-extrabold text-white mb-2 group-hover:text-brand-300 transition-colors tracking-tight">
                                            {project.name}
                                        </h3>
                                        <p className="text-slate-400 text-sm mb-6 leading-relaxed flex-1 font-light">
                                            {project.description || "No description provided."}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                                            <span className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                                                {date}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => handleDelete(project, e)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all text-sm"
                                                    title="Delete workspace"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                                </button>
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-slate-900 transition-all shadow-sm">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
