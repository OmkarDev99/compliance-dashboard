import pytest
import uuid
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.compliance_rule import ComplianceRule

@pytest.mark.asyncio
async def test_company_crud(client, db):
    # Setup user
    user = User(
        email="admin_test@example.com",
        hashed_password=get_password_hash("AdminPass123"),
        full_name="Admin Test",
        role="admin",
        is_active=True
    )
    db.add(user)
    
    # Setup active compliance rule for rule engine tests
    rule = ComplianceRule(
        name="Annual Return Filing",
        form_number="MGT-7",
        company_types=["private_limited"],
        frequency="annual",
        due_days_from_trigger=60,
        description="Filing details rule"
    )
    db.add(rule)
    await db.commit()
    
    token = create_access_token(user.id, "admin")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create company (POST /companies)
    company_payload = {
        "cin": "U74140DL2015PTC288888",
        "name": "Test Company Ltd",
        "company_type": "private_limited",
        "reg_date": "2024-04-10",
        "financial_year_end": "2026-03-31",
        "address": "123, New Road, Delhi",
        "assigned_to": str(user.id)
    }
    create_res = await client.post("/companies", json=company_payload, headers=headers)
    assert create_res.status_code == 201
    comp_data = create_res.json()
    assert comp_data["name"] == "Test Company Ltd"
    
    # Verify tasks generated (GET /companies/{id})
    comp_id = comp_data["id"]
    detail_res = await client.get(f"/companies/{comp_id}", headers=headers)
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["tasks_summary"]["total"] == 1
