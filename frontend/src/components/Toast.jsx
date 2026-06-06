import { useEffect, useState } from 'react';

/**
 * Toast — fixed bottom-right notification that auto-dismisses.
 * type: 'success' | 'error' | 'warning' | 'info'
 */
export default function Toast({ message, type = 'info', onClose }) {
    useEffect(() => {
        if (!message) return;
        const t = setTimeout(onClose, 4500);
        return () => clearTimeout(t);
    }, [message, onClose]);

    if (!message) return null;

    const styles = {
        error:   'bg-rose-500/90 border-rose-400 shadow-rose-500/20 text-white',
        success: 'bg-emerald-500/90 border-emerald-400 shadow-emerald-500/20 text-white',
        warning: 'bg-amber-500/90 border-amber-400 shadow-amber-500/20 text-white',
        info:    'bg-brand-600/90 border-brand-500 shadow-brand-500/20 text-white',
    };

    const icons = {
        error:   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
        success: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
        warning: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
        info:    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    };

    return (
        <div
            className={`fixed bottom-8 right-8 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl border shadow-xl backdrop-blur-md max-w-sm animate-slide-in ${styles[type]}`}
            style={{ animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
            <div className="shrink-0 bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-inner text-white">
                {icons[type]}
            </div>
            <div className="flex-1 mr-2">
                <p className="font-bold text-[15px] leading-tight drop-shadow-sm">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="shrink-0 opacity-60 hover:opacity-100 hover:bg-white/20 p-1.5 rounded-lg transition-all"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-white/40 rounded-b-2xl shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{
                width: '100%',
                animation: 'shrink 4.5s linear forwards'
            }} />

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(30px) scale(0.9); filter: blur(4px); }
                    to   { opacity: 1; transform: translateY(0)    scale(1); filter: blur(0); }
                }
                @keyframes shrink {
                    from { width: 100%; }
                    to   { width: 0%; }
                }
            `}</style>
        </div>
    );
}
