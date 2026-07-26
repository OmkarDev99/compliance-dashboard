from app.services.assistant_search import find_relevant_records
from app.routers.assistant import _source_title


def test_assistant_finds_form_related_publications():
    matches = find_relevant_records("MCA annual filing form compliance")
    assert matches
    assert all(item["url"] for item in matches)


def test_assistant_handles_unsearchable_question():
    assert find_relevant_records("the and what") == []


def test_assistant_rejects_irrelevant_question():
    assert find_relevant_records("what is the capital of France?") == []


def test_assistant_formats_scraped_source_title():
    record = find_relevant_records(
        "What is the procedure for transfer of interest of a member in a company not having share capital?"
    )[0]

    assert "Section 56" in record["title"]
    assert "form SH-4" in record["title"]
    source_title = _source_title(record["title"])
    assert len(source_title) <= 90
    assert source_title.endswith("...")
