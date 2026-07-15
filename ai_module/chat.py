import os
from dotenv import load_dotenv
from google import genai
from sentence_transformers import SentenceTransformer
import chromadb

# Load GEMINI_API_KEY from .env into environment variables
load_dotenv()

CHROMA_DB_PATH = "./chroma_store"
COLLECTION_NAME = "icsi_compliance_data"
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "
TOP_K = 5
DISTANCE_THRESHOLD = 0.7   # anything worse (higher) than this is considered "not relevant enough"

# --- Setup Gemini ---
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found. Check your .env file.")

client = genai.Client(api_key=api_key)
GEMINI_MODEL_NAME = "gemini-flash-latest"   # alias that always points to the current stable Flash model


def get_embedding_model():
    print("Loading embedding model...")
    return SentenceTransformer("BAAI/bge-base-en-v1.5")


def get_chroma_collection():
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    return client.get_collection(name=COLLECTION_NAME)


def retrieve_chunks(query: str, model, collection, top_k: int = TOP_K):
    query_embedding = model.encode(
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
        if distance <= DISTANCE_THRESHOLD:   # filter out weak/irrelevant matches
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


def ask_gemini(prompt: str) -> str:
    response = client.models.generate_content(
        model=GEMINI_MODEL_NAME,
        contents=prompt,
        config={"temperature": 0.2}
    )
    return response.text

def chat(question: str, model, collection):
    chunks = retrieve_chunks(question, model, collection)

    if not chunks:
        print("\nAnswer: I could not find this information in the available compliance notices.\n")
        return

    prompt = build_prompt(question, chunks)
    answer = ask_gemini(prompt)

    print("\nAnswer:", answer)
    print("\nSources used:")
    seen_urls = set()
    for c in chunks:
        url = c["meta"]["url"]
        if url not in seen_urls:
            print(f"  - {c['meta']['title']} ({c['meta']['source']}) — {url}")
            seen_urls.add(url)
    print()


if __name__ == "__main__":
    embed_model = get_embedding_model()
    collection = get_chroma_collection()
    print(f"Collection loaded with {collection.count()} chunks.\n")

    while True:
        question = input("Ask a question (or type 'exit' to quit): ").strip()
        if question.lower() == "exit":
            break
        if not question:
            continue
        chat(question, embed_model, collection)