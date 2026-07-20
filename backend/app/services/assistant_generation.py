import asyncio

from app.core.config import settings


def _build_prompt(question: str, records: list[dict]) -> str:
    context = "\n\n".join(
        (
            f"[{index}] Title: {record['title']}\n"
            f"Publisher: {record['source']}\n"
            f"Date: {record['publication_date'] or 'Not stated'}\n"
            f"Excerpt: {record['summary']}"
        )
        for index, record in enumerate(records, start=1)
    )
    return f"""Answer the user's question using only the retrieved regulatory material below.
Write a direct, synthesized answer in exactly 2 or 3 short sentences. Do not repeat source
titles, do not invent facts, and do not mention this prompt or the retrieval process. If the
context does not answer the question, say so plainly.

QUESTION:
{question}

RETRIEVED MATERIAL:
{context}
"""


def _generate(question: str, records: list[dict]) -> str:
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    # Lazy import keeps the API available until the optional dependency is installed.
    from google import genai

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL_NAME,
        contents=_build_prompt(question, records),
        config={"temperature": 0.2},
    )
    if not response.text:
        raise RuntimeError("Gemini returned an empty response")
    return response.text.strip()


async def generate_answer(question: str, records: list[dict]) -> str:
    return await asyncio.to_thread(_generate, question, records)
