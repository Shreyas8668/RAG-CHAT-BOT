import re
from typing import List
from .types import Chunk, ChunkingStrategy, DocumentItem

def estimate_token_count(text: str) -> int:
    """
    Estimates token count for English text (~1.3 tokens per word)
    """
    if not text or not text.strip():
        return 0
    words = len(text.strip().split())
    return max(1, int(round(words * 1.3)))

def chunk_document(
    doc: DocumentItem,
    chunk_size: int = 300,
    chunk_overlap: int = 50,
    strategy: ChunkingStrategy = 'fixed-size'
) -> List[Chunk]:
    """
    Splits document text content into semantic Chunk objects.
    """
    content = doc.content
    if not content or not content.strip():
        return []

    chunks: List[Chunk] = []

    if strategy == 'paragraph':
        paragraphs = [p.strip() for p in re.split(r'\n\s*\n', content) if p.strip()]
        current_text = ""
        start_idx = 0

        for p in paragraphs:
            if len(current_text + "\n\n" + p) > chunk_size and len(current_text) > 0:
                chunks.append(_create_chunk(doc, len(chunks), current_text.strip(), start_idx))
                start_idx += len(current_text)
                current_text = p
            else:
                if not current_text:
                    start_idx = content.find(p)
                current_text = f"{current_text}\n\n{p}" if current_text else p

        if current_text.strip():
            chunks.append(_create_chunk(doc, len(chunks), current_text.strip(), start_idx))

    elif strategy == 'sentence':
        # Sentence splitting pattern
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', content) if s.strip()]
        current_text = ""
        start_idx = 0

        for s in sentences:
            if len(current_text + " " + s) > chunk_size and len(current_text) > 0:
                chunks.append(_create_chunk(doc, len(chunks), current_text.strip(), start_idx))
                start_idx += len(current_text)

                if chunk_overlap > 0 and len(current_text) > chunk_overlap:
                    overlap_text = current_text[-chunk_overlap:]
                    current_text = overlap_text + " " + s
                else:
                    current_text = s
            else:
                current_text = f"{current_text} {s}" if current_text else s

        if current_text.strip():
            chunks.append(_create_chunk(doc, len(chunks), current_text.strip(), start_idx))

    else:
        # Fixed character size with overlap
        i = 0
        length = len(content)
        chunk_idx = 0

        while i < length:
            end = min(i + chunk_size, length)
            chunk_text = content[i:end]

            # Avoid splitting words mid-character if possible
            if end < length:
                last_space = chunk_text.rfind(' ')
                if last_space > int(chunk_size * 0.6):
                    chunk_text = chunk_text[:last_space]

            trimmed = chunk_text.strip()
            if trimmed:
                chunks.append(_create_chunk(doc, chunk_idx, trimmed, i))
                chunk_idx += 1

            actual_step = len(chunk_text) - (chunk_overlap if chunk_overlap < len(chunk_text) else 0)
            i += max(1, actual_step)

    return chunks

def _create_chunk(doc: DocumentItem, index: int, text: str, start_char_idx: int) -> Chunk:
    return Chunk(
        id=f"{doc.id}-chunk-{index}",
        documentId=doc.id,
        documentName=doc.name,
        chunkIndex=index,
        text=text,
        tokenCount=estimate_token_count(text),
        characterCount=len(text),
        startCharIndex=start_char_idx,
        endCharIndex=start_char_idx + len(text),
        tags=doc.tags or []
    )
