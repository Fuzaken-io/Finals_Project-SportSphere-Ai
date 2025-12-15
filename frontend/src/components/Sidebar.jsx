import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({
    isMobileOpen,
    toggleMobile,
    isDesktopOpen,
    toggleDesktop,
    conversations,
    currentConversationId,
    onNewChat,
    onLoadConversation,
    onRename,
    onTogglePin,
    onDelete,
    onShare
}) => {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const dropdownRef = useRef(null);
    const editInputRef = useRef(null);
    const { theme, toggleTheme } = useTheme();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
            // Add logic to save if clicking outside input while editing, or just cancel?
            // User requested persistence, so saving on blur is good UX.
            if (editingId && editInputRef.current && !editInputRef.current.contains(event.target)) {
                confirmRename();
            }
        };

        const handleScroll = () => {
            if (activeDropdown) setActiveDropdown(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [activeDropdown, editingId, editTitle]); // Add editingId dependency for click outside

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingId]);

    const toggleDropdown = (e, id) => {
        e.preventDefault();
        e.stopPropagation();

        if (activeDropdown === id) {
            setActiveDropdown(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 5,
                left: rect.left
            });
            setActiveDropdown(id);
        }
    };

    const handleRename = (conv) => {
        setEditingId(conv.id);
        setEditTitle(conv.title);
        setActiveDropdown(null);
    };

    const confirmRename = () => {
        if (editingId) {
            if (editTitle.trim() && editTitle !== conversations.find(c => c.id === editingId)?.title) {
                onRename(editingId, editTitle.trim());
            }
            setEditingId(null);
            setEditTitle('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            confirmRename();
        } else if (e.key === 'Escape') {
            setEditingId(null);
            setEditTitle('');
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this conversation?')) {
            onDelete(id);
            setActiveDropdown(null);
        }
    };

    // Sort conversations: pinned first, then by date
    const sortedConversations = [...conversations].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    return (
        <>
            {/* Backdrop for mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={toggleMobile}
                />
            )}

            <div
                className={`fixed md:relative z-30 h-full border-r transition-all duration-300 ease-in-out flex flex-col
                    ${theme === 'dark'
                        ? 'bg-[#0f172a]/80 backdrop-blur-xl border-white/5'
                        : 'bg-white border-gray-200'
                    }
                    ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
                    ${isDesktopOpen ? 'md:translate-x-0 md:w-64' : 'md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden md:border-none'}
                `}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo-light.png"
                            alt="SportSphere"
                            className="w-8 h-8 rounded-lg shadow-sm object-cover"
                        />
                        <span className={`font-semibold text-lg tracking-tight whitespace-nowrap ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                            }`}>SportSphere</span>
                    </div>

                    {/* Theme + Close Buttons */}
                    <div className="flex items-center gap-1">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-1.5 rounded-lg transition-colors ${theme === 'dark'
                                ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                                }`}
                            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {theme === 'dark' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                </svg>
                            )}
                        </button>

                        {/* Close Sidebar Button (Desktop) */}
                        <button
                            onClick={toggleDesktop}
                            className={`p-1.5 rounded-lg hidden md:flex transition-colors ${theme === 'dark'
                                ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                                }`}
                            title="Close Sidebar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>

                        {/* Close Sidebar Button (Mobile) */}
                        <button
                            onClick={toggleMobile}
                            className={`p-1.5 rounded-lg md:hidden transition-colors ${theme === 'dark'
                                ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* New Chat Button */}
                <div className="px-3 mb-4 whitespace-nowrap">
                    <button
                        onClick={onNewChat}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all shadow-sm group ${theme === 'dark'
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            : 'bg-white hover:bg-gray-50 text-slate-700 border border-slate-700'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className="text-sm font-medium">New chat</span>
                    </button>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
                    <div className={`text-xs font-medium mb-3 px-3 whitespace-nowrap ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}>Recent</div>
                    <div className="space-y-1">
                        {sortedConversations.map((conv) => (
                            <div key={conv.id} className="relative group">
                                {editingId === conv.id ? (
                                    <div className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 ${theme === 'dark'
                                        ? 'bg-slate-800'
                                        : 'bg-gray-200'
                                        }`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={theme === 'dark' ? 'white' : 'black'} className="w-4 h-4 shrink-0">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.605-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                        </svg>
                                        <input
                                            ref={editInputRef}
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="w-full bg-transparent border-none outline-none text-sm p-0 m-0"
                                            style={{ color: theme === 'dark' ? 'white' : 'black' }}
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onLoadConversation(conv.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm flex items-center justify-between group-hover:pr-8 ${currentConversationId === conv.id
                                            ? theme === 'dark'
                                                ? 'bg-slate-800 text-slate-100'
                                                : 'bg-gray-200 text-slate-900'
                                            : theme === 'dark'
                                                ? 'hover:bg-slate-800/60 text-slate-300 hover:text-slate-100'
                                                : 'hover:bg-gray-200/60 text-slate-700 hover:text-slate-900'
                                            }`}
                                    >
                                        <span className="truncate block flex items-center gap-2">
                                            {conv.pinned && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                                                    <path d="M9.768 8.243l3.78-3.78a.75.75 0 1 1 1.061 1.061l-3.78 3.78 1.124 2.592a.75.75 0 0 1-.306.924l-.001.001a.75.75 0 0 1-.924-.306L8.29 9.293 5.207 12.38a.75.75 0 0 1-1.06 0l-.001-.001a.75.75 0 0 1 0-1.06l3.086-3.086-3.233-2.433a.75.75 0 0 1-.306-.925l.001-.001a.75.75 0 0 1 .924-.306l2.592 1.124 3.78-3.78a.75.75 0 0 1 1.061 1.061l-3.78 3.78 1.124 2.592a.75.75 0 0 1-.306.924l-.001.001a.75.75 0 0 1-.924-.306L9.768 8.243z" />
                                                </svg>
                                            )}
                                            {conv.title}
                                        </span>
                                    </button>
                                )}

                                {/* 3-Dots Menu Button */}
                                {!editingId && (
                                    <div className={`absolute right-1 top-1/2 -translate-y-1/2 ${activeDropdown === conv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                        <button
                                            onClick={(e) => toggleDropdown(e, conv.id)}
                                            className={`p-1 rounded transition-colors ${activeDropdown === conv.id
                                                ? theme === 'dark' ? 'bg-slate-700' : 'bg-gray-300'
                                                : theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-300'
                                                } ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dropdown Menu */}
                {activeDropdown && (
                    <div
                        ref={dropdownRef}
                        className="fixed z-50 w-40 bg-[#2d2d2d] rounded-xl shadow-2xl border border-white/10 p-1.5 flex flex-col gap-0.5 animate-fade-in-up origin-top-left"
                        style={{ top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px` }}
                    >
                        <button
                            onClick={() => {
                                const conv = conversations.find(c => c.id === activeDropdown);
                                if (conv) handleRename(conv);
                            }}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 rounded-md transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                            Rename
                        </button>
                        <button
                            onClick={() => {
                                onTogglePin(activeDropdown);
                                setActiveDropdown(null);
                            }}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 rounded-md transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                            </svg>
                            {conversations.find(c => c.id === activeDropdown)?.pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                            onClick={() => {
                                onShare(activeDropdown);
                                setActiveDropdown(null);
                            }}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 rounded-md transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                            </svg>
                            Share
                        </button>
                        <div className="h-px bg-white/10 my-0.5"></div>
                        <button
                            onClick={() => handleDelete(activeDropdown)}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-left text-xs text-red-400 hover:bg-white/10 rounded-md transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Delete
                        </button>
                    </div>
                )}


                {/* Footer */}
                <div className={`p-3 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-700'
                    }`}>
                    <div className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors whitespace-nowrap overflow-hidden ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
                        }`}>
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 flex-shrink-0">
                            LM
                        </div>
                        <div className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                            }`}>
                            Lester
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;


