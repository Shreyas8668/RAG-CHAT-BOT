#!/usr/bin/env python3
"""
Python RAG Studio - Command Line Interface (CLI)
Usage:
  python cli.py                              # Launches interactive shell
  python cli.py --query "What is RAG?"       # Queries pre-loaded knowledge base
  python cli.py --file "doc.txt" --query "..." # Indexes file and queries
"""

import sys
import argparse
import os
import io

# Force UTF-8 stdout encoding for Windows console compatibility
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

from rag.types import RAGConfig
from rag.loader import get_preset_documents, load_text_content
from rag.chunker import chunk_document
from rag.vector_store import global_vector_store
from rag.llm_engine import generate_rag_response

def init_vector_store():
    """Indexes pre-loaded sample documents into vector store."""
    presets = get_preset_documents()
    total_chunks = 0
    for doc in presets:
        chunks = chunk_document(doc, chunk_size=300, chunk_overlap=50)
        global_vector_store.add_chunks(chunks)
        total_chunks += len(chunks)
    return len(presets), total_chunks

def print_banner():
    print("=" * 65)
    print("           [RAG] PYTHON RAG STUDIO CLI ENGINE [RAG]")
    print("  Retrieval-Augmented Generation with Dense Vector Search")
    print("=" * 65)

def run_query(query: str, config: RAGConfig):
    print(f"\n[?] Processing Query: '{query}'")
    print("-" * 65)
    
    # 1. Search Vector Store
    results, query_vector = global_vector_store.search(
        query=query,
        top_k=config.top_k,
        min_score=config.min_similarity_score
    )

    print(f"[*] Vector Search Completed ({len(results)} chunks retrieved)")
    for res in results:
        print(f"\n  [Rank #{res.rank}] Score: {res.score*100:.1f}% | Doc: {res.chunk.document_name}")
        print(f"     Text Snippet: \"{res.chunk.text[:120]}...\"")
        if res.matched_terms:
            print(f"     Matched Terms: {', '.join(res.matched_terms)}")

    # 2. Grounded LLM Response
    chat_msg, trace = generate_rag_response(query, results, query_vector, config)

    print("\n" + "=" * 65)
    print(f"[AI] Assistant Grounded Answer ({chat_msg.model_used} - {chat_msg.latency_ms}ms):")
    print("-" * 65)
    print(chat_msg.text)
    print("=" * 65 + "\n")

def interactive_mode(config: RAGConfig):
    print_banner()
    num_docs, num_chunks = init_vector_store()
    print(f"[+] Preloaded {num_docs} documents ({num_chunks} vector chunks indexed into store).\n")
    print("Type your questions below. Type 'exit' or 'quit' to stop.\n")

    while True:
        try:
            user_input = input("RAG> ").strip()
            if not user_input:
                continue
            if user_input.lower() in ('exit', 'quit', 'q'):
                print("Goodbye!")
                break
            run_query(user_input, config)
        except (KeyboardInterrupt, EOFError):
            print("\nExiting Python RAG Studio.")
            break

def main():
    parser = argparse.ArgumentParser(description="Python RAG Studio Command Line Interface")
    parser.add_argument("--query", "-q", type=str, help="Query string to search in RAG")
    parser.add_argument("--file", "-f", type=str, help="Optional text document file path to index")
    parser.add_argument("--top_k", "-k", type=int, default=3, help="Top K document chunks to retrieve")

    args = parser.parse_args()
    config = RAGConfig(topK=args.top_k)

    num_docs, num_chunks = init_vector_store()

    if args.file:
        if os.path.exists(args.file):
            with open(args.file, "r", encoding="utf-8") as f:
                content = f.read()
            custom_doc = load_text_content(content, os.path.basename(args.file))
            custom_chunks = chunk_document(custom_doc, chunk_size=config.chunk_size, chunk_overlap=config.chunk_overlap)
            global_vector_store.add_chunks(custom_chunks)
            print(f"[+] Indexed user file '{args.file}' ({len(custom_chunks)} chunks).")
        else:
            print(f"[!] Error: File '{args.file}' not found.")
            sys.exit(1)

    if args.query:
        print_banner()
        run_query(args.query, config)
    else:
        interactive_mode(config)

if __name__ == "__main__":
    main()
