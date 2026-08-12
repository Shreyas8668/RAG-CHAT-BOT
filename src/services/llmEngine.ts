import type { SearchResult, ChatMessage, RAGSettings, PipelineTrace } from '../types/rag';
import { tokenizeText } from './embeddings';

export function generateRAGResponse(
  query: string,
  results: SearchResult[],
  queryVector: number[],
  _config: RAGSettings
): { chatMessage: ChatMessage; pipelineTrace: PipelineTrace } {
  const startTime = performance.now();
  const queryTokens = new Set(tokenizeText(query));
  const answers: string[] = [];

  for (const res of results) {
    const text = res.chunk.text;
    const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 5);

    let bestSentence = '';
    let maxOverlap = -1;

    for (const s of sentences) {
      const sTokens = new Set(tokenizeText(s));
      let overlap = 0;
      queryTokens.forEach((t) => {
        if (sTokens.has(t)) overlap++;
      });
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestSentence = s;
      }
    }

    if (bestSentence && maxOverlap > 0) {
      answers.push(`${bestSentence.trim()} [Source ${res.rank}]`);
    } else if (answers.length < 2 && sentences.length > 0) {
      answers.push(`${sentences[0].trim()} [Source ${res.rank}]`);
    }
  }

  const generatedText =
    answers.length > 0
      ? `Based on the knowledge base context:\n\n${answers.join('\n\n')}`
      : 'I could not find sufficient information in the knowledge base to answer your question.';

  const promptContext = results.map((r) => `[Source ${r.rank}: ${r.chunk.documentName}]\n${r.chunk.text}`).join('\n\n');
  const duration = Math.round(performance.now() - startTime);

  const chatMessage: ChatMessage = {
    id: `msg-ast-${Date.now()}`,
    sender: 'assistant',
    text: generatedText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    retrievedChunks: results,
    promptContextUsed: promptContext,
    latencyMs: duration,
    modelUsed: 'Offline Local Synthesizer',
  };

  const pipelineTrace: PipelineTrace = {
    query,
    step1QueryVectorPreview: queryVector.slice(0, 8),
    step2RetrievedChunksCount: results.length,
    step2TopChunks: results,
    step3InjectedPrompt: promptContext,
    step4GeneratedResponse: generatedText,
    durationMs: duration,
  };

  return { chatMessage, pipelineTrace };
}
