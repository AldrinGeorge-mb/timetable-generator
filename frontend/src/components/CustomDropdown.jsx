import React, { useState, useEffect, useRef } from 'react';

const CustomDropdown = ({ options, value, onChange, placeholder, icon, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-4 bg-surface hover:bg-surface-dim backdrop-blur-md border ${isOpen ? 'border-primary shadow-md' : 'border-outline-variant/40 shadow-sm'} rounded-xl px-5 py-2.5 min-w-[200px] transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-primary/30`}
            >
                <div className="flex items-center gap-2.5">
                    {icon && <span className="material-symbols-outlined text-[20px] text-primary/80 group-hover:text-primary transition-colors">{icon}</span>}
                    <span className="font-label-md text-[15px] text-on-surface font-semibold tracking-wide">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <div className={`flex items-center justify-center w-6 h-6 rounded-full ${isOpen ? 'bg-primary/10' : 'bg-surface-container'} transition-colors duration-300`}>
                    <span className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`}>
                        expand_more
                    </span>
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[200px] bg-surface/95 backdrop-blur-xl border border-outline-variant/30 rounded-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] z-[100] overflow-hidden transform origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-outline-variant/30 scrollbar-track-transparent p-1.5 flex flex-col gap-0.5">
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left font-label-md text-[14px] transition-all duration-200 group/item ${
                                    value === opt.value
                                        ? 'bg-primary/10 text-primary font-bold'
                                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface hover:translate-x-0.5'
                                }`}
                            >
                                <span>{opt.label}</span>
                                {value === opt.value && (
                                    <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
