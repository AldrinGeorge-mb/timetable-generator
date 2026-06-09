import { useState } from 'react';
import { SectionCard } from './SharedAdminUI';

const API = import.meta.env.VITE_API_URL || '';

const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
};

export default function SubjectsTab({ 
    projectId, 
    subjects, 
    setSubjects, 
    classes, 
    showToast, 
    requestConfirm, 
    setAdminTab 
}) {
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectClasses, setNewSubjectClasses] = useState([]);

    async function handleAddSubject() {
        const name = newSubjectName.trim().toUpperCase();
        if (!name) return;
        try {
            const s = await authFetch(`${API}/api/subjects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, projectId, applicableClasses: newSubjectClasses }),
            }).then(r => r.json());
            if (s.error) { showToast(s.error, 'error'); return; }
            setSubjects(prev => [...prev, s]);
            setNewSubjectName('');
            setNewSubjectClasses([]);
            showToast(`Subject ${name} added`, 'success');
        } catch { showToast('Failed to add subject', 'error'); }
    }

    function handleDeleteSubject(name) {
        requestConfirm(
            "Delete Subject",
            `Are you sure you want to delete ${name}?`,
            async () => {
                try {
                    await authFetch(`${API}/api/subjects/${encodeURIComponent(name)}?projectId=${projectId}`, { method: 'DELETE' });
                    setSubjects(prev => prev.filter(s => s.name !== name));
                    showToast(`Deleted ${name}`, 'warning');
                } catch (e) { showToast('Error deleting subject', 'error'); }
            }
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full pb-20">
            {/* Header */}
            <header className="mb-12">
                <h1 className="font-serif text-[42px] text-slate-900 font-bold tracking-tight mb-3">Subjects Management</h1>
                <p className="text-slate-500 text-[15px] max-w-2xl leading-relaxed">Define the curriculum. Add subjects and assign them to specific classes to build accurate academic schedules.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Column 1: Add New Subject */}
                <section className="lg:col-span-5 bg-white border border-slate-200 rounded-[24px] p-8 sticky top-28 shadow-sm">
                    <h2 className="font-serif text-[22px] text-slate-800 font-bold mb-8 border-b border-slate-100 pb-5 flex items-center gap-3">
                        <div className="text-[#0b57d0]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                        </div>
                        Add New Subject
                    </h2>

                    <div className="space-y-8">
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Subject Name</label>
                            <input
                                type="text"
                                placeholder="E.G. CHEMISTRY"
                                value={newSubjectName}
                                onChange={e => setNewSubjectName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                                className="w-full bg-[#f8faff] border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0b57d0] focus:ring-4 focus:ring-[#0b57d0]/10 transition-all placeholder:text-slate-300 uppercase shadow-sm"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Applicable Classes</label>
                                {classes.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newSubjectClasses.length === classes.length) {
                                                setNewSubjectClasses([]);
                                            } else {
                                                setNewSubjectClasses([...classes]);
                                            }
                                        }}
                                        className="text-[10px] font-bold text-[#0b57d0] hover:text-blue-800 hover:underline uppercase tracking-wider transition-all"
                                    >
                                        {newSubjectClasses.length === classes.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                )}
                            </div>

                            {classes.length === 0 ? (
                                <div className="p-5 bg-amber-50 border border-amber-200/60 rounded-2xl flex flex-col items-center text-center">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-amber-100 flex items-center justify-center text-amber-500 mb-2">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    </div>
                                    <h4 className="text-sm font-bold text-amber-900 mb-1">No Classes Available</h4>
                                    <p className="text-[11px] font-medium text-amber-700/80 mb-3 max-w-[200px]">Create at least one class before adding subjects.</p>
                                    <button 
                                        onClick={() => setAdminTab('classes')}
                                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                                    >
                                        Go to Classes Tab
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {classes.map(cls => {
                                        const isSelected = newSubjectClasses.includes(cls);
                                        return (
                                            <button
                                                key={cls}
                                                onClick={() => {
                                                    if (isSelected) setNewSubjectClasses(prev => prev.filter(c => c !== cls));
                                                    else setNewSubjectClasses(prev => [...prev, cls]);
                                                }}
                                                className={`py-2 px-3 rounded-lg border font-medium text-[13px] transition-all flex items-center justify-center gap-1.5 ${
                                                    isSelected
                                                        ? 'bg-[#f0f4ff] border-[#0b57d0]/30 text-[#0b57d0] shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                {cls}
                                                {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <button
                                onClick={handleAddSubject}
                                className="w-full bg-[#0b57d0] hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                                Add Subject
                            </button>
                        </div>
                    </div>
                </section>

                {/* Column 2: All Subjects */}
                <section className="lg:col-span-7 space-y-6">
                    <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-5">
                        <h2 className="font-serif text-[26px] text-slate-800 font-bold flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                            All Subjects
                        </h2>
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 py-1.5 px-3 rounded-full">{subjects.length} Defined</span>
                    </div>

                    {subjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                            <div className="w-16 h-16 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center justify-center text-[#0b57d0] mb-4">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 mb-2">No subjects defined</h3>
                            <p className="text-sm font-medium text-slate-500 max-w-sm">Create subjects like Math or Science first before assigning them to teachers.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {subjects.map(s => (
                                <div key={s.name} className="group relative bg-white border border-slate-200 rounded-[16px] p-6 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                                    <button
                                        onClick={() => handleDeleteSubject(s.name)}
                                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                        title="Delete Subject"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                    
                                    <h3 className="font-bold text-[17px] text-slate-900 mb-4 pr-8 tracking-tight">{s.name}</h3>
                                    
                                    {s.applicableClasses && s.applicableClasses.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {s.applicableClasses.map(c => (
                                                <span key={c} className="text-[11px] font-bold bg-slate-100/80 text-slate-500 px-2.5 py-1.5 rounded-md">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
