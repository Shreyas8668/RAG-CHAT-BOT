from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

ChunkingStrategy = Literal['fixed-size', 'sentence', 'paragraph']
LLMProvider = Literal['offline', 'gemini', 'openai']

class DocumentItem(BaseModel):
    id: str
    name: str
    file_type: str = Field(alias='type')
    content: str
    size_bytes: int = Field(alias='sizeBytes')
    uploaded_at: str = Field(alias='uploadedAt')
    chunk_count: int = Field(default=0, alias='chunkCount')
    tags: List[str] = Field(default_factory=list)
    is_preset: bool = Field(default=False, alias='isPreset')

    class Config:
        populate_by_name = True

class Chunk(BaseModel):
    id: str
    document_id: str = Field(alias='documentId')
    document_name: str = Field(alias='documentName')
    chunk_index: int = Field(alias='chunkIndex')
    text: str
    token_count: int = Field(alias='tokenCount')
    character_count: int = Field(alias='characterCount')
    start_char_index: int = Field(alias='startCharIndex')
    end_char_index: int = Field(alias='endCharIndex')
    tags: List[str] = Field(default_factory=list)
    vector: Optional[List[float]] = None

    class Config:
        populate_by_name = True

class SearchResult(BaseModel):
    chunk: Chunk
    score: float
    rank: int
    matched_terms: List[str] = Field(default_factory=list, alias='matchedTerms')

    class Config:
        populate_by_name = True

class ChatMessage(BaseModel):
    id: str
    sender: Literal['user', 'assistant', 'system']
    text: str
    timestamp: str
    retrieved_chunks: Optional[List[SearchResult]] = Field(default=None, alias='retrievedChunks')
    prompt_context_used: Optional[str] = Field(default=None, alias='promptContextUsed')
    latency_ms: Optional[float] = Field(default=None, alias='latencyMs')
    model_used: Optional[str] = Field(default=None, alias='modelUsed')

    class Config:
        populate_by_name = True

class RAGConfig(BaseModel):
    chunk_size: int = Field(default=300, alias='chunkSize')
    chunk_overlap: int = Field(default=50, alias='chunkOverlap')
    chunking_strategy: ChunkingStrategy = Field(default='fixed-size', alias='chunkingStrategy')
    top_k: int = Field(default=3, alias='topK')
    min_similarity_score: float = Field(default=0.05, alias='minSimilarityScore')
    llm_provider: LLMProvider = Field(default='offline', alias='llmProvider')
    api_key: Optional[str] = Field(default='', alias='apiKey')
    custom_system_prompt: Optional[str] = Field(default=None, alias='customSystemPrompt')
    temperature: float = Field(default=0.2)

    class Config:
        populate_by_name = True

class QueryRequest(BaseModel):
    query: str
    config: Optional[RAGConfig] = None

class PipelineTrace(BaseModel):
    query: str
    step1_query_vector_preview: List[float] = Field(alias='step1QueryVectorPreview')
    step2_retrieved_chunks_count: int = Field(alias='step2RetrievedChunksCount')
    step2_top_chunks: List[SearchResult] = Field(alias='step2TopChunks')
    step3_injected_prompt: str = Field(alias='step3InjectedPrompt')
    step4_generated_response: str = Field(alias='step4GeneratedResponse')
    duration_ms: float = Field(alias='durationMs')

    class Config:
        populate_by_name = True

