import React from 'react';

export default function ConfirmModal({ 
    isOpen, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = "Confirm", 
    confirmColor = "bg-red-600 hover:bg-red-700 text-white",
    onSecondary,
    secondaryText
}) {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/30 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300">
            <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] w-full max-w-md p-8 transform transition-all scale-100">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-2xl shadow-inner border ${confirmColor.includes('red') ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-amber-50 border-amber-100 text-amber-500'}`}>
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="font-black text-2xl text-slate-800 tracking-tight">{title}</h3>
                </div>
                
                <p className="text-slate-600 text-[15px] mb-8 font-medium leading-relaxed">{message}</p>
                
                <div className="flex gap-4 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 bg-white border border-slate-200/60 text-slate-600 text-sm font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    {onSecondary && secondaryText && (
                        <button
                            onClick={onSecondary}
                            className="px-6 py-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold rounded-2xl hover:bg-rose-100 transition-all shadow-sm"
                        >
                            {secondaryText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-3 text-sm font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${confirmColor}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
