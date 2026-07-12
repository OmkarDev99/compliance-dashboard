from pydantic import BaseModel


class RegulatoryUpdateResponse(BaseModel):
    id: str
    title: str
    source: str
    category: str
    publication_date: str = ""
    url: str
    document_type: str = "Web Page"
    last_updated: str = ""
    keywords: list[str] = []
    summary: str = ""


class RegulatorySourceSummary(BaseModel):
    source: str
    count: int


class RegulatoryUpdatesPage(BaseModel):
    items: list[RegulatoryUpdateResponse]
    total: int
    sources: list[RegulatorySourceSummary]
