import { useState, useRef, useEffect } from 'react';
import { useExerciseSuggestions } from '../hooks';
import { streamChat, type ChatMessage } from '../api';
import { RefreshCw, MessageSquare, X, Send, Zap } from 'lucide-react';

const INTENSITY_COLOR: Record<string, string> = {
  low: 'bg-green-500/20 text-green-400',
  moderate: 'bg-amber-500/20 text-amber-400',
  high: 'bg-rose-500/20 text-rose-400',
};

export default function Exercise() {
  const { data, isLoading, isError, refetch, isFetching } = useExerciseSuggestions();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChat = (context?: string) => {
    setChatContext(context ?? null);
    if (context) {
      setMessages([{
        role: 'user',
        content: `I can't do "${context}". Can you suggest an alternative exercise that targets the same muscle groups?`,
      }]);
    } else {
      setMessages([]);
    }
    setChatOpen(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setInput('');
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsStreaming(true);

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      await streamChat(nextMessages, chatContext, (token) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + token,
          };
          return updated;
        });
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Auto-send substitution request when chat opens with context
  useEffect(() => {
    if (chatOpen && chatContext && messages.length === 1 && messages[0].role === 'user') {
      (async () => {
        setIsStreaming(true);
        const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
        setMessages((prev) => [...prev, assistantMsg]);
        try {
          await streamChat(messages, chatContext, (token) => {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + token,
              };
              return updated;
            });
          });
        } finally {
          setIsStreaming(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exercise Suggestions</h1>
        <div className="flex gap-2">
          <button onClick={() => refetch()} disabled={isFetching}
            className="flex items-center gap-1.5 text-sm bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Regenerate
          </button>
          <button onClick={() => openChat()}
            className="flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-lg transition-colors">
            <MessageSquare size={14} /> AI Chat
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-16 text-gray-400">
          <Zap size={32} className="mx-auto mb-3 animate-pulse text-emerald-400" />
          <p>Generating your personalised workout plan…</p>
        </div>
      )}

      {isError && (
        <div className="bg-amber-900/30 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-300">
          ⚠ Could not load exercise suggestions. Make sure you have set up your profile on the Home tab and the backend API + OpenAI key are configured.
        </div>
      )}

      {data && !isLoading && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-300">{data.rationale}</p>
            <div className="flex gap-4 mt-3 text-xs text-gray-400">
              <span>⏱ {data.total_duration_minutes} min</span>
              <span>🔥 ~{data.calories_estimate} kcal</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(data.exercises ?? []).map((ex: {
              name: string; category: string; intensity: string;
              sets?: number; reps?: string; duration_minutes?: number;
              rest_seconds?: number; description: string;
            }) => (
              <div key={ex.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{ex.name}</h3>
                    <span className="text-xs text-gray-400">{ex.category}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INTENSITY_COLOR[ex.intensity] ?? 'bg-gray-700 text-gray-300'}`}>
                    {ex.intensity}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{ex.description}</p>
                <div className="flex gap-3 text-xs text-gray-300">
                  {ex.sets && <span>{ex.sets} sets × {ex.reps}</span>}
                  {ex.duration_minutes && <span>{ex.duration_minutes} min</span>}
                  {ex.rest_seconds && <span>Rest {ex.rest_seconds}s</span>}
                </div>
                <button
                  onClick={() => openChat(ex.name)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 flex items-center gap-1 transition-colors"
                >
                  <MessageSquare size={11} /> Can't do this? Get a substitute
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* AI Chat Side Panel */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-gray-900 border-l border-gray-800 flex flex-col z-50 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="font-semibold text-sm">
              {chatContext ? `Substitute: ${chatContext}` : 'AI Trainer Chat'}
            </span>
            <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-gray-100">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm rounded-xl px-3 py-2 max-w-[90%] whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-emerald-600/20 text-emerald-100 ml-auto'
                  : 'bg-gray-800 text-gray-200'
              }`}>
                {m.content || <span className="animate-pulse text-gray-500">▌</span>}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-gray-800 flex gap-2">
            <textarea
              rows={2} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Ask about workouts, substitutes, form tips…"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button onClick={sendMessage} disabled={isStreaming || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 rounded-lg px-3 disabled:opacity-40 transition-colors">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
