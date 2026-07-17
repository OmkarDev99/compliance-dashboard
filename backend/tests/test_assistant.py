from app.services.assistant_search import find_relevant_records


def test_assistant_finds_form_related_publications():
    matches = find_relevant_records("MCA annual filing form compliance")
    assert matches
    assert all(item["url"] for item in matches)


def test_assistant_handles_unsearchable_question():
    assert find_relevant_records("the and what") == []
