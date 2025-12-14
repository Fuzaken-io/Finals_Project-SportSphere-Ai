import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { sendMessageToOllama } from '../services/ollama';
import { useTheme } from '../context/ThemeContext';

const ChatInterface = ({ conversation, onUpdateMessages }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const abortControllerRef = useRef(null);
    const { theme } = useTheme();

    const messages = conversation?.messages || [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
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
        const updatedMessages = [...messages, userMessage];

        // Update conversation immediately
        onUpdateMessages(conversation.id, updatedMessages);

        setInput('');
        setAttachedFiles([]);

        // Reset textarea height
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        setIsLoading(true);

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();

        try {
            const responseMessage = await sendMessageToOllama(
                updatedMessages,
                abortControllerRef.current.signal
            );
            onUpdateMessages(conversation.id, [...updatedMessages, responseMessage]);
        } catch (error) {
            if (error.message === 'cancelled') {
                // User cancelled - don't show error
                console.log('Generation cancelled by user');
            } else {
                const errorMessage = {
                    role: 'assistant',
                    content: "Sorry, I couldn't reach the server. Is Ollama running?",
                };
                onUpdateMessages(conversation.id, [...updatedMessages, errorMessage]);
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
            <div className="flex-1 overflow-y-auto w-full">
                <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
                            {/* Logo */}
                            <div className="w-20 h-20 rounded-full shadow-lg flex items-center justify-center mb-2 bg-gradient-to-br from-orange-500 to-orange-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-11 h-11">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                                </svg>
                            </div>

                            {/* Title */}
                            <div>
                                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Hello! I'm here to help you with detailed sports analysis and predictions.
                                </p>
                                <h2 className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                                    }`}>SportSphere AI</h2>
                                <p className={`text-lg ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                                    Sports Analysis and Predictions
                                </p>
                            </div>

                            {/* Suggestion Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full mt-8 px-4">
                                <button onClick={() => { setInput("Analyze the shooting percentages of key players in the upcoming game."); setTimeout(() => handleSend(), 100); }} className={`p-4 rounded-xl text-left transition-all border ${theme === 'dark'
                                    ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-orange-500/50'
                                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-orange-500/50 shadow-sm'
                                    }`}>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                        Analyze the shooting percentages of key players in the upcoming game.
                                    </p>
                                </button>
                                <button onClick={() => { setInput("Analyze the shooting percentages of key players in the upcoming game."); setTimeout(() => handleSend(), 100); }} className={`p-4 rounded-xl text-left transition-all border ${theme === 'dark'
                                    ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-orange-500/50'
                                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-orange-500/50 shadow-sm'
                                    }`}>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                        Evaluate the impact of recent injuries on the team's performance.
                                    </p>
                                </button>
                                <button onClick={() => { setInput("Analyze the shooting percentages of key players in the upcoming game."); setTimeout(() => handleSend(), 100); }} className={`p-4 rounded-xl text-left transition-all border ${theme === 'dark'
                                    ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-orange-500/50'
                                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-orange-500/50 shadow-sm'
                                    }`}>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
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

                    {isLoading && (
                        <div className="flex justify-start w-full">
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-none ${theme === 'dark' ? 'bg-slate-700' : 'bg-[#e5e7eb]'
                                }`}>
                                <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-slate-300' : 'bg-slate-400'
                                    }`}></div>
                                <div className={`w-2 h-2 rounded-full animate-bounce delay-75 ${theme === 'dark' ? 'bg-slate-300' : 'bg-slate-400'
                                    }`}></div>
                                <div className={`w-2 h-2 rounded-full animate-bounce delay-150 ${theme === 'dark' ? 'bg-slate-300' : 'bg-slate-400'
                                    }`}></div>
                            </div>
                        </div>
                    )}
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
                        ? 'bg-slate-800 border-slate-700'
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
                                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md'
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


