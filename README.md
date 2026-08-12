# 🤖 RAG Chat Bot

A full-stack **Retrieval-Augmented Generation (RAG)** studio built with FastAPI + React. Upload documents, chunk them, embed them into a dense vector store, and chat with your data — all in the browser.

## ✨ Features

- 📄 Upload `.txt`, `.json`, `.csv` files or paste raw text
- 🔍 Dense vector search with NumPy (no external AI APIs required)
- 💬 RAG-powered chat with pipeline trace view
- ⚙️ Configurable chunking strategies (fixed-size, etc.)
- 🧠 Built-in preset documents to get started instantly

## 🏗️ Architecture

```
Frontend (React + Vite + TailwindCSS)
        ↕ REST API
Backend (FastAPI + Python)
        ↕
RAG Core (NumPy Vector Store + LLM Engine)
```

## 🚀 Local Development

### Backend
```bash
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### Frontend
```bash
npm install
npm run dev
```

## 🌐 Deploy to Render

1. Fork/push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your repo — Render auto-detects `render.yaml`
4. Click **Deploy** — done!

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, TailwindCSS |
| Backend | FastAPI, Uvicorn |
| Vector Store | NumPy (dense cosine similarity) |
| Chunking | Fixed-size, configurable overlap |