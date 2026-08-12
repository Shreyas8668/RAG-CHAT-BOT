import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, FileText, Clock } from 'lucide-react';
import type { ChatMessage, SearchResult, RAGSettings } from '../types/rag';

interface ChatTabProps {
  messages: ChatMessage[];
  settings: RAGSettings;
  onSendMessage: (query: string) => Promise<void>;
}

export function ChatTab({ messages, settings, onSendMessage }: ChatTabProps) {
  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCitationChunk, setActiveCitationChunk] = useState<SearchResult | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isGenerating) return;
    const query = inputQuery;
    setInputQuery('');
    setIsGenerating(true);
    await onSendMessage(query);
    setIsGenerating(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-160px)]">
      <div className="lg:col-span-8 glass-panel p-6 flex flex-col h-full">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Context-Grounded RAG Assistant</h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
            Provider: {settings.llmProvider.toUpperCase()}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">Ask questions grounded in your indexed knowledge base.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {['What is Artificial Intelligence?', 'Summarize Quantum Superposition', 'What is the PTO policy?'].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputQuery(q);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 transition-colors"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium shadow-md'
                      : 'bg-black/40 border border-white/10 text-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Grounded Sources ({msg.retrievedChunks.length})
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {msg.retrievedChunks.map((res) => (
                          <button
                            key={res.chunk.id}
                            onClick={() => setActiveCitationChunk(res)}
                            className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            [Source {res.rank}: {(res.score * 100).toFixed(0)}%]
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.latencyMs && (
                    <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-3 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {msg.latencyMs}ms
                      </span>
                      <span>Model: {msg.modelUsed}</span>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask a question about your knowledge base..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isGenerating}
            className="flex-1 px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isGenerating || !inputQuery.trim()}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>

      <div className="lg:col-span-4 glass-panel p-6 flex flex-col h-full">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
          <FileText className="w-4 h-4 text-emerald-400" />
          Source Citation Drawer
        </h3>

        {activeCitationChunk ? (
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Source Rank #{activeCitationChunk.rank}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {(activeCitationChunk.score * 100).toFixed(1)}% Relevance
              </span>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Document Source:</label>
              <h4 className="text-sm font-bold text-gray-200">{activeCitationChunk.chunk.documentName}</h4>
            </div>

            <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 text-xs font-mono text-gray-200 leading-relaxed">
              "{activeCitationChunk.chunk.text}"
            </div>

            {activeCitationChunk.matchedTerms.length > 0 && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">Matched Keywords:</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeCitationChunk.matchedTerms.map((t, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 text-xs p-4">
            Click on any inline citation source badge ([Source 1]) in chat messages to inspect full chunk context.
          </div>
        )}
      </div>
    </div>
  );
}
