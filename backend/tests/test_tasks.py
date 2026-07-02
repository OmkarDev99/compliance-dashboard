import pytest
from datetime import date
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.company import Company
from app.models.task import Task
from app.models.audit_log import AuditLog
from sqlalchemy import select

@pytest.mark.asyncio
async def test_task_lifecycle(client, db):
    # Setup user
    user = User(
        email="staff_test@example.com",
        hashed_password=get_password_hash("StaffPass123"),
        full_name="Staff Test",
        role="staff",
        is_active=True
    )
    db.add(user)
    
    # Setup company
    company = Company(
        cin="U74140DL2015PTC999999",
        name="Tech Test Co",
        company_type="private_limited",
        reg_date=date(2024, 4, 10),
        financial_year_end=date(2026, 3, 31),
        address="Test Road",
        assigned_to=user.id
    )
    db.add(company)
    await db.flush()  # Resolve company.id
    
    # Create task
    task = Task(
        company_id=company.id,
        title="Annual Return Filing (MGT-7)",
        description="Filing task",
        due_date=date(2026, 5, 30),
        status="upcoming",
        assigned_to=user.id
    )
    db.add(task)
    await db.commit()
    
    token = create_access_token(user.id, "staff")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Complete task
    complete_res = await client.post(f"/tasks/{task.id}/complete", headers=headers)
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"
    
    # Verify audit log recorded in db
    await db.close() # Reset session to fetch clean state
    
    # Re-open session or query
    # In pytest conftest, session gets transaction rolled back, but flushing/committing works inside test
    audit_query = select(AuditLog).filter(AuditLog.entity_id == task.id, AuditLog.action == "task_completed")
    audit_res = await db.execute(audit_query)
    audit = audit_res.scalars().first()
    assert audit is not None
    assert audit.user_id == user.id
    
    # Reopen task
    reopen_res = await client.post(f"/tasks/{task.id}/reopen", headers=headers)
    assert reopen_res.status_code == 200
    assert reopen_res.json()["status"] == "upcoming"
    
    # Verify reopen audit log recorded
    audit_query2 = select(AuditLog).filter(AuditLog.entity_id == task.id, AuditLog.action == "task_reopened")
    audit_res2 = await db.execute(audit_query2)
    audit2 = audit_res2.scalars().first()
    assert audit2 is not None
