import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import { useTheme } from './context/ThemeContext';
// import { generateConversationTitle } from './services/titleGenerator'; // Removed

function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const { theme } = useTheme();

  // Conversation management
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Draft conversation (not yet saved to sidebar)
  const [draftConversation, setDraftConversation] = useState(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/chats');
      if (res.ok) {
        const data = await res.json();
        // Backend returns snake_case, frontend uses camelCase usually, but let's see.
        // Backend: {id, title, created_at}
        // Frontend expects: {id, title, messages: [], ...}
        // Listing usually just needs ID and Title. Messages loaded on select.
        setConversations(data.map(c => ({ ...c, messages: [] })));
      }
    } catch (error) {
      console.error("Failed to fetch chats", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with empty draft if no conversation is selected (even if history exists)
  useEffect(() => {
    if (!isLoading && !draftConversation && !currentConversationId) {
      createNewChat();
    }
  }, [draftConversation, currentConversationId, isLoading]);

  // Load conversation details when ID changes
  // Load conversation details when ID changes
  useEffect(() => {
    if (currentConversationId) {
      // Logic to prevent overwriting new messages with empty DB state
      const currentConv = conversations.find(c => c.id === currentConversationId);
      if (currentConv && currentConv.messages && currentConv.messages.length > 0) {
        // We already have messages (likely just promoted from draft), so don't re-fetch from empty DB yet
        return;
      }

      const loadMessages = async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/chats/${currentConversationId}`);
          if (res.ok) {
            const msgs = await res.json();
            setConversations(prev => prev.map(c =>
              c.id === currentConversationId ? { ...c, messages: msgs } : c
            ));
          }
        } catch (e) {
          console.error("Failed to load messages", e);
        }
      };
      loadMessages();
    }
  }, [currentConversationId]); // Note: We rely on the closure values from the render where ID changed

  // Get current conversation (from saved or draft)
  const currentConversation = draftConversation || conversations.find(c => c.id === currentConversationId) || null;

  // Create new chat (draft mode - doesn't appear in sidebar yet)
  const createNewChat = () => {
    const newChatId = Date.now().toString(); // Temporary ID until first save? Or use as permanent.
    const newDraft = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
    };
    setDraftConversation(newDraft);
    setCurrentConversationId(null);
    setIsMobileSidebarOpen(false);
  };

  // Load conversation
  const loadConversation = (id) => {
    setCurrentConversationId(id);
    setDraftConversation(null);
    setIsMobileSidebarOpen(false);
  };

  // Update conversation messages
  const updateConversationMessages = async (conversationId, messages) => {
    // If draft, we probably need to create it on backend first interaction?
    // Actually, backend main.py `chat` endpoint handles creation if `chat_id` passed?
    // Yes, `ensure_chat_exists` checks ID.

    // We update local state immediately for UI responsiveness
    if (draftConversation && draftConversation.id === conversationId) {
      // Promote draft to real conversation
      const truncatedTitle = messages[0].content.substring(0, 30) + (messages[0].content.length > 30 ? '...' : '');
      const newConv = { ...draftConversation, messages, title: truncatedTitle };
      setDraftConversation(null);
      setConversations([newConv, ...conversations]);
      setCurrentConversationId(newConv.id);

      // Generate AI Title Trigger Logic
      const shouldGenerateTitle = messages.length <= 2 && (
        !conversations.find(c => c.id === conversationId)?.title ||
        conversations.find(c => c.id === conversationId)?.title === 'New Chat' ||
        conversations.find(c => c.id === conversationId)?.title === 'Generating title...'
      );

      if (shouldGenerateTitle) {
        // Immediate Title Update (Truncate)
        const truncatedTitle = messages[0].content.substring(0, 30) + (messages[0].content.length > 30 ? '...' : '');

        // Update UI first
        setConversations(prev => prev.map(c =>
          c.id === conversationId ? { ...c, title: truncatedTitle } : c
        ));

        setTimeout(async () => {
          try {
            // Save initial fallback title to backend first to ensure persistence
            await fetch(`http://localhost:8000/api/chats/${conversationId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: truncatedTitle })
            });

            const res = await fetch('http://localhost:8000/api/generate_title', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: messages[0].content })
            });

            if (res.ok) {
              const data = await res.json();
              const aiTitle = data.title;

              // Update backend with refined AI title
              await fetch(`http://localhost:8000/api/chats/${conversationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: aiTitle })
              });

              // Update UI
              setConversations(prev => prev.map(c =>
                c.id === conversationId ? { ...c, title: aiTitle } : c
              ));
            }
          } catch (e) {
            console.error("Title gen failed, keeping fallback", e);
          }
        }, 0);
      }
    } else {
      // Existing conversation update

      // Check if we need to generate title for existing chat (e.g. restored "New Chat")
      const currentConv = conversations.find(c => c.id === conversationId);
      const shouldGenerateTitle = messages.length <= 2 && currentConv && (currentConv.title === 'New Chat' || !currentConv.title);

      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, messages: messages } : c
      ));

      if (shouldGenerateTitle) {
        // Immediate Title Update (Truncate)
        const truncatedTitle = messages[0].content.substring(0, 30) + (messages[0].content.length > 30 ? '...' : '');

        // Update UI first
        setConversations(prev => prev.map(c =>
          c.id === conversationId ? { ...c, title: truncatedTitle } : c
        ));

        setTimeout(async () => {
          try {
            // Save initial fallback title to backend first to ensure persistence
            await fetch(`http://localhost:8000/api/chats/${conversationId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: truncatedTitle })
            });

            const res = await fetch('http://localhost:8000/api/generate_title', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: messages[0].content })
            });

            if (res.ok) {
              const data = await res.json();
              const aiTitle = data.title;

              // Update backend with refined AI title
              await fetch(`http://localhost:8000/api/chats/${conversationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: aiTitle })
              });

              // Update UI
              setConversations(prev => prev.map(c =>
                c.id === conversationId ? { ...c, title: aiTitle } : c
              ));
            }
          } catch (e) {
            console.error("Title gen failed, keeping fallback", e);
          }
        }, 0);
      }
    }
  };

  // Rename conversation
  const renameConversation = async (id, newTitle) => {
    try {
      await fetch(`http://localhost:8000/api/chats/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      setConversations(conversations.map(conv =>
        conv.id === id ? { ...conv, title: newTitle } : conv
      ));
    } catch (e) {
      console.error("Rename failed", e);
    }
  };

  // Toggle pin
  const togglePin = (id) => {
    // NOTE: Backend DB schema provided didn't have 'pinned' column. 
    // Skipping backend persistence for PIN for now, or adding it?
    // User didn't ask for it specifically, but better to support or disable.
    // For now, local state only (will reset on refresh). 
    // To persist, I'd need to alter DB table. Let's keep it simple for now.
    setConversations(conversations.map(conv =>
      conv.id === id ? { ...conv, pinned: !conv.pinned } : conv
    ));
  };

  // Delete conversation
  const deleteConversation = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/chats/${id}`, { method: 'DELETE' });
      const updatedConversations = conversations.filter(conv => conv.id !== id);
      setConversations(updatedConversations);
      if (id === currentConversationId) {
        createNewChat();
      }
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  // Share conversation (copy to clipboard) - Client side only logic
  const shareConversation = async (id) => {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return;

    // Must ensure messages are loaded before sharing?
    // If messages empty (listing only), we might need to fetch them.
    let msgs = conversation.messages;
    if (!msgs || msgs.length === 0) {
      const res = await fetch(`http://localhost:8000/api/chats/${id}`);
      if (res.ok) msgs = await res.json();
    }

    const text = `# ${conversation.title}\n\n` +
      msgs.map(msg =>
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
      ? 'bg-[#0B1121] text-slate-100'
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
