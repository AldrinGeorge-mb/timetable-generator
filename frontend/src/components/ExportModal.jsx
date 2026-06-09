import { useState, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
    ];
}

const COLOR_MAP = {
    'bg-red-200': ['#fecaca', '#f87171'],
    'bg-blue-200': ['#bfdbfe', '#60a5fa'],
    'bg-green-200': ['#bbf7d0', '#4ade80'],
    'bg-yellow-200': ['#fef08a', '#facc15'],
    'bg-purple-200': ['#e9d5ff', '#c084fc'],
    'bg-orange-200': ['#fed7aa', '#fb923c'],
    'bg-pink-200': ['#fbcfe8', '#f472b6'],
    'bg-teal-200': ['#99f6e4', '#2dd4bf'],
    'bg-indigo-200': ['#c7d2fe', '#818cf8'],
    'bg-lime-200': ['#d9f99d', '#a3e635'],
    'bg-amber-200': ['#fde68a', '#fbbf24'],
    'bg-cyan-200': ['#a5f3fc', '#22d3ee'],
    'bg-fuchsia-200': ['#f5d0fe', '#e879f9'],
    'bg-emerald-200': ['#a7f3d0', '#34d399'],
    'bg-violet-200': ['#ddd6fe', '#a78bfa'],
    'bg-rose-200': ['#fecdd3', '#fb7185'],
    'bg-sky-200': ['#bae6fd', '#38bdf8'],
    'bg-slate-200': ['#e2e8f0', '#94a3b8'],
};

function getColors(colorClass) {
    if (!colorClass) return ['#eff6ff', '#bfdbfe'];
    const bgKey = colorClass.split(' ').find(c => c.startsWith('bg-'));
    return COLOR_MAP[bgKey] || ['#eff6ff', '#bfdbfe'];
}

function buildClassRows(schedule, DAYS) {
    const rows = {};
    DAYS.forEach(d => { rows[d] = {}; });
    (schedule || []).forEach(s => {
        if (!rows[s.day]) return;
        const [bg, border] = getColors(s.color);
        rows[s.day][s.period] = { subject: s.subject, extra: s.teacher, bgColor: bg, borderColor: border };
    });
    return rows;
}

function buildTeacherRows(allSchedules, teacher, DAYS) {
    const rows = {};
    DAYS.forEach(d => { rows[d] = {}; });
    Object.entries(allSchedules).forEach(([cls, slots]) => {
        (slots || []).filter(s => s.teacher === teacher).forEach(s => {
            if (!rows[s.day]) return;
            const [bg, border] = getColors(s.color);
            rows[s.day][s.period] = { subject: s.subject, extra: `Class ${cls}`, bgColor: bg, borderColor: border };
        });
    });
    return rows;
}

