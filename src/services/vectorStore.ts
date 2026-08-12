import type { Chunk, SearchResult } from '../types/rag';
import { calculateCosineSimilarity, extractMatchedTerms, generateEmbedding } from './embeddings';

export class VectorStore {
  private chunks: Chunk[] = [];

  public clear(): void {
    this.chunks = [];
  }

  public addChunks(newChunks: Chunk[]): void {
    const processed = newChunks.map((c) => {
      const vector = c.vector || generateEmbedding(c.text);
      return {
        ...c,
        vector,
      };
    });
    this.chunks.push(...processed);
  }

  public removeByDocumentId(docId: string): void {
    this.chunks = this.chunks.filter((c) => c.documentId !== docId);
  }

  public getAllChunks(): Chunk[] {
    return this.chunks;
  }

  public search(
    query: string,
    topK: number = 3,
    minScore: number = 0.05
  ): { results: SearchResult[]; queryVector: number[] } {
    if (!query.trim() || this.chunks.length === 0) {
      return { results: [], queryVector: [] };
    }

    const queryVector = generateEmbedding(query);
    const scoredResults: { chunk: Chunk; score: number; matchedTerms: string[] }[] = [];

    for (const chunk of this.chunks) {
      if (!chunk.vector) continue;

      const cosineScore = calculateCosineSimilarity(queryVector, chunk.vector);
      const matchedTerms = extractMatchedTerms(query, chunk.text);

      const keywordBoost = matchedTerms.length > 0 ? Math.min(0.25, matchedTerms.length * 0.08) : 0;
      const finalScore = Math.min(1.0, cosineScore * 0.75 + keywordBoost * 0.25);

      if (finalScore >= minScore) {
        scoredResults.push({
          chunk,
          score: parseFloat(finalScore.toFixed(4)),
          matchedTerms,
        });
      }
    }

    scoredResults.sort((a, b) => b.score - a.score);

    const topKResults: SearchResult[] = scoredResults.slice(0, topK).map((item, idx) => ({
      chunk: item.chunk,
      score: item.score,
      rank: idx + 1,
      matchedTerms: item.matchedTerms,
    }));

    return { results: topKResults, queryVector };
  }
}

export const globalVectorStore = new VectorStore();
