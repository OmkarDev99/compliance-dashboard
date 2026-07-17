from pathlib import Path

from app.services.regulatory_library import discover_data_files, load_regulatory_updates, search_regulatory_updates


def test_scraped_sources_are_loaded():
    updates = load_regulatory_updates()
    sources = {item["source"] for item in updates}
    # Duplicate source URLs are intentionally collapsed into one usable record.
    assert len(updates) >= 4_000
    assert {
        "MCA Portal",
        "ICSI",
        "RBI Portal",
        "Ministry of Labour & Employment",
        "IBBI",
        "SEBI",
        "NSE",
        "IP India",
        "India Registration Online",
        "Udyam Portal",
    }.issubset(sources)


def test_all_scraped_data_files_are_discovered():
    backend_dir = Path(__file__).resolve().parents[1]
    names = {path.name for path in discover_data_files(backend_dir)}
    assert "ibbi_scraped_data.json" in names
    assert "nse_scraped_data.json" in names
    assert "icsi_scrapped_data.json" in names


def test_search_is_case_insensitive_and_matches_content():
    results = search_regulatory_updates(query="MCA")
    assert results
    assert all("mca" in " ".join((item["title"], item["source"], item["category"], item["summary"], " ".join(item["keywords"]))).lower() for item in results)


def test_source_filter_limits_results():
    results = search_regulatory_updates(source="RBI Portal")
    assert results
    assert all(item["source"] == "RBI Portal" for item in results)
