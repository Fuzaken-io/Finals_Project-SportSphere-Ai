import React from 'react';

const StatCard = () => {
    return (
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-5 border border-slate-700/50 shadow-lg relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Player Focus</span>
                <span className="text-xs text-green-400 font-mono">▲ 4.2%</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-3xl">
                    👑
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg leading-tight">LeBron James</h3>
                    <p className="text-xs text-slate-400">Small Forward • LAL</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-slate-900/50 p-2 rounded-lg text-center border border-slate-700/30">
                    <div className="text-[10px] text-slate-500 uppercase">PTS</div>
                    <div className="text-lg font-bold text-slate-200">32</div>
                </div>
                <div className="bg-slate-900/50 p-2 rounded-lg text-center border border-slate-700/30">
                    <div className="text-[10px] text-slate-500 uppercase">REB</div>
                    <div className="text-lg font-bold text-slate-200">8</div>
                </div>
                <div className="bg-slate-900/50 p-2 rounded-lg text-center border border-slate-700/30">
                    <div className="text-[10px] text-slate-500 uppercase">AST</div>
                    <div className="text-lg font-bold text-slate-200">9</div>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
