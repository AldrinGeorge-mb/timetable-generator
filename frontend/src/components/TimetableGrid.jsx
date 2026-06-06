import { useState, useEffect, useCallback, memo } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';

const API = 'http://localhost:5000';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

// Tailwind safelist — keeps all color classes in the bundle
const _SAFELIST = [
    'bg-red-200 border-red-400', 'bg-blue-200 border-blue-400',
    'bg-green-200 border-green-400', 'bg-yellow-200 border-yellow-400',
    'bg-purple-200 border-purple-400', 'bg-orange-200 border-orange-400',
    'bg-pink-200 border-pink-400', 'bg-teal-200 border-teal-400',
    'bg-indigo-200 border-indigo-400', 'bg-lime-200 border-lime-400',
    'bg-amber-200 border-amber-400', 'bg-cyan-200 border-cyan-400',
    'bg-fuchsia-200 border-fuchsia-400', 'bg-emerald-200 border-emerald-400',
    'bg-violet-200 border-violet-400', 'bg-rose-200 border-rose-400',
    'bg-sky-200 border-sky-400', 'bg-slate-200 border-slate-400',
    'bg-stone-200 border-stone-400', 'bg-zinc-200 border-zinc-400',
];

// ─── Draggable Block ───────────────────────────────────────────────────────────
const DraggableBlock = memo(function DraggableBlock({ slot, onDelete, justMoved }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: slot.id,
        data: slot,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
        opacity: 0.95,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`group relative w-full h-full rounded-xl p-2 flex flex-col justify-center items-center cursor-grab active:cursor-grabbing transition-all duration-300 select-none shadow-sm border
                ${slot.color ? slot.color.replace('bg-', 'bg-').replace('border-', 'border-') : 'bg-blue-100 border-blue-200'}
                ${isDragging ? 'shadow-2xl scale-110 rotate-2 z-50 ring-4 ring-brand-400/30' : 'hover:shadow-md hover:scale-[1.03]'}
                ${justMoved ? 'ring-2 ring-emerald-400 animate-pulse bg-emerald-100/80 border-emerald-300' : ''}`}
        >
            <div className="absolute inset-0 bg-white/20 rounded-xl pointer-events-none mix-blend-overlay"></div>
            <button
                onPointerDown={e => e.stopPropagation()}
                onClick={() => onDelete(slot.id, slot.subject)}
                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-white bg-white hover:bg-rose-500 border border-slate-200 hover:border-rose-500 rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-black transition-all leading-none shadow-sm z-10"
            >✕</button>
            <span className="font-extrabold text-slate-800 text-[13px] text-center leading-tight drop-shadow-sm relative z-10">{slot.subject}</span>
            <span className="text-[10px] text-slate-600/80 font-bold mt-0.5 text-center leading-tight relative z-10">{slot.teacher}</span>
        </div>
    );
});

const DroppableCell = memo(function DroppableCell({ day, period, children, isDraggingAny, isValid }) {
    const { isOver, setNodeRef } = useDroppable({
        id: `${day}-${period}`,
        data: { day, period }
    });

    let bgClass = "bg-white/40";
    if (isOver) {
        bgClass = "bg-brand-50 ring-2 ring-inset ring-brand-400 z-10 relative shadow-[inset_0_0_20px_rgba(139,92,246,0.1)] rounded-xl";
    } else if (isDraggingAny) {
        if (isValid) {
            bgClass = "bg-emerald-50/50 ring-2 ring-inset ring-emerald-300/50 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)] rounded-xl";
        } else {
            bgClass = "bg-rose-50/30 ring-1 ring-inset ring-rose-200/50 opacity-50 grayscale-[50%] rounded-xl";
        }
    } else {
        bgClass = "hover:bg-white/80 rounded-xl";
    }

    return (
        <td
            ref={setNodeRef}
            className={`p-1.5 align-top w-36 h-24 transition-all duration-300 ${bgClass}`}
        >
            {children || (
                <div className="w-full h-full border border-dashed border-slate-200/60 rounded-xl flex items-center justify-center text-slate-300 text-[10px] transition-colors">
                    —
                </div>
            )}
        </td>
    );
});

