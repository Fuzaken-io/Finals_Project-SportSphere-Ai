import React from 'react';
import LiveScoreWidget from './LiveScoreWidget';
import StatCard from './StatCard';

const RightPanel = () => {
    return (
        <div className="hidden xl:flex flex-col w-[340px] h-full border-l border-[#1e293b] bg-[#0f172a]/50 p-6 gap-6 overflow-y-auto custom-scrollbar">

            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-100">Bento Grid</h3>
                <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                    </svg>
                </button>
            </div>

            <LiveScoreWidget />
            <StatCard />

            {/* Training Graph Placeholder */}
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-5 border border-slate-700/50 shadow-lg flex-1 min-h-[200px] relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Training Load</span>
                </div>
                {/* Mock Graph using CSS Gradients */}
                <div className="w-full h-[120px] flex items-end justify-between px-2 gap-2">
                    <div className="w-full bg-slate-700/30 rounded-t-sm h-[40%] hover:h-[50%] hover:bg-blue-500/50 transition-all duration-300"></div>
                    <div className="w-full bg-slate-700/30 rounded-t-sm h-[60%] hover:h-[70%] hover:bg-blue-500/50 transition-all duration-300"></div>
                    <div className="w-full bg-slate-700/30 rounded-t-sm h-[30%] hover:h-[40%] hover:bg-blue-500/50 transition-all duration-300"></div>
                    <div className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-sm h-[85%] shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
                    <div className="w-full bg-slate-700/30 rounded-t-sm h-[50%] hover:h-[60%] hover:bg-blue-500/50 transition-all duration-300"></div>
                </div>
                <div className="mt-4 text-center">
                    <span className="text-xs text-slate-400">Peak Performance Detected</span>
                </div>
            </div>

        </div>
    );
};

export default RightPanel;
