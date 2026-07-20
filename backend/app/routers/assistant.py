from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Optional

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.regulatory_library import load_regulatory_updates
from app.services.assistant_search import find_relevant_records
from app.services.assistant_generation import generate_answer


router = APIRouter(prefix="/assistant", tags=["compliance assistant"])

MAX_SOURCE_TITLE_LENGTH = 90
MAX_CONTEXT_RECORDS = 3


def _short_text(value: str, max_length: int) -> str:
    text = " ".join(value.split())
    if len(text) <= max_length:
        return text
    return f"{text[: max_length - 3].rsplit(' ', 1)[0]}..."


def _source_title(value: str) -> str:
    return _short_text(value, MAX_SOURCE_TITLE_LENGTH)


class AssistantRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)


class AssistantSource(BaseModel):
    title: str
    url: str
    date: str


class AssistantResponse(BaseModel):
    answer: str
    sources: list[AssistantSource]
    confidence: str
    assistant_label: str = "Regulatory Library Assistant"


@router.get("/health")
async def assistant_health(current_user: User = Depends(get_current_user)):
    records = load_regulatory_updates()
    return {"status": "ok", "records_indexed": len(records)}


@router.post("/chat", response_model=AssistantResponse)
async def assistant_chat(
    request: AssistantRequest,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    matches = find_relevant_records(request.question)
    
    if not matches:
        return {
            "answer": "I could not find a sufficiently relevant publication in the current regulatory library. Try including a form number, regulator, circular number, or obligation name.",
            "sources": [],
            "confidence": "not_found",
        }

    context_records = matches[:MAX_CONTEXT_RECORDS]
    try:
        answer = await generate_answer(request.question, context_records)
    except Exception:
        return {
            "answer": "I found relevant publications but could not generate a response right now. Please try again shortly.",
            "sources": [],
            "confidence": "error",
        }

    return {
        "answer": answer,
        "sources": [
            {
                "title": _source_title(item["title"]),
                "url": item["url"],
                "date": item["publication_date"],
            }
            for item in matches
        ],
        "confidence": "answered",
        "assistant_label": "Regulatory Library Assistant",
    }
