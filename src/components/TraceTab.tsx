import { Activity, ArrowDown, Database, Sparkles, Code, CheckCircle, Terminal } from 'lucide-react';
import type { PipelineTrace } from '../types/rag';

interface TraceTabProps {
  lastTrace: PipelineTrace | null;
}

export function TraceTab({ lastTrace }: TraceTabProps) {
  if (!lastTrace) {
    return (
      <div className="glass-panel p-12 text-center flex flex-col items-center justify-center gap-4">
        <Activity className="w-12 h-12 text-amber-400 opacity-60 animate-pulse" />
        <h2 className="text-lg font-bold text-white">No Active RAG Pipeline Trace</h2>
        <p className="text-xs text-gray-400 max-w-md">
          Execute a query in the Grounded Chat or Vector Search tab to record a step-by-step trace of vectorization, top-K search, and prompt injection.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              RAG Execution Trace Log
            </h2>
            <p className="text-xs text-gray-400">Query: "{lastTrace.query}"</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 font-bold">
              Latency: {lastTrace.durationMs}ms
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6 relative">
          <div className="p-4 rounded-xl bg-black/40 border border-amber-500/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Step 1: User Query Dense Vectorization
              </span>
              <span className="text-xs font-mono text-gray-400">Dim: 64D</span>
            </div>
            <p className="text-xs text-gray-300 font-mono">
              Vector Embedding Preview: [{lastTrace.step1QueryVectorPreview.join(', ')}...]
            </p>
          </div>

          <div className="flex justify-center text-amber-400">
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-purple-500/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4" />
                Step 2: Top-K Vector Cosine Similarity Search
              </span>
              <span className="text-xs font-mono text-purple-300">
                Retrieved {lastTrace.step2RetrievedChunksCount} Chunks
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {lastTrace.step2TopChunks.map((res) => (
                <div key={res.chunk.id} className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs font-mono">
                  <div className="flex justify-between text-purple-300 font-bold mb-1">
                    <span>Rank #{res.rank}: {res.chunk.documentName}</span>
                    <span>{(res.score * 100).toFixed(1)}%</span>
                  </div>
                  <p className="text-gray-300 line-clamp-2">"{res.chunk.text}"</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center text-purple-400">
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4" />
                Step 3: Grounded System Prompt Assembly
              </span>
            </div>
            <pre className="text-xs font-mono bg-black/60 p-3 rounded-lg text-cyan-300 overflow-x-auto whitespace-pre-wrap max-h-48">
              {lastTrace.step3InjectedPrompt}
            </pre>
          </div>

          <div className="flex justify-center text-cyan-400">
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Step 4: Grounded LLM Response Generation
              </span>
              <span className="text-xs font-mono text-emerald-300 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Complete
              </span>
            </div>
            <p className="text-xs font-mono bg-black/60 p-3 rounded-lg text-emerald-200 whitespace-pre-wrap">
              {lastTrace.step4GeneratedResponse}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
