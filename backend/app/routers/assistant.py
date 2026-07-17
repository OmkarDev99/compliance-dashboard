from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.regulatory_library import load_regulatory_updates
from app.services.assistant_search import find_relevant_records


router = APIRouter(prefix="/assistant", tags=["compliance assistant"])


class AssistantRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)


class AssistantSource(BaseModel):
    title: str
    source: str
    url: str
    date: str


class AssistantResponse(BaseModel):
    answer: str
    sources: list[AssistantSource]
    confidence: str


@router.get("/health")
async def assistant_health(current_user: User = Depends(get_current_user)):
    records = load_regulatory_updates()
    return {"status": "ok", "records_indexed": len(records)}


@router.post("/chat", response_model=AssistantResponse)
async def assistant_chat(request: AssistantRequest, current_user: User = Depends(get_current_user)):
    matches = find_relevant_records(request.question)
    if not matches:
        return {
            "answer": "I could not find a sufficiently relevant publication in the current regulatory library. Try including a form number, regulator, filing type, or obligation name.",
            "sources": [],
            "confidence": "not_found",
        }

    lead = matches[0]
    answer = (
        f"The closest source-backed match is “{lead['title']}” from {lead['source']}. "
        f"{lead['summary'] or 'Open the publication for the complete regulatory text.'}"
    )
    if len(matches) > 1:
        answer += f" I also found {len(matches) - 1} related publication{'s' if len(matches) > 2 else ''} below."

    return {
        "answer": answer,
        "sources": [
            {"title": item["title"], "source": item["source"], "url": item["url"], "date": item["publication_date"]}
            for item in matches
        ],
        "confidence": "answered",
    }
