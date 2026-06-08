import { useState, useEffect, useCallback, memo } from 'react';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';

const API = 'http://localhost:5000';

const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
};

// ─── Small UI helpers ──────────────────────────────────────────────────────────
const SectionCard = memo(function SectionCard({ title, badge, children }) {
    return (
        <div className="bg-white backdrop-blur-xl rounded-[32px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden transition-all hover:shadow-[0_12px_50px_-12px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 bg-white">
                <h3 className="font-black text-slate-900 text-lg tracking-tight">{title}</h3>
                {badge !== undefined && (
                    <span className="text-xs font-bold px-3 py-1 bg-white text-indigo-600 rounded-full border border-indigo-100 shadow-sm">{badge}</span>
                )}
            </div>
            <div className="p-8">{children}</div>
        </div>
    );
});

const Tag = memo(function Tag({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/80 text-indigo-600 text-xs font-bold rounded-xl border border-indigo-100/50 shadow-sm backdrop-blur-sm">
            {label}
            {onRemove && (
                <button onClick={onRemove} className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-indigo-200 hover:text-indigo-200 transition-colors text-indigo-600">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            )}
        </span>
    );
});

const IconButton = memo(function IconButton({ onClick, icon, className = '', title = '' }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 text-sm shadow-sm border border-transparent hover:border-black/5 hover:-translate-y-0.5 ${className}`}
        >
            {icon}
        </button>
    );
});

const ClassGroupSelector = memo(function ClassGroupSelector({ availableClasses, selectedClasses, disabledClassesMap = {}, onToggleClass, onToggleGroup }) {
    const groups = {};
    availableClasses.forEach(c => {
        const match = c.match(/^(\d+)/);
        const grade = match ? match[1] : 'Other';
        if (!groups[grade]) groups[grade] = [];
        groups[grade].push(c);
    });

    const [expandedGroups, setExpandedGroups] = useState({});
    const toggleExpand = (grade) => setExpandedGroups(prev => ({...prev, [grade]: !prev[grade]}));

    return (
        <div className="border border-slate-200 rounded-[24px] bg-white backdrop-blur-md overflow-hidden text-left shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            {Object.keys(groups).sort((a,b) => (parseInt(a)||999) - (parseInt(b)||999)).map(grade => {
                const groupClasses = groups[grade];
                const availableGroupClasses = groupClasses.filter(c => !disabledClassesMap[c]);
                const allSelected = availableGroupClasses.length > 0 && availableGroupClasses.every(c => selectedClasses.includes(c));
                const someSelected = availableGroupClasses.some(c => selectedClasses.includes(c));

                return (
                    <div key={grade} className="border-b border-slate-100/50 last:border-0">
                        <div className="flex items-center gap-2 p-2.5 hover:bg-white bg-white transition-colors">
                            <button 
                                type="button"
                                onClick={() => toggleExpand(grade)}
                                className="w-6 h-6 flex items-center justify-center text-slate-900/40 font-bold hover:bg-slate-50 hover:text-slate-900/80 rounded-lg transition-all"
                            >
                                {expandedGroups[grade] ? '▼' : '▶'}
                            </button>
                            <span className="font-bold text-sm text-slate-900/80 flex-1 cursor-pointer select-none" onClick={() => toggleExpand(grade)}>
                                {grade === 'Other' ? 'Other Classes' : `Grade ${grade}`}
                            </span>
                            <input 
                                type="checkbox" 
                                checked={allSelected}
                                disabled={availableGroupClasses.length === 0}
                                ref={input => { if(input) input.indeterminate = someSelected && !allSelected; }}
                                onChange={(e) => onToggleGroup(availableGroupClasses, e.target.checked)}
                                className="w-4 h-4 cursor-pointer accent-brand-600 rounded-md border-slate-300"
                            />
                        </div>
                        {expandedGroups[grade] && (
                            <div className="pl-10 pr-4 py-2 bg-white border-t border-slate-100">
                                {groupClasses.map(c => {
                                    const disabledBy = disabledClassesMap[c];
                                    return (
                                        <label key={c} className={`flex items-center justify-between py-2 px-2 rounded-lg transition-colors ${disabledBy ? 'opacity-50 cursor-not-allowed' : 'hover:bg-transparent cursor-pointer group'}`}>
                                            <span className={`text-sm font-medium ${disabledBy ? 'text-slate-900/40' : 'text-slate-900/60 group-hover:text-brand-700'}`}>
                                                {c} {disabledBy && <span className="text-[10px] font-bold uppercase tracking-wider ml-2 bg-slate-50 px-2 py-0.5 rounded-full text-slate-900/50">{disabledBy}</span>}
                                            </span>
                                            <input 
                                                type="checkbox"
                                                checked={selectedClasses.includes(c)}
                                                disabled={!!disabledBy}
                                                onChange={(e) => onToggleClass(c, e.target.checked)}
                                                className={`w-4 h-4 rounded-md border-slate-300 ${disabledBy ? '' : 'cursor-pointer accent-brand-600'}`}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
});

// ─── Main AdminDashboard ───────────────────────────────────────────────────────
export default function AdminDashboard({ projectId }) {
    const [activeTab, setActiveTab] = useState('teachers');
    const [toast, setToast] = useState({ message: '', type: 'info' });
    const [pendingConfirm, setPendingConfirm] = useState(null);

    useEffect(() => {
        const handleSetTab = (e) => setActiveTab(e.detail);
        window.addEventListener('setAdminTab', handleSetTab);
        return () => window.removeEventListener('setAdminTab', handleSetTab);
    }, []);

    // ── Teachers state ──
    const [teachers, setTeachers] = useState([]);
    const [newTeacherName, setNewTeacherName] = useState('');
    const [newTeacherSpec, setNewTeacherSpec] = useState('');
    const [editingTeacher, setEditingTeacher] = useState(null); // { name, assignments[], isNew }
    const [expandedAssignmentIndex, setExpandedAssignmentIndex] = useState(null);

    // ── Subjects state ──
    const [subjects, setSubjects] = useState([]);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectClasses, setNewSubjectClasses] = useState([]);

    // ── Classes state ──
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [requirements, setRequirements] = useState([]);
    const [newClassName, setNewClassName] = useState('');
    const [newReqSubject, setNewReqSubject] = useState('');
    const [newReqPeriods, setNewReqPeriods] = useState('');
    const [editingRequirement, setEditingRequirement] = useState(null);
    const [saving, setSaving] = useState(false);
    const [classTeacher, setClassTeacher] = useState('');
    const [copyTargets, setCopyTargets] = useState([]);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [copying, setCopying] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const showToast = (message, type = 'info') => setToast({ message, type });
    const clearToast = useCallback(() => setToast({ message: '', type: 'info' }), []);

    const requestConfirm = (title, message, action, confirmText = 'Delete', confirmColor = 'bg-red-600 hover:bg-red-700 text-white') => {
        setPendingConfirm({ title, message, action, confirmText, confirmColor });
    };

    // ── Fetch all on mount ──
    useEffect(() => {
        if (projectId) fetchAll();
    }, [projectId]);

    async function fetchAll() {
        try {
            const [t, s, c] = await Promise.all([
                authFetch(`${API}/api/teachers?projectId=${projectId}`).then(r => r.json()),
                authFetch(`${API}/api/subjects?projectId=${projectId}`).then(r => r.json()),
                authFetch(`${API}/api/classes?projectId=${projectId}`).then(r => r.json()),
            ]);
            setTeachers(t);
            setSubjects(s);
            setClasses(c);
            if (c.length > 0) {
                setSelectedClass(c[0]);
                loadRequirements(c[0]);
            }
        } catch {
            showToast('Failed to load data', 'error');
        }
    }

    async function loadRequirements(className) {
        if (!className) return;
        try {
            const data = await authFetch(`${API}/api/rules/${className}?projectId=${projectId}`).then(r => r.json());
            setRequirements(Array.isArray(data) ? data : (Array.isArray(data.requirements) ? data.requirements : []));
            setClassTeacher(Array.isArray(data) ? '' : (data.classTeacher || ''));
            setIsDirty(false); // Reset dirty state when a class is freshly loaded
        } catch {
            showToast(`Failed to load rules for ${className}`, 'error');
        }
    }

    async function handleClassSwitch(newClass) {
        if (newClass === selectedClass) return;
        if (isDirty && selectedClass) {
            await handleSaveDraft(selectedClass, false); // auto-save silently
        }
        setSelectedClass(newClass);
        loadRequirements(newClass);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TEACHERS
    // ──────────────────────────────────────────────────────────────────────────
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

    // ──────────────────────────────────────────────────────────────────────────
    // SUBJECTS
    // ──────────────────────────────────────────────────────────────────────────
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

    // ──────────────────────────────────────────────────────────────────────────
    // CLASSES & REQUIREMENTS
    // ──────────────────────────────────────────────────────────────────────────
    async function handleAddClass() {
        const name = newClassName.trim().toUpperCase();
        if (!name) return;
        try {
            const c = await authFetch(`${API}/api/classes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ className: name, projectId }),
            }).then(r => r.json());
            if (c.error) { showToast(c.error, 'error'); return; }
            setClasses(prev => {
                const next = [...prev, name];
                next.sort((a, b) => {
                    const matchA = a.match(/^(\d+)(.*)$/);
                    const matchB = b.match(/^(\d+)(.*)$/);
                    if (!matchA || !matchB) return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
                    const numA = parseInt(matchA[1], 10);
                    const numB = parseInt(matchB[1], 10);
                    if (numA !== numB) return numB - numA;
                    return matchA[2].localeCompare(matchB[2]);
                });
                return next;
            });
            setNewClassName('');
            showToast(`Class ${name} created`, 'success');
        } catch { showToast('Failed to create class', 'error'); }
    }

    function handleDeleteClass(className) {
        requestConfirm(
            "Delete Class",
            `Are you sure you want to delete class ${className} and all its requirements?`,
            async () => {
                try {
                    await authFetch(`${API}/api/classes/${encodeURIComponent(className)}?projectId=${projectId}`, { method: 'DELETE' });
                    setClasses(prev => prev.filter(c => c !== className));
                    if (selectedClass === className) {
                        const next = classes.find(c => c !== className) || '';
                        setSelectedClass(next);
                        loadRequirements(next);
                    }
                    showToast(`Deleted class ${className}`, 'warning');
                } catch (e) { showToast('Error deleting class', 'error'); }
            }
        );
    }

    function handleAddRequirement() {
        if (!newReqSubject || !newReqPeriods) return;
        const periods = parseInt(newReqPeriods);
        if (periods < 1 || periods > 14) { showToast('Periods must be 1–14', 'error'); return; }

        const totalNow = requirements.reduce((sum, r) => sum + r.periodsPerWeek, 0);
        if (totalNow + periods > 35) {
            showToast(`Adding ${periods} periods would exceed the 35-slot limit (${35 - totalNow} remaining)`, 'error');
            return;
        }

        const subjectStr = newReqSubject.toUpperCase();
        
        // Auto-resolve teacher
        const matchedTeacher = teachers.find(t => 
            (t.assignments || []).some(a => a.subject === subjectStr && (a.classes || []).includes(selectedClass))
        );

        if (!matchedTeacher) {
            showToast(`No teacher assigned for ${subjectStr} in class ${selectedClass}. Please configure this in the Teachers tab first.`, 'error');
            return;
        }

        setRequirements(prev => [...prev, {
            subject: subjectStr,
            teacher: matchedTeacher.name.toUpperCase(),
            periodsPerWeek: periods
        }]);
        setNewReqSubject('');
        setNewReqPeriods('');
        setIsDirty(true);
    }

    function handleDeleteRequirement(index) {
        setRequirements(prev => prev.filter((_, i) => i !== index));
        setIsDirty(true);
    }

    function startEditRequirement(index, req) {
        setEditingRequirement({
            index,
            subject: req.subject,
            teacher: req.teacher,
            periodsPerWeek: req.periodsPerWeek
        });
    }

    function saveEditRequirement() {
        if (!editingRequirement.periodsPerWeek) return;
        const periods = parseInt(editingRequirement.periodsPerWeek);
        if (periods < 1 || periods > 14) { showToast('Periods must be 1–14', 'error'); return; }

        const otherRequirements = requirements.filter((_, i) => i !== editingRequirement.index);
        const totalNow = otherRequirements.reduce((sum, r) => sum + r.periodsPerWeek, 0);
        
        if (totalNow + periods > 35) {
            showToast(`Updating to ${periods} periods would exceed the 35-slot limit (${35 - totalNow} remaining)`, 'error');
            return;
        }

        setRequirements(prev => prev.map((r, i) => i === editingRequirement.index ? {
            ...r, // Keep the same subject and auto-resolved teacher
            periodsPerWeek: periods
        } : r));
        setEditingRequirement(null);
        setIsDirty(true);
        showToast('Requirement updated', 'success');
    }

    async function handleSaveDraft(targetClass = selectedClass, showToastMsg = true) {
        setSaving(true);
        try {
            await authFetch(`${API}/api/rules/${targetClass}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requirements, projectId, classTeacher, skipRegenerate: true }),
            });
            setIsDirty(false);
            if (showToastMsg) showToast('Requirements saved!', 'success');
        } catch {
            if (showToastMsg) showToast('Failed to save rules', 'error');
        } finally {
            setSaving(false);
        }
    }

    async function handleRegenerateSchedule() {
        if (isDirty) {
            await handleSaveDraft(selectedClass, false);
        }
        setSaving(true);
        try {
            const result = await authFetch(`${API}/api/schedule/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId }),
            }).then(r => r.json());
            showToast(result.message || 'Timetable generated successfully!', 'success');
        } catch {
            showToast('Failed to generate timetable', 'error');
        } finally {
            setSaving(false);
        }
    }

    async function handleCopyRequirements() {
        if (copyTargets.length === 0) return;
        setCopying(true);
        try {
            await Promise.all(copyTargets.map(async (targetClass) => {
                // Fetch target's current requirements to preserve their teachers
                const res = await authFetch(`${API}/api/rules/${targetClass}?projectId=${projectId}`);
                const data = await res.json();
                const existingReqs = data.requirements || [];
                
                // Build the new copied requirements
                const newRequirements = requirements.map(req => {
                    const existing = existingReqs.find(e => e.subject === req.subject);
                    let teacherToAssign = '';

                    if (existing && existing.teacher) {
                        teacherToAssign = existing.teacher;
                    } else {
                        // Find the corresponding teacher for this subject and targetClass
                        const mappedTeacher = teachers.find(t => 
                            t.assignments && t.assignments.some(a => a.subject === req.subject && a.classes.includes(targetClass))
                        );
                        if (mappedTeacher) {
                            teacherToAssign = mappedTeacher.name;
                        }
                    }

                    return {
                        ...req,
                        teacher: teacherToAssign
                    };
                });

                return authFetch(`${API}/api/rules/${targetClass}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requirements: newRequirements, projectId, skipRegenerate: true }),
                });
            }));
            showToast(`Requirements copied to: ${copyTargets.join(', ')} (teachers were preserved)`, 'success');
            setShowCopyModal(false);
            setCopyTargets([]);
        } catch {
            showToast('Failed to copy requirements', 'error');
        } finally {
            setCopying(false);
        }
    }

    // ── Computed ──
    const totalPeriods = requirements.reduce((sum, r) => sum + r.periodsPerWeek, 0);
    const periodBalance = 35 - totalPeriods;

    const TABS = [
        { id: 'teachers', label: '👩‍🏫 Teachers', count: teachers.length },
        { id: 'subjects', label: '📚 Subjects', count: subjects.length },
        { id: 'classes',  label: '🏫 Classes',  count: classes.length },
    ];

    return (
        <>
        <div className="h-full bg-transparent relative flex flex-col overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />
            
            <Toast message={toast.message} type={toast.type} onClose={clearToast} />

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 p-8 overflow-y-auto w-full relative z-10">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900/90 tracking-tight drop-shadow-sm">
                                {TABS.find(t => t.id === activeTab)?.label.replace(/^[^\w\s]+/, '')} Management
                            </h1>
                        </div>
                        <button
                            onClick={() => requestConfirm(
                                'Regenerate AI Schedule', 
                                'This will apply all rules and generate a brand new timetable for all classes. Continue?', 
                                handleRegenerateSchedule,
                                'Regenerate',
                                'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                            )}
                            disabled={saving}
                            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold rounded-2xl transition-all shadow-[0_8px_25px_-8px_rgba(79,70,229,0.5)] hover:shadow-[0_12px_35px_-8px_rgba(79,70,229,0.6)] active:scale-[0.98] text-sm flex items-center gap-2 border border-slate-300"
                        >
                            {saving ? '⏳ Generating...' : '✨ Regenerate AI Schedule'}
                        </button>
                    </div>

                {/* ── ACTIVE TAB CONTENT ── */}
                {activeTab === 'teachers' && (
                    <div className="flex flex-col gap-6">
                        {/* Teacher list */}
                        <div className="bg-white backdrop-blur-xl rounded-[32px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-slate-200 p-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse border-spacing-y-2" style={{ borderCollapse: 'separate' }}>
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-black text-slate-900/40 uppercase tracking-widest bg-transparent">Name</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-900/40 uppercase tracking-widest bg-transparent">Assignments</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-900/40 uppercase tracking-widest bg-transparent">Status</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-900/40 uppercase tracking-widest bg-transparent text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teachers.length === 0 ? (
                                            <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-900/50 text-sm bg-slate-50 rounded-2xl">No teachers added yet.</td></tr>
                                        ) : teachers.map(teacher => (
                                            <tr key={teacher.name} className="group bg-white hover:bg-indigo-500/100/100/10 transition-colors shadow-sm hover:shadow-md rounded-2xl overflow-hidden border border-slate-100">
                                                <td className="px-6 py-5 text-sm font-bold text-slate-900/90 rounded-l-2xl">{teacher.name}</td>
                                                <td className="px-6 py-5 text-sm text-slate-900/60">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(teacher.assignments || []).map(a => (
                                                            <span key={a.subject} className="inline-flex items-center gap-1.5 px-3 py-1 bg-transparent border border-slate-100 text-slate-900/60 text-xs font-medium rounded-xl">
                                                                <span className="font-bold text-indigo-600">{a.subject}:</span> {a.classes?.length ? a.classes.join(', ') : 'None'}
                                                            </span>
                                                        ))}
                                                        {(!teacher.assignments || teacher.assignments.length === 0) && <span className="text-slate-900/40 italic">No assignments</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">Active</span>
                                                </td>
                                                <td className="px-6 py-5 flex items-center justify-end gap-2 rounded-r-2xl">
                                                    <button onClick={() => startEditTeacher(teacher)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-indigo-500/100/10 text-slate-900/40 hover:text-indigo-600 border border-slate-200 transition-all shadow-sm hover:shadow" title="Edit">✏️</button>
                                                    <button onClick={() => handleDeleteTeacher(teacher.name)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-rose-50 text-slate-900/40 hover:text-rose-500 border border-slate-200 transition-all shadow-sm hover:shadow" title="Delete">🗑</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Add teacher */}
                        <div className="bg-white backdrop-blur-xl rounded-[32px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-slate-200 p-8">
                            <h3 className="font-black text-slate-900 text-lg tracking-tight mb-6">Add New Teacher</h3>
                            <div className="flex flex-col gap-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-900/90 mb-2 tracking-wide">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Sarah Chen"
                                            className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-900/40 cursor-pointer shadow-sm"
                                            onClick={startAddTeacher}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-900/90 mb-2 tracking-wide flex items-center gap-2">Email Address <span className="text-[9px] px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-900/40 rounded-full">Visual</span></label>
                                        <input type="text" placeholder="name@edu.com" className="w-full bg-white border border-slate-200/50 text-slate-900/40 rounded-2xl px-4 py-3 text-sm font-medium cursor-not-allowed shadow-sm" disabled />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-900/90 mb-2 tracking-wide flex items-center gap-2">Department <span className="text-[9px] px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-900/40 rounded-full">Visual</span></label>
                                        <select className="w-full bg-white border border-slate-200/50 text-slate-900/40 rounded-2xl px-4 py-3 text-sm font-medium cursor-not-allowed shadow-sm" disabled><option>Mathematics</option></select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-900/90 mb-2 tracking-wide flex items-center gap-2">Availability <span className="text-[9px] px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-900/40 rounded-full">Visual</span></label>
                                        <select className="w-full bg-white border border-slate-200/50 text-slate-900/40 rounded-2xl px-4 py-3 text-sm font-medium cursor-not-allowed shadow-sm" disabled><option>Full Time</option></select>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <button onClick={startAddTeacher} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl transition-all shadow-md active:scale-95">Add Teacher</button>
                                    <span className="text-[11px] text-slate-900/40 ml-4 font-medium tracking-wide">Opens the full assignment editor</span>
                                </div>
                            </div>
                        </div>

                        {/* Edit Teacher Modal */}
                        {editingTeacher && (
                            <div className="fixed inset-0 z-50 bg-white backdrop-blur-[24px] flex items-center justify-center p-4">
                                <div className="bg-[#131326]/95 backdrop-blur-xl border border-slate-200 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
                                    {editingTeacher.isNew ? (
                                        <div className="mb-4">
                                            <label className="block text-xs font-black text-slate-900/40 uppercase tracking-widest mb-2">Teacher Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. JOSNA TR"
                                                value={editingTeacher.name}
                                                onChange={e => setEditingTeacher(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
                                            />
                                        </div>
                                    ) : (
                                        <h3 className="font-black text-2xl text-slate-900/90 mb-4 tracking-tight">
                                            Edit: {editingTeacher.name}
                                        </h3>
                                    )}
                                    <p className="text-xs font-black text-slate-900/40 uppercase tracking-widest mb-3">Assignments (Subject → Classes)</p>
                                    
                                    <div className="space-y-4 mb-8 max-h-64 overflow-y-auto pr-2">
                                        {editingTeacher.assignments.map((assignment, index) => (
                                            <div key={assignment.subject} className="p-4 bg-white border border-slate-100 rounded-[20px] shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-sm text-indigo-600">{assignment.subject}</span>
                                                    <button onClick={() => setEditingTeacher(prev => {
                                                        const newAss = [...prev.assignments];
                                                        newAss.splice(index, 1);
                                                        return { ...prev, assignments: newAss };
                                                    })} className="text-red-400 hover:text-red-600 font-bold px-2">×</button>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {assignment.classes?.map(cls => (
                                                        <Tag key={cls} label={cls} onRemove={() => setEditingTeacher(prev => {
                                                            const newAss = [...prev.assignments];
                                                            newAss[index].classes = newAss[index].classes.filter(c => c !== cls);
                                                            return { ...prev, assignments: newAss };
                                                        })} />
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
                                                        <div className="mt-3">
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
                                                            <button type="button" onClick={() => setExpandedAssignmentIndex(null)} className="w-full mt-2 py-1.5 text-xs font-bold text-white bg-indigo-500/100 hover:bg-indigo-600 rounded-lg transition-colors shadow-sm">Done</button>
                                                        </div>
                                                    );
                                                })() : (
                                                    <button type="button" onClick={() => setExpandedAssignmentIndex(index)} className="mt-2 w-full py-1.5 text-xs text-indigo-600 font-bold border border-indigo-200 border-dashed rounded-lg bg-indigo-500/10 hover:bg-indigo-100 transition-colors">+ Manage Classes</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 mb-6 pt-6 border-t border-slate-100">
                                        <select
                                            value=""
                                            onChange={e => {
                                                const sub = e.target.value;
                                                if (!sub || editingTeacher.assignments.some(a => a.subject === sub)) return;
                                                setEditingTeacher(prev => ({ ...prev, assignments: [...prev.assignments, { subject: sub, classes: [] }] }));
                                            }}
                                            className="flex-1 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm bg-white"
                                        >
                                            <option value="">Add new subject assignment...</option>
                                            {subjects.filter(s => !editingTeacher.assignments.some(a => a.subject === s.name)).map(s => (
                                                <option key={s.name} value={s.name}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => setEditingTeacher(null)}
                                            className="px-5 py-2.5 bg-slate-50 text-slate-900/60 text-sm font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                                        >Cancel</button>
                                        <button
                                            onClick={saveEditTeacher}
                                            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg active:scale-95"
                                        >Save Changes</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── SUBJECTS TAB ── */}
                {activeTab === 'subjects' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SectionCard title="Add New Subject">
                            <div className="flex flex-col gap-4">
                                <input
                                    type="text"
                                    placeholder="Subject name (e.g. CHEMISTRY)"
                                    value={newSubjectName}
                                    onChange={e => setNewSubjectName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                                    className="border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
                                />

                                <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                                    <p className="text-xs font-black text-slate-900/40 uppercase tracking-widest mb-3">Applicable Classes (Leave empty for ALL classes)</p>
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                        {classes.map(cls => {
                                            const isSelected = newSubjectClasses.includes(cls);
                                            return (
                                                <button
                                                    key={cls}
                                                    onClick={() => {
                                                        if (isSelected) setNewSubjectClasses(prev => prev.filter(c => c !== cls));
                                                        else setNewSubjectClasses(prev => [...prev, cls]);
                                                    }}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                                                        isSelected 
                                                            ? 'bg-indigo-600 border-indigo-600 text-slate-900 shadow-md' 
                                                            : 'bg-white border-slate-200 text-slate-900/60 hover:border-indigo-300 shadow-sm'
                                                    }`}
                                                >
                                                    {cls}
                                                </button>
                                            );
                                        })}
                                        {classes.length === 0 && <span className="text-xs text-slate-900/40">Add classes first</span>}
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddSubject}
                                    className="px-6 py-3 mt-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl transition-all shadow-md active:scale-95"
                                >+ Add</button>
                            </div>
                        </SectionCard>

                        <SectionCard title="All Subjects" badge={subjects.length}>
                            {subjects.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                    <div className="w-14 h-14 bg-indigo-500/10 text-indigo-600 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner">
                                        📚
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800 mb-1">No subjects defined</h3>
                                    <p className="text-xs text-gray-500 max-w-[200px]">Create subjects like Math or Science first.</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3 max-h-80 overflow-y-auto p-1">
                                    {subjects.map(s => (
                                        <div key={s.name} className="flex flex-col gap-2 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group relative">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-black text-slate-900/80 tracking-tight">{s.name}</span>
                                                <button
                                                    onClick={() => handleDeleteSubject(s.name)}
                                                    className="opacity-0 group-hover:opacity-100 text-rose-600 hover:text-rose-600 transition-all leading-none text-lg ml-3 bg-rose-50 rounded-full w-6 h-6 flex items-center justify-center"
                                                >×</button>
                                            </div>
                                            {s.applicableClasses && s.applicableClasses.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {s.applicableClasses.map(c => (
                                                        <span key={c} className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100/50">
                                                            {c}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    </div>
                )}

                {/* ── CLASSES TAB ── */}
                {activeTab === 'classes' && (
                    <div className="space-y-6">
                        {/* Class management row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Add class */}
                            <SectionCard title="Add New Class">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Class name (e.g. 6C)"
                                        value={newClassName}
                                        onChange={e => setNewClassName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddClass()}
                                        className="flex-1 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
                                    />
                                    <button
                                        onClick={handleAddClass}
                                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl transition-all shadow-md active:scale-95"
                                    >+ Add</button>
                                </div>
                            </SectionCard>

                            {/* Class list */}
                            <SectionCard title="All Classes" badge={classes.length}>
                                <div className="flex flex-wrap gap-2">
                                    {classes.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center w-full">
                                            <div className="w-14 h-14 bg-indigo-500/10 text-indigo-600 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner">
                                                🏫
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-800 mb-1">No classes yet</h3>
                                            <p className="text-xs text-gray-500 max-w-[200px]">Add your first class to set its requirements.</p>
                                        </div>
                                    ) : (
                                        classes.map(cls => (
                                            <div key={cls} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold cursor-pointer transition-all group shadow-sm hover:shadow-md
                                                ${selectedClass === cls ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-600/20' : 'bg-white text-slate-900/80 border-slate-200 hover:border-indigo-300'}`}
                                                onClick={() => handleClassSwitch(cls)}
                                            >
                                                {cls}
                                                <button
                                                    onPointerDown={e => e.stopPropagation()}
                                                    onClick={e => { e.stopPropagation(); handleDeleteClass(cls); }}
                                                    className={`opacity-0 group-hover:opacity-100 transition-opacity text-base leading-none ml-1 flex items-center justify-center w-5 h-5 rounded-full ${selectedClass === cls ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                                                >×</button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </SectionCard>
                        </div>

                        {/* Requirements editor */}
                        {selectedClass && (
                            <SectionCard
                                title={`Subject Requirements — Class ${selectedClass}`}
                                badge={`${totalPeriods}/35 periods`}
                            >
                                {/* Class Teacher row */}
                                <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl shadow-sm">
                                    <div className="w-10 h-10 bg-amber-100/80 rounded-full flex items-center justify-center text-xl shadow-inner border border-amber-200">🏅</div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Class Teacher</p>
                                        <p className="text-[11px] font-medium text-amber-600/80">Their subject will be prioritised in Period 1 every day</p>
                                    </div>
                                    <select
                                        value={classTeacher}
                                        onChange={e => { setClassTeacher(e.target.value); setIsDirty(true); }}
                                        className="border border-amber-300/50 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900/80 font-bold min-w-[180px] shadow-sm backdrop-blur-sm"
                                    >
                                        <option value="">— None —</option>
                                        {teachers.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                    </select>
                                </div>

                                {/* Period usage bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                                        <span>Period usage</span>
                                        <span className={periodBalance < 0 ? 'text-red-600' : periodBalance === 0 ? 'text-emerald-600' : 'text-gray-500'}>
                                            {periodBalance < 0 ? `${Math.abs(periodBalance)} over limit!` : `${periodBalance} remaining`}
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${totalPeriods > 35 ? 'bg-red-500' : totalPeriods === 35 ? 'bg-emerald-500' : 'bg-indigo-500/100'}`}
                                            style={{ width: `${Math.min((totalPeriods / 35) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Existing requirements */}
                                <div className="space-y-3 mb-8 max-h-80 overflow-y-auto pr-2">
                                    {requirements.length === 0 && (
                                        <p className="text-slate-900/40 text-sm font-medium text-center py-8 bg-white rounded-2xl border border-slate-100 border-dashed">No requirements yet. Add one below.</p>
                                    )}
                                    {requirements.map((req, i) => (
                                        <div key={i} className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 flex-1">
                                                <span className="font-black text-indigo-600 text-sm tracking-tight break-words">{req.subject}</span>
                                                <span className="text-slate-900/50 text-sm break-words font-medium px-2 py-0.5 bg-transparent rounded-lg border border-slate-100">{req.teacher || '(Select Teacher)'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-xs font-black text-slate-900/60 bg-transparent border border-slate-200 px-3 py-1.5 rounded-xl tracking-wide">
                                                    {req.periodsPerWeek} periods
                                                </span>
                                                <IconButton
                                                    onClick={() => startEditRequirement(i, req)}
                                                    icon="✏️"
                                                    title="Edit requirement"
                                                    className="bg-blue-50/50 hover:bg-blue-100 text-blue-600 rounded-xl"
                                                />
                                                <IconButton
                                                    onClick={() => handleDeleteRequirement(i)}
                                                    icon="🗑"
                                                    title="Remove requirement"
                                                    className="bg-rose-50/50 hover:bg-rose-100 text-rose-500 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add requirement row */}
                                <div className="flex flex-wrap gap-3 mb-8 p-5 bg-white rounded-[24px] border border-dashed border-slate-300 shadow-inner">
                                    <select
                                        value={newReqSubject}
                                        onChange={e => setNewReqSubject(e.target.value)}
                                        className="flex-1 min-w-32 border border-slate-200 rounded-2xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
                                    >
                                        <option value="">Subject…</option>
                                        {subjects
                                            .filter(s => !requirements.some(r => r.subject === s.name))
                                            .filter(s => !s.applicableClasses || s.applicableClasses.length === 0 || s.applicableClasses.includes(selectedClass))
                                            .map(s => <option key={s.name}>{s.name}</option>)
                                        }
                                    </select>
                                    <input
                                        type="number"
                                        min="1"
                                        max={Math.max(1, periodBalance)}
                                        placeholder="Periods"
                                        value={newReqPeriods}
                                        onChange={e => setNewReqPeriods(e.target.value)}
                                        className="w-28 border border-slate-200 rounded-2xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
                                    />
                                    <button
                                        onClick={handleAddRequirement}
                                        disabled={periodBalance <= 0}
                                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-2xl transition-all shadow-md active:scale-95"
                                    >+ Add</button>
                                </div>

                                {/* Save + Copy buttons */}
                                <div className="flex gap-4 mb-2">
                                    <button
                                        onClick={() => handleSaveDraft()}
                                        disabled={saving || totalPeriods === 0 || !isDirty}
                                        className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-200 disabled:to-slate-300 disabled:text-white/40 text-white font-bold rounded-2xl transition-all shadow-[0_8px_20px_-8px_rgba(79,70,229,0.5)] hover:shadow-[0_12px_25px_-8px_rgba(79,70,229,0.6)] active:scale-[0.98] text-sm"
                                    >
                                        {saving ? '⏳ Saving...' : (isDirty ? '💾 Save Requirements' : '✅ Saved')}
                                    </button>
                                    <button
                                        onClick={() => { setCopyTargets([]); setShowCopyModal(true); }}
                                        disabled={requirements.length === 0}
                                        className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-[0_8px_20px_-8px_rgba(16,185,129,0.5)] active:scale-[0.98] text-sm flex items-center gap-2 whitespace-nowrap"
                                        title="Copy these requirements to other classes"
                                    >
                                        📋 Copy To…
                                    </button>
                                </div>

                                {totalPeriods !== 35 && totalPeriods > 0 && (
                                    <p className={`text-xs text-center mt-2 font-medium ${periodBalance < 0 ? 'text-red-500' : 'text-amber-600'}`}>
                                        {periodBalance < 0
                                            ? `⚠ Total exceeds 35 by ${Math.abs(periodBalance)}. Please reduce before saving.`
                                            : `ℹ Total is ${totalPeriods}/35 — ${periodBalance} slot(s) will be left empty.`
                                        }
                                    </p>
                                )}
                            </SectionCard>
                        )}

                        {/* Copy Requirements Modal */}
                        {showCopyModal && (
                            <div className="fixed inset-0 z-50 bg-white backdrop-blur-[24px] flex items-center justify-center p-4">
                                <div className="bg-[#131326]/95 backdrop-blur-xl border border-slate-200 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
                                    <h3 className="font-black text-2xl text-slate-900/90 mb-2 tracking-tight">Copy Requirements</h3>
                                    <p className="text-sm text-slate-900/50 mb-6 font-medium">
                                        Copy <span className="font-bold text-indigo-600">{selectedClass}</span>'s subject requirements to selected classes.
                                        <span className="block mt-2 text-[11px] font-black uppercase tracking-widest text-amber-600/80">⚠ Class teachers will NOT be copied</span>
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-8 max-h-48 overflow-y-auto p-1">
                                        {classes.filter(c => c !== selectedClass).map(cls => (
                                            <button
                                                key={cls}
                                                onClick={() => setCopyTargets(prev =>
                                                    prev.includes(cls) ? prev.filter(x => x !== cls) : [...prev, cls]
                                                )}
                                                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all shadow-sm hover:shadow-md
                                                    ${copyTargets.includes(cls)
                                                        ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-600/20'
                                                        : 'bg-white text-slate-900/80 border-slate-200 hover:border-indigo-300'}`}
                                            >
                                                {cls}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => setShowCopyModal(false)}
                                            className="px-5 py-2.5 bg-slate-50 text-slate-900/60 text-sm font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                                        >Cancel</button>
                                        <button
                                            onClick={handleCopyRequirements}
                                            disabled={copyTargets.length === 0 || copying}
                                            className="px-6 py-2.5 bg-emerald-600 text-slate-900 text-sm font-bold rounded-2xl hover:bg-emerald-500 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {copying && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                            Copy to {copyTargets.length} class{copyTargets.length !== 1 ? 'es' : ''}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Edit Requirement Modal */}
                        {editingRequirement && (
                            <div className="fixed inset-0 z-50 bg-white backdrop-blur-[24px] flex items-center justify-center p-4">
                                <div className="bg-[#131326]/95 backdrop-blur-xl border border-slate-200 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
                                    <h3 className="font-black text-2xl text-slate-900/90 mb-6 tracking-tight">
                                        Edit Requirement
                                    </h3>
                                    <div className="flex flex-col gap-5 mb-8">
                                        <div>
                                            <label className="block text-xs font-black text-slate-900/40 uppercase tracking-widest mb-2">Subject</label>
                                            <div className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900/80 font-bold shadow-inner">
                                                {editingRequirement.subject}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-900/40 uppercase tracking-widest mb-2">Assigned Teacher</label>
                                            <div className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900/80 shadow-inner">
                                                {editingRequirement.teacher}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-900/40 uppercase tracking-widest mb-2">Periods Per Week</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={editingRequirement.periodsPerWeek}
                                                onChange={e => setEditingRequirement(prev => ({ ...prev, periodsPerWeek: e.target.value }))}
                                                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => setEditingRequirement(null)}
                                            className="px-5 py-2.5 bg-slate-50 text-slate-900/60 text-sm font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                                        >Cancel</button>
                                        <button
                                            onClick={saveEditRequirement}
                                            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-md active:scale-95"
                                        >Save Changes</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                </div>
            </main>
        </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={!!pendingConfirm}
                title={pendingConfirm?.title}
                message={pendingConfirm?.message}
                onCancel={() => setPendingConfirm(null)}
                onConfirm={() => {
                    if (pendingConfirm?.action) pendingConfirm.action();
                    setPendingConfirm(null);
                }}
                confirmText={pendingConfirm?.confirmText || "Confirm"}
                confirmColor={pendingConfirm?.confirmColor || "bg-indigo-600 hover:bg-indigo-700 text-white"}
            />
        </>
    );
}
