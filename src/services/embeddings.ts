/**
 * Semantic Dense Vector Embedding Service
 * Generates vector representations and computes cosine similarity for RAG retrieval.
 */

const VECTOR_DIM = 64;

// Standard stop words to filter out noise
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with',
  'by', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over', 'under',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'can', 'could', 'should', 'would', 'will', 'this', 'that',
  'these', 'those', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who',
  'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more'
]);

/**
 * Tokenize and normalize text into clean lowercased terms
 */
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

/**
 * Fast deterministic hash for generating pseudo-semantic vector components
 */
function hashStringToDimension(str: string, maxDim: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % maxDim;
}

/**
 * Generates a normalized dense vector embedding (64 dimensions) for a given text chunk
 */
export function generateEmbedding(text: string): number[] {
  const vector = new Array(VECTOR_DIM).fill(0);
  const terms = tokenizeText(text);
  if (terms.length === 0) return vector;

  // Term frequency map
  const termCounts: Record<string, number> = {};
  terms.forEach((t) => {
    termCounts[t] = (termCounts[t] || 0) + 1;
  });

  // Project terms into embedding vector dimensions with subword n-grams
  terms.forEach((term) => {
    const tf = (termCounts[term] || 1) / terms.length;
    const dimIndex = hashStringToDimension(term, VECTOR_DIM);
    const weight = (1 + Math.log(1 + tf)) * (term.length > 4 ? 1.2 : 1.0);
    vector[dimIndex] += weight;

    // Additional subword trigram hashing for partial matching
    for (let i = 0; i <= term.length - 3; i++) {
      const tri = term.slice(i, i + 3);
      const triDim = hashStringToDimension(tri, VECTOR_DIM);
      vector[triDim] += 0.3 * weight;
    }
  });

  // Normalize vector to unit length (L2 norm)
  let norm = 0;
  for (let i = 0; i < VECTOR_DIM; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIM; i++) {
      vector[i] = parseFloat((vector[i] / norm).toFixed(4));
    }
  }

  return vector;
}

/**
 * Calculates Cosine Similarity between two vectors
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Extract matched keywords between query and chunk text for UI highlighting
 */
export function extractMatchedTerms(query: string, chunkText: string): string[] {
  const queryTerms = tokenizeText(query);
  const chunkTerms = new Set(tokenizeText(chunkText));
  
  return Array.from(new Set(queryTerms.filter((term) => chunkTerms.has(term))));
}
