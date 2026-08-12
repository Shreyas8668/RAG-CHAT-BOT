import { Settings, X, Cpu, Key, Sliders } from 'lucide-react';
import type { RAGSettings } from '../types/rag';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RAGSettings;
  setSettings: React.Dispatch<React.SetStateAction<RAGSettings>>;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  setSettings,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel p-6 max-w-xl w-full border border-cyan-500/30 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">RAG Engine & LLM Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-bold text-gray-200 block mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Synthesis LLM Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'offline', label: 'Offline Engine (Zero Key)' },
                { id: 'gemini', label: 'Google Gemini API' },
                { id: 'openai', label: 'OpenAI GPT API' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSettings({ ...settings, llmProvider: p.id as any })}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    settings.llmProvider === p.id
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/20'
                      : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {settings.llmProvider !== 'offline' && (
            <div>
              <label className="text-xs text-gray-300 block mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                {settings.llmProvider.toUpperCase()} API Key
              </label>
              <input
                type="password"
                placeholder={`Enter your ${settings.llmProvider} API key...`}
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Top-K Chunks to Retrieve
              </span>
              <span className="font-mono text-cyan-400 font-bold">{settings.topK} Chunks</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={settings.topK}
              onChange={(e) => setSettings({ ...settings, topK: parseInt(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">Minimum Relevancy Threshold</span>
              <span className="font-mono text-emerald-400 font-bold">{(settings.minSimilarityScore * 100).toFixed(0)}% Score</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.5"
              step="0.05"
              value={settings.minSimilarityScore}
              onChange={(e) => setSettings({ ...settings, minSimilarityScore: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1">Custom System Instruction</label>
            <textarea
              rows={3}
              value={settings.customSystemPrompt}
              onChange={(e) => setSettings({ ...settings, customSystemPrompt: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-gray-200 focus:outline-none focus:border-cyan-500 resize-none font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-sm text-white shadow-lg shadow-cyan-600/20"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
