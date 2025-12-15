import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { sendMessageToOllama } from '../services/ollama';
import { useTheme } from '../context/ThemeContext';

const ChatInterface = ({ conversation, onUpdateMessages }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const scrollContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const abortControllerRef = useRef(null);
    const { theme } = useTheme();
    const messages = conversation?.messages || [];

    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    const scrollToBottom = (smooth = false) => {
        if (!messagesEndRef.current) return;
        messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    };

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            // Strict threshold: consider "at bottom" if within 50px
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            setShouldAutoScroll(isAtBottom);
        }
    };

    // Scroll trigger
    useEffect(() => {
        // If it's a new user message, force scroll
        if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
            setShouldAutoScroll(true);
            scrollToBottom(true);
        }
        // If streaming and auto-scroll is enabled, keep scrolling
        else if (shouldAutoScroll) {
            scrollToBottom(false); // Instant scroll to prevent lag
        }
    }, [messages, isLoading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        const newFiles = [];

        for (const file of files) {
            try {
                const text = await file.text();
                newFiles.push({
                    name: file.name,
                    content: text,
                    size: file.size,
                });
            } catch (error) {
                console.error('Error reading file:', error);
                alert(`Failed to read ${file.name}`);
            }
        }

        setAttachedFiles([...attachedFiles, ...newFiles]);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index) => {
        setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
    };

    const handleSend = async (e) => {
        e?.preventDefault();

        if ((!input.trim() && attachedFiles.length === 0) || isLoading || !conversation) return;

        // Prepare message content
        let messageContent = input.trim();

        // Add file context if files are attached
        if (attachedFiles.length > 0) {
            const filesContext = attachedFiles.map(file =>
                `\n\n---FILE: ${file.name}---\n${file.content}\n---END FILE---`
            ).join('\n');
            messageContent = messageContent + filesContext;
        }

        const userMessage = { role: 'user', content: messageContent };
        // We do NOT add the assistant message yet to the backend call, only for UI display
        const textExchangedMessages = [...messages, userMessage];

        // Prepare placeholder for streaming
        const assistantPlaceholder = { role: 'assistant', content: '' };
        const messagesForUI = [...textExchangedMessages, assistantPlaceholder];

        // Update conversation immediately with placeholder
        onUpdateMessages(conversation.id, messagesForUI);

        setInput('');
        setAttachedFiles([]);

        // Reset textarea height
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        setIsLoading(true);

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();

        let accumulatedContent = "";

        try {
            await sendMessageToOllama(
                textExchangedMessages, // Send history + new user msg
                conversation.id,
                (chunk) => {
                    accumulatedContent += chunk;
                    // Update UI with growing content
                    const streamliningMsgs = [
                        ...textExchangedMessages,
                        { role: 'assistant', content: accumulatedContent }
                    ];
                    onUpdateMessages(conversation.id, streamliningMsgs);
                },
                abortControllerRef.current.signal
            );
            // Final update is handled by the last chunk, essentially. 
            // The sendMessageToOllama returns full string but we are updating incrementally.
            // We can do one final ensure:
            const finalMsgs = [
                ...textExchangedMessages,
                { role: 'assistant', content: accumulatedContent }
            ];
            onUpdateMessages(conversation.id, finalMsgs);

        } catch (error) {
            if (error.message === 'cancelled') {
                console.log('Generation cancelled by user');
            } else {
                const errorMessage = {
                    role: 'assistant',
                    content: "Sorry, I couldn't reach the server. Is Ollama running?",
                };
                // Replace the placeholder with error
                onUpdateMessages(conversation.id, [...textExchangedMessages, errorMessage]);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestionClick = (suggestionText) => {
        setInput(suggestionText);
        // Wait a bit for state to update, then send
        setTimeout(() => {
            handleSend();
        }, 50);
    };

    return (
        <div className="flex flex-col h-full w-full relative">

            {/* Messages Stream */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto w-full"
            >
                <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 relative z-10">
                            {/* Glow Effect Background */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>

                            {/* Logo */}
                            {/* Logo */}
                            <div className="mb-6 relative group">
                                <div className="absolute inset-0 bg-orange-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                                <img
                                    src="/logo-light.png"
                                    alt="SportSphere Logo"
                                    className="w-24 h-24 relative z-10 drop-shadow-2xl hover:scale-105 transition-transform duration-300 object-cover rounded-full"
                                />
                            </div>

                            {/* Title */}
                            <div>
                                <p className={`text-sm mb-4 font-medium tracking-wide uppercase ${theme === 'dark' ? 'text-blue-400' : 'text-slate-500'}`}>
                                    Hello! I'm here to help you with detailed sports analysis.
                                </p>
                                <h2 className={`text-4xl font-extrabold mb-2 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'
                                    }`}>SportSphere AI</h2>
                                <h3 className={`text-xl font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Sports Analysis and Predictions
                                </h3>
                            </div>

                            {/* Suggestion Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full mt-12 px-4">
                                <button onClick={() => { setInput("Analyze the shooting percentages of key players in the upcoming game."); setTimeout(() => handleSend(), 100); }} className={`p-5 rounded-2xl text-left transition-all border group relative overflow-hidden ${theme === 'dark'
                                    ? 'bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-200'
                                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-500/50 shadow-sm text-slate-700'
                                    }`}>
                                    <p className="text-sm font-medium leading-relaxed relative z-10">
                                        Analyze the shooting percentages of key players.
                                    </p>
                                </button>
                                <button onClick={() => { setInput("Evaluate the impact of recent injuries on the team's performance."); setTimeout(() => handleSend(), 100); }} className={`p-5 rounded-2xl text-left transition-all border group relative overflow-hidden ${theme === 'dark'
                                    ? 'bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-200'
                                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-500/50 shadow-sm text-slate-700'
                                    }`}>
                                    <p className="text-sm font-medium leading-relaxed relative z-10">
                                        Evaluate the impact of recent injuries on the team.
                                    </p>
                                </button>
                                <button onClick={() => { setInput("Compare the recent performance trends of both teams."); setTimeout(() => handleSend(), 100); }} className={`p-5 rounded-2xl text-left transition-all border group relative overflow-hidden ${theme === 'dark'
                                    ? 'bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-200'
                                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-500/50 shadow-sm text-slate-700'
                                    }`}>
                                    <p className="text-sm font-medium leading-relaxed relative z-10">
                                        Compare the recent performance trends of both teams.
                                    </p>
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <MessageBubble key={index} message={msg} />
                        ))
                    )}

                    {/* Loading indicator removed as it's now inside the MessageBubble */}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            {/* Input Area */}
            <div className="flex-none p-4 w-full bg-transparent">
                <div className="max-w-3xl mx-auto">
                    {/* Attached Files Preview */}
                    {attachedFiles.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                            {attachedFiles.map((file, index) => (
                                <div key={index} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${theme === 'dark'
                                    ? 'bg-slate-700 text-slate-200'
                                    : 'bg-gray-200 text-gray-700'
                                    }`}>
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="hover:text-red-500"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={`relative flex items-end w-full p-2 rounded-3xl overflow-hidden transition-all border ${theme === 'dark'
                        ? 'bg-[#1e293b]/60 backdrop-blur-xl border-white/10 shadow-2xl'
                        : 'bg-white border-gray-300 shadow-sm'
                        }`}>

                        {/* File Input (Hidden) */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".txt,.md,.json,.xml,.csv,.log"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* Attachment Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-2.5 ml-1 rounded-full transition-all flex-shrink-0 ${theme === 'dark'
                                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-gray-200'
                                }`}
                            title="Attach file"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                            </svg>
                        </button>

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Message SportSphere..."
                            disabled={!conversation}
                            className={`w-full max-h-[200px] py-2.5 px-3 bg-transparent border-none focus:ring-0 focus:outline-none resize-none custom-scrollbar leading-6 ${theme === 'dark'
                                ? 'text-slate-100 placeholder:text-slate-500'
                                : 'text-slate-800 placeholder:text-slate-500'
                                }`}
                            rows={1}
                        />

                        {/* Send or Cancel Button */}
                        {isLoading ? (
                            <button
                                onClick={handleCancel}
                                className={`p-2 m-1 rounded-full transition-all flex-shrink-0 ${theme === 'dark'
                                    ? 'bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600'
                                    : 'bg-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-300'
                                    }`}
                                title="Stop generating"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm9-3.75a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75z" clipRule="evenodd" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={(!input.trim() && attachedFiles.length === 0) || !conversation}
                                className={`p-2 m-1 rounded-full transition-all flex-shrink-0 ${(input.trim() || attachedFiles.length > 0) && conversation
                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md'
                                    : 'bg-[#e5e5e5] text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="text-center mt-2">
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            SportSphere can make mistakes. Consider checking important information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;


