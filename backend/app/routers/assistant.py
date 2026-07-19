import re

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.regulatory_library import load_regulatory_updates
from app.services.assistant_search import find_relevant_records


router = APIRouter(prefix="/assistant", tags=["compliance assistant"])

MAX_SOURCE_TITLE_LENGTH = 160
MAX_ANSWER_SENTENCES = 3


def _clean_text(value: str) -> str:
    text = " ".join(value.split())
    return re.sub(r"(?<=[.!?])(?=[A-Z])", " ", text)


def _short_text(value: str, max_length: int) -> str:
    text = _clean_text(value)
    if len(text) <= max_length:
        return text
    return f"{text[: max_length - 3].rsplit(' ', 1)[0]}..."


def _answer_text(record: dict) -> str:
    title = record["title"]
    answer = re.split(r"\bans\.\s*", title, flags=re.IGNORECASE)[-1]
    if answer == title:
        answer = record["summary"] or title
    sentences = re.split(r"(?<=[.!?])\s+", _clean_text(answer))
    return " ".join(sentences[:MAX_ANSWER_SENTENCES])


def _source_title(value: str) -> str:
    title = re.split(r"\bans\.\s*", value, flags=re.IGNORECASE)[0]
    return _short_text(title, MAX_SOURCE_TITLE_LENGTH)


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
            "answer": "I couldn't find relevant information for this question. Try including a form number, regulator, filing type, or obligation name.",
            "sources": [],
            "confidence": "not_found",
        }

    lead = matches[0]
    answer = _answer_text(lead)

    return {
        "answer": answer,
        "sources": [
            {"title": _source_title(item["title"]), "source": item["source"], "url": item["url"], "date": item["publication_date"]}
            for item in matches
        ],
        "confidence": "answered",
    }
