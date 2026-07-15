from sentence_transformers import SentenceTransformer
import chromadb
from load_and_chunk import load_data, build_documents, chunk_documents, DATA_PATHS

CHROMA_DB_PATH = "./chroma_store"       # where Chroma will save data on disk
COLLECTION_NAME = "icsi_compliance_data"
BATCH_SIZE = 32                          # how many chunks to embed at once


def get_embedding_model():
    print("Loading embedding model...")
    return SentenceTransformer("BAAI/bge-base-en-v1.5")


def get_chroma_collection():
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    collection = client.get_or_create_collection(name=COLLECTION_NAME)
    return collection


def embed_and_store(chunks: list, model, collection):
    total = len(chunks)
    print(f"Embedding and storing {total} chunks in batches of {BATCH_SIZE}...")

    for start in range(0, total, BATCH_SIZE):
        batch = chunks[start:start + BATCH_SIZE]

        texts = [c["text"] for c in batch]
        ids = [c["chunk_id"] for c in batch]

        # embed this batch (no query prefix — these are documents, not questions)
        embeddings = model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False
        ).tolist()

        # ChromaDB metadata values must be str, int, float, or bool — no None, no lists
        metadatas = [
            {
        "doc_id": c["doc_id"],
        "chunk_index": c["chunk_index"],
        "title": c["title"],
        "source": c["source"],
        "category": c["category"],
        "publication_date": c["publication_date"],
        "url": c["url"],
        "document_type": c["document_type"],
        "keywords": c["keywords"],
            }
            for c in batch
        ]

        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )

        print(f"  stored {min(start + BATCH_SIZE, total)}/{total}")

    print("Done. Total chunks in collection:", collection.count())


if __name__ == "__main__":
    raw = load_data(DATA_PATHS)
    docs = build_documents(raw)
    chunks = chunk_documents(docs)
    print("Total chunks to embed:", len(chunks))

    model = get_embedding_model()
    collection = get_chroma_collection()

    embed_and_store(chunks, model, collection)