import { useState } from 'react';
import { Database, Search, Sparkles, Hash, Eye, BarChart2 } from 'lucide-react';
import type { Chunk, SearchResult, RAGSettings } from '../types/rag';

interface VectorTabProps {
  chunks: Chunk[];
  settings: RAGSettings;
  setSettings: React.Dispatch<React.SetStateAction<RAGSettings>>;
  onSearch: (query: string) => Promise<{ results: SearchResult[]; queryVectorPreview: number[] }>;
}

export function VectorTab({ chunks, onSearch }: VectorTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [queryVector, setQueryVector] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const data = await onSearch(searchQuery);
    setSearchResults(data.results);
    setQueryVector(data.queryVectorPreview);
    setIsSearching(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-12 glass-panel p-6">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Search className="w-5 h-5 text-cyan-400" />
          Vector Similarity Search Playground
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Test dense vector embedding search and inspect cosine similarity scores in real time.
        </p>

        <form onSubmit={handleTestSearch} className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter a test query (e.g., 'What is artificial intelligence?' or 'Remote work policy')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-gray-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-semibold text-sm text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSearching ? 'Computing Embeddings...' : 'Calculate Similarity'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="flex flex-col gap-4 bg-black/30 p-4 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                Top-{searchResults.length} Retrieved Matches
              </h3>
              {queryVector.length > 0 && (
                <span className="text-xs font-mono text-gray-400">
                  Query 64D Vector Preview: [{queryVector.slice(0, 5).join(', ')}...]
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {searchResults.map((res) => (
                <div
                  key={res.chunk.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                      Rank #{res.rank}
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                      {(res.score * 100).toFixed(1)}% Match
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 line-clamp-4 font-mono bg-black/40 p-2.5 rounded-lg">
                    "{res.chunk.text}"
                  </p>

                  <div className="flex flex-col gap-1 text-[11px] text-gray-400 border-t border-white/5 pt-2">
                    <span>Document: <strong className="text-gray-200">{res.chunk.documentName}</strong></span>
                    {res.matchedTerms.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        <span className="text-gray-400">Matched Terms:</span>
                        {res.matchedTerms.map((t, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-12 glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            Indexed Chunk Store ({chunks.length} Total Chunks)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chunks.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedChunk(c)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                selectedChunk?.id === c.id
                  ? 'bg-purple-500/10 border-purple-500/40'
                  : 'bg-black/30 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                  Chunk #{c.chunkIndex + 1}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                  <Hash className="w-3 h-3 text-cyan-400" />
                  {c.tokenCount} Tokens
                </span>
              </div>

              <p className="text-xs text-gray-300 font-mono bg-black/40 p-2.5 rounded-lg line-clamp-3">
                {c.text}
              </p>

              <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-white/5 pt-2">
                <span className="truncate max-w-[180px]">{c.documentName}</span>
                <span className="text-cyan-400 hover:underline flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Inspect Vector
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedChunk && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-2xl w-full border border-purple-500/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Dense Vector Embedding Inspector
              </h3>
              <button
                onClick={() => setSelectedChunk(null)}
                className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-300"
              >
                Close
              </button>
            </div>

            <div className="text-xs text-gray-300 bg-black/50 p-3 rounded-lg border border-white/10">
              <strong className="text-purple-300">Text Content:</strong>
              <p className="font-mono mt-1 text-gray-200">{selectedChunk.text}</p>
            </div>

            {selectedChunk.vector && (
              <div>
                <h4 className="text-xs font-bold text-gray-300 mb-2">64-Dimensional Vector Preview:</h4>
                <div className="grid grid-cols-8 gap-1.5 bg-black/60 p-3 rounded-lg font-mono text-[10px]">
                  {selectedChunk.vector.map((val, idx) => (
                    <div
                      key={idx}
                      className="p-1 rounded text-center truncate border border-white/5"
                      style={{
                        backgroundColor: `rgba(139, 92, 246, ${Math.abs(val) * 0.8})`,
                        color: Math.abs(val) > 0.3 ? '#ffffff' : '#9ca3af'
                      }}
                      title={`Dim #${idx}: ${val}`}
                    >
                      {val.toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
