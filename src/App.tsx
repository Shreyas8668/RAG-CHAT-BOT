import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DocumentTab } from './components/DocumentTab';
import { VectorTab } from './components/VectorTab';
import { ChatTab } from './components/ChatTab';
import { TraceTab } from './components/TraceTab';
import { SettingsModal } from './components/SettingsModal';
import type { DocumentItem, Chunk, SearchResult, ChatMessage, PipelineTrace, RAGSettings } from './types/rag';
import { globalVectorStore } from './services/vectorStore';
import { chunkDocument } from './services/chunker';
import { generateRAGResponse } from './services/llmEngine';

const API_BASE = 'http://127.0.0.1:8000';

export function App() {
  const [activeTab, setActiveTab] = useState<'documents' | 'vector' | 'chat' | 'trace'>('documents');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [lastTrace, setLastTrace] = useState<PipelineTrace | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [settings, setSettings] = useState<RAGSettings>({
    chunkSize: 300,
    chunkOverlap: 50,
    chunkingStrategy: 'fixed-size',
    topK: 3,
    minSimilarityScore: 0.05,
    llmProvider: 'offline',
    apiKey: '',
    customSystemPrompt: 'You are a helpful RAG AI Assistant. Answer questions accurately based ONLY on the provided context.',
    temperature: 0.2,
  });

  const fetchState = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) {
        setBackendOnline(true);
        const docsRes = await fetch(`${API_BASE}/api/documents`);
        const docsData = await docsRes.json();
        setDocuments(docsData);

        const chunksRes = await fetch(`${API_BASE}/api/chunks`);
        const chunksData = await chunksRes.json();
        setChunks(chunksData.chunks || []);
        return;
      }
    } catch (e) {
      setBackendOnline(false);
    }

    setChunks(globalVectorStore.getAllChunks());
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadDocument = async (file: File | null, rawText: string, name: string) => {
    if (backendOnline) {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('content', rawText);
        formData.append('filename', name);
      }
      formData.append('chunk_size', settings.chunkSize.toString());
      formData.append('chunk_overlap', settings.chunkOverlap.toString());
      formData.append('strategy', settings.chunkingStrategy);

      const res = await fetch(`${API_BASE}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchState();
        return;
      }
    }

    const text = file ? await file.text() : rawText;
    const docItem: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: file ? file.name : name,
      type: (name.split('.').pop() || 'txt') as any,
      content: text,
      sizeBytes: text.length,
      uploadedAt: new Date().toISOString(),
      chunkCount: 0,
      tags: ['uploaded'],
    };

    const newChunks = chunkDocument(docItem, settings.chunkSize, settings.chunkOverlap, settings.chunkingStrategy);
    docItem.chunkCount = newChunks.length;

    globalVectorStore.addChunks(newChunks);
    setDocuments((prev) => [...prev, docItem]);
    setChunks(globalVectorStore.getAllChunks());
  };

  const handleDeleteDocument = async (docId: string) => {
    if (backendOnline) {
      await fetch(`${API_BASE}/api/documents/${docId}`, { method: 'DELETE' });
      await fetchState();
      return;
    }
    globalVectorStore.removeByDocumentId(docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setChunks(globalVectorStore.getAllChunks());
  };

  const handleResetPresets = async () => {
    if (backendOnline) {
      await fetch(`${API_BASE}/api/documents/reset-presets`, { method: 'POST' });
      await fetchState();
    }
  };

  const handleVectorSearch = async (query: string): Promise<{ results: SearchResult[]; queryVectorPreview: number[] }> => {
    if (backendOnline) {
      const formData = new FormData();
      formData.append('query', query);
      formData.append('top_k', settings.topK.toString());
      formData.append('min_score', settings.minSimilarityScore.toString());

      const res = await fetch(`${API_BASE}/api/search`, { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        return {
          results: data.results,
          queryVectorPreview: data.queryVectorPreview || [],
        };
      }
    }
    const res = globalVectorStore.search(query, settings.topK, settings.minSimilarityScore);
    return {
      results: res.results,
      queryVectorPreview: res.queryVector,
    };
  };

  const handleSendMessage = async (query: string) => {
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);

    if (backendOnline) {
      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, config: settings }),
        });

        if (res.ok) {
          const data = await res.json();
          setChatMessages((prev) => [...prev, data.message]);
          setLastTrace(data.trace);
          return;
        }
      } catch (e) {
        console.error("FastAPI error:", e);
      }
    }

    const { results, queryVector } = globalVectorStore.search(query, settings.topK, settings.minSimilarityScore);
    const { chatMessage, pipelineTrace } = generateRAGResponse(query, results, queryVector, settings);

    setChatMessages((prev) => [...prev, chatMessage]);
    setLastTrace(pipelineTrace);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col p-4 md:p-6">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        docCount={documents.length}
        chunkCount={chunks.length}
        backendOnline={backendOnline}
        openSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto">
        {activeTab === 'documents' && (
          <DocumentTab
            documents={documents}
            settings={settings}
            setSettings={setSettings}
            onUploadDocument={handleUploadDocument}
            onDeleteDocument={handleDeleteDocument}
            onResetPresets={handleResetPresets}
          />
        )}

        {activeTab === 'vector' && (
          <VectorTab
            chunks={chunks}
            settings={settings}
            setSettings={setSettings}
            onSearch={handleVectorSearch}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            messages={chatMessages}
            settings={settings}
            onSendMessage={handleSendMessage}
          />
        )}

        {activeTab === 'trace' && <TraceTab lastTrace={lastTrace} />}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
      />
    </div>
  );
}

export default App;
