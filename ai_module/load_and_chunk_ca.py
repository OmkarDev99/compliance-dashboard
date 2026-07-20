import json
import re
from langchain_text_splitters import RecursiveCharacterTextSplitter

DATA_PATHS = [
    "../backend/nse_scraped_data.json",
    "../backend/rbi_scraped_data.json",
    "../backend/sebi_scraped_data.json",
    "../backend/udyam_scraped_data.json",
]


def clean_text(text: str) -> str:
    """Basic cleanup: collapse weird whitespace/newlines from PDF extraction."""
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize_keywords(keywords) -> str:
    """Convert list- and string-based keyword fields into Chroma-safe text."""
    if isinstance(keywords, list):
        return ", ".join(str(keyword) for keyword in keywords if keyword) or "none"

    if isinstance(keywords, str):
        cleaned_keywords = keywords.strip()
        return "none" if not cleaned_keywords or cleaned_keywords == "[]" else cleaned_keywords

    return "none"


def load_data(paths: list) -> list:
    all_records = []
    for path in paths:
        with open(path, "r", encoding="utf-8") as f:
            records = json.load(f)
            print(f"  loaded {len(records)} records from {path}")
            all_records.extend(records)
    return all_records


def build_documents(raw_records: list) -> list:
    """
    Convert CA scraped records into a clean, consistent internal format.
    Every record gets a stable doc_id so we can track it later.
    """
    documents = []
    for i, record in enumerate(raw_records):
        cleaned_text = clean_text(record.get("full_text", ""))

        if not cleaned_text:
            continue

        documents.append({
            "doc_id": f"ca_doc_{i}",
            "title": record.get("title", "Untitled"),
            "source": record.get("source", ""),
            "category": record.get("category", ""),
            "publication_date": record.get("publication_date") or "unknown",
            "url": record.get("url", ""),
            "document_type": record.get("document_type", ""),
            "keywords": normalize_keywords(record.get("keywords")),
            "text": cleaned_text,
        })

    return documents


def chunk_documents(documents: list) -> list:
    """Split documents into overlapping chunks while retaining their metadata."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    all_chunks = []
    for doc in documents:
        text_pieces = splitter.split_text(doc["text"])

        for idx, piece in enumerate(text_pieces):
            all_chunks.append({
                "chunk_id": f"{doc['doc_id']}_chunk_{idx}",
                "doc_id": doc["doc_id"],
                "chunk_index": idx,
                "text": piece,
                "title": doc["title"],
                "source": doc["source"],
                "category": doc["category"],
                "publication_date": doc["publication_date"],
                "url": doc["url"],
                "document_type": doc["document_type"],
                "keywords": doc["keywords"],
            })

    return all_chunks


if __name__ == "__main__":
    raw = load_data(DATA_PATHS)
    print("Total raw records:", len(raw))

    docs = build_documents(raw)
    print("Documents after cleaning (non-empty):", len(docs))

    chunks = chunk_documents(docs)
    print("\nTotal chunks created:", len(chunks))

    if chunks:
        print("\nSample chunk:")
        print("chunk_id:", chunks[0]["chunk_id"])
        print("title:", chunks[0]["title"])
        print("text preview:", chunks[0]["text"][:300])
