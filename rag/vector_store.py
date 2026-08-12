from typing import List, Dict, Tuple, Optional
from .types import Chunk, SearchResult
from .embeddings import generate_embedding, calculate_cosine_similarity, extract_matched_terms

class VectorStore:
    def __init__(self):
        self.chunks: List[Chunk] = []

    def clear(self) -> None:
        """
        Clears all indexed chunks.
        """
        self.chunks.clear()

    def add_chunks(self, new_chunks: List[Chunk]) -> None:
        """
        Embeds and indexes document chunks.
        """
        for chunk in new_chunks:
            if not chunk.vector:
                chunk.vector = generate_embedding(chunk.text)
            self.chunks.append(chunk)

    def remove_by_document_id(self, doc_id: str) -> None:
        """
        Removes all chunks associated with a specific document ID.
        """
        self.chunks = [c for c in self.chunks if c.document_id != doc_id]

    def get_all_chunks(self) -> List[Chunk]:
        """
        Returns all stored chunks.
        """
        return self.chunks

    def search(
        self,
        query: str,
        top_k: int = 3,
        min_score: float = 0.05
    ) -> Tuple[List[SearchResult], List[float]]:
        """
        Performs Top-K nearest neighbor vector search against stored chunk embeddings.
        """
        if not query.strip() or not self.chunks:
            return [], []

        query_vector = generate_embedding(query)
        results = []

        for chunk in self.chunks:
            if not chunk.vector:
                continue

            cosine_score = calculate_cosine_similarity(query_vector, chunk.vector)
            matched_terms = extract_matched_terms(query, chunk.text)

            # Keyword match boost
            keyword_boost = min(0.25, len(matched_terms) * 0.08) if matched_terms else 0.0
            final_score = min(1.0, cosine_score * 0.75 + keyword_boost * 0.25)

            if final_score >= min_score:
                results.append({
                    'chunk': chunk,
                    'score': round(final_score, 4),
                    'matched_terms': matched_terms
                })

        # Sort by similarity score descending
        results.sort(key=lambda x: x['score'], reverse=True)

        top_results = []
        for idx, item in enumerate(results[:top_k], start=1):
            top_results.append(
                SearchResult(
                    chunk=item['chunk'],
                    score=item['score'],
                    rank=idx,
                    matchedTerms=item['matched_terms']
                )
            )

        return top_results, query_vector

# Global singleton store instance
global_vector_store = VectorStore()
