from sentence_transformers import SentenceTransformer
import chromadb

CHROMA_DB_PATH = "./chroma_store"
COLLECTION_NAME = "icsi_compliance_data"
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "


def get_embedding_model():
    print("Loading embedding model...")
    return SentenceTransformer("BAAI/bge-base-en-v1.5")


def get_chroma_collection():
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    return client.get_collection(name=COLLECTION_NAME)


def search(query: str, model, collection, top_k: int = 5):
    query_embedding = model.encode(
        QUERY_PREFIX + query,
        normalize_embeddings=True
    ).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )

    print(f"\nTop {top_k} results for: \"{query}\"\n" + "-" * 60)

    for doc, meta, distance in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0]
    ):
        print(f"[distance: {distance:.4f}] {meta['title']}")
        print(f"  source: {meta['source']} | category: {meta['category']} | date: {meta['publication_date']}")
        print(f"  url: {meta['url']}")
        print(f"  text: {doc[:250]}...")
        print()


if __name__ == "__main__":
    model = get_embedding_model()
    collection = get_chroma_collection()

    print(f"Collection loaded with {collection.count()} chunks.\n")

    while True:
        query = input("Ask a question (or type 'exit' to quit): ").strip()
        if query.lower() == "exit":
            break
        if not query:
            continue
        search(query, model, collection, top_k=5)