from fastapi import FastAPI
from pydantic import BaseModel
from rag_engine import get_answer

app = FastAPI(title="CS Compliance Chatbot API")


class ChatRequest(BaseModel):
    question: str


class Source(BaseModel):
    title: str
    source: str
    url: str
    date: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
    confidence: str


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    result = get_answer(request.question)
    return result