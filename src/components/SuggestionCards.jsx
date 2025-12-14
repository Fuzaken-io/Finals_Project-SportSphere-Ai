import React from 'react';

const suggestions = [
    { icon: '🏀', text: 'Analyze LeBron\'s legacy vs MJ', query: 'Analyze LeBron vs MJ' },
    { icon: '🥊', text: 'Explain the "Peek-a-Boo" style', query: 'Explain Mike Tyson peek-a-boo style' },
    { icon: '🏋️', text: 'Give me a vertical jump workout', query: 'Give me a vertical jump training plan' },
];

const SuggestionCards = ({ onSelect }) => {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4 w-full justify-center max-w-2xl px-4">
            {suggestions.map((item, index) => (
                <button
                    key={index}
                    onClick={() => onSelect(item.query)}
                    className="flex flex-col items-start justify-between min-w-[160px] h-[140px] p-4 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-500 rounded-2xl backdrop-blur-md transition-all duration-300 text-left group"
                >
                    <div className="text-2xl group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                    <span className="text-sm text-slate-300 font-medium leading-tight">
                        {item.text}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default SuggestionCards;
