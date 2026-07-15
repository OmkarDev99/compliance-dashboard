# AI Compliance Chatbot Module

RAG-based chatbot for querying ICSI and MCA compliance notices, built with
FastAPI, ChromaDB, sentence-transformers, and the Gemini API.

## Architecture
- `load_and_chunk.py` — loads scraped JSON, cleans and chunks documents
- `embed_and_store.py` — embeds chunks (BAAI/bge-base-en-v1.5) and stores in ChromaDB
- `search.py` — standalone terminal script to test retrieval only
- `rag_engine.py` — core RAG logic: retrieval + prompt building + Gemini call
- `main.py` — FastAPI app exposing `/chat` and `/health`

## Setup
1. `python3 -m venv venv && source venv/bin/activate`
2. `pip install -r requirements.txt`
3. Create `.env` with `GEMINI_API_KEY=your_key_here`
4. Build the vector store (one-time, or whenever source data changes):
   `python load_and_chunk.py` then `python embed_and_store.py`
5. Run the API on port 8001 for frontend integration:
   `uvicorn main:app --host 0.0.0.0 --port 8001 --reload`
6. Test at `http://127.0.0.1:8001/docs`

## Frontend Integration
The frontend expects the RAG service to run on **port 8001**. Configure the environment variable:
```
VITE_RAG_API_URL=http://localhost:8001
```

## API
### POST /chat
Request: `{ "question": "string" }`
Response: `{ "answer": "string", "sources": [...], "confidence": "answered|not_found|error" }`

### GET /health
Response: `{ "status": "ok" }`