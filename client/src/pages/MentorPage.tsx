import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Bot,
  Sparkles,
  Send,
  Square,
  Plus,
  Trash2,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient, API_BASE_URL, getAuthToken } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { MentorMessageRenderer } from '../components/common/MentorMessageRenderer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  created_at?: string;
  isError?: boolean;
  failedText?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const MentorPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Active topic passed via navigation state or default
  const [activeTopic, setActiveTopic] = useState<string>(
    location.state?.topic || 'Core Engineering'
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Load conversations, health check, and initial personalized greeting
  useEffect(() => {
    loadConversations();
    fetchInitialGreeting();
    checkHealthAndProvider();
  }, []);

  const checkHealthAndProvider = async () => {
    try {
      const health = await apiClient<{
        status: string;
        ai_provider_configured: boolean;
        ai_provider: string;
      }>('/health');

      if (!health.ai_provider_configured && (import.meta.env.DEV || import.meta.env.MODE !== 'production')) {
        console.info(
          '[Mindora AI Mentor] Development note: ANTHROPIC_API_KEY is not configured in backend/.env. Using built-in Socratic mentor simulation.'
        );
      }
    } catch (err) {
      console.warn('[Mindora AI Mentor] Backend health check unreachable:', err);
    }
  };

  const loadConversations = async () => {
    try {
      const res = await apiClient<{ conversations: Conversation[] }>('/mentor/conversations');
      setConversations(res.conversations || []);
    } catch (err) {
      console.warn('Could not load conversations:', err);
    }
  };

  const fetchInitialGreeting = async () => {
    try {
      const res = await apiClient<{
        greeting: string;
        has_data: boolean;
        active_topic?: string;
      }>('/mentor/greeting');

      if (res.active_topic) {
        setActiveTopic(res.active_topic);
      }

      setMessages([
        {
          id: 'greeting_msg',
          role: 'assistant',
          content: res.greeting,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      const firstName = user?.name?.split(' ')[0] || 'there';
      setMessages([
        {
          id: 'greeting_msg',
          role: 'assistant',
          content: `Hi ${firstName}! I'm Mindora, your AI Study Mentor. What concept or problem can we explore together today?`,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  const selectConversation = async (convId: string) => {
    setActiveConvId(convId);
    setLoadingHistory(true);
    try {
      const res = await apiClient<{
        conversation: Conversation;
        messages: Message[];
      }>(`/mentor/conversations/${convId}`);

      setMessages(res.messages || []);
    } catch (err) {
      console.error('Error fetching conversation:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStartNewChat = () => {
    setActiveConvId(null);
    fetchInitialGreeting();
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await apiClient(`/mentor/conversations/${convId}`, { method: 'DELETE' });
      if (activeConvId === convId) {
        handleStartNewChat();
      }
      loadConversations();
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isStreaming) return;

    // Only clear input if user submitted from input field, preserving typed text on Retry
    if (!textToSend) {
      setInput('');
    }

    // Append user message to UI immediately
    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    // Prepare assistant placeholder message for streaming
    const assistantMsgId = 'asst_' + Date.now();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      sources: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const match = document.cookie.match(new RegExp('(^|;\\s*)csrfToken=([^;]+)'));
      const csrfToken = match ? decodeURIComponent(match[2]) : null;
      const authToken = getAuthToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/mentor/chat`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          message: text,
          topic: activeTopic,
          conversation_id: activeConvId || undefined,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('[Mindora AI Mentor] Authentication failed (401). Session expired.');
          throw { status: 401, friendlyMessage: 'Your session expired. Please log in again.' };
        } else if (response.status === 429) {
          console.warn('[Mindora AI Mentor] Rate limit exceeded (429).');
          throw { status: 429, friendlyMessage: "You're sending messages quickly. Wait a moment and retry." };
        } else if (response.status >= 500) {
          console.error(`[Mindora AI Mentor] Server error (${response.status}).`);
          throw { status: response.status, friendlyMessage: 'My AI service had a problem. Your message is saved, try again.' };
        } else {
          console.error(`[Mindora AI Mentor] Request failed with HTTP ${response.status}.`);
          throw { status: response.status, friendlyMessage: 'My AI service had a problem. Your message is saved, try again.' };
        }
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream response');

      const decoder = new TextDecoder();
      let buffer = '';

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

              if (eventData.type === 'start') {
                if (eventData.conversation_id && !activeConvId) {
                  setActiveConvId(eventData.conversation_id);
                  loadConversations();
                }
              } else if (eventData.type === 'token') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + eventData.token }
                      : m
                  )
                );
              } else if (eventData.type === 'error') {
                console.error('[Mindora AI Mentor] Provider error event:', eventData);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content:
                            eventData.message ||
                            'My AI service had a problem. Your message is saved, try again.',
                          isError: true,
                          failedText: text,
                        }
                      : m
                  )
                );
              } else if (eventData.type === 'done') {
                if (eventData.sources) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, sources: eventData.sources }
                        : m
                    )
                  );
                }
                loadConversations();
              }
            } catch (parseErr) {
              console.warn('SSE Parse error:', parseErr);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User stopped generation manually
      } else {
        let userMessage = 'My AI service had a problem. Your message is saved, try again.';
        if (err.status === 401) {
          userMessage = 'Your session expired. Please log in again.';
        } else if (err.status === 429) {
          userMessage = "You're sending messages quickly. Wait a moment and retry.";
        } else if (err.status >= 500) {
          userMessage = 'My AI service had a problem. Your message is saved, try again.';
        } else if (!err.status || err.name === 'TypeError' || String(err).includes('Failed to fetch')) {
          console.error('[Mindora AI Mentor] Backend unreachable:', err);
          userMessage = "I can't reach the study server. Is it running?";
        } else if (err.friendlyMessage) {
          userMessage = err.friendlyMessage;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: userMessage,
                  isError: true,
                  failedText: text,
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const quickPrompts = [
    { label: 'Explain simply', text: 'Could you explain this simply using a real-world analogy?' },
    { label: 'Give me a hint', text: 'Give me a small hint for this problem without spoiling the full solution.' },
    { label: 'Quiz me', text: 'Quiz me with one conceptual check question on this topic.' },
    { label: 'Summarize my notes', text: 'What do my uploaded lecture notes say about this topic?' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-8.5rem)] animate-in fade-in duration-300">
      {/* Left Sidebar: Conversation History */}
      <div className="w-full md:w-64 flex flex-col rounded-2xl bg-white dark:bg-[#151231] border border-brand-violet/15 overflow-hidden flex-shrink-0">
        <div className="p-3 border-b border-brand-violet/10 dark:border-brand-violet/20 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-slate/70 dark:text-gray-300">
            Past Chats
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartNewChat}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                activeConvId === conv.id
                  ? 'bg-brand-violet text-white font-semibold shadow-sm'
                  : 'text-brand-slate dark:text-gray-200 hover:bg-brand-violet/10'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                <span className="truncate">{conv.title}</span>
              </div>
              <button
                onClick={(e) => handleDeleteConversation(e, conv.id)}
                className="opacity-50 hover:opacity-100 p-1 hover:text-brand-coral"
                title="Delete chat"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {conversations.length === 0 && (
            <div className="p-4 text-center text-xs text-brand-slate/40 dark:text-gray-500">
              No previous chats recorded.
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <Card padding="none" className="flex-1 flex flex-col overflow-hidden border border-brand-violet/20 shadow-md">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-brand-violet/10 dark:border-brand-violet/20 bg-gradient-to-r from-brand-midnight via-brand-royal to-brand-violet text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-brand-cyan shadow-sm">
              <Bot className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight">Mindora AI Mentor</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-cyan/20 text-brand-cyan">
                  Socratic Peer Tutor
                </span>
              </div>
              <p className="text-[11px] text-gray-200 truncate max-w-xs sm:max-w-md">
                Active Topic Context: <strong className="text-brand-cyan">{activeTopic}</strong>
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleStartNewChat}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="bg-white/20 text-white border-white/30 hover:bg-white/30 hidden sm:flex"
          >
            Reset Chat
          </Button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-brand-violet/5 dark:bg-[#0B0A1A]/40">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12 text-xs text-brand-slate/60">
              Loading conversation transcript...
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-brand-royal to-brand-violet text-white rounded-br-none'
                      : m.isError
                      ? 'bg-brand-coral/10 dark:bg-brand-coral/15 text-brand-slate dark:text-gray-100 border border-brand-coral/30 rounded-bl-none'
                      : 'bg-white dark:bg-[#151231] text-brand-slate dark:text-gray-100 border border-brand-violet/15 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-brand-violet/10 dark:border-brand-violet/20">
                    <span className="font-bold text-[11px] opacity-80 flex items-center gap-1.5">
                      {m.role === 'assistant' ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                          <span>Mindora</span>
                        </>
                      ) : (
                        <span>You</span>
                      )}
                    </span>
                    {m.created_at && (
                      <span className="text-[10px] opacity-50 font-mono">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <MentorMessageRenderer
                    content={m.content}
                    sources={m.sources}
                    onSourceClick={() => navigate('/pdf-notes')}
                  />

                  {/* Retry Button for Failed Messages */}
                  {m.isError && m.failedText && (
                    <div className="mt-3 pt-2.5 border-t border-brand-coral/20 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-brand-coral font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> Failed to receive guidance
                      </span>
                      <button
                        onClick={() => handleSendMessage(m.failedText)}
                        disabled={isStreaming}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-brand-violet text-white hover:bg-brand-violet/90 shadow-sm transition-colors disabled:opacity-50"
                        title="Retry sending this message"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Retry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Typing Indicator */}
          {isStreaming && (
            <div className="flex items-center gap-2 text-xs text-brand-violet dark:text-brand-cyan animate-pulse">
              <Bot className="w-4 h-4" />
              <span>Mindora is formulating thoughtful guidance...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Chips */}
        <div className="px-4 py-2 bg-white/70 dark:bg-[#151231]/80 border-t border-brand-violet/10 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-slate/40 flex-shrink-0">
            Quick Prompts:
          </span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.text)}
              disabled={isStreaming}
              className="px-2.5 py-1 rounded-full bg-brand-violet/10 hover:bg-brand-violet/20 text-brand-violet dark:text-brand-cyan font-medium whitespace-nowrap transition-colors disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Sticky Input Bar */}
        <div className="p-3 sm:p-4 border-t border-brand-violet/15 bg-white dark:bg-[#151231]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about formulas, exam proofs, hints, or problem steps..."
              disabled={isStreaming}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-brand-violet/20 bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white placeholder:text-brand-slate/40 focus:outline-none focus:ring-2 focus:ring-brand-cyan disabled:opacity-60"
            />

            {isStreaming ? (
              <Button
                variant="danger"
                size="md"
                type="button"
                onClick={handleStopStreaming}
                leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
              >
                Stop
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={!input.trim()}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Send
              </Button>
            )}
          </form>
        </div>
      </Card>
    </div>
  );
};
