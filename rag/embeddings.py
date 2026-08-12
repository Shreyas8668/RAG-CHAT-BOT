import re
import math
import numpy as np
from typing import List, Set

VECTOR_DIM = 64

STOP_WORDS: Set[str] = {
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with',
    'by', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over', 'under',
    'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'can', 'could', 'should', 'would', 'will', 'this', 'that',
    'these', 'those', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more'
}

def tokenize_text(text: str) -> List[str]:
    """
    Tokenizes and normalizes text into cleaned lowercased terms.
    """
    cleaned = re.sub(r'[^\w\s]', ' ', text.lower())
    terms = cleaned.split()
    return [t for t in terms if len(t) > 1 and t not in STOP_WORDS]

def hash_string_to_dimension(str_val: str, max_dim: int = VECTOR_DIM) -> int:
    """
    Deterministic string hashing for dimension projection.
    """
    h = 0
    for char in str_val:
        h = (h * 31 + ord(char)) & 0xffffffff
    return h % max_dim

def generate_embedding(text: str) -> List[float]:
    """
    Generates a normalized 64-dimensional dense semantic embedding vector using NumPy.
    """
    vec = np.zeros(VECTOR_DIM, dtype=np.float32)
    terms = tokenize_text(text)
    if not terms:
        return vec.tolist()

    # Term frequency calculation
    term_counts = {}
    for t in terms:
        term_counts[t] = term_counts.get(t, 0) + 1

    for t in terms:
        tf = term_counts[t] / len(terms)
        dim_idx = hash_string_to_dimension(t, VECTOR_DIM)
        weight = (1.0 + math.log(1.0 + tf)) * (1.2 if len(t) > 4 else 1.0)
        vec[dim_idx] += weight

        # Subword n-gram features for partial matching
        for i in range(len(t) - 2):
            tri = t[i:i+3]
            tri_idx = hash_string_to_dimension(tri, VECTOR_DIM)
            vec[tri_idx] += 0.3 * weight

    # L2 Normalization
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm

    return [round(float(val), 4) for val in vec]

def calculate_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """
    Computes Cosine Similarity between two embedding vectors using NumPy dot product.
    """
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0

    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    dot_product = np.dot(a, b)
    similarity = dot_product / (norm_a * norm_b)
    return float(np.clip(similarity, 0.0, 1.0))

def extract_matched_terms(query: str, chunk_text: str) -> List[str]:
    """
    Extracts overlapping keywords between query and chunk for visual UI highlight badges.
    """
    query_terms = tokenize_text(query)
    chunk_terms = set(tokenize_text(chunk_text))
    
    matched = set(t for t in query_terms if t in chunk_terms)
    return list(matched)
