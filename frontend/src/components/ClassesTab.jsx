import { useState, useEffect, useRef } from 'react';
import CustomDropdown from './CustomDropdown';

const API = import.meta.env.VITE_API_URL || '';

const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
};

export default function ClassesTab({
    projectId,
    project,
    classes,
    setClasses,
    subjects,
    teachers,
    showToast,
    requestConfirm
}) {
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
    const searchQuery = ''; // Ensure this doesn't conflict
    const [searchQueryState, setSearchQuery] = useState('');

    const maxPeriods = (project?.settings?.numberOfDays || 5) * (project?.settings?.periodsPerDay || 7);

    const newClassInputRef = useRef(null);

    // Initial load of first class if none selected
    useEffect(() => {
        if (classes.length > 0 && !selectedClass) {
            setSelectedClass(classes[0]);
            loadRequirements(classes[0]);
        }
    }, [classes, selectedClass]);

    async function loadRequirements(className) {
        if (!className) return;
        try {
            const data = await authFetch(`${API}/api/rules/${className}?projectId=${projectId}`).then(r => r.json());
            setRequirements(Array.isArray(data) ? data : (Array.isArray(data.requirements) ? data.requirements : []));
            setClassTeacher(Array.isArray(data) ? '' : (data.classTeacher || ''));
            setIsDirty(false);
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
            if (!selectedClass) {
                setSelectedClass(name);
                loadRequirements(name);
            }
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
                        if (next) loadRequirements(next);
                        else {
                            setRequirements([]);
                            setClassTeacher('');
                        }
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
        if (totalNow + periods > maxPeriods) {
            showToast(`Adding ${periods} periods would exceed the ${maxPeriods}-slot limit (${maxPeriods - totalNow} remaining)`, 'error');
            return;
        }

        const subjectStr = newReqSubject.toUpperCase();

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

        if (totalNow + periods > maxPeriods) {
            showToast(`Updating to ${periods} periods would exceed the ${maxPeriods}-slot limit (${maxPeriods - totalNow} remaining)`, 'error');
            return;
        }

        setRequirements(prev => prev.map((r, i) => i === editingRequirement.index ? {
            ...r,
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

    async function handleCopyRequirements() {
        if (copyTargets.length === 0) return;
        setCopying(true);
        try {
            await Promise.all(copyTargets.map(async (targetClass) => {
                const res = await authFetch(`${API}/api/rules/${targetClass}?projectId=${projectId}`);
                const data = await res.json();
                const existingReqs = data.requirements || [];

                const newRequirements = requirements.map(req => {
                    const existing = existingReqs.find(e => e.subject === req.subject);
                    let teacherToAssign = '';

                    if (existing && existing.teacher) {
                        teacherToAssign = existing.teacher;
                    } else {
                        const mappedTeacher = teachers.find(t =>
                            t.assignments && t.assignments.some(a => a.subject === req.subject && a.classes.includes(targetClass))
                        );
                        if (mappedTeacher) {
                            teacherToAssign = mappedTeacher.name;
                        }
                    }

                    return { ...req, teacher: teacherToAssign };
                });

                return authFetch(`${API}/api/rules/${targetClass}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requirements: newRequirements, projectId, skipRegenerate: true }),
                });
            }));
            showToast(`Requirements copied to: ${copyTargets.join(', ')}`, 'success');
            setShowCopyModal(false);
            setCopyTargets([]);
        } catch {
            showToast('Failed to copy requirements', 'error');
        } finally {
            setCopying(false);
        }
    }

    const totalPeriods = requirements.reduce((sum, r) => sum + r.periodsPerWeek, 0);
    const periodBalance = maxPeriods - totalPeriods;

    const filteredClasses = classes.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-8 pb-12 font-sans">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-6">
                <div>
                    <h1 className="font-serif text-3xl text-slate-800 mb-1">Classes Management</h1>
                    <p className="text-sm text-slate-500">Define class sections and configure their academic requirements.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => newClassInputRef.current?.focus()}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-[#0b57d0] text-white hover:bg-blue-700 transition-colors rounded font-medium text-sm shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        New Class
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    {/* Add Class Inline */}
                    <div className="bg-white border border-slate-200 rounded p-4 flex gap-2 items-center shadow-sm">
                        <input
                            ref={newClassInputRef}
                            type="text"
                            placeholder="Enter new class name (e.g. 10 C)"
                            value={newClassName}
                            onChange={e => setNewClassName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddClass()}
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-slate-800 placeholder:text-slate-500"
                        />
                        <button
                            onClick={handleAddClass}
                            className="text-[#0b57d0] hover:bg-blue-50 p-1 rounded-full flex items-center justify-center transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        </button>
                    </div>

                    {/* Class List Filter */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Search classes..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-[#f0f4f9] border-none rounded focus:outline-none focus:ring-2 focus:ring-[#0b57d0]/20 text-sm text-slate-800 placeholder:text-slate-600"
                        />
                    </div>

                    {/* Classes Grid */}
                    <div className="flex flex-col border border-slate-200 rounded bg-white overflow-hidden shadow-sm">
                        {filteredClasses.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">No classes found.</div>
                        ) : (
                            filteredClasses.map(cls => {
                                const isActive = selectedClass === cls;
                                return (
                                    <div
                                        key={cls}
                                        onClick={() => handleClassSwitch(cls)}
                                        className={`flex items-center justify-between p-4 border-b border-slate-200 group cursor-pointer transition-colors ${isActive
                                                ? 'bg-[#f0f4f9] border-l-4 border-l-[#0b57d0]'
                                                : 'bg-white border-l-4 border-l-transparent hover:bg-slate-50'
                                            }`}
                                    >
                                        <div>
                                            <div className={`font-serif text-xl ${isActive ? 'text-[#0b57d0]' : 'text-slate-800'}`}>{cls}</div>
                                        </div>
                                        <div className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            {/* Edit button as a visual placeholder like in the image, or hide if no edit class feature */}
                                            <button className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors">
                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                            </button>
                                            <button
                                                onClick={e => { e.stopPropagation(); handleDeleteClass(cls); }}
                                                className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-8">
                    {selectedClass ? (
                        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                            {/* Editor Header */}
                            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="font-serif text-2xl text-slate-800">Class {selectedClass} Requirements</h2>
                                    <div className="bg-[#f0f4f9] px-3 py-1 rounded text-xs font-medium text-slate-500">
                                        {maxPeriods} Periods Total
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setCopyTargets([]); setShowCopyModal(true); }}
                                        disabled={requirements.length === 0}
                                        className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                        Copy To...
                                    </button>
                                    <button
                                        onClick={() => handleSaveDraft()}
                                        disabled={saving || !isDirty}
                                        className="px-4 py-2 bg-[#0b57d0] text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>

                            {/* Editor Content */}
                            <div className="p-6">
                                {/* Top Meta Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    {/* Class Teacher Selection */}
                                    <div className="border border-slate-200 rounded p-4 bg-[#f8faff]">
                                        <label className="text-[10px] text-slate-500 font-bold block mb-2 uppercase tracking-wider">Class Teacher</label>
                                        <div className="relative">
                                            <CustomDropdown
                                                className="w-full"
                                                options={[
                                                    { value: '', label: '— None —' },
                                                    ...teachers.map(t => ({ value: t.name, label: t.name }))
                                                ]}
                                                value={classTeacher}
                                                onChange={val => { setClassTeacher(val); setIsDirty(true); }}
                                                placeholder="— None —"
                                                icon="person"
                                            />
                                        </div>
                                    </div>

                                    {/* Period Usage */}
                                    <div className="border border-slate-200 rounded p-4 bg-[#f8faff] flex flex-col justify-center">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Period Capacity</span>
                                            <span className="text-2xl text-slate-800 leading-none font-serif">
                                                {totalPeriods} <span className="text-sm text-slate-400 font-sans">/ {maxPeriods}</span>
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${totalPeriods > maxPeriods ? 'bg-red-500' : 'bg-[#0b57d0]'}`} style={{ width: `${Math.min((totalPeriods / maxPeriods) * 100, 100)}%` }}></div>
                                        </div>
                                        <div className={`text-[11px] mt-2 text-right ${maxPeriods - totalPeriods < 0 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                            {maxPeriods - totalPeriods < 0 ? `${Math.abs(maxPeriods - totalPeriods)} periods over limit!` : `${maxPeriods - totalPeriods} periods available`}
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-t border-slate-200 mb-6" />

                                {/* Requirements List */}
                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-serif text-xl text-slate-800">Subjects & Periods</h3>
                                        <span className="text-[11px] font-medium text-[#0b57d0] bg-[#e8f0fe] px-3 py-1 rounded">{requirements.length} Subjects Defined</span>
                                    </div>

                                    <div className="flex flex-col border border-slate-200 rounded overflow-hidden">
                                        {/* Requirement Row Headers */}
                                        <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-[#f8faff] border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                            <div className="col-span-4">Subject</div>
                                            <div className="col-span-4">Teacher</div>
                                            <div className="col-span-2 text-center">Periods</div>
                                            <div className="col-span-2 text-right">Actions</div>
                                        </div>

                                        {requirements.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500 text-sm bg-white">No requirements added yet.</div>
                                        ) : (
                                            requirements.map((req, i) => (
                                                <div key={i} className="grid grid-cols-12 gap-4 py-3 px-4 bg-white border-b border-slate-100 items-center hover:bg-slate-50 transition-colors group last:border-b-0">
                                                    <div className="col-span-4 text-sm text-slate-800 font-medium">{req.subject}</div>
                                                    <div className="col-span-4 text-sm text-slate-500">{req.teacher || '(Select Teacher)'}</div>
                                                    <div className="col-span-2 text-center">
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-slate-50 text-sm text-slate-700 border border-slate-200">{req.periodsPerWeek}</span>
                                                    </div>
                                                    <div className="col-span-2 flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => startEditRequirement(i, req)}
                                                            className="text-slate-400 hover:text-[#0b57d0] transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRequirement(i)}
                                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Add Requirement Form Inline */}
                                <div className="border border-dashed border-[#a8c7fa] bg-[#f8faff] rounded p-5">
                                    <h4 className="text-[10px] text-[#0b57d0] font-bold mb-3 uppercase tracking-wider">Add New Requirement</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                                        <div className="sm:col-span-5">
                                            <label className="text-[11px] text-slate-500 block mb-1">Subject</label>
                                            <div className="relative">
                                                <CustomDropdown
                                                    className="w-full"
                                                    options={[
                                                        { value: '', label: 'Select Subject...' },
                                                        ...subjects
                                                            .filter(s => !requirements.some(r => r.subject === s.name))
                                                            .filter(s => !s.applicableClasses || s.applicableClasses.length === 0 || s.applicableClasses.includes(selectedClass))
                                                            .map(s => ({ value: s.name, label: s.name }))
                                                    ]}
                                                    value={newReqSubject}
                                                    onChange={setNewReqSubject}
                                                    placeholder="Select Subject..."
                                                    icon="menu_book"
                                                />
                                            </div>
                                        </div>
                                        <div className="sm:col-span-4">
                                            <label className="text-[11px] text-slate-500 block mb-1">Teacher (Optional)</label>
                                            <div className="relative">
                                                <select disabled className="w-full appearance-none bg-white border border-slate-300 rounded px-3 py-2 pr-8 text-sm text-slate-500 opacity-70">
                                                    <option>Auto-assign or Select...</option>
                                                </select>
                                                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="text-[11px] text-slate-500 block mb-1">Periods</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={Math.max(1, periodBalance)}
                                                value={newReqPeriods}
                                                onChange={e => setNewReqPeriods(e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-center text-slate-800 focus:outline-none focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0]"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex justify-end">
                                            <button
                                                onClick={handleAddRequirement}
                                                disabled={periodBalance <= 0 || !newReqSubject || !newReqPeriods}
                                                className="w-full h-[38px] bg-[#0b57d0] text-white rounded flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                            >
                                                <span className="material-symbols-outlined">add</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                            <span className="material-symbols-outlined text-slate-300 text-6xl mb-4">school</span>
                            <h2 className="font-serif text-2xl text-slate-700 mb-2">No Class Selected</h2>
                            <p className="text-sm text-slate-500 max-w-sm">Select a class from the list on the left to configure its schedule requirements, or create a new class.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay / Modal for Copy Requirements */}
            {showCopyModal && (
                <div aria-modal="true" role="dialog" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setShowCopyModal(false)}></div>
                    <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0b57d0]">
                                    <span className="material-symbols-outlined">content_copy</span>
                                </div>
                                <div>
                                    <h3 className="font-serif text-xl text-slate-800 leading-tight">Copy Requirements</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Duplicate schedule from <span className="font-semibold text-[#0b57d0]">{selectedClass}</span></p>
                                </div>
                            </div>
                            <button onClick={() => setShowCopyModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-6 flex flex-col gap-5 bg-slate-50/50">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
                                <div className="text-sm text-slate-600 flex-1">
                                    Select the classes that should inherit the exact same subject and period requirements as <strong className="text-[#0b57d0]">{selectedClass}</strong>.
                                    <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">warning</span>
                                        Existing requirements in selected classes will be overwritten.
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-end">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Available Classes
                                    </label>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setCopyTargets(classes.filter(c => c !== selectedClass))}
                                            className="text-xs font-medium text-[#0b57d0] hover:text-blue-800 transition-colors"
                                        >
                                            Select All
                                        </button>
                                        <button 
                                            onClick={() => setCopyTargets([])}
                                            className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                                        >
                                            Clear Selection
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="bg-white border border-slate-200 rounded-lg p-4 max-h-[280px] overflow-y-auto shadow-inner">
                                    {classes.length <= 1 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                                            <p className="text-sm">No other classes available to copy to.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {classes.filter(c => c !== selectedClass).map(cls => {
                                                const isSelected = copyTargets.includes(cls);
                                                return (
                                                    <button
                                                        key={cls}
                                                        onClick={() => setCopyTargets(prev => prev.includes(cls) ? prev.filter(x => x !== cls) : [...prev, cls])}
                                                        className={`relative flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all group overflow-hidden ${
                                                            isSelected 
                                                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-200' 
                                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'
                                                        }`}
                                                    >
                                                        <span className="truncate pr-2">{cls}</span>
                                                        <div className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors ${
                                                            isSelected 
                                                                ? 'bg-[#0b57d0] border-[#0b57d0] text-white' 
                                                                : 'border-slate-300 bg-white group-hover:border-slate-400'
                                                        }`}>
                                                            {isSelected && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="text-xs text-slate-500 flex justify-between items-center px-1">
                                    <span>{copyTargets.length} class{copyTargets.length !== 1 ? 'es' : ''} selected</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                            <button
                                onClick={() => setShowCopyModal(false)}
                                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCopyRequirements}
                                disabled={copyTargets.length === 0 || copying}
                                className="px-6 py-2.5 bg-[#0b57d0] text-white text-sm font-medium rounded-lg hover:bg-blue-700 hover:shadow-md transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center gap-2"
                            >
                                {copying ? (
                                    <>
                                        <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                                        Copying...
                                    </>
                                ) : (
                                    <>
                                        Confirm Copy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingRequirement && (
                <div aria-modal="true" role="dialog" className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingRequirement(null)}></div>
                    <div className="relative bg-white rounded shadow-xl border border-slate-200 w-full max-w-lg mx-4 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t">
                            <h3 className="font-serif text-xl text-slate-800">Edit Requirement</h3>
                            <button onClick={() => setEditingRequirement(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-5">
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Subject</label>
                                <div className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm text-slate-800">
                                    {editingRequirement.subject}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Assigned Teacher</label>
                                <div className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm text-slate-800">
                                    {editingRequirement.teacher}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Periods Per Week</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="14"
                                    value={editingRequirement.periodsPerWeek}
                                    onChange={e => setEditingRequirement(prev => ({ ...prev, periodsPerWeek: e.target.value }))}
                                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0]"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b">
                            <button
                                onClick={() => setEditingRequirement(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEditRequirement}
                                className="px-4 py-2 bg-[#0b57d0] text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
