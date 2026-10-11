import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, X, Send, Lightbulb, ExternalLink } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiClient, API_BASE_URL, getAuthToken } from '../../api/client';

export const FloatingMentorButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([
    {
      role: 'ai',
      text: `Hello ${firstName}! I'm your Mindora AI Mentor. How can I assist your study session right now?`,
    },
  ]);

  useEffect(() => {
    if (user?.name) {
      setMessages([
        {
          role: 'ai',
          text: `Hello ${user.name.split(' ')[0]}! I'm your Mindora AI Mentor. How can I assist your study session right now?`,
        },
      ]);
    }
  }, [user]);

  // Derive active context from current route
  const getContextualTopic = () => {
    switch (location.pathname) {
      case '/roadmap':
        return 'Personalized Learning Roadmap';
      case '/diagnostic':
        return 'Diagnostic Assessment';
      case '/skill-gaps':
        return 'Skill Gaps & Prerequisite Analysis';
      case '/practice':
        return 'Adaptive Practice Problems';
      case '/timer':
        return 'Pomodoro Deep Focus';
      case '/resources':
        return 'Selected Textbooks & Video Explanations';
      case '/pdf-notes':
        return 'Smart Annotations & Lecture Notes';
      case '/timetable':
        return 'Spaced Repetition & Study Schedule';
      default:
        return 'General Study Strategy';
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isSending) return;
    const userText = inputMessage.trim();
    setInputMessage('');

    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsSending(true);

    try {
      const match = document.cookie.match(new RegExp('(^|;\\s*)csrfToken=([^;]+)'));
      const csrfToken = match ? decodeURIComponent(match[2]) : null;

      const authToken = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(`${API_BASE_URL}/mentor/chat`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          message: userText,
          topic: getContextualTopic(),
        }),
      });

      if (!response.ok) throw new Error('Request failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';
      let replyText = '';

      setMessages((prev) => [...prev, { role: 'ai', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              if (eventData.type === 'token') {
                replyText += eventData.token;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'ai', text: replyText };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Great question regarding ${getContextualTopic()}! Remember to break this down step-by-step and verify each part.`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenFullMentor = () => {
    setIsOpen(false);
    navigate('/ai-mentor', { state: { topic: getContextualTopic() } });
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 p-3.5 rounded-full bg-gradient-to-r from-brand-violet via-brand-orchid to-brand-cyan text-white shadow-violet-glow hover:scale-105 active:scale-95 transition-all duration-200 group focus-visible:ring-2 focus-visible:ring-brand-cyan"
        aria-label="Ask Mindora AI Mentor"
        title="Open AI Mentor"
      >
        <div className="relative flex items-center justify-center">
          <Bot className="w-6 h-6 animate-pulse-subtle" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-cyan"></span>
          </span>
        </div>
      </button>

      {/* Slide-out Contextual AI Mentor Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full sm:w-96 max-w-full bg-white dark:bg-[#151231] h-full shadow-2xl flex flex-col border-l border-brand-violet/25 z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-brand-violet/10 dark:border-brand-violet/20 flex items-center justify-between bg-gradient-to-r from-brand-midnight to-brand-royal text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md">
                  <Bot className="w-5 h-5 text-brand-cyan" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                    Mindora AI Mentor <Sparkles className="w-3.5 h-3.5 text-brand-orchid" />
                  </h3>
                  <p className="text-[11px] text-brand-cyan truncate max-w-[180px]">
                    Context: {getContextualTopic()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleOpenFullMentor}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                  title="Expand to Full Chat Page"
                  aria-label="Expand to full mentor chat page"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                  aria-label="Close AI Mentor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Context Hints */}
            <div className="px-3 py-2 bg-brand-violet/5 dark:bg-brand-violet/10 border-b border-brand-violet/10 flex items-center gap-2 text-xs text-brand-violet dark:text-brand-cyan">
              <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-[11px]">Ask for hints, analogies, or check questions.</span>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-brand-royal to-brand-violet text-white rounded-br-none'
                        : 'bg-white dark:bg-[#1C1742] text-brand-slate dark:text-gray-100 border border-brand-violet/15 rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Prompts */}
            <div className="p-2 border-t border-brand-violet/10 dark:border-brand-violet/20 flex gap-1.5 overflow-x-auto text-[11px]">
              <button
                onClick={() => setInputMessage('Explain this simply like I am 5')}
                className="px-2.5 py-1 rounded-full bg-brand-violet/10 dark:bg-brand-violet/20 text-brand-violet dark:text-brand-cyan whitespace-nowrap hover:bg-brand-violet/20"
              >
                💡 Explain simply
              </button>
              <button
                onClick={() => setInputMessage('Give me a small hint for this')}
                className="px-2.5 py-1 rounded-full bg-brand-violet/10 dark:bg-brand-violet/20 text-brand-violet dark:text-brand-cyan whitespace-nowrap hover:bg-brand-violet/20"
              >
                🔍 Give hint
              </button>
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-brand-violet/10 dark:border-brand-violet/20 bg-white dark:bg-[#151231]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask your study mentor..."
                  disabled={isSending}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-brand-violet/5 dark:bg-[#1C1742] border border-brand-violet/20 text-brand-slate dark:text-white placeholder:text-brand-slate/40 focus:outline-none focus:ring-1 focus:ring-brand-cyan"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSending}
                  className="p-2 rounded-xl bg-gradient-to-r from-brand-violet to-brand-cyan text-white disabled:opacity-40"
                  aria-label="Send query"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
