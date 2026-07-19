import re

from app.services.regulatory_library import load_regulatory_updates


MIN_RELEVANCE_SCORE = 7


def _terms(question: str) -> set[str]:
    stop_words = {"the", "and", "for", "what", "when", "where", "which", "about", "with", "from", "this", "that", "have", "does", "need", "please", "tell"}
    return {word for word in re.findall(r"[a-z0-9-]+", question.lower()) if len(word) > 2 and word not in stop_words}


def find_relevant_records(question: str, limit: int = 5) -> list[dict]:
    terms = _terms(question)
    if not terms:
        return []
    ranked = []
    for record in load_regulatory_updates():
        title = record["title"].lower()
        keywords = " ".join(record["keywords"]).lower()
        category = record["category"].lower()
        summary = record["summary"].lower()
        score = sum(
            (5 if term in title else 0)
            + (3 if term in keywords else 0)
            + (2 if term in category else 0)
            + (1 if term in summary else 0)
            for term in terms
        )
        matches = sum(term in f"{title} {keywords} {category} {summary}" for term in terms)
        if score >= MIN_RELEVANCE_SCORE and matches >= max(1, len(terms) // 2):
            ranked.append((score, matches, record))
    ranked.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return [item[2] for item in ranked[:limit]]
