import { useState, useEffect, useCallback, useRef, memo } from 'react';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';
import ExportModal from './ExportModal';
import CustomDropdown from './CustomDropdown';

const API = import.meta.env.VITE_API_URL || '';

const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
};
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Tailwind safelist — keeps all color classes in the bundle
const _SAFELIST = [
    "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
];

// ─── Draggable Block ───────────────────────────────────────────────────────────
// 1x1 transparent GIF used to suppress the browser's native drag ghost image
const EMPTY_IMG = new Image();
EMPTY_IMG.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// ─── Draggable Block ───────────────────────────────────────────────────────────

const DraggableBlock = memo(function DraggableBlock({ slot, onDelete, justMoved, onDragStart }) {
    const isConflict = false; // We can add conflict visual later if needed
    const bgStyle = slot.color ? slot.color : 'bg-surface-container border-outline-variant/30 text-on-surface';

    return (
        <div
            draggable
            onDragStart={e => {
                e.dataTransfer.setDragImage(EMPTY_IMG, 0, 0);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', slot.id);
                onDragStart(slot);
            }}
            onDragEnd={() => onDragStart(null)}
            className={`h-full w-full rounded-xl card-element p-3 flex flex-col justify-between border border-opacity-50 group relative overflow-hidden
                ${bgStyle}
                ${justMoved ? 'ring-2 ring-primary animate-[pulse_1s_ease-in-out_2]' : ''}`}
        >
            <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => onDelete(slot.id, slot.subject)}
                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 text-error hover:text-white bg-white hover:bg-error border border-outline-variant/30 hover:border-error rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold transition-all leading-none shadow-sm z-20"
            >✕</button>
            <div className="flex items-start mb-2 relative z-10 w-full overflow-hidden">
                <span className="font-display text-lg leading-tight font-medium truncate" title={slot.subject}>{slot.subject}</span>
            </div>
            <div className="flex items-end mt-auto relative z-10 w-full overflow-hidden">
                <span className="font-label-md text-xs opacity-80 truncate" title={slot.teacher}>{slot.teacher}</span>
            </div>
        </div>
    );
});

const DroppableCell = memo(function DroppableCell({ day, period, children, isDraggingAny, isValid, onDrop, onDragOver }) {
    const [isOver, setIsOver] = useState(false);

    let bgClass = "relative z-10 group/slot";
    let overlay = null;

    if (isOver) {
        overlay = (
            <div className="absolute inset-2 border border-dashed border-primary/40 rounded-xl bg-primary/5 flex items-center justify-center pointer-events-none z-20">
                <div className="flex flex-col items-center gap-1">
                    <span className="material-symbols-outlined text-primary/60 text-[20px]">file_download</span>
                    <span className="font-label-md text-[10px] text-primary/60 uppercase tracking-widest">Drop Here</span>
                </div>
            </div>
        );
    } else if (isDraggingAny) {
        if (isValid) {
            bgClass += " grid-cell-shimmer";
        } else {
            bgClass += " opacity-40 grayscale-[30%]";
        }
    }

    return (
        <div
            className={`p-2 min-w-0 grid-slot border-r border-outline-variant/10 ${bgClass}`}
            onDragOver={e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setIsOver(true);
                onDragOver && onDragOver(day, period);
            }}
            onDragLeave={() => setIsOver(false)}
            onDrop={e => {
                e.preventDefault();
                setIsOver(false);
                const id = e.dataTransfer.getData('text/plain');
                onDrop(id, day, period);
            }}
        >
            {overlay}
            {children || (
                <div className="absolute inset-2 border border-dashed border-outline-variant/50 rounded-xl bg-surface-container-low/30 flex items-center justify-center pointer-events-none transition-all group-hover/slot:border-primary/30 group-hover/slot:bg-primary/5">
                    <span className="font-label-md text-[10px] text-on-surface-variant/50 uppercase tracking-widest group-hover/slot:text-primary/50">Empty</span>
                </div>
            )}
        </div>
    );
});