// ─── Core PDF Drawing (pure jsPDF — zero DOM, near-instant) ──────────────────
function drawTimetablePage(pdf, title, subtitle, rows, isFirst, DAYS, PERIODS, breaks) {
    const PW = 297, PH = 210, M = 8;
    const HEADER_H = 20;
    const TABLE_TOP = M + HEADER_H + 4;
    const TABLE_W = PW - 2 * M;
    const DAY_COL_W = 18;
    const BREAK_COL_W = 6;
    const PERIOD_COL_W = (TABLE_W - DAY_COL_W - breaks.length * BREAK_COL_W) / PERIODS.length;
    const THEAD_H = 9;
    const DATA_ROW_H = (PH - TABLE_TOP - M - THEAD_H) / DAYS.length;

    if (!isFirst) pdf.addPage();

    // ── Header bar ──
    pdf.setFillColor(79, 70, 229);        // indigo-600
    pdf.roundedRect(M, M, PW - 2 * M, HEADER_H, 3, 3, 'F');

    // Accent stripe inside header
    pdf.setFillColor(99, 102, 241);       // indigo-500 lighter
    pdf.roundedRect(M, M + HEADER_H - 4, PW - 2 * M, 4, 0, 0, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text(title, M + 7, M + 9);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(199, 210, 254);      // indigo-200
    pdf.text(subtitle, M + 7, M + 16);

    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    pdf.text(`Generated ${dateStr}`, PW - M - 3, M + 9, { align: 'right' });

    // ── Table header row ──
    pdf.setFillColor(241, 245, 249);      // slate-100
    pdf.rect(M, TABLE_TOP, TABLE_W, THEAD_H, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);      // slate-500

    pdf.text('Day', M + DAY_COL_W / 2, TABLE_TOP + 5.8, { align: 'center' });
    
    const columns = [];
    PERIODS.forEach(p => {
        columns.push({ type: 'period', p });
        const brk = breaks.find(b => b.afterPeriod === p);
        if (brk) columns.push({ type: 'break', label: brk.label.toUpperCase() });
    });

    let currX = M + DAY_COL_W;
    columns.forEach(col => {
        const colW = col.type === 'break' ? BREAK_COL_W : PERIOD_COL_W;
        if (col.type === 'period') {
            pdf.text(`Period ${col.p}`, currX + colW / 2, TABLE_TOP + 5.8, { align: 'center' });
        } else {
            // Draw break header text vertically
            pdf.setFontSize(5);
            pdf.text(col.label, currX + colW / 2, TABLE_TOP + 5.8, { align: 'center' });
            pdf.setFontSize(7.5);
        }
        currX += colW;
    });

    // ── Data rows ──
    DAYS.forEach((day, di) => {
        const rowY = TABLE_TOP + THEAD_H + di * DATA_ROW_H;

        // Alternating row background
        pdf.setFillColor(di % 2 === 0 ? 255 : 248, di % 2 === 0 ? 255 : 250, di % 2 === 0 ? 255 : 252);
        pdf.rect(M, rowY, TABLE_W, DATA_ROW_H, 'F');

        // Day label
        pdf.setTextColor(71, 85, 105);    // slate-600
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(day.slice(0, 3), M + DAY_COL_W / 2, rowY + DATA_ROW_H / 2 + 1.5, { align: 'center' });

        // Cells
        let currentCellX = M + DAY_COL_W;
        columns.forEach(col => {
            const colW = col.type === 'break' ? BREAK_COL_W : PERIOD_COL_W;
            if (col.type === 'break') {
                // Fill break background
                pdf.setFillColor(241, 245, 249); // slate-100
                pdf.rect(currentCellX, rowY, colW, DATA_ROW_H, 'F');
            } else {
                const p = col.p;
                const slot = rows[day]?.[p];
                const cx = currentCellX + 1.5;
                const cy = rowY + 2;
                const cw = colW - 3;
                const ch = DATA_ROW_H - 4;

                if (slot) {
                    pdf.setFillColor(...hexToRgb(slot.bgColor));
                    pdf.setDrawColor(...hexToRgb(slot.borderColor));
                    pdf.setLineWidth(0.35);
                    pdf.roundedRect(cx, cy, cw, ch, 2, 2, 'FD');

                    pdf.setTextColor(30, 41, 59);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(7.8);
                    pdf.text(slot.subject, cx + cw / 2, cy + ch / 2 + (slot.extra ? -1.5 : 1), {
                        align: 'center', maxWidth: cw - 2,
                    });

                    if (slot.extra) {
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(6.2);
                        pdf.setTextColor(100, 116, 139);
                        pdf.text(slot.extra, cx + cw / 2, cy + ch / 2 + 3.5, {
                            align: 'center', maxWidth: cw - 2,
                        });
                    }
                } else {
                    pdf.setTextColor(203, 213, 225);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(16);
                    pdf.text('·', cx + cw / 2, cy + ch / 2 + 2, { align: 'center' });
                }
            }
            currentCellX += colW;
        });
    });

    // ── Grid lines ──
    const tableH = THEAD_H + DAYS.length * DATA_ROW_H;
    pdf.setDrawColor(226, 232, 240);      // slate-200
    pdf.setLineWidth(0.2);

    // Outer border
    pdf.rect(M, TABLE_TOP, TABLE_W, tableH, 'S');

    // Vertical dividers
    pdf.setDrawColor(226, 232, 240);
    pdf.line(M + DAY_COL_W, TABLE_TOP, M + DAY_COL_W, TABLE_TOP + tableH);
    let lineX = M + DAY_COL_W;
    columns.forEach(col => {
        lineX += col.type === 'break' ? BREAK_COL_W : PERIOD_COL_W;
        pdf.line(lineX, TABLE_TOP, lineX, TABLE_TOP + tableH);
    });

    // Horizontal dividers
    pdf.setDrawColor(203, 213, 225);
    pdf.line(M, TABLE_TOP + THEAD_H, M + TABLE_W, TABLE_TOP + THEAD_H);
    for (let r = 1; r < DAYS.length; r++) {
        const y = TABLE_TOP + THEAD_H + r * DATA_ROW_H;
        pdf.line(M, y, M + TABLE_W, y);
    }

    // Day column right border (slightly darker)
    pdf.setDrawColor(148, 163, 184);
    pdf.setLineWidth(0.4);
    pdf.line(M + DAY_COL_W, TABLE_TOP, M + DAY_COL_W, TABLE_TOP + tableH);
}

// ─── Export Modal ─────────────────────────────────────────────────────────────
export default function ExportModal({ isOpen, onClose, allSchedules, classes, uniqueTeachers, project }) {
    const DAYS = ALL_DAYS.slice(0, project?.settings?.numberOfDays || 5);
    const PERIODS = Array.from({ length: project?.settings?.periodsPerDay || 7 }, (_, i) => i + 1);
    const breaks = project?.settings?.breaks || [
        { afterPeriod: 2, label: 'Interval' },
        { afterPeriod: 4, label: 'Lunch' },
        { afterPeriod: 6, label: 'Interval' }
    ];
    const [mode, setMode] = useState('class');
    const [selected, setSelected] = useState([]);
    const [generating, setGenerating] = useState(false);

    const items = mode === 'class' ? classes : uniqueTeachers;

    useEffect(() => { setSelected([...items]); }, [mode, isOpen]);

    const toggleItem = item => setSelected(p => p.includes(item) ? p.filter(i => i !== item) : [...p, item]);
    const selectAll = () => setSelected([...items]);
    const deselectAll = () => setSelected([]);

    const handleDownload = useCallback(() => {
        if (selected.length === 0 || generating) return;
        setGenerating(true);

        // Yield to UI for the spinner to render, then generate
        requestAnimationFrame(() => {
            setTimeout(() => {
                try {
                    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

                    selected.forEach((item, i) => {
                        const rows = mode === 'class'
                            ? buildClassRows(allSchedules[item], DAYS)
                            : buildTeacherRows(allSchedules, item, DAYS);
                        const title = mode === 'class' ? `Class ${item} — Timetable` : `${item} — Teaching Schedule`;
                        const subtitle = mode === 'class'
                            ? `Weekly schedule for Class ${item}`
                            : `Periods taught across all classes`;
                        drawTimetablePage(pdf, title, subtitle, rows, i === 0, DAYS, PERIODS, breaks);
                    });

                    const filename = `timetable_${mode}_${selected.join('-')}.pdf`;
                    pdf.save(filename);
                } finally {
                    setGenerating(false);
                }
            }, 20); // tiny delay lets React paint the spinner
        });
    }, [selected, mode, allSchedules, generating]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-[700px] flex flex-col overflow-hidden border border-slate-200"
                    style={{ animation: 'popIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}
                >
                    {/* Header */}
                    <div className="px-8 py-6 pb-5 flex items-start justify-between shrink-0">
                        <div>
                            <h2 className="text-slate-900 font-serif font-bold text-[28px] tracking-tight">Export as PDF</h2>
                            <p className="text-slate-500 text-[15px] mt-1 font-medium">Select everything for exporting</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="px-8 flex flex-col gap-8 overflow-y-auto pb-8">

                        {/* Thin divider */}
                        <div className="h-px w-full bg-slate-100 -mt-2"></div>

                        {/* Mode toggle */}
                        <div className="flex justify-center -mt-2">
                            <div className="flex bg-[#f4f6fb] rounded-xl p-1 shadow-inner w-full max-w-[340px]">
                                {['class', 'teacher'].map(m => (
                                    <button key={m} onClick={() => setMode(m)}
                                        className={`flex-1 py-2.5 rounded-[10px] text-[15px] font-bold transition-all duration-200 ${mode === m ? 'bg-white shadow-sm text-[#0b57d0]' : 'text-slate-400 hover:text-slate-600'}`}>
                                        {m === 'class' ? 'Class-wise' : 'Teacher-wise'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selection */}
                        <div>
                            <div className="flex items-end justify-between mb-4 border-b border-slate-100 pb-2">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    Available {mode === 'class' ? 'Classes' : 'Teachers'}
                                </p>
                                <div className="flex gap-4">
                                    <button onClick={selectAll} className="text-sm font-bold text-[#0b57d0] hover:text-blue-800 transition-colors">Select All</button>
                                    <button onClick={deselectAll} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Deselect All</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto pr-2 pb-1">
                                {items.map(item => {
                                    const on = selected.includes(item);
                                    return (
                                        <button key={item} onClick={() => toggleItem(item)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium text-left transition-all duration-150 border ${on ? 'bg-[#f8faff] border-[#0b57d0] text-slate-800 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                            <div className="shrink-0 flex items-center justify-center">
                                                {on ? (
                                                    <div className="w-[18px] h-[18px] rounded-full border-2 border-[#0b57d0] flex items-center justify-center bg-white">
                                                        <svg className="w-3 h-3 text-[#0b57d0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </div>
                                                ) : (
                                                    <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200 bg-white"></div>
                                                )}
                                            </div>
                                            <span className="truncate">{item}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Info Details Box */}
                        <div className="flex items-start gap-4 bg-[#f8faff] rounded-xl px-6 py-5">
                            <div className="mt-0.5 shrink-0 text-slate-500">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <h4 className="text-slate-600 text-xs font-bold uppercase tracking-widest">Export Preview Details</h4>
                                <p className="text-slate-500 text-[13px] leading-relaxed">
                                    The generated document will be structured in an A4 Landscape format, utilizing vector graphics to ensure crisp readability of the Master Grid when printed at scale.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-slate-100 bg-white flex items-center justify-end gap-3 shrink-0">
                        <button onClick={onClose} disabled={generating}
                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 transition-all disabled:opacity-40">
                            Cancel
                        </button>
                        <button onClick={handleDownload} disabled={selected.length === 0 || generating}
                            className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm ${selected.length > 0 && !generating ? 'bg-[#0b57d0] text-white hover:bg-blue-700 hover:shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}>
                            {generating ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
                            ) : (
                                <>
                                    Download PDF
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.96) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </>
    );
}
