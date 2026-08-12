export type ChunkingStrategy = 'fixed-size' | 'sentence' | 'paragraph';

export interface DocumentItem {
  id: string;
  name: string;
  type: 'txt' | 'md' | 'json' | 'pdf' | 'csv';
  content: string;
  sizeBytes: number;
  uploadedAt: string;
  chunkCount: number;
  tags?: string[];
  isPreset?: boolean;
}

export interface Chunk {
  id: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
  characterCount: number;
  startCharIndex: number;
  endCharIndex: number;
  tags?: string[];
  vector?: number[];
}

export interface SearchResult {
  chunk: Chunk;
  score: number; // Cosine similarity 0.0 - 1.0
  rank: number;
  matchedTerms: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  retrievedChunks?: SearchResult[];
  promptContextUsed?: string;
  latencyMs?: number;
  modelUsed?: string;
}

export interface PipelineTrace {
  query: string;
  step1QueryVectorPreview: number[];
  step2RetrievedChunksCount: number;
  step2TopChunks: SearchResult[];
  step3InjectedPrompt: string;
  step4GeneratedResponse: string;
  durationMs: number;
}

export interface RAGSettings {
  chunkSize: number; // e.g. 300
  chunkOverlap: number; // e.g. 50
  chunkingStrategy: ChunkingStrategy;
  topK: number; // 1 - 10
  minSimilarityScore: number; // 0.0 - 1.0
  llmProvider: 'offline' | 'gemini' | 'openai';
  apiKey: string;
  customSystemPrompt: string;
  temperature: number;
}