// ─── Mini Read-Only Grid (for All Classes overview) ────────────────────────────
const MiniGrid = memo(function MiniGrid({ className, slots, previewChain, large, DAYS, PERIODS }) {
    const getSlot = (day, period) => slots?.find(s => s.day === day && s.period === period);

    // Scale styles based on 'large' prop
    const textSz = large ? "text-xs" : "text-[9px]";
    const textSzSmall = large ? "text-[10px]" : "text-[8px]";
    const thPy = large ? "py-2.5" : "py-1.5";
    const tdPy = large ? "py-2" : "py-1";
    const headerSz = large ? "text-lg" : "text-sm";
    const headerPy = large ? "py-3.5" : "py-2.5";

    return (
        <div className={`bg-white rounded-[20px] overflow-hidden border border-slate-200 ${large ? 'shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]' : 'shadow-sm'}`}>
            <div className={`bg-white px-5 ${headerPy} border-b border-slate-200`}>
                <h3 className={`text-slate-800 font-extrabold tracking-tight ${headerSz}`}>Class {className}</h3>
            </div>
            <div className="overflow-auto bg-slate-50">
                <table className={`w-full text-center border-collapse ${textSz}`}>
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 backdrop-blur-sm">
                            <th className={`${thPy} px-1.5 border-r border-slate-200 text-slate-400 font-bold text-left w-14 uppercase tracking-wider`}></th>
                            {PERIODS.map(p => (
                                <th key={p} className={`${thPy} px-1 border-r border-slate-200 text-slate-500 font-bold w-11`}>P{p}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map(day => (
                            <tr key={day} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className={`${tdPy} px-2 border-r border-slate-100 bg-slate-50/50 text-slate-500 font-bold text-left tracking-wide`}>{day.slice(0, 3)}</td>
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
                                                <div className="absolute inset-1 border-2 border-brand-400 border-dashed rounded-lg bg-indigo-500/10/90 animate-pulse flex flex-col justify-center items-center z-10 shadow-inner">
                                                    <span className={`font-black text-indigo-600 ${textSzSmall} leading-tight drop-shadow-sm`}>{previewMoveHere.subject}</span>
                                                </div>
                                            ) : null}
                                            {slot ? (
                                                <div className={`rounded-lg ${textSzSmall} px-1 ${tdPy} font-extrabold text-slate-800 leading-tight ${slot.color ? slot.color.replace('bg-', 'bg-').replace('border-', 'border-') : 'bg-slate-100 border border-slate-200'} shadow-sm ${previewMoveOut ? 'opacity-20 grayscale scale-90 transition-all' : ''}`}>
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
        authFetch(`${API}/api/suggest-alternatives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teacherName: conflict.draggedBlock.teacher,
                originalDay: conflict.draggedBlock.day,
                originalPeriod: conflict.draggedBlock.period,
                currentClassName: conflict.currentClassName,
                allSchedules: conflict.allSchedules,
                settings: conflict.settings,
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
        authFetch(`${API}/api/find-cascade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                draggedBlock: conflict.draggedBlock,
                targetDay: conflict.newDay,
                targetPeriod: conflict.newPeriod,
                currentClassName: conflict.currentClassName,
                allSchedules: conflict.allSchedules,
                settings: conflict.settings,
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-inverse-surface/10 backdrop-blur-sm z-40" onClick={() => { onPreviewChain && onPreviewChain(null); onCancel(); }}></div>
            <main 
                className="relative z-50 w-full max-w-lg bg-[#faf8ff]/95 backdrop-blur-md border border-border-light rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden"
                style={{ animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
                <header className="bg-amber-soft border-b border-border-light p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="font-headline-md text-headline-md text-amber-text flex items-center gap-2 m-0">
                                <span className="material-symbols-outlined text-amber-text" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                                Teacher Collision Detected
                            </h1>
                            <p className="font-body-md text-sm text-amber-text/80 mt-1 mb-0">Resolve the conflict to maintain institutional integrity.</p>
                        </div>
                        <button aria-label="Close modal" className="text-amber-text/60 hover:text-amber-text transition-colors mt-1" onClick={() => { onPreviewChain && onPreviewChain(null); onCancel(); }}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </header>

                <div className="p-5 flex flex-col gap-5 bg-surface flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <div className="flex flex-col gap-3">
                        {conflict.messages.map((msg, i) => (
                            <div key={i} className="bg-red-light border border-crimson-deep/20 rounded-lg p-3.5 flex items-start gap-2.5">
                                <span className="material-symbols-outlined text-crimson-deep text-[20px] mt-0.5">error</span>
                                <div className="font-body-md text-sm text-crimson-deep" dangerouslySetInnerHTML={{ __html: msg.replace(/([^ ]+ TR|[^ ]+ SIR)/g, '<strong>$1</strong>') }} />
                            </div>
                        ))}
                    </div>

                    <nav aria-label="Resolution Tabs" className="flex border-b border-border-light relative shrink-0">
                        <button 
                            onClick={() => setActiveTab('alternatives')}
                            className={`flex-1 py-2.5 font-label-md text-xs sm:text-sm transition-colors uppercase relative flex items-center justify-center gap-1.5 ${activeTab === 'alternatives' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-on-surface'}`}
                        >
                            Alternatives
                        </button>
                        <button 
                            onClick={() => setActiveTab('cascade')}
                            className={`flex-1 py-2.5 font-label-md text-xs sm:text-sm transition-colors uppercase relative flex items-center justify-center gap-1.5 ${activeTab === 'cascade' ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-on-surface'}`}
                        >
                            Smart Resolve
                            <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[9px] px-1.5 py-0.5 rounded font-medium tracking-wide">NEW</span>
                        </button>
                    </nav>

                    <div className="flex flex-col gap-5">
                        {activeTab === 'alternatives' && (
                            <div className="flex flex-col gap-4">
                                {!alternatives && !altError && (
                                    <div className="font-body-md text-sm text-secondary">Computing collision-free slots…</div>
                                )}
                                {altError && <div className="font-body-md text-sm text-error">Could not compute alternatives.</div>}
                                {alternatives && !hasAlternatives && (
                                    <div className="font-body-md text-sm text-secondary">No simple 1-step moves available. Try Smart Resolve.</div>
                                )}
                                {alternatives?.safeEmptySlots?.length > 0 && (
                                    <div className="flex flex-col gap-2.5">
                                        <h3 className="font-label-md text-xs text-on-surface uppercase tracking-wide">Move to Empty Slot</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {alternatives.safeEmptySlots.map(({ day, period }) => (
                                                <button key={`${day}-${period}`} onClick={() => onSelectAlternative({ type: 'move', day, period })} className="border border-border-light text-on-surface font-label-md text-xs px-3 py-1.5 rounded uppercase tracking-wide hover:bg-surface-variant transition-colors bg-surface-container-lowest">
                                                    {DAY_ABBREV[day]} P{period}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {alternatives?.safeSwapSlots?.length > 0 && (
                                    <div className="flex flex-col gap-2.5 mt-1">
                                        <h3 className="font-label-md text-xs text-on-surface uppercase tracking-wide">Swap With Block</h3>
                                        <div className="flex flex-col gap-2">
                                            {alternatives.safeSwapSlots.map(alt => (
                                                <div key={`${alt.day}-${alt.period}`} className="border border-border-light rounded-lg bg-surface-container-lowest p-3 flex justify-between items-center hover:border-primary/40 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-body-md text-sm text-on-surface">
                                                            <span className="font-semibold">{alt.subject}</span>
                                                            <span className="mx-2 text-outline/50">|</span>
                                                            <span className="text-secondary">{alt.teacher}</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => onSelectAlternative({ type: 'swap', ...alt })} className="bg-primary/5 text-primary border border-primary/20 font-label-md text-[11px] px-3 py-1.5 rounded uppercase tracking-wide hover:bg-primary hover:text-white transition-colors shrink-0">
                                                        Swap {DAY_ABBREV[alt.day]} P{alt.period}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'cascade' && (
                            <div className="flex flex-col gap-4">
                                {!cascades && !cascadeError && (
                                    <div className="font-body-md text-sm text-secondary">Searching across all classes for resolution chains…</div>
                                )}
                                {cascadeError && <div className="font-body-md text-sm text-error">Failed to search for cascades.</div>}
                                {cascades?.blocked && (
                                    <div className="font-body-md text-sm text-error">{cascades.reason || "This slot is permanently blocked."}</div>
                                )}
                                {cascades?.chains?.length === 0 && !cascades.blocked && (
                                    <div className="font-body-md text-sm text-secondary">Could not find any safe multi-step resolution within 4 moves.</div>
                                )}
                                {cascades?.chains?.map((chain, idx) => (
                                    <section key={idx} 
                                        onMouseEnter={() => onPreviewChain && onPreviewChain(chain)}
                                        onMouseLeave={() => onPreviewChain && onPreviewChain(null)}
                                        className="border border-border-light rounded-lg bg-surface-container-lowest p-4 hover:border-primary/40 transition-colors"
                                    >
                                        <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-border-light/50">
                                            <h3 className="font-label-md text-xs text-on-surface uppercase tracking-wide">Option {idx + 1} ({chain.length} Moves)</h3>
                                            <button onClick={() => { onPreviewChain && onPreviewChain(null); onApplyCascade(chain); }} className="bg-primary text-white font-label-md text-[11px] px-3 py-1.5 rounded uppercase tracking-wide hover:bg-primary/90 transition-colors">Apply Chain</button>
                                        </div>
                                        <div className="flex flex-col gap-1.5 relative">
                                            <div className="absolute left-[11px] top-6 bottom-5 w-px bg-border-light z-0"></div>
                                            {chain.map((move, mIdx) => (
                                                <div key={mIdx} className="flex items-center gap-3 relative z-10 bg-surface-container-lowest py-1.5">
                                                    <div className="w-6 h-6 rounded-full bg-surface-variant border border-border-light flex items-center justify-center text-[11px] font-bold text-secondary shrink-0">{mIdx + 1}</div>
                                                    <div className="flex-1 font-body-md text-[13px] text-on-surface truncate">
                                                        <span className="font-semibold text-slate-800">C{move.className}: {move.subject}</span>
                                                        <span className="mx-2 text-outline/50">|</span>
                                                        <span className="text-secondary">{DAY_ABBREV[move.fromDay]} P{move.fromPeriod}</span> <span className="material-symbols-outlined text-outline align-middle text-[14px]">arrow_forward</span> <span className="text-secondary">{DAY_ABBREV[move.toDay]} P{move.toPeriod}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-3 relative z-10 bg-surface-container-lowest py-1.5">
                                                <div className="w-6 h-6 rounded-full bg-surface-variant border border-border-light flex items-center justify-center text-[11px] font-bold text-secondary shrink-0">{chain.length + 1}</div>
                                                <div className="flex-1 font-body-md text-[13px] text-secondary">
                                                    <span className="font-semibold text-slate-700">Swap Target</span>
                                                    <span className="mx-2 text-outline/50">|</span>
                                                    Slot becomes available
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <footer className="bg-surface-container-lowest border-t border-border-light p-4 flex justify-between items-center mt-auto shrink-0 gap-3">
                    <button onClick={() => { onPreviewChain && onPreviewChain(null); onCancel(); }} className="font-label-md text-xs sm:text-sm text-secondary hover:text-on-surface transition-colors uppercase tracking-wide">
                        Cancel
                    </button>
                    <button onClick={onForce} className="border border-error text-error font-label-md text-[11px] sm:text-xs px-3 py-2 rounded uppercase tracking-wide hover:bg-error-container/50 transition-colors flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        Force Swap
                    </button>
                </footer>
                
                <style>{`
                    @keyframes popIn {
                        from { opacity: 0; transform: scale(0.92) translateY(12px); }
                        to   { opacity: 1; transform: scale(1)    translateY(0); }
                    }
                `}</style>
            </main>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TimetableGrid({ projectId, project, setHasUnsavedChanges, saveTimetableRef }) {
    const DAYS = ALL_DAYS.slice(0, project?.settings?.numberOfDays || 5);
    const PERIODS = Array.from({ length: project?.settings?.periodsPerDay || 7 }, (_, i) => i + 1);
    const breaks = project?.settings?.breaks || [
        { afterPeriod: 2, label: 'Interval' },
        { afterPeriod: 4, label: 'Lunch' },
        { afterPeriod: 6, label: 'Interval' }
    ];
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
    const [showExportModal, setShowExportModal] = useState(false);
    const tableRef = useRef(null);
    const overlayRef = useRef(null);
    const dragHandlerRef = useRef(null);

    const gridColsString = `100px ${PERIODS.map(p => breaks.some(b => b.afterPeriod === p) ? 'minmax(0,1fr) 60px' : 'minmax(0,1fr)').join(' ')}`;

    const showToast = (message, type = 'info') => setToast({ message, type });
    const clearToast = useCallback(() => setToast({ message: '', type: 'info' }), []);

    const requestConfirm = (title, message, action, confirmText = "Confirm", confirmColor = "bg-red-600 hover:bg-red-700 text-white") => {
        setPendingConfirm({ title, message, action, confirmText, confirmColor });
    };

    useEffect(() => {
        if (!projectId) return;
        setLoading(true);
        Promise.all([
            authFetch(`${API}/api/classes?projectId=${projectId}`).then(r => r.json()),
            authFetch(`${API}/api/schedule?projectId=${projectId}`).then(r => r.json()),
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

    useEffect(() => {
        if (setHasUnsavedChanges) {
            setHasUnsavedChanges(isDirty);
        }
    }, [isDirty, setHasUnsavedChanges]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const resp = await authFetch(`${API}/api/schedule/save`, {
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

    useEffect(() => {
        if (saveTimetableRef) {
            saveTimetableRef.current = handleSave;
        }
    }, [allSchedules, projectId]);

    const handleRegenerate = () => {
        requestConfirm(
            "Regenerate Master Schedule",
            "WARNING: This will wipe all manual modifications across all classes and generate a fresh schedule. Continue?",
            async () => {
                setRegenerating(true);
                try {
                    const resp = await authFetch(`${API}/api/schedule/regenerate`, {
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
    // Called when a block starts being dragged (from DraggableBlock's onDragStart)
    const handleDragStart = (draggedBlock) => {
        if (!draggedBlock) {
            // Tear down global listener
            if (dragHandlerRef.current) {
                document.removeEventListener('dragover', dragHandlerRef.current);
                dragHandlerRef.current = null;
            }
            if (overlayRef.current) overlayRef.current.style.display = 'none';
            setDraggedItem(null);
            setValidSlots({});
            return;
        }

        // Prime the overlay with this slot's color & text (direct DOM = zero re-render)
        if (overlayRef.current) {
            const colorCls = draggedBlock.color || 'bg-blue-100 border-blue-200';
            overlayRef.current.className =
                `pointer-events-none absolute top-0 left-0 z-50 rounded-xl p-2 flex flex-col justify-center items-center shadow-2xl ring-2 ring-brand-400/40 border opacity-95 ${colorCls}`;
            const spans = overlayRef.current.querySelectorAll('span');
            if (spans[0]) spans[0].textContent = draggedBlock.subject;
            if (spans[1]) spans[1].textContent = draggedBlock.teacher;
        }

        // Global dragover — fires even when mouse is outside the table
        const handler = (e) => {
            if (!tableRef.current || !overlayRef.current) return;
            const rect = tableRef.current.getBoundingClientRect();
            const OW = 130, OH = 84;
            const x = Math.min(Math.max(e.clientX - rect.left - OW / 2, 0), rect.width - OW);
            const y = Math.min(Math.max(e.clientY - rect.top - OH / 2, 0), rect.height - OH);
            overlayRef.current.style.display = 'flex';
            overlayRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        };
        dragHandlerRef.current = handler;
        document.addEventListener('dragover', handler);
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

    // Called when a block is dropped onto a cell (from DroppableCell's onDrop)
    const handleDrop = async (draggedBlockId, newDay, newPeriod) => {
        setDraggedItem(null);
        setValidSlots({});

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
                    authFetch(`${API}/api/validate-move`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            teacherName: draggedBlock.teacher,
                            targetDay: newDay,
                            targetPeriod: newPeriod,
                            currentClassName: selectedClass,
                            allSchedules: tempAllSchedules,
                            settings: project?.settings,
                        }),
                    }).then(r => r.json()),
                    authFetch(`${API}/api/validate-move`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            teacherName: occupant.teacher,
                            targetDay: draggedBlock.day,
                            targetPeriod: draggedBlock.period,
                            currentClassName: selectedClass,
                            allSchedules: tempAllSchedules,
                            settings: project?.settings,
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
                        allSchedules,
                        settings: project?.settings
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

            const resp = await authFetch(`${API}/api/validate-move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherName: draggedBlock.teacher,
                    targetDay: newDay,
                    targetPeriod: newPeriod,
                    currentClassName: selectedClass,
                    allSchedules: tempAllSchedules,
                    settings: project?.settings,
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
    const totalSlots = DAYS.length * PERIODS.length;
    const totalEmpty = totalSlots - totalFilled;

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
                <div className="flex items-end justify-between mb-8 pb-4 flex-wrap gap-6">
                    <div>
                        <h1 className="font-display text-5xl font-medium tracking-tight text-on-surface">Time Table</h1>
                        <p className="text-on-surface-variant font-label-md mt-2 tracking-wide uppercase opacity-80">
                            {view === 'single'
                                ? viewMode === 'class'
                                    ? `Class ${selectedClass} · ${totalFilled}/${totalSlots} slots filled`
                                    : `Teacher ${selectedTeacher} · ${teacherSchedule.length}/${totalSlots} slots teaching`
                                : `All Classes Overview`
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-4 border-b border-outline-variant/30 pb-2 flex-wrap">
                        {/* Undo Button */}
                        <button
                            onClick={handleUndo}
                            disabled={history.length === 0}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-label-md transition-colors btn-interactive border shadow-sm
                                ${history.length > 0 
                                    ? 'bg-surface-container hover:bg-surface-dim text-on-surface-variant border-outline-variant/50' 
                                    : 'bg-surface-container/50 text-outline border-outline-variant/20 cursor-not-allowed opacity-60'}`}
                            title="Undo last action"
                        >
                            <span className="material-symbols-outlined text-[18px]">undo</span> Undo
                        </button>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={!isDirty || saving}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-label-md transition-all btn-interactive
                                ${!isDirty && !saving ? 'bg-surface-container text-outline cursor-not-allowed border border-outline-variant/30 shadow-none' 
                                : saving ? 'bg-primary/70 text-on-primary cursor-not-allowed shadow-md' 
                                : 'bg-primary hover:bg-primary/90 text-on-primary shadow-md hover:shadow-lg hover:-translate-y-0.5'}`}
                        >
                            {saving ? (
                                <><div className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" /> Saving...</>
                            ) : isDirty ? (
                                <>Save Changes <span className="w-2 h-2 rounded-full bg-error animate-pulse ml-1" /></>
                            ) : (
                                <>Saved</>
                            )}
                        </button>

                        {/* Export PDF */}
                        <button
                            onClick={() => setShowExportModal(true)}
                            disabled={Object.keys(allSchedules).length === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-dim text-on-surface-variant font-label-md transition-colors btn-interactive border border-outline-variant/50 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Export
                        </button>

                        <div className="w-px h-8 bg-outline-variant/30 mx-2"></div>

                        {/* View Mode Toggle (Single vs All) */}
                        {viewMode === 'class' && (
                            <div className="flex bg-surface-container p-1 rounded-xl border border-outline-variant/30 shadow-inner">
                                <button
                                    onClick={() => setView('single')}
                                    className={`px-4 py-1.5 rounded-lg font-label-md text-sm transition-all ${view === 'single' ? 'bg-surface shadow-sm text-on-surface border border-outline-variant/20' : 'text-on-surface-variant hover:text-on-surface'}`}
                                >
                                    Single Class
                                </button>
                                <button
                                    onClick={() => setView('all')}
                                    className={`px-4 py-1.5 rounded-lg font-label-md text-sm transition-all ${view === 'all' ? 'bg-surface shadow-sm text-on-surface border border-outline-variant/20' : 'text-on-surface-variant hover:text-on-surface'}`}
                                >
                                    All Classes
                                </button>
                            </div>
                        )}

                        {/* Dropdowns */}
                        {view === 'single' && viewMode === 'class' && (
                            <CustomDropdown
                                options={classes.map(cls => ({ value: cls, label: `Class ${cls}` }))}
                                value={selectedClass}
                                onChange={setSelectedClass}
                                placeholder="Select Class"
                                icon="meeting_room"
                            />
                        )}
                        {view === 'single' && viewMode === 'teacher' && (
                            <CustomDropdown
                                options={uniqueTeachers.map(t => ({ value: t, label: t }))}
                                value={selectedTeacher}
                                onChange={setSelectedTeacher}
                                placeholder="Select Teacher"
                                icon="person"
                            />
                        )}

                        {/* Filter Segmented Control */}
                        {view === 'single' && (
                            <div className="flex bg-surface-container p-1 rounded-xl border border-outline-variant/30 shadow-inner ml-2">
                                <button
                                    onClick={() => setViewMode('class')}
                                    className={`px-4 py-1.5 rounded-lg font-label-md text-sm transition-all ${viewMode === 'class' ? 'bg-surface shadow-sm text-on-surface border border-outline-variant/20' : 'text-on-surface-variant hover:text-on-surface'}`}
                                >
                                    By Class
                                </button>
                                <button
                                    onClick={() => setViewMode('teacher')}
                                    className={`px-4 py-1.5 rounded-lg font-label-md text-sm transition-all ${viewMode === 'teacher' ? 'bg-surface shadow-sm text-on-surface border border-outline-variant/20' : 'text-on-surface-variant hover:text-on-surface'}`}
                                >
                                    By Teacher
                                </button>
                            </div>
                        )}

                        {/* Validating indicator */}
                        {validating && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-container text-on-primary-container rounded-xl font-label-md text-xs border border-primary/20 animate-pulse ml-2">
                                <div className="w-2.5 h-2.5 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin" />
                                Validating…
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Loading ── */}
                {loading && (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                        <div className="text-center">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                            <p className="font-medium">Loading schedules…</p>
                        </div>
                    </div>
                )}

                {/* ── Single Class Grid (with DnD) ── */}
                {!loading && view === 'single' && viewMode === 'class' && (
                    <div ref={tableRef} className="bg-surface rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 overflow-hidden relative">
                        <div ref={overlayRef} style={{ display: 'none', width: 130, height: 84, willChange: 'transform' }}>
                            <span className="font-extrabold text-slate-800 text-[13px] text-center leading-tight drop-shadow-sm" />
                            <span className="text-[10px] text-white/60/80 font-bold mt-0.5 text-center" />
                        </div>
                        
                        <div className="min-w-[1200px] overflow-x-auto w-full">
                            <div style={{ gridTemplateColumns: gridColsString }} className="grid w-full sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                <div className="p-4 border-r border-outline-variant/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-outline">calendar_month</span>
                                </div>
                                {PERIODS.map(p => {
                                    const cols = [
                                        <div key={`p-${p}`} className={`p-4 text-center ${p !== PERIODS.length || breaks.some(b => b.afterPeriod === p) ? 'border-r' : ''} border-outline-variant/10 text-on-surface font-display text-lg tracking-wide`}>Period {p}</div>
                                    ];
                                    const brk = breaks.find(b => b.afterPeriod === p);
                                    if (brk) cols.push(
                                        <div key={`b-${p}`} className={`bg-surface-container-low/50 ${p !== PERIODS.length ? 'border-r' : ''} border-outline-variant/10 flex items-center justify-center overflow-hidden`}>
                                            <span className="text-[10px] tracking-[0.2em] text-on-surface-variant font-label-md uppercase rotate-[-90deg] whitespace-nowrap">{brk.label}</span>
                                        </div>
                                    );
                                    return cols;
                                })}
                            </div>
                            
                            <div className="relative flex flex-col">
                                {DAYS.map((day, i) => (
                                    <div key={day} style={{ gridTemplateColumns: gridColsString }} className={`grid w-full border-b border-outline-variant/10 ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-container-low/30'}`}>
                                        <div className="p-4 border-r border-outline-variant/10 flex flex-col items-center justify-center bg-surface/50 backdrop-blur-sm sticky left-0 z-20 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
                                            <span className="font-display text-xl text-on-surface mb-1">{day.slice(0, 3)}</span>
                                        </div>

                                        {PERIODS.map((period) => {
                                            const slot = getSlotData(day, period);
                                            const isValid = validSlots[`${day}-${period}`];
                                            let previewMoveHere = null;
                                            let previewMoveOut = false;
                                            if (previewChain) {
                                                previewMoveHere = previewChain.find(m => m.toDay === day && m.toPeriod === period && m.className === selectedClass);
                                                previewMoveOut = previewChain.some(m => m.fromDay === day && m.fromPeriod === period && m.className === selectedClass);
                                            }

                                            const cell = (
                                                <DroppableCell
                                                    key={`${day}-${period}`}
                                                    day={day}
                                                    period={period}
                                                    isDraggingAny={!!draggedItem}
                                                    isValid={isValid}
                                                    onDrop={handleDrop}
                                                >
                                                    {previewMoveHere ? (
                                                        <div className="w-full h-full border-2 border-primary border-dashed rounded-xl p-2 flex flex-col justify-center items-center bg-primary/10 animate-pulse">
                                                            <span className="font-bold text-primary text-sm text-center leading-tight">{previewMoveHere.subject}</span>
                                                            <span className="text-[10px] text-primary/70 mt-1 text-center font-bold">New</span>
                                                        </div>
                                                    ) : (
                                                        slot && <div className={previewMoveOut ? "opacity-20 grayscale transition-all duration-300 w-full h-full" : "w-full h-full"}>
                                                            <DraggableBlock slot={slot} onDelete={handleDeleteBlock} justMoved={justMovedIds.includes(slot.id)} onDragStart={handleDragStart} />
                                                        </div>
                                                    )}
                                                </DroppableCell>
                                            );

                                            // Inject breaks
                                            const brk = breaks.find(b => b.afterPeriod === period);
                                            if (brk) {
                                                return [
                                                    cell,
                                                    <div key={`break-${day}-${period}`} className={`border-outline-variant/10 break-column min-h-[100px] ${period !== PERIODS.length ? 'border-r' : ''}`}></div>
                                                ];
                                            }
                                            return cell;
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Teacher Grid (Read-Only) ── */}
                {!loading && view === 'single' && viewMode === 'teacher' && (
                    <div className="bg-surface rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 overflow-hidden relative">
                        <div className="min-w-[1200px] overflow-x-auto w-full">
                            <div style={{ gridTemplateColumns: gridColsString }} className="grid w-full sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                <div className="p-4 border-r border-outline-variant/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-outline">calendar_month</span>
                                </div>
                                {PERIODS.map(p => {
                                    const cols = [
                                        <div key={`p-${p}`} className={`p-4 text-center ${p !== PERIODS.length || breaks.some(b => b.afterPeriod === p) ? 'border-r' : ''} border-outline-variant/10 text-on-surface font-display text-lg tracking-wide`}>Period {p}</div>
                                    ];
                                    const brk = breaks.find(b => b.afterPeriod === p);
                                    if (brk) cols.push(
                                        <div key={`b-${p}`} className={`bg-surface-container-low/50 ${p !== PERIODS.length ? 'border-r' : ''} border-outline-variant/10 flex items-center justify-center overflow-hidden`}>
                                            <span className="text-[10px] tracking-[0.2em] text-on-surface-variant font-label-md uppercase rotate-[-90deg] whitespace-nowrap">{brk.label}</span>
                                        </div>
                                    );
                                    return cols;
                                })}
                            </div>
                            
                            <div className="relative flex flex-col">
                                {DAYS.map((day, i) => (
                                    <div key={day} style={{ gridTemplateColumns: gridColsString }} className={`grid w-full border-b border-outline-variant/10 ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-container-low/30'}`}>
                                        <div className="p-4 border-r border-outline-variant/10 flex flex-col items-center justify-center bg-surface/50 backdrop-blur-sm sticky left-0 z-20 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
                                            <span className="font-display text-xl text-on-surface mb-1">{day.slice(0, 3)}</span>
                                        </div>

                                        {PERIODS.map(period => {
                                            const slot = getSlotData(day, period);
                                            const cell = (
                                                <div key={`${day}-${period}`} className="p-2 grid-slot border-r border-outline-variant/10 relative z-10 group/slot min-h-[100px]">
                                                    {slot ? (
                                                        <div className={`h-full w-full rounded-xl card-element p-3 flex flex-col justify-between border border-opacity-50 relative overflow-hidden ${slot.color ? slot.color : 'bg-surface-container border-outline-variant/30 text-on-surface'}`}>
                                                            <div className="flex justify-between items-start mb-2 relative z-10">
                                                                <span className="font-display text-lg leading-tight font-medium truncate" title={`Class ${slot.className}`}>Class {slot.className}</span>
                                                            </div>
                                                            <div className="flex justify-between items-end mt-auto relative z-10">
                                                                <span className="font-label-md text-xs opacity-80 truncate" title={slot.subject}>{slot.subject}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="absolute inset-2 border border-dashed border-outline-variant/50 rounded-xl bg-surface-container-low/30 flex items-center justify-center pointer-events-none transition-all group-hover/slot:border-primary/30 group-hover/slot:bg-primary/5">
                                                            <span className="font-label-md text-[10px] text-on-surface-variant/50 uppercase tracking-widest group-hover/slot:text-primary/50">Free</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );

                                            // Inject breaks
                                            const brk = breaks.find(b => b.afterPeriod === period);
                                            if (brk) {
                                                return [
                                                    cell,
                                                    <div key={`break-${day}-${period}`} className={`border-outline-variant/10 break-column min-h-[100px] ${period !== PERIODS.length ? 'border-r' : ''}`}></div>
                                                ];
                                            }
                                            return cell;
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Period stats bar */}
                {!loading && view === 'single' && viewMode === 'class' && (
                    <div className="mt-4 flex flex-wrap gap-3">
                        {[...new Set(currentSchedule.map(s => s.subject))]
                            .map(subject => ({
                                subject,
                                count: currentSchedule.filter(s => s.subject === subject).length,
                                color: currentSchedule.find(s => s.subject === subject)?.color || 'bg-white'
                            }))
                            .sort((a, b) => b.count - a.count)
                            .map(({ subject, count, color }) => (
                                <div key={subject} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold text-slate-800 ${color}`}>
                                    <span>{subject}</span>
                                    <span className="bg-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
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
                                <MiniGrid className={cls} slots={allSchedules[cls]} previewChain={previewChain} large={false} DAYS={DAYS} PERIODS={PERIODS} />
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

            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                allSchedules={allSchedules}
                classes={classes}
                uniqueTeachers={uniqueTeachers}
                project={project}
            />
        </>
    );
}
