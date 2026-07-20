import chromadb
from sentence_transformers import SentenceTransformer

from load_and_chunk_ca import DATA_PATHS, build_documents, chunk_documents, load_data

CHROMA_DB_PATH = "./chroma_store"
COLLECTION_NAME = "ca_compliance_data"
BATCH_SIZE = 16


def get_embedding_model():
    print("Loading embedding model...")
    return SentenceTransformer("BAAI/bge-base-en-v1.5")


def get_chroma_collection():
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    return client.get_or_create_collection(name=COLLECTION_NAME)


def embed_and_store(chunks: list, model, collection):
    existing_ids = set(collection.get(include=[])["ids"])
    pending_chunks = [chunk for chunk in chunks if chunk["chunk_id"] not in existing_ids]
    total = len(pending_chunks)

    print(f"Existing CA chunks: {len(existing_ids)}")
    print(f"Embedding and storing {total} remaining chunks in batches of {BATCH_SIZE}...")

    for start in range(0, total, BATCH_SIZE):
        batch = pending_chunks[start:start + BATCH_SIZE]
        texts = [chunk["text"] for chunk in batch]
        ids = [chunk["chunk_id"] for chunk in batch]

        embeddings = model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        ).tolist()

        metadatas = [
            {
                "doc_id": chunk["doc_id"],
                "chunk_index": chunk["chunk_index"],
                "title": chunk["title"],
                "source": chunk["source"],
                "category": chunk["category"],
                "publication_date": chunk["publication_date"],
                "url": chunk["url"],
                "document_type": chunk["document_type"],
                "keywords": chunk["keywords"],
            }
            for chunk in batch
        ]

        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )
        print(f"  stored {min(start + BATCH_SIZE, total)}/{total}")

    print("Done. Total chunks in CA collection:", collection.count())


if __name__ == "__main__":
    raw = load_data(DATA_PATHS)
    docs = build_documents(raw)
    chunks = chunk_documents(docs)
    print("Total chunks to embed:", len(chunks))

    model = get_embedding_model()
    collection = get_chroma_collection()
    embed_and_store(chunks, model, collection)
