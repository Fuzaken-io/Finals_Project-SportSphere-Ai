import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './context/ThemeContext';
import { generateConversationTitle } from './services/titleGenerator';

function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const { theme } = useTheme();

  // Conversation management
  const [conversations, setConversations] = useLocalStorage('dribol-conversations', []);
  const [currentConversationId, setCurrentConversationId] = useLocalStorage('dribol-current-conversation', null);

  // Draft conversation (not yet saved to sidebar)
  const [draftConversation, setDraftConversation] = useState(null);

  // Initialize with empty draft if no conversations exist
  useEffect(() => {
    if (conversations.length === 0 && !draftConversation && !currentConversationId) {
      createNewChat();
    }
  }, [conversations.length, draftConversation, currentConversationId]);

  // Get current conversation (from saved or draft)
  const currentConversation = draftConversation || conversations.find(c => c.id === currentConversationId) || null;

  // Create new chat (draft mode - doesn't appear in sidebar yet)
  const createNewChat = () => {
    const newDraft = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
    };
    setDraftConversation(newDraft);
    setCurrentConversationId(null); // Clear any selected conversation
    setIsMobileSidebarOpen(false); // Close mobile sidebar on new chat
  };

  // Load conversation
  const loadConversation = (id) => {
    setCurrentConversationId(id);
    setDraftConversation(null); // Clear draft when loading saved conversation
    setIsMobileSidebarOpen(false); // Close mobile sidebar when selecting
  };

  // Update conversation messages
  const updateConversationMessages = async (conversationId, messages) => {
    // If this is a draft conversation with first message, save it immediately then generate title
    if (draftConversation && draftConversation.id === conversationId && messages.length === 1) {
      // First, immediately update the draft to show the message
      const tempConversation = {
        ...draftConversation,
        messages,
        title: 'Generating title...',
        updatedAt: new Date().toISOString(),
      };

      // Add to conversations list immediately
      setConversations([tempConversation, ...conversations]);
      setCurrentConversationId(tempConversation.id);
      setDraftConversation(null); // Clear draft

      // Then generate AI title in the background (non-blocking)
      setTimeout(async () => {
        try {
          // Get existing titles to avoid duplicates
          const existingTitles = conversations.map(c => c.title).filter(t => !t.startsWith('Chat '));

          // Generate AI title
          const aiTitle = await generateConversationTitle(messages[0].content, existingTitles);

          // Update with AI-generated title
          setConversations(prevConversations => prevConversations.map(c => {
            if (c.id === conversationId) {
              return { ...c, title: aiTitle };
            }
            return c;
          }));
        } catch (error) {
          console.error('Failed to generate title:', error);
          // Fallback to simple truncation
          const fallbackTitle = messages[0].content.substring(0, 50) + (messages[0].content.length > 50 ? '...' : '');
          setConversations(prevConversations => prevConversations.map(c => {
            if (c.id === conversationId) {
              return { ...c, title: fallbackTitle };
            }
            return c;
          }));
        }
      }, 0);
    }
    // If it's an existing conversation, just update it
    else if (!draftConversation) {
      setConversations(prevConversations => prevConversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages,
            updatedAt: new Date().toISOString(),
          };
        }
        return conv;
      }));
    }
    // If it's a draft with more messages (AI response came back), update draft
    else if (draftConversation && draftConversation.id === conversationId) {
      setDraftConversation({
        ...draftConversation,
        messages,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Rename conversation
  const renameConversation = (id, newTitle) => {
    setConversations(conversations.map(conv =>
      conv.id === id ? { ...conv, title: newTitle, updatedAt: new Date().toISOString() } : conv
    ));
  };

  // Toggle pin
  const togglePin = (id) => {
    setConversations(conversations.map(conv =>
      conv.id === id ? { ...conv, pinned: !conv.pinned, updatedAt: new Date().toISOString() } : conv
    ));
  };

  // Delete conversation
  const deleteConversation = (id) => {
    const updatedConversations = conversations.filter(conv => conv.id !== id);
    setConversations(updatedConversations);

    // If deleting current conversation, always go to new empty chat
    if (id === currentConversationId) {
      createNewChat();
    }
  };

  // Share conversation (copy to clipboard)
  const shareConversation = async (id) => {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return;

    const text = `# ${conversation.title}\n\n` +
      conversation.messages.map(msg =>
        `**${msg.role === 'user' ? 'User' : 'AI'}**: ${msg.content}`
      ).join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      alert('Conversation copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy conversation');
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${theme === 'dark'
      ? 'bg-slate-950 text-slate-100'
      : 'bg-gray-50 text-slate-900'
      }`}>

      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        toggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isDesktopOpen={isDesktopSidebarOpen}
        toggleDesktop={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={createNewChat}
        onLoadConversation={loadConversation}
        onRename={renameConversation}
        onTogglePin={togglePin}
        onDelete={deleteConversation}
        onShare={shareConversation}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative transition-all duration-300">

        {/* Mobile Header / Desktop Toggle (When Closed) */}
        <div className="absolute top-4 left-4 z-40 flex gap-2">
          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className={`p-2 rounded-lg shadow-sm transition-colors ${theme === 'dark'
                ? 'bg-slate-800 border border-slate-700 text-gray-300'
                : 'bg-white border border-gray-200 text-gray-600'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>

          {/* Desktop Toggle (Visible ONLY when sidebar is CLOSED) */}
          <div className="hidden md:block">
            {!isDesktopSidebarOpen && (
              <button
                onClick={() => setIsDesktopSidebarOpen(true)}
                className={`p-2 rounded-lg transition-all ${theme === 'dark'
                  ? 'bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-slate-700 text-gray-400 hover:text-gray-300'
                  : 'bg-white/50 hover:bg-white border border-transparent hover:border-gray-200 text-gray-500 hover:text-gray-700'
                  }`}
                title="Open Sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <ChatInterface
          conversation={currentConversation}
          onUpdateMessages={updateConversationMessages}
        />

      </div>
    </div>
  );
}

export default App;

