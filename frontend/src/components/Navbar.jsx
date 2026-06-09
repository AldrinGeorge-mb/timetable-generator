import React from 'react';

export default function Navbar({
    handleProjectExit,
    activeTab,
    handleTabSwitch,
    adminTab,
    handleRegenerate
}) {
    return (
        <header className="h-20 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-8 shrink-0">
            <button
                onClick={handleProjectExit}
                className="group flex items-center gap-3.5 w-auto px-4 py-2 -ml-4 rounded-2xl hover:bg-slate-50/80 transition-all duration-300"
            >
                <div className="w-10 h-10 bg-blue-50 text-[#0b57d0] border border-blue-100 flex items-center justify-center rounded-[14px] group-hover:bg-[#0b57d0] group-hover:text-white group-hover:border-[#0b57d0] transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 shadow-sm group-hover:shadow-[0_8px_16px_-6px_rgba(11,87,208,0.4)]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                        <path d="M8 14h.01"></path>
                        <path d="M12 14h.01"></path>
                        <path d="M16 14h.01"></path>
                    </svg>
                </div>
                <span className="font-serif text-[26px] font-black tracking-tight text-slate-800 group-hover:text-[#0b57d0] transition-colors mt-0.5">Schedulify</span>
            </button>

            <nav className="flex items-center gap-10 h-full">
                <button
                    onClick={() => handleTabSwitch('grid')}
                    className={`h-full flex items-center gap-2 border-b-2 font-label-md tracking-widest uppercase transition-all px-2 mt-[2px] ${activeTab === 'grid' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">calendar_view_week</span>
                    Timetable
                </button>
                <button
                    onClick={() => handleTabSwitch('admin', 'classes')}
                    className={`h-full flex items-center gap-2 border-b-2 font-label-md tracking-widest uppercase transition-all px-2 mt-[2px] ${activeTab === 'admin' && adminTab === 'classes' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                    Classes
                </button>
                <button
                    onClick={() => handleTabSwitch('admin', 'subjects')}
                    className={`h-full flex items-center gap-2 border-b-2 font-label-md tracking-widest uppercase transition-all px-2 mt-[2px] ${activeTab === 'admin' && adminTab === 'subjects' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                    Courses
                </button>
                <button
                    onClick={() => handleTabSwitch('admin', 'teachers')}
                    className={`h-full flex items-center gap-2 border-b-2 font-label-md tracking-widest uppercase transition-all px-2 mt-[2px] ${activeTab === 'admin' && adminTab === 'teachers' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    Teachers
                </button>
            </nav>

            <div className="flex items-center gap-6 w-90 justify-end">
                <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container/60 backdrop-blur-md border border-outline-variant/30 text-primary font-label-md hover:bg-primary hover:text-on-primary hover:shadow-md transition-all btn-interactive"
                >
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    Generate Time Table                </button>
            </div>
        </header>
    );
}
