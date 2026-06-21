import React from 'react';
import { Landmark } from 'lucide-react';

export function IncoreLogo({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="w-10 h-10 bg-gradient-to-tr from-[#0C4196] to-[#2EB9FF] rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <svg viewBox="0 0 24 24" fill="none" className="w-5.5 h-5.5 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                </svg>
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight selection:text-[#0C4196]">
                Incore<span className="text-secondary font-black">Pro</span>
            </span>
        </div>
    );
}

export default IncoreLogo;
