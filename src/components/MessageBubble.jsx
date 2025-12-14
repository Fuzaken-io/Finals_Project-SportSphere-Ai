import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../context/ThemeContext';

const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    const { theme } = useTheme();

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in-up`}>
            <div
                className={`max-w-[85%] md:max-w-[75%] px-5 py-3.5 shadow-sm text-[15px] leading-relaxed break-words break-all ${isUser
                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                        : theme === 'dark'
                            ? 'bg-slate-700 text-slate-100 rounded-2xl rounded-bl-sm'
                            : 'bg-[#e5e7eb] text-gray-900 rounded-2xl rounded-bl-sm'
                    }`}
            >
                <div>
                    {isUser ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                strong: ({ node, ...props }) => <strong className={`font-semibold ${theme === 'dark' ? 'text-slate-50' : 'text-gray-950'}`} {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc ml-5 mb-3 space-y-1.5" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal ml-5 mb-3 space-y-1.5" {...props} />,
                                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                h1: ({ node, ...props }) => <h1 className={`text-xl font-bold mb-3 mt-5 ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`} {...props} />,
                                h2: ({ node, ...props }) => <h2 className={`text-lg font-bold mb-3 mt-4 ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`} {...props} />,
                                h3: ({ node, ...props }) => <h3 className={`text-md font-bold mb-2 mt-3 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`} {...props} />,
                                blockquote: ({ node, ...props }) => <blockquote className={`border-l-4 border-blue-500 pl-4 py-1 my-3 rounded-r ${theme === 'dark' ? 'text-slate-300 bg-slate-800' : 'text-gray-700 bg-gray-50/50'
                                    }`} {...props} />,
                                hr: ({ node, ...props }) => <hr className={`my-4 border-t ${theme === 'dark' ? 'border-slate-600' : 'border-gray-300'
                                    }`} {...props} />,
                                code: ({ node, inline, className, children, ...props }) => {
                                    return inline ? (
                                        <code className={`px-1.5 py-0.5 rounded text-[13px] font-mono text-pink-600 ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-200/60'
                                            }`} {...props}>
                                            {children}
                                        </code>
                                    ) : (
                                        <div className="bg-[#1e293b] rounded-xl p-4 my-3 overflow-x-auto text-slate-200 shadow-sm">
                                            <code className="text-xs sm:text-sm font-mono block" {...props}>
                                                {children}
                                            </code>
                                        </div>
                                    )
                                }
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
