import os
from dotenv import load_dotenv
from google import genai
from sentence_transformers import SentenceTransformer
import chromadb
import time

load_dotenv()

CHROMA_DB_PATH = "./chroma_store"
COLLECTION_NAME = "icsi_compliance_data"
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "
TOP_K = 5
DISTANCE_THRESHOLD = 0.7
GEMINI_MODEL_NAME = "gemini-flash-latest"

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found. Check your .env file.")

client = genai.Client(api_key=api_key)

# These load once when this module is first imported — not per request
print("Loading embedding model...")
embed_model = SentenceTransformer("BAAI/bge-base-en-v1.5")

chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
collection = chroma_client.get_collection(name=COLLECTION_NAME)
print(f"Collection loaded with {collection.count()} chunks.")


def retrieve_chunks(query: str, top_k: int = TOP_K):
    query_embedding = embed_model.encode(
        QUERY_PREFIX + query,
        normalize_embeddings=True
    ).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )

    chunks = []
    for doc, meta, distance in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0]
    ):
        if distance <= DISTANCE_THRESHOLD:
            chunks.append({"text": doc, "meta": meta, "distance": distance})

    return chunks


def build_prompt(question: str, chunks: list) -> str:
    context_blocks = []
    for i, c in enumerate(chunks, start=1):
        meta = c["meta"]
        context_blocks.append(
            f"[{i}] (Source: {meta['source']}, Title: {meta['title']}, Date: {meta['publication_date']})\n{c['text']}"
        )
    context_text = "\n\n".join(context_blocks)

    prompt = f"""You are a compliance assistant. Answer ONLY using the CONTEXT below, which
consists of excerpts from official ICSI/MCA compliance notices and circulars. Do not use
any outside knowledge. If the answer is not present in the context, respond exactly:
"I could not find this information in the available compliance notices."
Always mention which source [number] you used.

CONTEXT:
{context_text}

QUESTION:
{question}

Answer concisely and cite the source number(s) you used."""

    return prompt


def ask_gemini(prompt: str, max_retries: int = 2) -> str:
    last_error = None

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL_NAME,
                contents=prompt,
                config={"temperature": 0.2}
            )
            if response.text:
                return response.text
            else:
                raise ValueError("Gemini returned an empty response")

        except Exception as e:
            last_error = e
            print(f"Gemini call failed (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2)  # brief pause before retrying

    # all retries failed
    raise RuntimeError(f"Gemini API failed after {max_retries} attempts: {last_error}")

def get_answer(question: str) -> dict:
    """
    Main entry point: takes a question, returns a dict with answer + sources.
    Never raises — always returns a usable response, even on failure.
    """
    question = question.strip()

    if not question:
        return {
            "answer": "Please enter a question.",
            "sources": [],
            "confidence": "invalid_input"
        }

    if len(question) > 500:
        return {
            "answer": "Your question is too long. Please keep it under 500 characters.",
            "sources": [],
            "confidence": "invalid_input"
        }

    # Step 1: Retrieval
    try:
        chunks = retrieve_chunks(question)
    except Exception as e:
        print(f"Retrieval failed: {e}")
        return {
            "answer": "The compliance database is temporarily unavailable. Please try again shortly.",
            "sources": [],
            "confidence": "error"
        }

    if not chunks:
        return {
            "answer": "I could not find this information in the available compliance notices.",
            "sources": [],
            "confidence": "not_found"
        }

    # Step 2: Generation
    prompt = build_prompt(question, chunks)
    try:
        answer_text = ask_gemini(prompt)
    except Exception as e:
        print(f"Generation failed: {e}")
        return {
            "answer": "I found relevant information but couldn't generate a response right now. Please try again in a moment.",
            "sources": [],
            "confidence": "error"
        }

    # Step 3: Build sources list
    seen_urls = set()
    sources = []
    for c in chunks:
        url = c["meta"]["url"]
        if url not in seen_urls:
            sources.append({
                "title": c["meta"]["title"],
                "source": c["meta"]["source"],
                "url": url,
                "date": c["meta"]["publication_date"]
            })
            seen_urls.add(url)

    return {
        "answer": answer_text,
        "sources": sources,
        "confidence": "answered"
    }