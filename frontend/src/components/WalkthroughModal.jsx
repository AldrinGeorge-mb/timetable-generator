import React, { useState } from 'react';

export default function WalkthroughModal({ isOpen, isAutoPopup, onClose }) {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    if (!isOpen) return null;

    const handleClose = () => {
        if (isAutoPopup && dontShowAgain) {
            localStorage.setItem('schedulify_hide_walkthrough', 'true');
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/30 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300">
            <div className="bg-white/90 backdrop-blur-2xl border border-white rounded-[32px] shadow-[0_20px_80px_rgba(0,0,0,0.15)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl shadow-inner border bg-indigo-50 border-indigo-100 text-[#0b57d0]">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-black text-2xl text-slate-800 tracking-tight">Welcome to Schedulify</h3>
                            <p className="text-slate-500 text-sm font-medium">Your quick guide to creating the perfect timetable.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="space-y-8">
                        
                        {/* Step 1 */}
                        <div className="flex gap-5 group">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0b57d0] border border-blue-100 flex items-center justify-center font-bold shadow-sm group-hover:bg-[#0b57d0] group-hover:text-white transition-all duration-300">1</div>
                                <div className="w-px h-full bg-slate-100 my-2 group-hover:bg-blue-100 transition-colors"></div>
                            </div>
                            <div className="pb-4">
                                <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[20px] text-[#0b57d0]">meeting_room</span>
                                    Add Your Classes
                                </h4>
                                <p className="text-slate-600 text-[15px] leading-relaxed">
                                    Start by navigating to the <strong>Classes</strong> tab. Here, you can define all the classes (e.g., Grade 10A, Grade 10B) that need a schedule.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-5 group">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">2</div>
                                <div className="w-px h-full bg-slate-100 my-2 group-hover:bg-emerald-100 transition-colors"></div>
                            </div>
                            <div className="pb-4">
                                <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[20px] text-emerald-600">menu_book</span>
                                    Define Subjects
                                </h4>
                                <p className="text-slate-600 text-[15px] leading-relaxed">
                                    Next, go to the <strong>Courses</strong> tab to add the subjects taught in your school. For each subject, you can specify if it requires consecutive periods (like Science Labs).
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-5 group">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">3</div>
                                <div className="w-px h-full bg-slate-100 my-2 group-hover:bg-amber-100 transition-colors"></div>
                            </div>
                            <div className="pb-4">
                                <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[20px] text-amber-600">person</span>
                                    Assign Teachers
                                </h4>
                                <p className="text-slate-600 text-[15px] leading-relaxed">
                                    Head over to the <strong>Teachers</strong> tab. Add your teachers and assign them their subjects and classes. You can also specify their working limits to prevent over-scheduling!
                                </p>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-5 group">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">4</div>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[20px] text-purple-600">auto_awesome</span>
                                    Generate Timetable
                                </h4>
                                <p className="text-slate-600 text-[15px] leading-relaxed">
                                    Once your data is ready, click the <strong>Generate Time Table</strong> button in the top right corner. Our AI will crunch the numbers and build a conflict-free master schedule instantly.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className={`px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center ${isAutoPopup ? 'justify-between' : 'justify-end'} shrink-0`}>
                    {isAutoPopup && (
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input 
                                    type="checkbox" 
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-[#0b57d0] checked:border-[#0b57d0] transition-all cursor-pointer"
                                />
                                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
                                    <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors select-none">
                                Don't show this again
                            </span>
                        </label>
                    )}
                    <button
                        onClick={handleClose}
                        className="px-8 py-3 bg-[#0b57d0] text-white text-sm font-bold rounded-2xl transition-all shadow-[0_8px_16px_-6px_rgba(11,87,208,0.4)] hover:shadow-[0_12px_20px_-6px_rgba(11,87,208,0.5)] hover:-translate-y-0.5"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}