// ─── Mini Read-Only Grid (for All Classes overview) ────────────────────────────
const MiniGrid = memo(function MiniGrid({ className, slots, previewChain, large }) {
    const getSlot = (day, period) => slots?.find(s => s.day === day && s.period === period);

    // Scale styles based on 'large' prop
    const textSz = large ? "text-xs" : "text-[9px]";
    const textSzSmall = large ? "text-[10px]" : "text-[8px]";
    const thPy = large ? "py-2.5" : "py-1.5";
    const tdPy = large ? "py-2" : "py-1";
    const headerSz = large ? "text-lg" : "text-sm";
    const headerPy = large ? "py-3.5" : "py-2.5";

    return (
        <div className={`glass-card rounded-[20px] overflow-hidden ${large ? 'shadow-lg' : 'shadow-sm'}`}>
            <div className={`bg-gradient-to-r from-brand-600 to-indigo-500 px-5 ${headerPy} border-b border-brand-400/30 shadow-inner`}>
                <h3 className={`text-white font-extrabold tracking-tight ${headerSz}`}>Class {className}</h3>
            </div>
            <div className="overflow-auto bg-white/50">
                <table className={`w-full text-center border-collapse ${textSz}`}>
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/60 backdrop-blur-sm">
                            <th className={`${thPy} px-1.5 border-r border-slate-200/50 text-slate-400 font-bold text-left w-14 uppercase tracking-wider`}></th>
                            {PERIODS.map(p => (
                                <th key={p} className={`${thPy} px-1 border-r border-slate-200/50 text-slate-500 font-bold w-11`}>P{p}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map(day => (
                            <tr key={day} className="border-b border-slate-100/50 hover:bg-white/40 transition-colors">
                                <td className={`${tdPy} px-2 border-r border-slate-100/50 bg-slate-50/50 text-slate-500 font-bold text-left tracking-wide`}>{day.slice(0, 3)}</td>
                                {PERIODS.map(period => {
                                    const slot = getSlot(day, period);

                                    let previewMoveHere = null;
                                    let previewMoveOut = false;
                                    if (previewChain) {
                                        previewMoveHere = previewChain.find(m => m.toDay === day && m.toPeriod === period && m.className === className);
                                        previewMoveOut = previewChain.some(m => m.fromDay === day && m.fromPeriod === period && m.className === className);
                                    }

                                    return (
                                        <td key={period} className={`${tdPy} px-1 border-r border-slate-100/30 relative`}>
                                            {previewMoveHere ? (
                                                <div className="absolute inset-1 border-2 border-brand-400 border-dashed rounded-lg bg-brand-50/90 animate-pulse flex flex-col justify-center items-center z-10 shadow-inner">
                                                    <span className={`font-black text-brand-700 ${textSzSmall} leading-tight drop-shadow-sm`}>{previewMoveHere.subject}</span>
                                                </div>
                                            ) : null}
                                            {slot ? (
                                                <div className={`rounded-lg ${textSzSmall} px-1 ${tdPy} font-extrabold text-slate-700 leading-tight ${slot.color ? slot.color.replace('bg-', 'bg-').replace('border-', 'border-') : 'bg-slate-100 border border-slate-200'} shadow-sm ${previewMoveOut ? 'opacity-20 grayscale scale-90 transition-all' : ''}`}>
                                                    {slot.subject}
                                                </div>
                                            ) : (
                                                <div className="text-slate-200 font-black">·</div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
});


const DAY_ABBREV = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri' };

// ─── Swap Conflict Modal (with Safe Alternatives) ──────────────────────────
function SwapConflictModal({ conflict, onForce, onCancel, onSelectAlternative, onApplyCascade, onPreviewChain }) {
    const [activeTab, setActiveTab] = useState('alternatives'); // 'alternatives' | 'cascade'
    const [alternatives, setAlternatives] = useState(null);
    const [altError, setAltError] = useState(false);

    const [cascades, setCascades] = useState(null);
    const [cascadeError, setCascadeError] = useState(false);

    useEffect(() => {
        if (!conflict) return;
        setAlternatives(null);
        setAltError(false);
        fetch(`${API}/api/suggest-alternatives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teacherName: conflict.draggedBlock.teacher,
                originalDay: conflict.draggedBlock.day,
                originalPeriod: conflict.draggedBlock.period,
                currentClassName: conflict.currentClassName,
                allSchedules: conflict.allSchedules,
            }),
        })
            .then(r => r.json())
            .then(data => setAlternatives(data))
            .catch(() => setAltError(true));
    }, [conflict]);

    useEffect(() => {
        if (!conflict || activeTab !== 'cascade') return;
        if (cascades) return; // already fetched

        setCascadeError(false);
        fetch(`${API}/api/find-cascade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                draggedBlock: conflict.draggedBlock,
                targetDay: conflict.newDay,
                targetPeriod: conflict.newPeriod,
                currentClassName: conflict.currentClassName,
                allSchedules: conflict.allSchedules,
            }),
        })
            .then(r => r.json())
            .then(data => setCascades(data))
            .catch(() => setCascadeError(true));
    }, [conflict, activeTab, cascades]);

    if (!conflict) return null;

    const hasAlternatives = alternatives &&
        (alternatives.safeEmptySlots?.length > 0 || alternatives.safeSwapSlots?.length > 0);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-end p-6 pointer-events-none">
            <div
                className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden pointer-events-auto border border-gray-200"
                style={{ animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl font-black">⚠</div>
                    <div>
                        <h3 className="text-white font-extrabold text-base leading-tight">Teacher Collision Detected</h3>
                        <p className="text-orange-100 text-xs mt-0.5">Resolve the conflict without breaking global constraints</p>
                    </div>
                </div>

                {/* ── Scrollable body ── */}
                <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

                    {/* Conflict messages */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Conflicts Detected</p>
                        <div className="space-y-2">
                            {conflict.messages.map((msg, i) => (
                                <div key={i} className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                                    <span className="text-red-500 font-bold text-sm mt-0.5 shrink-0">✕</span>
                                    <p className="text-red-700 text-sm font-medium leading-snug">{msg}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 mt-2">
                        <button
                            onClick={() => setActiveTab('alternatives')}
                            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'alternatives' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            Alternatives (1-step)
                        </button>
                        <button
                            onClick={() => setActiveTab('cascade')}
                            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'cascade' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            Smart Resolve (Multi-step)
                            <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-black">New</span>
                        </button>
                    </div>

                    {/* ── Alternatives Tab ── */}
                    {activeTab === 'alternatives' && (
                        <div>
                            {!alternatives && !altError && (
                                <div className="flex items-center gap-2 text-gray-400 text-sm py-3">
                                    <div className="w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
                                    Computing collision-free slots…
                                </div>
                            )}

                            {altError && <p className="text-red-500 text-sm">Could not compute alternatives.</p>}

                            {alternatives && !hasAlternatives && (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
                                    No simple 1-step moves available. Try <strong>Smart Resolve</strong>.
                                </div>
                            )}

                            {alternatives?.safeEmptySlots?.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs text-emerald-700 font-semibold mb-2">● Move to empty slot</p>
                                    <div className="flex flex-wrap gap-2">
                                        {alternatives.safeEmptySlots.map(({ day, period }) => (
                                            <button
                                                key={`${day}-${period}`}
                                                onClick={() => onSelectAlternative({ type: 'move', day, period })}
                                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg transition-colors"
                                            >
                                                {DAY_ABBREV[day]} P{period}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {alternatives?.safeSwapSlots?.length > 0 && (
                                <div>
                                    <p className="text-xs text-blue-700 font-semibold mb-2">● Swap with another block</p>
                                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                        {alternatives.safeSwapSlots.map(alt => (
                                            <button
                                                key={`${alt.day}-${alt.period}`}
                                                onClick={() => onSelectAlternative({ type: 'swap', ...alt })}
                                                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition-colors group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-1 rounded-md border text-xs font-bold text-gray-800 ${alt.color || 'bg-gray-100'}`}>
                                                        {alt.subject}
                                                    </span>
                                                    <span className="text-gray-500 text-xs">{alt.teacher}</span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-xs text-gray-400">{DAY_ABBREV[alt.day]} P{alt.period}</span>
                                                    <span className="text-xs bg-blue-100 group-hover:bg-blue-200 text-blue-700 font-bold px-2 py-0.5 rounded-lg transition-colors">Swap ⇄</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Cascade Tab ── */}
                    {activeTab === 'cascade' && (
                        <div>
                            {!cascades && !cascadeError && (
                                <div className="flex items-center gap-2 text-gray-400 text-sm py-3">
                                    <div className="w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
                                    Searching across all classes for resolution chains…
                                </div>
                            )}

                            {cascadeError && <p className="text-red-500 text-sm">Failed to search for cascades.</p>}

                            {cascades?.blocked && (
                                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                                    {cascades.reason || "This slot is permanently blocked. No sequence of moves can safely free it up."}
                                </div>
                            )}

                            {cascades?.chains?.length === 0 && !cascades.blocked && (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
                                    Could not find any safe multi-step resolution within 3 moves.
                                </div>
                            )}

                            {cascades?.chains?.length > 0 && (
                                <div className="space-y-4">
                                    <p className="text-xs font-medium text-gray-500">
                                        Found {cascades.chains.length} way(s) to resolve this collision by cascading moves.
                                    </p>
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                        {cascades.chains.map((chain, idx) => (
                                            <div
                                                key={idx}
                                                className="border border-indigo-100 hover:border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50/80 rounded-xl p-3 flex flex-col gap-2 transition-all cursor-default"
                                                onMouseEnter={() => onPreviewChain && onPreviewChain(chain)}
                                                onMouseLeave={() => onPreviewChain && onPreviewChain(null)}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Option {idx + 1} ({chain.length} moves)</span>
                                                    <button
                                                        onClick={() => { onPreviewChain && onPreviewChain(null); onApplyCascade(chain); }}
                                                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                    >
                                                        Apply Chain
                                                    </button>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {chain.map((move, mIdx) => (
                                                        <div key={mIdx} className="flex items-center gap-2 text-[11px] bg-white border border-gray-100 rounded-lg px-2.5 py-1.5 shadow-sm">
                                                            <span className="flex-1 truncate">
                                                                <span className="font-bold text-gray-800">Class {move.className}:</span>{' '}
                                                                <span className="font-semibold text-gray-700">{move.subject}</span>
                                                            </span>
                                                            <span className="text-gray-400 shrink-0">
                                                                {DAY_ABBREV[move.fromDay]} P{move.fromPeriod} <strong className="text-indigo-400 mx-1">→</strong> {DAY_ABBREV[move.toDay]} P{move.toPeriod}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer actions ── */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
                    <button
                        onClick={() => { onPreviewChain && onPreviewChain(null); onCancel(); }}
                        className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onForce}
                        className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-sm rounded-xl transition-colors"
                    >
                        Force Original Swap (Breaks Rules)
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.92) translateY(12px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0); }
                }
            `}</style>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TimetableGrid({ projectId }) {
    const [allSchedules, setAllSchedules] = useState({});
    const [history, setHistory] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [view, setView] = useState('single'); // 'single' | 'all'
    const [viewMode, setViewMode] = useState('class'); // 'class' | 'teacher'
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);
    const [toast, setToast] = useState({ message: '', type: 'info' });
    const [pendingSwap, setPendingSwap] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [pendingConfirm, setPendingConfirm] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [validSlots, setValidSlots] = useState({});
    const [previewChain, setPreviewChain] = useState(null);
    const [justMovedIds, setJustMovedIds] = useState([]);

    const showToast = (message, type = 'info') => setToast({ message, type });
    const clearToast = useCallback(() => setToast({ message: '', type: 'info' }), []);

    const requestConfirm = (title, message, action, confirmText = "Confirm", confirmColor = "bg-red-600 hover:bg-red-700 text-white") => {
        setPendingConfirm({ title, message, action, confirmText, confirmColor });
    };

    useEffect(() => {
        if (!projectId) return;
        setLoading(true);
        Promise.all([
            fetch(`${API}/api/classes?projectId=${projectId}`).then(r => r.json()),
            fetch(`${API}/api/schedule?projectId=${projectId}`).then(r => r.json()),
        ])
            .then(([classNames, schedules]) => {
                setClasses(classNames);
                setAllSchedules(schedules);
                if (classNames.length > 0) setSelectedClass(classNames[0]);
                setIsDirty(false);
                showToast(`Loaded schedules for ${classNames.length} classes`, 'success');
            })
            .catch(() => showToast('Failed to connect to backend server', 'error'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const resp = await fetch(`${API}/api/schedule/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ allSchedules, projectId })
            });
            if (!resp.ok) throw new Error('Failed to save');
            setIsDirty(false);
            showToast('Timetable saved to database!', 'success');
        } catch {
            showToast('Failed to save timetable.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerate = () => {
        requestConfirm(
            "Regenerate Master Schedule",
            "WARNING: This will wipe all manual modifications across all classes and generate a fresh schedule. Continue?",
            async () => {
                setRegenerating(true);
                try {
                    const resp = await fetch(`${API}/api/schedule/regenerate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ projectId })
                    });
                    if (!resp.ok) throw new Error('Failed to regenerate');
                    const newSchedules = await resp.json();
                    setHistory(h => [...h, allSchedules]);
                    setAllSchedules(newSchedules);
                    setIsDirty(false);
                    showToast('AI successfully regenerated a fresh master schedule!', 'success');
                } catch {
                    showToast('Failed to regenerate timetable.', 'error');
                } finally {
                    setRegenerating(false);
                }
            },
            "Regenerate",
            "bg-red-600 hover:bg-red-700 text-white"
        );
    };

    const updateSchedules = (updater, isUndo = false) => {
        setAllSchedules(prev => {
            if (!isUndo) {
                setHistory(h => [...h, prev]);
            }
            const next = typeof updater === 'function' ? updater(prev) : updater;
            setIsDirty(true);
            return next;
        });
    };

    const handleUndo = () => {
        setHistory(h => {
            if (h.length === 0) return h;
            const newHistory = [...h];
            const lastState = newHistory.pop();
            setAllSchedules(lastState);
            setIsDirty(true);
            showToast('Action undone', 'info');
            return newHistory;
        });
    };

    // ─── Data Derivation ───
    const uniqueTeachers = Array.from(new Set(
        Object.values(allSchedules).flat().map(s => s.teacher)
    )).sort();

    // Auto-select first teacher if none selected
    useEffect(() => {
        if (!selectedTeacher && uniqueTeachers.length > 0) {
            setSelectedTeacher(uniqueTeachers[0]);
        }
    }, [uniqueTeachers, selectedTeacher]);

    const currentSchedule = allSchedules[selectedClass] || [];

    const teacherSchedule = Object.entries(allSchedules).flatMap(([clsName, slots]) =>
        slots.filter(s => s.teacher === selectedTeacher).map(s => ({ ...s, className: clsName }))
    );

    const getSlotData = (day, period) => {
        if (viewMode === 'teacher') {
            return teacherSchedule.find(s => s.day === day && s.period === period);
        }
        return currentSchedule.find(s => s.day === day && s.period === period);
    };

    const handleDeleteBlock = (id, subject) => {
        updateSchedules(prev => ({
            ...prev,
            [selectedClass]: prev[selectedClass].filter(s => s.id !== id)
        }));
        showToast(`Removed ${subject} from the grid`, 'warning');
    };

    const commitSwap = (draggedBlock, occupant, newDay, newPeriod) => {
        updateSchedules(prev => ({
            ...prev,
            [selectedClass]: prev[selectedClass].map(s => {
                if (s.id === occupant.id) return { ...s, day: draggedBlock.day, period: draggedBlock.period };
                if (s.id === draggedBlock.id) return { ...s, day: newDay, period: newPeriod };
                return s;
            })
        }));
        showToast(`Forced swap: ${draggedBlock.subject} ↔ ${occupant.subject}`, 'warning');
        setPendingSwap(null);
    };

    const handleApplyCascade = (chain) => {
        updateSchedules(prev => {
            const next = { ...prev };
            // Deep copy affected classes
            chain.forEach(move => {
                if (!next[move.className]) return;
                next[move.className] = [...next[move.className]];
            });

            // Apply all moves
            chain.forEach(move => {
                const clsSched = next[move.className];
                const blockIdx = clsSched.findIndex(s => s.id === move.blockId);
                if (blockIdx !== -1) {
                    clsSched[blockIdx] = { ...clsSched[blockIdx], day: move.toDay, period: move.toPeriod };
                }
            });
            return next;
        });
        showToast(`Applied ${chain.length}-step resolution chain!`, 'success');
        setPendingSwap(null);
        setPreviewChain(null);
        setJustMovedIds(chain.map(m => m.blockId));
        setTimeout(() => setJustMovedIds([]), 4000);
    };
    const handleDragStart = (event) => {
        const { active } = event;
        const draggedBlock = currentSchedule.find(s => s.id === active.id);
        if (!draggedBlock) return;

        setDraggedItem(draggedBlock);

        // Precompute valid slots for this teacher and potential swaps
        const newValid = {};
        DAYS.forEach(day => {
            PERIODS.forEach(period => {
                // Find potential occupant in the current class at the target slot
                const occupant = currentSchedule.find(s => s.day === day && s.period === period && s.id !== draggedBlock.id);

                // 1. Is the dragged teacher busy at this target slot?
                // We ignore the dragged block itself, AND we ignore the occupant (because the occupant will move out in a swap)
                const teacherBusyAtTarget = Object.values(allSchedules).some(classBlocks =>
                    classBlocks.some(b =>
                        b.day === day &&
                        b.period === period &&
                        b.teacher === draggedBlock.teacher &&
                        b.id !== draggedBlock.id &&
                        (!occupant || b.id !== occupant.id)
                    )
                );

                if (teacherBusyAtTarget) {
                    newValid[`${day}-${period}`] = false;
                    return;
                }

                // 2. If there's an occupant, check the reverse swap!
                if (occupant) {
                    // Is the occupant teacher busy at the dragged block's ORIGINAL slot?
                    // We ignore the occupant itself, AND we ignore the dragged block (because it's moving out)
                    const occupantBusyAtOrigin = Object.values(allSchedules).some(classBlocks =>
                        classBlocks.some(b =>
                            b.day === draggedBlock.day &&
                            b.period === draggedBlock.period &&
                            b.teacher === occupant.teacher &&
                            b.id !== occupant.id &&
                            b.id !== draggedBlock.id
                        )
                    );

                    if (occupantBusyAtOrigin) {
                        newValid[`${day}-${period}`] = false;
                        return;
                    }
                }

                newValid[`${day}-${period}`] = true;
            });
        });
        setValidSlots(newValid);
    };

    const handleDragEnd = async (event) => {
        setDraggedItem(null);
        setValidSlots({});
        const { active, over } = event;
        if (!over) return;

        const draggedBlockId = active.id;
        const newDay = over.data.current.day;
        const newPeriod = over.data.current.period;
        const draggedBlock = currentSchedule.find(s => s.id === draggedBlockId);
        if (!draggedBlock) return;

        // If dragged to same position, do nothing
        if (draggedBlock.day === newDay && draggedBlock.period === newPeriod) return;

        const occupant = currentSchedule.find(
            s => s.day === newDay && s.period === newPeriod && s.id !== draggedBlockId
        );


        if (occupant) {
            // SWAP: both teachers move to new slots — must validate BOTH directions
            // against all other classes. Neither leg is safe to assume conflict-free.
            setValidating(true);
            try {
                const tempSchedule = currentSchedule.filter(s => s.id !== draggedBlockId && s.id !== occupant.id);
                const tempAllSchedules = { ...allSchedules, [selectedClass]: tempSchedule };

                // Leg 1: draggedBlock.teacher moves to occupant's slot (newDay, newPeriod)
                // Leg 2: occupant.teacher moves to draggedBlock's original slot
                const [leg1, leg2] = await Promise.all([
                    fetch(`${API}/api/validate-move`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            teacherName: draggedBlock.teacher,
                            targetDay: newDay,
                            targetPeriod: newPeriod,
                            currentClassName: selectedClass,
                            allSchedules: tempAllSchedules,
                        }),
                    }).then(r => r.json()),
                    fetch(`${API}/api/validate-move`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            teacherName: occupant.teacher,
                            targetDay: draggedBlock.day,
                            targetPeriod: draggedBlock.period,
                            currentClassName: selectedClass,
                            allSchedules: tempAllSchedules,
                        }),
                    }).then(r => r.json()),
                ]);

                // Collect all conflict messages from both legs
                const conflictMessages = [
                    ...(!leg1.isValid ? [leg1.message] : []),
                    ...(!leg2.isValid ? [leg2.message] : []),
                ];

                if (conflictMessages.length > 0) {
                    // Pause and show alternatives modal — include enough context for the API call
                    setPendingSwap({
                        messages: conflictMessages,
                        draggedBlock,
                        occupant,
                        newDay,
                        newPeriod,
                        currentClassName: selectedClass,
                        allSchedules
                    });
                    return;
                }

                // Both legs are clear — commit the swap immediately
                updateSchedules(prev => ({
                    ...prev,
                    [selectedClass]: prev[selectedClass].map(s => {
                        if (s.id === occupant.id) return { ...s, day: draggedBlock.day, period: draggedBlock.period };
                        if (s.id === draggedBlockId) return { ...s, day: newDay, period: newPeriod };
                        return s;
                    })
                }));
                showToast(`Swapped ${draggedBlock.subject} ↔ ${occupant.subject}`, 'success');
            } catch {
                showToast('Validation server unreachable', 'error');
            } finally {
                setValidating(false);
            }
            return;
        }


        // Moving to empty slot: validate cross-class collision
        setValidating(true);
        try {
            const tempSchedule = currentSchedule.filter(s => s.id !== draggedBlockId);
            const tempAllSchedules = { ...allSchedules, [selectedClass]: tempSchedule };

            const resp = await fetch(`${API}/api/validate-move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherName: draggedBlock.teacher,
                    targetDay: newDay,
                    targetPeriod: newPeriod,
                    currentClassName: selectedClass,
                    allSchedules: tempAllSchedules,
                }),
            });
            const result = await resp.json();

            if (!result.isValid) {
                showToast(result.message, 'error');
                return; // block is reverted automatically (state not changed)
            }

            // Move is valid — update state
            updateSchedules(prev => ({
                ...prev,
                [selectedClass]: prev[selectedClass].map(s =>
                    s.id === draggedBlockId ? { ...s, day: newDay, period: newPeriod } : s
                )
            }));
            showToast(`Moved ${draggedBlock.subject} → ${newDay} Period ${newPeriod}`, 'success');
        } catch {
            showToast('Validation server unreachable', 'error');
        } finally {
            setValidating(false);
        }
    };

    // Execute a safe alternative chosen by the user from the modal
    const handleSelectAlternative = (alt) => {
        const { draggedBlock } = pendingSwap;
        setPendingSwap(null);

        if (alt.type === 'move') {
            // Move dragged block to a safe empty slot; original occupant stays put
            updateSchedules(prev => ({
                ...prev,
                [selectedClass]: prev[selectedClass].map(s =>
                    s.id === draggedBlock.id
                        ? { ...s, day: alt.day, period: alt.period }
                        : s
                )
            }));
            showToast(`✅ Moved ${draggedBlock.subject} → ${DAY_ABBREV[alt.day]} P${alt.period} (collision-free)`, 'success');
        } else {
            // Swap dragged block with an alternative partner — both directions are pre-validated
            commitSwap(
                draggedBlock,
                { id: alt.blockId, day: alt.day, period: alt.period, subject: alt.subject, teacher: alt.teacher },
                alt.day,
                alt.period
            );
            showToast(`✅ Safe swap: ${draggedBlock.subject} ⇄ ${alt.subject} (collision-free)`, 'success');
        }
    };

    const totalFilled = currentSchedule.length;
    const totalEmpty = 40 - totalFilled;

    return (
        <>
            <Toast message={toast.message} type={toast.type} onClose={clearToast} />

            {/* Swap conflict modal with safe alternatives */}
            <SwapConflictModal
                conflict={pendingSwap}
                onForce={() => {
                    commitSwap(
                        pendingSwap.draggedBlock,
                        pendingSwap.occupant,
                        pendingSwap.newDay,
                        pendingSwap.newPeriod
                    );
                }}
                onCancel={() => setPendingSwap(null)}
                onSelectAlternative={handleSelectAlternative}
                onApplyCascade={handleApplyCascade}
                onPreviewChain={setPreviewChain}
            />

            {/* ── Floating Live Preview for Affected Classes ── */}
            {previewChain && (
                <div className="fixed top-6 left-6 bottom-6 z-[150] w-[calc(100%-560px)] min-w-[500px] flex flex-col gap-5 overflow-y-auto pb-8 pr-4 pointer-events-none" style={{ animation: 'popIn 0.2s ease-out' }}>
                    <div className="bg-indigo-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg border border-indigo-700 flex items-center gap-3 shrink-0 text-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                        Live Cascade Preview
                    </div>
                    {Array.from(new Set(previewChain.map(m => m.className))).map(clsName => (
                        <div key={clsName} className="pointer-events-auto">
                            <MiniGrid
                                className={clsName}
                                slots={allSchedules[clsName]}
                                previewChain={previewChain}
                                large={true}
                            />
                        </div>
                    ))}
                </div>
            )}

            <div className={`p-6 max-w-[96rem] mx-auto transition-opacity duration-300 ${previewChain ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                {/* ── Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight drop-shadow-sm">
                            {view === 'all'
                                ? 'All Classes — Overview'
                                : viewMode === 'teacher'
                                    ? `Teacher ${selectedTeacher} — Schedule`
                                    : `Class ${selectedClass} — Schedule`
                            }
                        </h2>
                        <p className="text-slate-500 font-bold text-sm mt-1.5 uppercase tracking-wider">
                            {view === 'single'
                                ? viewMode === 'class'
                                    ? `${totalFilled}/40 slots filled · ${totalEmpty} empty`
                                    : `${teacherSchedule.length}/40 slots teaching`
                                : `${classes.length} classes · AI-Generated, Collision-Free`
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Undo Button */}
                        <button
                            onClick={handleUndo}
                            disabled={history.length === 0}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                                history.length > 0
                                    ? 'bg-white border border-slate-200/60 text-slate-700 hover:bg-slate-50 shadow-sm hover:border-slate-300'
                                    : 'bg-white/50 border border-transparent text-slate-300 cursor-not-allowed'
                            }`}
                            title="Undo last action"
                        >
                            <span>↩</span> Undo
                        </button>

                        {/* View Toggle */}
                        {view === 'single' && (
                            <div className="flex bg-slate-100/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-1 gap-1 mr-2 shadow-inner">
                                <button
                                    onClick={() => setViewMode('class')}
                                    className={`px-5 py-2 rounded-lg text-sm font-black transition-all duration-300 ${viewMode === 'class' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                                >
                                    By Class
                                </button>
                                <button
                                    onClick={() => setViewMode('teacher')}
                                    className={`px-5 py-2 rounded-lg text-sm font-black transition-all duration-300 ${viewMode === 'teacher' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                                >
                                    By Teacher
                                </button>
                            </div>
                        )}

                        {/* Mode Toggle (Single vs All) */}
                        {viewMode === 'class' && (
                            <div className="flex bg-slate-100/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-1 gap-1 shadow-inner">
                                <button
                                    onClick={() => setView('single')}
                                    className={`px-5 py-2 rounded-lg text-sm font-black transition-all duration-300 ${view === 'single' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                                >
                                    Single Class
                                </button>
                                <button
                                    onClick={() => setView('all')}
                                    className={`px-5 py-2 rounded-lg text-sm font-black transition-all duration-300 ${view === 'all' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                                >
                                    All Classes
                                </button>
                            </div>
                        )}

                        {/* Dropdown — only in single view */}
                        {view === 'single' && viewMode === 'class' && (
                            <select
                                value={selectedClass}
                                onChange={e => setSelectedClass(e.target.value)}
                                className="border border-gray-200 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                                {classes.map(cls => (
                                    <option key={cls} value={cls}>Class {cls}</option>
                                ))}
                            </select>
                        )}

                        {view === 'single' && viewMode === 'teacher' && (
                            <select
                                value={selectedTeacher}
                                onChange={e => setSelectedTeacher(e.target.value)}
                                className="border border-gray-200 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                                {uniqueTeachers.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        )}

                        {/* Validating badge */}
                        {validating && (
                            <span className="px-3 py-1.5 bg-amber-100 border border-amber-300 text-amber-700 text-xs font-bold rounded-lg animate-pulse">
                                Validating move…
                            </span>
                        )}

                        {/* Persistence Controls */}
                        <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                            <button
                                onClick={handleSave}
                                disabled={!isDirty || saving}
                                className={`px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${!isDirty && !saving ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : saving ? 'bg-emerald-600 text-white cursor-not-allowed opacity-80' : 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600'}`}
                            >
                                {saving ? (
                                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                                ) : isDirty ? (
                                    <>💾 Save Changes <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse ml-1" /></>
                                ) : (
                                    <>✅ Saved</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Loading ── */}
                {loading && (
                    <div className="flex items-center justify-center h-64 text-gray-400">
                        <div className="text-center">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                            <p className="font-medium">Loading schedules…</p>
                        </div>
                    </div>
                )}

                {/* ── Single Class Grid (with DnD) ── */}
                {!loading && view === 'single' && viewMode === 'class' && (
                    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToFirstScrollableAncestor]}>
                        <div className="glass-card rounded-[32px] shadow-sm overflow-auto">
                            <table className="w-full text-center border-collapse">
                                <thead className="sticky top-0 z-20 shadow-sm">
                                    <tr className="bg-white/80 backdrop-blur-md border-b border-slate-200/50">
                                        <th className="sticky left-0 z-30 bg-white/90 backdrop-blur-md py-4 px-6 w-32 text-slate-400 font-black text-left text-sm uppercase tracking-widest shadow-[4px_0_10px_rgba(0,0,0,0.02)]">Day</th>
                                        {PERIODS.map(p => (
                                            <th key={p} className="py-4 px-2 text-slate-700 font-extrabold text-sm w-40">
                                                Period {p}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {DAYS.map((day, i) => (
                                        <tr key={day} className={`border-b border-slate-100/50 ${i % 2 === 0 ? 'bg-white/40' : 'bg-slate-50/30'}`}>
                                            <td className="sticky left-0 z-10 py-3 px-6 bg-white/60 backdrop-blur-sm text-slate-700 font-black text-base text-left shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
                                                {day}
                                            </td>
                                            {PERIODS.map(period => {
                                                const slot = getSlotData(day, period);
                                                const isValid = validSlots[`${day}-${period}`];

                                                // Check preview chain
                                                let previewMoveHere = null;
                                                let previewMoveOut = false;
                                                if (previewChain) {
                                                    previewMoveHere = previewChain.find(m => m.toDay === day && m.toPeriod === period && m.className === selectedClass);
                                                    previewMoveOut = previewChain.some(m => m.fromDay === day && m.fromPeriod === period && m.className === selectedClass);
                                                }

                                                return (
                                                    <DroppableCell
                                                        key={`${day}-${period}`}
                                                        day={day}
                                                        period={period}
                                                        isDraggingAny={!!draggedItem}
                                                        isValid={isValid}
                                                    >
                                                        {previewMoveHere ? (
                                                            <div className="w-full h-full border-2 border-indigo-400 border-dashed rounded-lg p-2 flex flex-col justify-center items-center bg-indigo-50/80 animate-pulse">
                                                                <span className="font-bold text-indigo-700 text-sm text-center leading-tight">{previewMoveHere.subject}</span>
                                                                <span className="text-[10px] text-indigo-500 mt-1 text-center font-bold">New</span>
                                                            </div>
                                                        ) : (
                                                            slot && <div className={previewMoveOut ? "opacity-20 grayscale transition-all duration-300 w-full h-full" : "w-full h-full"}>
                                                                <DraggableBlock slot={slot} onDelete={handleDeleteBlock} justMoved={justMovedIds.includes(slot.id)} />
                                                            </div>
                                                        )}
                                                    </DroppableCell>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </DndContext>
                )}

                {/* ── Teacher Grid (Read-Only) ── */}
                {!loading && view === 'single' && viewMode === 'teacher' && (
                    <div className="glass-card rounded-[32px] shadow-sm overflow-auto">
                        <table className="w-full text-center border-collapse">
                            <thead className="sticky top-0 z-20 shadow-sm">
                                <tr className="bg-white/80 backdrop-blur-md border-b border-slate-200/50">
                                    <th className="sticky left-0 z-30 bg-white/90 backdrop-blur-md py-4 px-6 w-32 text-slate-400 font-black text-left text-sm uppercase tracking-widest shadow-[4px_0_10px_rgba(0,0,0,0.02)]">Day</th>
                                    {PERIODS.map(p => (
                                        <th key={p} className="py-4 px-2 text-slate-700 font-extrabold text-sm w-40">
                                            Period {p}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {DAYS.map((day, i) => (
                                    <tr key={day} className={`border-b border-slate-100/50 ${i % 2 === 0 ? 'bg-white/40' : 'bg-slate-50/30'}`}>
                                        <td className="sticky left-0 z-10 py-3 px-6 bg-white/60 backdrop-blur-sm text-slate-700 font-black text-base text-left shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
                                            {day}
                                        </td>
                                        {PERIODS.map(period => {
                                            const slot = getSlotData(day, period);
                                            return (
                                                <td key={`${day}-${period}`} className="p-1.5 align-top min-w-[140px]">
                                                    {slot ? (
                                                        <div className={`p-3 rounded-xl text-left shadow-sm flex flex-col justify-between h-full min-h-[5.5rem] border ${slot.color ? slot.color.replace('bg-', 'bg-').replace('border-', 'border-') : 'bg-slate-50 border-slate-200'}`}>
                                                            <div className="font-black text-[16px] text-slate-900 tracking-tight leading-tight">
                                                                Class {slot.className}
                                                            </div>
                                                            <div className="text-[12px] font-extrabold text-brand-700 bg-white/70 px-2 py-1 rounded-lg flex items-center justify-between mt-2 border border-brand-100/50">
                                                                <span className="truncate drop-shadow-sm" title={slot.subject}>
                                                                    {slot.subject}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full min-h-[5.5rem] flex items-center justify-center text-slate-300 text-xs font-black tracking-widest uppercase border border-dashed border-slate-200/60 rounded-xl bg-white/20">
                                                            Free
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Period stats bar */}
                {!loading && view === 'single' && viewMode === 'class' && (
                    <div className="mt-4 flex flex-wrap gap-3">
                        {[...new Set(currentSchedule.map(s => s.subject))]
                            .map(subject => ({
                                subject,
                                count: currentSchedule.filter(s => s.subject === subject).length,
                                color: currentSchedule.find(s => s.subject === subject)?.color || 'bg-gray-100'
                            }))
                            .sort((a, b) => b.count - a.count)
                            .map(({ subject, count, color }) => (
                                <div key={subject} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold text-gray-700 ${color}`}>
                                    <span>{subject}</span>
                                    <span className="bg-white/60 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
                                </div>
                            ))
                        }
                    </div>
                )}

                {/* ── All Classes Overview (read-only mini grids) ── */}
                {!loading && view === 'all' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {classes.map(cls => (
                            <div
                                key={cls}
                                onClick={() => { setSelectedClass(cls); setView('single'); }}
                                className="cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all rounded-xl"
                                title={`Click to open Class ${cls}`}
                            >
                                <MiniGrid className={cls} slots={allSchedules[cls]} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
                confirmColor={pendingConfirm?.confirmColor || "bg-red-600 hover:bg-red-700 text-white"}
            />
        </>
    );
}