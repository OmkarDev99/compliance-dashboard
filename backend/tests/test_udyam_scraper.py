import os
import json
import pytest
from app.services.regulatory_library import load_regulatory_updates, search_regulatory_updates

def test_udyam_data_file_exists():
    # Verify that the scraping result file has been generated
    json_path = "udyam_scraped_data.json"
    assert os.path.exists(json_path), f"{json_path} does not exist. Run the scraper first!"

def test_udyam_records_load():
    updates = load_regulatory_updates()
    udyam_records = [item for item in updates if item["source"] == "Udyam Portal"]
    
    assert len(udyam_records) > 0, "No records from 'Udyam Portal' found in loaded updates."
    
    # Check structure of the first Udyam record
    record = udyam_records[0]
    assert "title" in record
    assert "url" in record
    assert "publication_date" in record
    assert "category" in record
    assert record["document_type"] in ["PDF", "Web Page"]
    assert "udyam" in record["keywords"]

def test_udyam_search():
    results = search_regulatory_updates(source="Udyam Portal")
    assert len(results) > 0
    assert all(item["source"] == "Udyam Portal" for item in results)
    
    # Text term search
    results_term = search_regulatory_updates(query="MSME")
    # At least some Udyam records mention MSME
    udyam_msme = [item for item in results_term if item["source"] == "Udyam Portal"]
    assert len(udyam_msme) > 0
