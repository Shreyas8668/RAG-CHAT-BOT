import type { Chunk, ChunkingStrategy, DocumentItem } from '../types/rag';

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words * 1.3));
}

export function chunkDocument(
  doc: DocumentItem,
  chunkSize: number = 300,
  chunkOverlap: number = 50,
  strategy: ChunkingStrategy = 'fixed-size'
): Chunk[] {
  const content = doc.content;
  if (!content || content.trim().length === 0) return [];

  const chunks: Chunk[] = [];

  if (strategy === 'paragraph') {
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    let currentChunkText = '';
    let startIdx = 0;

    paragraphs.forEach((p) => {
      if ((currentChunkText + '\n\n' + p).length > chunkSize && currentChunkText.length > 0) {
        chunks.push(createChunkObj(doc, chunks.length, currentChunkText.trim(), startIdx));
        startIdx += currentChunkText.length;
        currentChunkText = p;
      } else {
        if (!currentChunkText) startIdx = content.indexOf(p);
        currentChunkText = currentChunkText ? `${currentChunkText}\n\n${p}` : p;
      }
    });

    if (currentChunkText.trim().length > 0) {
      chunks.push(createChunkObj(doc, chunks.length, currentChunkText.trim(), startIdx));
    }
  } else if (strategy === 'sentence') {
    const sentences = content.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [content];
    let currentChunkText = '';
    let startIdx = 0;

    sentences.forEach((s) => {
      if ((currentChunkText + ' ' + s).length > chunkSize && currentChunkText.length > 0) {
        chunks.push(createChunkObj(doc, chunks.length, currentChunkText.trim(), startIdx));
        startIdx += currentChunkText.length;

        if (chunkOverlap > 0 && currentChunkText.length > chunkOverlap) {
          const overlapText = currentChunkText.slice(-chunkOverlap);
          currentChunkText = overlapText + ' ' + s;
        } else {
          currentChunkText = s;
        }
      } else {
        currentChunkText = currentChunkText ? `${currentChunkText} ${s}` : s;
      }
    });

    if (currentChunkText.trim().length > 0) {
      chunks.push(createChunkObj(doc, chunks.length, currentChunkText.trim(), startIdx));
    }
  } else {
    let i = 0;
    const len = content.length;
    let chunkIndex = 0;

    while (i < len) {
      const end = Math.min(i + chunkSize, len);
      let chunkText = content.slice(i, end);

      if (end < len) {
        const lastSpace = chunkText.lastIndexOf(' ');
        if (lastSpace > chunkSize * 0.6) {
          chunkText = chunkText.slice(0, lastSpace);
        }
      }

      const trimmed = chunkText.trim();
      if (trimmed.length > 0) {
        chunks.push(createChunkObj(doc, chunkIndex, trimmed, i));
        chunkIndex++;
      }

      const actualStep = chunkText.length - (chunkOverlap < chunkText.length ? chunkOverlap : 0);
      i += Math.max(1, actualStep);
    }
  }

  return chunks;
}

function createChunkObj(doc: DocumentItem, index: number, text: string, startCharIndex: number): Chunk {
  return {
    id: `${doc.id}-chunk-${index}`,
    documentId: doc.id,
    documentName: doc.name,
    chunkIndex: index,
    text,
    tokenCount: estimateTokenCount(text),
    characterCount: text.length,
    startCharIndex,
    endCharIndex: startCharIndex + text.length,
    tags: doc.tags || [],
  };
}
