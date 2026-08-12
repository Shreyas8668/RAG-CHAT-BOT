import time
import requests
import json
from typing import List, Dict, Any, Tuple, Optional
from .types import SearchResult, ChatMessage, RAGConfig, PipelineTrace
from .embeddings import tokenize_text

DEFAULT_SYSTEM_PROMPT = """You are a helpful RAG AI Assistant. Answer the user's question using ONLY the provided document context below.
If the context does not contain enough information to answer the question, clearly state "I could not find sufficient information in the knowledge base."
Always cite your sources using [Source 1], [Source 2], etc."""

def build_prompt_context(results: List[SearchResult], custom_system_prompt: Optional[str] = None) -> str:
    """
    Constructs the augmented context prompt sent to the LLM.
    """
    system_instruction = custom_system_prompt or DEFAULT_SYSTEM_PROMPT
    
    if not results:
        return f"{system_instruction}\n\n[CONTEXT: No relevant documents found in knowledge base]"

    context_str = "\n\n".join([
        f"[Source {r.rank}: {r.chunk.document_name} (Chunk #{r.chunk.chunk_index + 1})]\n{r.chunk.text}"
        for r in results
    ])

    return f"{system_instruction}\n\n=== RETRIEVED KNOWLEDGE CONTEXT ===\n{context_str}\n======================================"

def offline_synthesize(query: str, results: List[SearchResult], context_prompt: str) -> str:
    """
    Offline Grounded Synthesis Engine:
    Selects relevant sentences from top retrieved chunks and composes a concise context-grounded response with inline citations.
    """
    if not results:
        return "I could not find sufficient information in the indexed knowledge base to answer your question."

    query_tokens = set(tokenize_text(query))
    answers = []
    sources_used = set()

    for res in results:
        chunk_text = res.chunk.text
        # Split chunk into sentences
        sentences = [s.strip() for s in chunk_text.replace('\n', ' ').split('.') if len(s.strip()) > 10]
        
        best_sentence = None
        best_score = -1

        for sentence in sentences:
            sentence_tokens = set(tokenize_text(sentence))
            overlap = len(query_tokens.intersection(sentence_tokens))
            if overlap > best_score:
                best_score = overlap
                best_sentence = sentence

        if best_sentence and best_score > 0:
            answers.append(f"{best_sentence.strip()}. [Source {res.rank}]")
            sources_used.add(res.rank)
        elif len(answers) < 2:
            # Fallback: use first sentence of chunk
            snippet = sentences[0] if sentences else chunk_text[:120]
            answers.append(f"{snippet.strip()}. [Source {res.rank}]")
            sources_used.add(res.rank)

    if not answers:
        return f"Based on the retrieved documents ([Source 1]), here is what was found:\n\n{results[0].chunk.text[:300]}..."

    response_text = f"Based on the knowledge base context:\n\n" + "\n\n".join(answers)
    return response_text

def call_gemini_api(api_key: str, prompt_context: str, query: str) -> str:
    """
    Calls Google Gemini REST API
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{prompt_context}\n\nUSER QUESTION: {query}"}
                ]
            }
        ]
    }
    
    res = requests.post(url, headers=headers, json=payload, timeout=15)
    res.raise_for_status()
    data = res.json()
    return data['candidates'][0]['content']['parts'][0]['text']

def call_openai_api(api_key: str, prompt_context: str, query: str) -> str:
    """
    Calls OpenAI REST API
    """
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": prompt_context},
            {"role": "user", "content": query}
        ],
        "temperature": 0.2
    }
    
    res = requests.post(url, headers=headers, json=payload, timeout=15)
    res.raise_for_status()
    data = res.json()
    return data['choices'][0]['message']['content']

def generate_rag_response(
    query: str,
    results: List[SearchResult],
    query_vector: List[float],
    config: RAGConfig
) -> Tuple[ChatMessage, PipelineTrace]:
    """
    Executes the full RAG synthesis pipeline and returns ChatMessage and PipelineTrace.
    """
    start_time = time.time()
    
    # 1. Build Grounded Context Prompt
    prompt_context = build_prompt_context(results, config.custom_system_prompt)

    # 2. Synthesize Answer
    model_name = "Offline Engine (Deterministic Grounded)"
    generated_text = ""

    if config.llm_provider == 'gemini' and config.api_key:
        try:
            model_name = "Google Gemini 1.5 Flash"
            generated_text = call_gemini_api(config.api_key, prompt_context, query)
        except Exception as e:
            generated_text = f"[Gemini API Error: {str(e)}]\n\nFalling back to Offline Synthesizer:\n\n" + offline_synthesize(query, results, prompt_context)
    elif config.llm_provider == 'openai' and config.api_key:
        try:
            model_name = "OpenAI GPT-3.5 Turbo"
            generated_text = call_openai_api(config.api_key, prompt_context, query)
        except Exception as e:
            generated_text = f"[OpenAI API Error: {str(e)}]\n\nFalling back to Offline Synthesizer:\n\n" + offline_synthesize(query, results, prompt_context)
    else:
        generated_text = offline_synthesize(query, results, prompt_context)

    duration_ms = round((time.time() - start_time) * 1000, 2)

    # 3. Construct ChatMessage and PipelineTrace
    chat_message = ChatMessage(
        id=f"msg-{int(time.time()*1000)}",
        sender="assistant",
        text=generated_text,
        timestamp=time.strftime("%H:%M:%S"),
        retrievedChunks=results,
        promptContextUsed=prompt_context,
        latencyMs=duration_ms,
        modelUsed=model_name
    )

    pipeline_trace = PipelineTrace(
        query=query,
        step1QueryVectorPreview=query_vector[:8],
        step2RetrievedChunksCount=len(results),
        step2TopChunks=results,
        step3InjectedPrompt=prompt_context,
        step4GeneratedResponse=generated_text,
        durationMs=duration_ms
    )

    return chat_message, pipeline_trace
