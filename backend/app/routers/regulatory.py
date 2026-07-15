from collections import Counter

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.regulatory_update import RegulatoryUpdatesPage
from app.services.regulatory_library import load_regulatory_updates, search_regulatory_updates


router = APIRouter(prefix="/regulatory-updates", tags=["regulatory updates"])


@router.get("", response_model=RegulatoryUpdatesPage)
async def get_regulatory_updates(
    query: str = "",
    source: str = "",
    category: str = "",
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
):
    all_records = load_regulatory_updates()
    filtered = search_regulatory_updates(query=query, source=source, category=category)
    source_counts = Counter(record["source"] for record in all_records)
    return {
        "items": filtered[offset : offset + limit],
        "total": len(filtered),
        "sources": [
            {"source": name, "count": count}
            for name, count in sorted(source_counts.items())
        ],
    }
