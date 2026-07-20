from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag_engine_ca import get_answer

app = FastAPI(title="CA Compliance Chatbot API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    try:
        return get_answer(request.question)
    except Exception as error:
        print(f"Unexpected error in CA /chat: {error}")
        return {
            "answer": "Something went wrong on our end. Please try again.",
            "sources": [],
            "confidence": "error",
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main_ca:app", host="0.0.0.0", port=8002, reload=True)
