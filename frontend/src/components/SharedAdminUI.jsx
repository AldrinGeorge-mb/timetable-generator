import { useState, memo } from 'react';

export const SectionCard = memo(function SectionCard({ title, badge, children }) {
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

export const Tag = memo(function Tag({ label, onRemove }) {
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

export const IconButton = memo(function IconButton({ onClick, icon, className = '', title = '' }) {
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

export const ClassGroupSelector = memo(function ClassGroupSelector({ availableClasses, selectedClasses, disabledClassesMap = {}, onToggleClass, onToggleGroup }) {
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
                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg transition-all"
                            >
                                <svg 
                                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
                                    className={`transition-transform duration-200 ${expandedGroups[grade] ? 'rotate-90' : ''}`}
                                >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
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
