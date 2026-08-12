import { useState } from 'react';
import { Upload, FileText, Sliders, RefreshCw, Trash2, Tag } from 'lucide-react';
import type { DocumentItem, RAGSettings } from '../types/rag';

interface DocumentTabProps {
  documents: DocumentItem[];
  settings: RAGSettings;
  setSettings: React.Dispatch<React.SetStateAction<RAGSettings>>;
  onUploadDocument: (file: File | null, rawText: string, name: string) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
  onResetPresets: () => Promise<void>;
}

export function DocumentTab({
  documents,
  settings,
  setSettings,
  onUploadDocument,
  onDeleteDocument,
  onResetPresets,
}: DocumentTabProps) {
  const [dragActive, setDragActive] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeDocPreview, setActiveDocPreview] = useState<DocumentItem | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      await onUploadDocument(file, '', file.name);
      setIsUploading(false);
    }
  };

  const handleCustomTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    setIsUploading(true);
    const title = customTitle.trim() || `Document_${Date.now()}.txt`;
    await onUploadDocument(null, customText, title);
    setCustomText('');
    setCustomTitle('');
    setIsUploading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              Ingest Knowledge Base
            </h2>
            <button
              onClick={onResetPresets}
              className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Presets
            </button>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                onUploadDocument(e.dataTransfer.files[0], '', e.dataTransfer.files[0].name);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/15 bg-black/20 hover:border-white/30'
            }`}
          >
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".txt,.md,.json,.csv"
              className="hidden"
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-200">
                Drag & drop files or <span className="text-cyan-400 underline">browse</span>
              </p>
              <p className="text-xs text-gray-400">Supports .TXT, .MD, .JSON, .CSV formats</p>
            </label>
          </div>

          <form onSubmit={handleCustomTextSubmit} className="mt-4 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Document Title (e.g. Project_Notes.txt)"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
            />
            <textarea
              placeholder="Paste raw text or markdown content here..."
              rows={3}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-cyan-500 resize-none"
            />
            <button
              type="submit"
              disabled={isUploading || !customText.trim()}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-medium text-sm text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
            >
              {isUploading ? 'Chunking & Indexing...' : 'Add Text Document'}
            </button>
          </form>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            Text Chunking Parameters
          </h2>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Chunk Size (Characters)</span>
                <span className="font-mono text-purple-400 font-bold">{settings.chunkSize} chars</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={settings.chunkSize}
                onChange={(e) => setSettings({ ...settings, chunkSize: parseInt(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Chunk Overlap (Characters)</span>
                <span className="font-mono text-cyan-400 font-bold">{settings.chunkOverlap} chars</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={settings.chunkOverlap}
                onChange={(e) => setSettings({ ...settings, chunkOverlap: parseInt(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 block mb-1">Chunking Strategy</label>
              <select
                value={settings.chunkingStrategy}
                onChange={(e) => setSettings({ ...settings, chunkingStrategy: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-purple-500"
              >
                <option value="fixed-size">Fixed Character Size (Sliding Window)</option>
                <option value="sentence">Sentence Boundary Splitting</option>
                <option value="paragraph">Paragraph Double-Newline Splitting</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="glass-panel p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Indexed Documents ({documents.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[550px] flex flex-col gap-3 pr-2">
            {documents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No documents indexed yet. Upload a file or click "Reload Presets".
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setActiveDocPreview(doc)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    activeDocPreview?.id === doc.id
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-black/30 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-100">{doc.name}</h3>
                        <p className="text-xs text-gray-400">{(doc.sizeBytes / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                        {doc.chunkCount} Chunks
                      </span>
                      {doc.isPreset && (
                        <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          Preset
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDocument(doc.id);
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Tag className="w-3 h-3 text-gray-400" />
                      {doc.tags.map((t, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 line-clamp-2 bg-black/40 p-2.5 rounded-lg font-mono">
                    {doc.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
