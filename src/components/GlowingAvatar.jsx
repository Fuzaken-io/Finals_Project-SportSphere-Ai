import React from 'react';

const GlowingAvatar = () => {
    return (
        <div className="relative flex items-center justify-center w-48 h-48 mb-6">
            {/* Outer Glows */}
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-[60px] opacity-40 animate-pulse"></div>
            <div className="absolute inset-0 bg-purple-500 rounded-full blur-[40px] opacity-30 animate-pulse delay-75"></div>

            {/* The Orb Ring */}
            <div className="relative w-32 h-32 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.6)]">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden relative">
                    {/* Inner fluid effect */}
                    <div className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#3b82f6_100%)] animate-[spin_4s_linear_infinite] opacity-50"></div>

                    {/* Core */}
                    <div className="absolute inset-[2px] rounded-full bg-slate-900 z-10 flex items-center justify-center">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-full blur-sm"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlowingAvatar;
