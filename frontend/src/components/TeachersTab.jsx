import { useState } from 'react';
import { SectionCard, Tag, IconButton, ClassGroupSelector } from './SharedAdminUI';

const API = import.meta.env.VITE_API_URL || '';

const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
};

export default function TeachersTab({ 
    projectId, 
    teachers, 
    setTeachers, 
    subjects, 
    classes, 
    showToast, 
    requestConfirm, 
    setAdminTab 
}) {
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [expandedAssignmentIndex, setExpandedAssignmentIndex] = useState(null);
    const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

    function startAddTeacher() {
        setEditingTeacher({ isNew: true, name: '', assignments: [] });
        setExpandedAssignmentIndex(null);
    }

    function handleDeleteTeacher(name) {
        requestConfirm(
            "Delete Teacher",
            `Are you sure you want to delete ${name}?`,
            async () => {
                try {
                    await authFetch(`${API}/api/teachers/${encodeURIComponent(name)}?projectId=${projectId}`, { method: 'DELETE' });
                    setTeachers(prev => prev.filter(t => t.name !== name));
                    showToast(`Deleted ${name}`, 'warning');
                } catch (e) { showToast('Error deleting teacher', 'error'); }
            }
        );
    }

    function startEditTeacher(teacher) {
        setEditingTeacher({ name: teacher.name, assignments: JSON.parse(JSON.stringify(teacher.assignments || [])) });
        setExpandedAssignmentIndex(null);
    }

    async function saveEditTeacher() {
        const name = editingTeacher.name.trim().toUpperCase();
        if (!name) return;
        const { assignments, isNew } = editingTeacher;

        try {
            if (isNew) {
                const t = await authFetch(`${API}/api/teachers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, assignments, projectId }),
                }).then(r => r.json());
                if (t.error) { showToast(t.error, 'error'); return; }
                setTeachers(prev => [...prev, t]);
                showToast(`Teacher ${name} created`, 'success');
            } else {
                await authFetch(`${API}/api/teachers/${encodeURIComponent(name)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assignments, projectId }),
                });
                setTeachers(prev => prev.map(t => t.name === name ? { ...t, assignments } : t));
                showToast(`Updated ${name}`, 'success');
            }
            setEditingTeacher(null);
        } catch {
            showToast('Failed to save teacher', 'error');
        }
    }

    return (
        <div className="space-y-6">
            <div className={`grid grid-cols-1 gap-6 items-start`}>
                {/* Teachers List */}
                <SectionCard title="Faculty Roster" badge={teachers.length}>
                    {teachers.length === 0 ? (
                        <div className="flex items-center justify-center py-16 w-full">
                            <div className="relative rounded-[32px] p-[3px] bg-gradient-to-br from-[#4f46e5] to-[#c026d3] w-full max-w-[320px] shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <div className="bg-[#f8faff] rounded-[29px] p-6 h-full flex flex-col">
                                    <div className="w-12 h-12 bg-[#e8eefc] rounded-xl flex items-center justify-center text-[#4f46e5] mb-4">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                                    </div>
                                    <h3 className="text-[22px] font-bold text-[#0f172a] leading-tight mb-3">Onboard New<br/>Teacher</h3>
                                    <p className="text-[13px] font-medium text-[#475569] leading-relaxed mb-6">Add a new faculty member, configure their department, and set up their class assignments in one place.</p>
                                    <button onClick={startAddTeacher} className="mt-auto self-start px-5 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-bold text-[#0f172a] shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors active:scale-95">
                                        Get Started <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {teachers.map(t => {
                                const totalAssignedClasses = (t.assignments || []).reduce((sum, a) => sum + (a.classes?.length || 0), 0);
                                return (
                                    <div key={t.name} className="group p-5 bg-white border border-slate-200 rounded-3xl shadow-sm hover:border-indigo-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-full min-h-[160px]">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-bl-[100px] pointer-events-none transition-transform group-hover:scale-110" />
                                        
                                        <div className="relative z-10 flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200/50">
                                                    {t.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-700 transition-colors truncate max-w-[100px]" title={t.name}>{t.name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.assignments?.length || 0} Subjects</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all bg-white shadow-sm border border-slate-100 rounded-xl p-1 gap-1 -mr-2 -mt-2">
                                                <IconButton 
                                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>} 
                                                    onClick={() => startEditTeacher(t)}
                                                    className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 w-8 h-8"
                                                />
                                                <IconButton 
                                                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>} 
                                                    onClick={() => handleDeleteTeacher(t.name)}
                                                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 w-8 h-8"
                                                />
                                            </div>
                                        </div>

                                        <div className="relative z-10 flex-1 mt-2">
                                            {t.assignments && t.assignments.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {t.assignments.map(a => (
                                                        <div key={a.subject} className="flex flex-col bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 flex-1 min-w-[80px] hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group/assignment">
                                                            <span className="text-[11px] font-black text-slate-700 truncate group-hover/assignment:text-indigo-700">{a.subject}</span>
                                                            <span className="text-[9px] font-bold text-slate-400 mt-0.5 leading-tight group-hover/assignment:text-indigo-500 line-clamp-2">
                                                                {a.classes && a.classes.length > 0 ? a.classes.join(', ') : 'No classes'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs font-medium text-slate-400 italic">No assignments yet</div>
                                            )}
                                        </div>
                                        
                                        <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500">Total Classes</span>
                                            <span className="text-xs font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100/50">
                                                {totalAssignedClasses}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            <div 
                                onClick={startAddTeacher}
                                className="group p-5 bg-white border border-slate-200 border-dashed rounded-3xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-center items-center h-full min-h-[160px] cursor-pointer"
                            >
                                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                </div>
                                <h3 className="font-bold text-slate-600 group-hover:text-indigo-700 transition-colors">Add New Teacher</h3>
                            </div>
                        </div>
                    )}
                </SectionCard>

                {/* Modals */}
                <div>

                    {/* Edit Teacher Modal */}
                    {editingTeacher && (
                        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl animate-in fade-in zoom-in-[0.98] duration-300 relative overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
                                <div className="relative pt-10 pb-8 px-8 bg-white border-b border-slate-200 shrink-0">
                                    <button onClick={() => setEditingTeacher(null)} className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all border border-slate-100"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                    <div className="relative z-10 flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-[#f0f4ff] border border-blue-100/50 flex items-center justify-center text-[#0b57d0] shrink-0">
                                            {editingTeacher.isNew ? <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                                        </div>
                                        <div>
                                            <h3 className="font-serif text-[28px] text-slate-800 font-bold leading-tight mb-1">{editingTeacher.isNew ? 'New Teacher' : editingTeacher.name}</h3>
                                            <p className="text-[13px] font-medium text-slate-500">{editingTeacher.isNew ? 'Create profile and assign classes.' : 'Update profile and assignments.'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar relative z-10 bg-white">
                                    {editingTeacher.isNew && (
                                        <div className="mb-8 group">
                                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 transition-colors group-focus-within:text-[#0b57d0]">Teacher Name</label>
                                            <input type="text" placeholder="e.g. Celin" value={editingTeacher.name} onChange={e => setEditingTeacher(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-5 py-4 text-sm font-semibold focus:outline-none focus:border-[#0b57d0] focus:ring-4 focus:ring-[#0b57d0]/10 transition-all placeholder:text-slate-300 shadow-sm" />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Subject Assignments</h4>
                                        <span className="text-[10px] font-bold px-3 py-1 bg-[#f0f4ff] text-[#0b57d0] rounded-full border border-blue-100">{editingTeacher.assignments.length} Assigned</span>
                                    </div>
                                
                                    {subjects.length === 0 ? (
                                        <div className="p-6 bg-amber-50 border border-amber-200/60 rounded-[24px] flex flex-col items-center text-center mt-4 mb-8">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-amber-100 flex items-center justify-center text-amber-500 mb-3">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                                            </div>
                                            <h4 className="text-sm font-bold text-amber-900 mb-1">No Subjects Available</h4>
                                            <p className="text-xs font-medium text-amber-700/80 mb-4 max-w-[250px]">You need to create at least one subject before you can assign it to a teacher.</p>
                                            <button 
                                                onClick={() => {
                                                    setEditingTeacher(null);
                                                    if(setAdminTab) setAdminTab('subjects');
                                                }}
                                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                                            >
                                                Go to Subjects Tab
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-4 mb-8 max-h-64 overflow-y-auto pr-2">
                                                {editingTeacher.assignments.map((assignment, index) => (
                                                    <div key={assignment.subject} className="p-5 bg-white border border-slate-200 rounded-[24px] shadow-sm hover:border-[#0b57d0]/30 hover:shadow transition-all group">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="font-bold text-sm text-[#0b57d0]">{assignment.subject}</span>
                                                            <button onClick={() => setEditingTeacher(prev => {
                                                                const newAss = [...prev.assignments];
                                                                newAss.splice(index, 1);
                                                                return { ...prev, assignments: newAss };
                                                            })} className="text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 w-8 h-8 flex items-center justify-center rounded-full transition-colors opacity-0 group-hover:opacity-100"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {assignment.classes?.map(cls => (
                                                                <span key={cls} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f4ff] text-[#0b57d0] text-xs font-bold rounded-full border border-blue-100">
                                                                    {cls}
                                                                    <button onClick={() => setEditingTeacher(prev => {
                                                                        const newAss = [...prev.assignments];
                                                                        newAss[index].classes = newAss[index].classes.filter(c => c !== cls);
                                                                        return { ...prev, assignments: newAss };
                                                                    })} className="hover:text-red-500 transition-colors focus:outline-none">
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        
                                                        {expandedAssignmentIndex === index ? (() => {
                                                            const disabledClassesMap = {};
                                                            teachers.forEach(t => {
                                                                if (t.name === editingTeacher.name && !editingTeacher.isNew) return; // skip self
                                                                (t.assignments || []).forEach(a => {
                                                                    if (a.subject === assignment.subject) {
                                                                        (a.classes || []).forEach(c => {
                                                                            disabledClassesMap[c] = t.name;
                                                                        });
                                                                    }
                                                                });
                                                            });

                                                            return (
                                                                <div className="mt-4 pt-3 border-t border-slate-100">
                                                                    <ClassGroupSelector 
                                                                        availableClasses={classes}
                                                                        selectedClasses={assignment.classes || []}
                                                                        disabledClassesMap={disabledClassesMap}
                                                                        onToggleClass={(cls, isSelected) => {
                                                                            setEditingTeacher(prev => {
                                                                                const newAss = [...prev.assignments];
                                                                                if (!newAss[index].classes) newAss[index].classes = [];
                                                                                if (isSelected && !newAss[index].classes.includes(cls)) newAss[index].classes.push(cls);
                                                                                if (!isSelected) newAss[index].classes = newAss[index].classes.filter(c => c !== cls);
                                                                                return { ...prev, assignments: newAss };
                                                                            });
                                                                        }}
                                                                        onToggleGroup={(groupClasses, isSelected) => {
                                                                            setEditingTeacher(prev => {
                                                                                const newAss = [...prev.assignments];
                                                                                if (!newAss[index].classes) newAss[index].classes = [];
                                                                                if (isSelected) {
                                                                                    groupClasses.forEach(c => {
                                                                                        if (!newAss[index].classes.includes(c)) newAss[index].classes.push(c);
                                                                                    });
                                                                                } else {
                                                                                    newAss[index].classes = newAss[index].classes.filter(c => !groupClasses.includes(c));
                                                                                }
                                                                                return { ...prev, assignments: newAss };
                                                                            });
                                                                        }}
                                                                    />
                                                                    <button type="button" onClick={() => setExpandedAssignmentIndex(null)} className="w-full mt-3 py-2 text-xs font-bold text-white bg-[#0b57d0] hover:bg-blue-700 rounded-xl transition-colors shadow-sm">Done</button>
                                                                </div>
                                                            );
                                                        })() : (
                                                            <button type="button" onClick={() => setExpandedAssignmentIndex(index)} className="mt-3 w-full py-2 text-xs text-[#0b57d0] font-bold border border-blue-200 border-dashed rounded-xl bg-[#f8faff] hover:bg-[#f0f4ff] transition-colors">+ Manage Classes</button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="relative mt-2 mb-8 group">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                                                    className={`w-full flex items-center justify-between px-5 py-4 bg-slate-50/50 border border-dashed rounded-2xl text-sm font-bold transition-all cursor-pointer ${isSubjectDropdownOpen ? 'bg-[#f8faff] border-[#0b57d0] text-[#0b57d0] shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-[#f8faff] hover:border-blue-200 hover:text-[#0b57d0]'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isSubjectDropdownOpen ? 'text-[#0b57d0]' : 'text-slate-400 group-hover:text-[#0b57d0] transition-colors'}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                                        Assign a new subject...
                                                    </div>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isSubjectDropdownOpen ? 'text-[#0b57d0] rotate-180' : 'text-slate-400'}`}><polyline points="6 9 12 15 18 9"/></svg>
                                                </button>
                                                
                                                {isSubjectDropdownOpen && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-[200] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                                        {subjects.filter(s => !editingTeacher.assignments.some(a => a.subject === s.name)).length === 0 ? (
                                                            <div className="px-5 py-4 text-sm font-medium text-slate-400 italic text-center">No more subjects available</div>
                                                        ) : (
                                                            subjects.filter(s => !editingTeacher.assignments.some(a => a.subject === s.name)).map(s => (
                                                                <button
                                                                    key={s.name}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingTeacher(prev => ({ ...prev, assignments: [...prev.assignments, { subject: s.name, classes: [] }] }));
                                                                        setIsSubjectDropdownOpen(false);
                                                                    }}
                                                                    className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-[#f0f4ff] hover:text-[#0b57d0] transition-colors flex items-center justify-between group/item"
                                                                >
                                                                    {s.name}
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#0b57d0] opacity-0 group-hover/item:opacity-100 transition-opacity"><polyline points="20 6 9 17 4 12"/></svg>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                                    <button
                                        onClick={() => setEditingTeacher(null)}
                                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-[13px] font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                                    >Cancel</button>
                                    <button
                                        onClick={saveEditTeacher}
                                        className="px-7 py-2.5 bg-[#0b57d0] hover:bg-blue-700 text-white text-[13px] font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2"
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                                        Save Teacher
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
