import { useState, useEffect, useCallback, memo } from 'react';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';

const API = 'http://localhost:5000';

// ─── Small UI helpers ──────────────────────────────────────────────────────────
const SectionCard = memo(function SectionCard({ title, badge, children }) {
    return (
        <div className="glass-card rounded-[24px] overflow-hidden">
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100/50 bg-white/40">
                <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">{title}</h3>
                {badge !== undefined && (
                    <span className="text-[11px] font-black px-3 py-1 bg-brand-100 text-brand-700 rounded-full shadow-inner border border-brand-200/50">{badge}</span>
                )}
            </div>
            <div className="p-8">{children}</div>
        </div>
    );
});

const Tag = memo(function Tag({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-xl border border-brand-200/50 shadow-sm">
            {label}
            {onRemove && (
                <button onClick={onRemove} className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors text-brand-400">
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
        <div className="border border-slate-200/60 rounded-xl bg-white/50 backdrop-blur-sm overflow-hidden text-left shadow-inner">
            {Object.keys(groups).sort((a,b) => (parseInt(a)||999) - (parseInt(b)||999)).map(grade => {
                const groupClasses = groups[grade];
                const availableGroupClasses = groupClasses.filter(c => !disabledClassesMap[c]);
                const allSelected = availableGroupClasses.length > 0 && availableGroupClasses.every(c => selectedClasses.includes(c));
                const someSelected = availableGroupClasses.some(c => selectedClasses.includes(c));

                return (
                    <div key={grade} className="border-b border-slate-100/50 last:border-0">
                        <div className="flex items-center gap-2 p-2.5 hover:bg-white/60 bg-white/30 transition-colors">
                            <button 
                                type="button"
                                onClick={() => toggleExpand(grade)}
                                className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-all"
                            >
                                {expandedGroups[grade] ? '▼' : '▶'}
                            </button>
                            <span className="font-bold text-sm text-slate-700 flex-1 cursor-pointer select-none" onClick={() => toggleExpand(grade)}>
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
                            <div className="pl-10 pr-4 py-2 bg-white/80 border-t border-slate-50/50">
                                {groupClasses.map(c => {
                                    const disabledBy = disabledClassesMap[c];
                                    return (
                                        <label key={c} className={`flex items-center justify-between py-2 px-2 rounded-lg transition-colors ${disabledBy ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer group'}`}>
                                            <span className={`text-sm font-medium ${disabledBy ? 'text-slate-400' : 'text-slate-600 group-hover:text-brand-700'}`}>
                                                {c} {disabledBy && <span className="text-[10px] font-bold uppercase tracking-wider ml-2 bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{disabledBy}</span>}
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
                fetch(`${API}/api/teachers?projectId=${projectId}`).then(r => r.json()),
                fetch(`${API}/api/subjects?projectId=${projectId}`).then(r => r.json()),
                fetch(`${API}/api/classes?projectId=${projectId}`).then(r => r.json()),
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
            const data = await fetch(`${API}/api/rules/${className}?projectId=${projectId}`).then(r => r.json());
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
                    await fetch(`${API}/api/teachers/${encodeURIComponent(name)}?projectId=${projectId}`, { method: 'DELETE' });
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
                const t = await fetch(`${API}/api/teachers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, assignments, projectId }),
                }).then(r => r.json());
                if (t.error) { showToast(t.error, 'error'); return; }
                setTeachers(prev => [...prev, t]);
                showToast(`Teacher ${name} created`, 'success');
            } else {
                await fetch(`${API}/api/teachers/${encodeURIComponent(name)}`, {
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
            const s = await fetch(`${API}/api/subjects`, {
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
                    await fetch(`${API}/api/subjects/${encodeURIComponent(name)}?projectId=${projectId}`, { method: 'DELETE' });
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
            const c = await fetch(`${API}/api/classes`, {
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
                    await fetch(`${API}/api/classes/${encodeURIComponent(className)}?projectId=${projectId}`, { method: 'DELETE' });
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
            await fetch(`${API}/api/rules/${targetClass}`, {
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
            const result = await fetch(`${API}/api/schedule/generate`, {
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
                const res = await fetch(`${API}/api/rules/${targetClass}?projectId=${projectId}`);
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

                return fetch(`${API}/api/rules/${targetClass}`, {
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
        <div className="flex min-h-[calc(100vh-80px)] bg-[#f8fafc]">
            <Toast message={toast.message} type={toast.type} onClose={clearToast} />

            {/* ── SIDEBAR NAVIGATION ── */}
            <aside className="w-72 bg-white/60 backdrop-blur-xl border-r border-slate-200/50 shrink-0 flex flex-col pt-8 z-10 shadow-[10px_0_30px_rgba(0,0,0,0.03)] relative">
                <div className="px-8 mb-10 relative z-10">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h2>
                    <p className="text-slate-500 text-sm mt-1.5 font-medium">Manage global parameters</p>
                </div>
                <nav className="flex-1 flex flex-col gap-2.5 px-5 relative z-10">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 border ${
                                activeTab === tab.id 
                                    ? 'bg-white text-brand-700 border-white shadow-[0_8px_20px_rgba(0,0,0,0.04)] scale-[1.02]' 
                                    : 'text-slate-500 border-transparent hover:bg-white/50 hover:text-slate-800 hover:border-white/50'
                            }`}
                        >
                            <span className="text-[15px]">{tab.label}</span>
                            <span className={`text-[11px] font-black px-2.5 py-1 rounded-full shadow-inner ${
                                activeTab === tab.id 
                                    ? 'bg-brand-50 text-brand-700 border border-brand-100' 
                                    : 'bg-slate-100/80 text-slate-500 border border-slate-200/50'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight drop-shadow-sm">
                                {TABS.find(t => t.id === activeTab)?.label.replace(/^[^\w\s]+/, '')} Management
                            </h1>
                        </div>
                        <button
                            onClick={() => requestConfirm(
                                'Generate Timetable', 
                                'This will apply all rules and generate a brand new timetable for all classes. Continue?', 
                                handleRegenerateSchedule,
                                'Generate',
                                'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                            )}
                            disabled={saving}
                            className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:from-slate-300 disabled:to-slate-300 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 text-sm flex items-center gap-2 border border-white/20"
                        >
                            {saving ? '⏳ Generating...' : '✨ Generate Timetable'}
                        </button>
                    </div>

                {/* ── ACTIVE TAB CONTENT ── */}
                {activeTab === 'teachers' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Add teacher */}
                        <SectionCard title="Add New Teacher">
                            <button
                                onClick={startAddTeacher}
                                className="w-full py-4 bg-white border border-slate-200/60 hover:border-brand-300 hover:bg-brand-50 text-brand-600 text-sm font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 group"
                            ><span className="text-lg leading-none group-hover:scale-110 transition-transform">+</span> Create New Teacher</button>
                            <p className="text-gray-400 text-xs mt-3 text-center">Add a teacher along with their subjects and classes.</p>
                        </SectionCard>

                        {/* Teacher list */}
                        <SectionCard title="All Teachers" badge={teachers.length}>
                            {teachers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">
                                        👩‍🏫
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">No teachers yet</h3>
                                    <p className="text-sm text-gray-500 max-w-[250px]">Add your teaching staff here to assign them to subjects and classes.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                    {teachers.map(teacher => (
                                        <div key={teacher.name} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-gray-800">{teacher.name}</p>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    {(teacher.assignments || []).map(a => (
                                                        <div key={a.subject} className="text-xs text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 inline-flex w-fit gap-2">
                                                            <span className="font-bold text-indigo-600">{a.subject}:</span>
                                                            <span>{a.classes?.length ? a.classes.join(', ') : 'No classes'}</span>
                                                        </div>
                                                    ))}
                                                    {(!teacher.assignments || teacher.assignments.length === 0) && (
                                                        <span className="text-gray-400 text-xs italic">No assignments</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <IconButton
                                                    onClick={() => startEditTeacher(teacher)}
                                                    icon="✏️"
                                                    title="Edit specializations"
                                                className="bg-blue-50 hover:bg-blue-100 text-blue-600"
                                            />
                                            <IconButton
                                                onClick={() => handleDeleteTeacher(teacher.name)}
                                                icon="🗑"
                                                title="Delete teacher"
                                                className="bg-red-50 hover:bg-red-100 text-red-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        </SectionCard>

                        {/* Edit Teacher Modal */}
                        {editingTeacher && (
                            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                                    {editingTeacher.isNew ? (
                                        <div className="mb-4">
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Teacher Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. JOSNA TR"
                                                value={editingTeacher.name}
                                                onChange={e => setEditingTeacher(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                            />
                                        </div>
                                    ) : (
                                        <h3 className="font-extrabold text-lg text-gray-800 mb-4">
                                            Edit: {editingTeacher.name}
                                        </h3>
                                    )}
                                    <p className="text-sm text-gray-500 mb-3">Assignments (Subject → Classes)</p>
                                    
                                    <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-2">
                                        {editingTeacher.assignments.map((assignment, index) => (
                                            <div key={assignment.subject} className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-sm text-indigo-700">{assignment.subject}</span>
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
                                                            <button type="button" onClick={() => setExpandedAssignmentIndex(null)} className="w-full mt-2 py-1.5 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors shadow-sm">Done</button>
                                                        </div>
                                                    );
                                                })() : (
                                                    <button type="button" onClick={() => setExpandedAssignmentIndex(index)} className="mt-2 w-full py-1.5 text-xs text-indigo-600 font-bold border border-indigo-200 border-dashed rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">+ Manage Classes</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 mb-6 pt-4 border-t border-gray-100">
                                        <select
                                            value=""
                                            onChange={e => {
                                                const sub = e.target.value;
                                                if (!sub || editingTeacher.assignments.some(a => a.subject === sub)) return;
                                                setEditingTeacher(prev => ({ ...prev, assignments: [...prev.assignments, { subject: sub, classes: [] }] }));
                                            }}
                                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
                                            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                        >Cancel</button>
                                        <button
                                            onClick={saveEditTeacher}
                                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors"
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
                            <div className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    placeholder="Subject name (e.g. CHEMISTRY)"
                                    value={newSubjectName}
                                    onChange={e => setNewSubjectName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />

                                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                                    <p className="text-xs font-bold text-gray-500 mb-2">Applicable Classes (Leave empty for ALL classes)</p>
                                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                                        {classes.map(cls => {
                                            const isSelected = newSubjectClasses.includes(cls);
                                            return (
                                                <button
                                                    key={cls}
                                                    onClick={() => {
                                                        if (isSelected) setNewSubjectClasses(prev => prev.filter(c => c !== cls));
                                                        else setNewSubjectClasses(prev => [...prev, cls]);
                                                    }}
                                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                                                        isSelected 
                                                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                                                    }`}
                                                >
                                                    {cls}
                                                </button>
                                            );
                                        })}
                                        {classes.length === 0 && <span className="text-xs text-gray-400">Add classes first</span>}
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddSubject}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors"
                                >+ Add</button>
                            </div>
                        </SectionCard>

                        <SectionCard title="All Subjects" badge={subjects.length}>
                            {subjects.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner">
                                        📚
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800 mb-1">No subjects defined</h3>
                                    <p className="text-xs text-gray-500 max-w-[200px]">Create subjects like Math or Science first.</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto">
                                    {subjects.map(s => (
                                        <div key={s.name} className="flex flex-col gap-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl group relative">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-gray-700">{s.name}</span>
                                                <button
                                                    onClick={() => handleDeleteSubject(s.name)}
                                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all leading-none text-base ml-2"
                                                >×</button>
                                            </div>
                                            {s.applicableClasses && s.applicableClasses.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {s.applicableClasses.map(c => (
                                                        <span key={c} className="text-[9px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
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
                                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    />
                                    <button
                                        onClick={handleAddClass}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors"
                                    >+ Add</button>
                                </div>
                            </SectionCard>

                            {/* Class list */}
                            <SectionCard title="All Classes" badge={classes.length}>
                                <div className="flex flex-wrap gap-2">
                                    {classes.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center w-full">
                                            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner">
                                                🏫
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-800 mb-1">No classes yet</h3>
                                            <p className="text-xs text-gray-500 max-w-[200px]">Add your first class to set its requirements.</p>
                                        </div>
                                    ) : (
                                        classes.map(cls => (
                                            <div key={cls} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-sm font-bold cursor-pointer transition-all group
                                                ${selectedClass === cls ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-indigo-300'}`}
                                                onClick={() => handleClassSwitch(cls)}
                                            >
                                                {cls}
                                                <button
                                                    onPointerDown={e => e.stopPropagation()}
                                                    onClick={e => { e.stopPropagation(); handleDeleteClass(cls); }}
                                                    className={`opacity-0 group-hover:opacity-100 transition-opacity text-base leading-none ml-1 ${selectedClass === cls ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-red-500'}`}
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
                                <div className="flex items-center gap-3 mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <span className="text-amber-600 text-lg">🏅</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-0.5">Class Teacher</p>
                                        <p className="text-[11px] text-amber-600">Their subject will be prioritised in Period 1 every day</p>
                                    </div>
                                    <select
                                        value={classTeacher}
                                        onChange={e => { setClassTeacher(e.target.value); setIsDirty(true); }}
                                        className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-700 font-semibold min-w-40"
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
                                            className={`h-full rounded-full transition-all ${totalPeriods > 35 ? 'bg-red-500' : totalPeriods === 35 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${Math.min((totalPeriods / 35) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Existing requirements */}
                                <div className="space-y-2 mb-6 max-h-80 overflow-y-auto pr-1">
                                    {requirements.length === 0 && (
                                        <p className="text-gray-300 text-sm text-center py-6">No requirements yet. Add one below.</p>
                                    )}
                                    {requirements.map((req, i) => (
                                        <div key={i} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 flex-1">
                                                <span className="font-bold text-indigo-600 text-sm break-words">{req.subject}</span>
                                                <span className="text-gray-500 text-sm break-words">{req.teacher || '(Select Teacher)'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-sm font-bold text-gray-700 bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                                                    {req.periodsPerWeek} periods
                                                </span>
                                                <IconButton
                                                    onClick={() => startEditRequirement(i, req)}
                                                    icon="✏️"
                                                    title="Edit requirement"
                                                    className="bg-blue-50 hover:bg-blue-100 text-blue-600"
                                                />
                                                <IconButton
                                                    onClick={() => handleDeleteRequirement(i)}
                                                    icon="🗑"
                                                    title="Remove requirement"
                                                    className="bg-red-50 hover:bg-red-100 text-red-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add requirement row */}
                                <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <select
                                        value={newReqSubject}
                                        onChange={e => setNewReqSubject(e.target.value)}
                                        className="flex-1 min-w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
                                        className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    />
                                    <button
                                        onClick={handleAddRequirement}
                                        disabled={periodBalance <= 0}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-lg transition-colors"
                                    >+ Add</button>
                                </div>

                                {/* Save + Copy buttons */}
                                <div className="flex gap-3 mb-2">
                                    <button
                                        onClick={() => handleSaveDraft()}
                                        disabled={saving || totalPeriods === 0 || !isDirty}
                                        className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md text-sm"
                                    >
                                        {saving ? '⏳ Saving...' : (isDirty ? '💾 Save Requirements' : '✅ Saved')}
                                    </button>
                                    <button
                                        onClick={() => { setCopyTargets([]); setShowCopyModal(true); }}
                                        disabled={requirements.length === 0}
                                        className="px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition-all shadow-md text-sm flex items-center gap-2 whitespace-nowrap"
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
                            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                                    <h3 className="font-extrabold text-lg text-gray-800 mb-1">Copy Requirements</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Copy <span className="font-bold text-indigo-600">{selectedClass}</span>'s subject requirements to selected classes.
                                        <span className="block mt-1 text-[11px] text-amber-600 font-medium">⚠ Class teachers will NOT be copied — each class keeps their own.</span>
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-6 max-h-48 overflow-y-auto p-1">
                                        {classes.filter(c => c !== selectedClass).map(cls => (
                                            <button
                                                key={cls}
                                                onClick={() => setCopyTargets(prev =>
                                                    prev.includes(cls) ? prev.filter(x => x !== cls) : [...prev, cls]
                                                )}
                                                className={`px-3 py-1.5 rounded-xl border text-sm font-bold transition-all
                                                    ${copyTargets.includes(cls)
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-indigo-300'}`}
                                            >
                                                {cls}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => setShowCopyModal(false)}
                                            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                        >Cancel</button>
                                        <button
                                            onClick={handleCopyRequirements}
                                            disabled={copyTargets.length === 0 || copying}
                                            className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {copying && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                            Copy to {copyTargets.length} class{copyTargets.length !== 1 ? 'es' : ''}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Edit Requirement Modal */}
                        {editingRequirement && (
                            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                                    <h3 className="font-extrabold text-lg text-gray-800 mb-4">
                                        Edit Requirement
                                    </h3>
                                    <div className="flex flex-col gap-4 mb-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Subject</label>
                                            <div className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-bold">
                                                {editingRequirement.subject}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Assigned Teacher</label>
                                            <div className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
                                                {editingRequirement.teacher}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Periods Per Week</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={editingRequirement.periodsPerWeek}
                                                onChange={e => setEditingRequirement(prev => ({ ...prev, periodsPerWeek: e.target.value }))}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => setEditingRequirement(null)}
                                            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                        >Cancel</button>
                                        <button
                                            onClick={saveEditRequirement}
                                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors"
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