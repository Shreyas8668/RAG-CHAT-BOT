import { Database, FileText, MessageSquare, Activity, Settings, Cpu } from 'lucide-react';

interface HeaderProps {
  activeTab: 'documents' | 'vector' | 'chat' | 'trace';
  setActiveTab: (tab: 'documents' | 'vector' | 'chat' | 'trace') => void;
  docCount: number;
  chunkCount: number;
  backendOnline: boolean;
  openSettings: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  docCount,
  chunkCount,
  backendOnline,
  openSettings,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight gradient-text">Python RAG Studio</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
              v1.0 Python
            </span>
          </div>
          <p className="text-xs text-gray-400">Retrieval-Augmented Generation Engine & Vector Playground</p>
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex items-center gap-1 bg-black/30 p-1.5 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'documents'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents ({docCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('vector')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'vector'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Vector Store ({chunkCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Grounded Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('trace')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'trace'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Pipeline Trace</span>
        </button>
      </nav>

      {/* Backend Status & Settings */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-black/30 border border-white/10">
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-gray-300 font-mono">{backendOnline ? 'Python Engine Ready' : 'Offline'}</span>
        </div>

        <button
          onClick={openSettings}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-colors"
          title="RAG & Model Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
