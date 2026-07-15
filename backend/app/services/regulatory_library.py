import hashlib
import json
import re
from functools import lru_cache
from pathlib import Path


DATA_FILES = (
    "mca_scraped_data.json",
    "icsi_scrapped_data.json",
    "rbi_scraped_data.json",
    "labour_scraped_data.json",
    "atlas_vayana_scraped_data.json",
    "udyam_scraped_data.json",
)


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def _summary(text: str, limit: int = 260) -> str:
    clean = _clean_text(text)
    if len(clean) <= limit:
        return clean
    shortened = clean[: limit + 1].rsplit(" ", 1)[0]
    return f"{shortened}..."


@lru_cache(maxsize=1)
def load_regulatory_updates() -> list[dict]:
    backend_dir = Path(__file__).resolve().parents[2]
    records: list[dict] = []
    seen_urls: set[str] = set()

    for filename in DATA_FILES:
        path = backend_dir / filename
        if not path.exists():
            continue
        with path.open(encoding="utf-8") as source_file:
            rows = json.load(source_file)
        for row in rows if isinstance(rows, list) else []:
            title = _clean_text(row.get("title", ""))
            url = _clean_text(row.get("url", ""))
            if not title or not url or url in seen_urls:
                continue
            seen_urls.add(url)
            keywords = row.get("keywords") or []
            if isinstance(keywords, str):
                keywords = [item.strip() for item in keywords.split(",") if item.strip()]
            records.append({
                "id": hashlib.sha1(url.encode("utf-8")).hexdigest()[:12],
                "title": title,
                "source": _clean_text(row.get("source", "Unknown")),
                "category": _clean_text(row.get("category", "General")),
                "publication_date": _clean_text(row.get("publication_date", "")),
                "url": url,
                "document_type": _clean_text(row.get("document_type", "Web Page")),
                "last_updated": _clean_text(row.get("last_updated", "")),
                "keywords": keywords,
                "summary": _summary(row.get("full_text", "")),
            })
    return records


def search_regulatory_updates(query: str = "", source: str = "", category: str = "") -> list[dict]:
    query_terms = [term.lower() for term in query.split() if term.strip()]
    results = []
    for record in load_regulatory_updates():
        if source and record["source"].lower() != source.lower():
            continue
        if category and record["category"].lower() != category.lower():
            continue
        haystack = " ".join((record["title"], record["source"], record["category"], record["summary"], " ".join(record["keywords"]))).lower()
        if query_terms and not all(term in haystack for term in query_terms):
            continue
        results.append(record)
    return results
