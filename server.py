from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
import os
import uvicorn

from rag.types import DocumentItem, Chunk, SearchResult, ChatMessage, RAGConfig, QueryRequest, PipelineTrace
from rag.loader import load_text_content, get_preset_documents, parse_json_content, parse_csv_content
from rag.chunker import chunk_document
from rag.vector_store import global_vector_store
from rag.llm_engine import generate_rag_response

app = FastAPI(
    title="Python RAG Studio REST API",
    description="Retrieval-Augmented Generation REST API powered by Python & Dense Vector Search",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global documents state
documents_db: List[DocumentItem] = []

def initialize_presets():
    """Initializes preset documents into documents_db and vector store."""
    global documents_db
    if not documents_db:
        presets = get_preset_documents()
        documents_db.extend(presets)
        for doc in presets:
            chunks = chunk_document(doc, chunk_size=300, chunk_overlap=50)
            doc.chunk_count = len(chunks)
            global_vector_store.add_chunks(chunks)

initialize_presets()

@app.get("/api/health")
def health_check():
    all_chunks = global_vector_store.get_all_chunks()
    return {
        "status": "online",
        "engine": "Python RAG Core (FastAPI + NumPy Vector Store)",
        "documentsCount": len(documents_db),
        "totalChunksIndexed": len(all_chunks)
    }

@app.get("/api/documents", response_model=List[DocumentItem])
def list_documents():
    return documents_db

@app.post("/api/documents/reset-presets")
def reset_presets():
    global documents_db
    documents_db.clear()
    global_vector_store.clear()
    initialize_presets()
    return {"message": "Presets reloaded successfully", "count": len(documents_db)}

@app.post("/api/documents/upload", response_model=DocumentItem)
async def upload_document(
    file: Optional[UploadFile] = File(None),
    content: Optional[str] = Form(None),
    filename: Optional[str] = Form(None),
    chunk_size: int = Form(300),
    chunk_overlap: int = Form(50),
    strategy: str = Form("fixed-size")
):
    text_content = ""
    name = filename or "uploaded_document.txt"

    if file:
        name = file.filename or name
        raw_bytes = await file.read()
        text_content = raw_bytes.decode("utf-8", errors="ignore")
    elif content:
        text_content = content
    else:
        raise HTTPException(status_code=400, detail="Either file or content must be provided.")

    ext = name.split(".")[-1].lower() if "." in name else "txt"
    if ext == "json":
        text_content = parse_json_content(text_content)
    elif ext == "csv":
        text_content = parse_csv_content(text_content)

    doc_item = load_text_content(text_content, name)
    chunks = chunk_document(doc_item, chunk_size=chunk_size, chunk_overlap=chunk_overlap, strategy=strategy)
    doc_item.chunk_count = len(chunks)

    documents_db.append(doc_item)
    global_vector_store.add_chunks(chunks)

    return doc_item

@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: str):
    global documents_db
    documents_db = [d for d in documents_db if d.id != doc_id]
    global_vector_store.remove_by_document_id(doc_id)
    return {"message": f"Document {doc_id} deleted successfully."}

@app.post("/api/chunk-preview")
def preview_chunks(
    text: str = Form(...),
    chunk_size: int = Form(300),
    chunk_overlap: int = Form(50),
    strategy: str = Form("fixed-size")
):
    dummy_doc = load_text_content(text, "preview.txt")
    chunks = chunk_document(dummy_doc, chunk_size=chunk_size, chunk_overlap=chunk_overlap, strategy=strategy)
    return {"chunkCount": len(chunks), "chunks": chunks}

@app.get("/api/chunks")
def list_chunks():
    chunks = global_vector_store.get_all_chunks()
    return {"totalChunks": len(chunks), "chunks": chunks}

@app.post("/api/search")
def vector_search(query: str = Form(...), top_k: int = Form(3), min_score: float = Form(0.05)):
    results, query_vector = global_vector_store.search(query=query, top_k=top_k, min_score=min_score)
    return {
        "query": query,
        "queryVectorPreview": query_vector[:8] if query_vector else [],
        "retrievedCount": len(results),
        "results": results
    }

@app.post("/api/chat")
def chat_rag(req: QueryRequest):
    config = req.config or RAGConfig()
    results, query_vector = global_vector_store.search(
        query=req.query,
        top_k=config.top_k,
        min_score=config.min_similarity_score
    )
    
    chat_msg, trace = generate_rag_response(
        query=req.query,
        results=results,
        query_vector=query_vector,
        config=config
    )

    return {
        "message": chat_msg,
        "trace": trace
    }

# Mount static files if build directory exists
if os.path.exists("dist"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
