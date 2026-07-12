from app.services.regulatory_library import load_regulatory_updates, search_regulatory_updates


def test_scraped_sources_are_loaded():
    updates = load_regulatory_updates()
    sources = {item["source"] for item in updates}
    # Duplicate source URLs are intentionally collapsed into one usable record.
    assert len(updates) >= 150
    assert {
        "MCA Portal",
        "ICSI",
        "RBI Portal",
        "Ministry of Labour & Employment",
    }.issubset(sources)


def test_search_is_case_insensitive_and_matches_content():
    results = search_regulatory_updates(query="MCA")
    assert results
    assert all("mca" in " ".join((item["title"], item["source"], item["category"], item["summary"], " ".join(item["keywords"]))).lower() for item in results)


def test_source_filter_limits_results():
    results = search_regulatory_updates(source="RBI Portal")
    assert results
    assert all(item["source"] == "RBI Portal" for item in results)
