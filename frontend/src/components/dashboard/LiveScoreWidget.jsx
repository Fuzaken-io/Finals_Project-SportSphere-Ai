import React from 'react';

const LiveScoreWidget = () => {
    return (
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-5 border border-slate-700/50 shadow-lg relative overflow-hidden group">

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Game</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 rounded-full border border-red-500/30">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-red-400">Q4 2:30</span>
                </div>
            </div>

            {/* Teams */}
            <div className="flex justify-between items-center mb-6">
                <div className="text-center">
                    {/* Team Logo Placeholder */}
                    <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center text-xl border border-purple-500/30 mb-2">
                        🟣
                    </div>
                    <div className="font-bold text-slate-200">LAL</div>
                </div>

                <div className="text-3xl font-bold text-white tracking-widest font-mono">
                    108 <span className="text-slate-600 text-xl mx-1">-</span> 102
                </div>

                <div className="text-center">
                    {/* Team Logo Placeholder */}
                    <div className="w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center text-xl border border-blue-500/30 mb-2">
                        🔵
                    </div>
                    <div className="font-bold text-slate-200">GSW</div>
                </div>
            </div>

            {/* Progress Bar (Momentum) */}
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-[60%] bg-gradient-to-r from-purple-500 to-blue-500"></div>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 text-center">
                Lakers possession • Lebron at the line
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        </div>
    );
};

export default LiveScoreWidget;
