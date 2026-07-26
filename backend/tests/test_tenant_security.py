from datetime import date, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock
import uuid

import pytest
from fastapi import HTTPException

from app.core.dependencies import get_current_user, require_same_organization
from app.core.security import create_access_token
from app.models.organization import Organization
from app.models.task import Task
from app.models.user import User
from app.services import scheduler
from app.routers.admin import create_user
from app.schemas.user import UserCreate


@pytest.mark.asyncio
async def test_token_cannot_be_reused_after_user_moves_workspace(monkeypatch):
    original_org = uuid.uuid4()
    current_org = uuid.uuid4()
    user = SimpleNamespace(id=uuid.uuid4(), role="admin", is_active=True, organization_id=current_org)
    monkeypatch.setattr(User, "get", AsyncMock(return_value=user))

    token = create_access_token(user.id, user.role, original_org)
    with pytest.raises(HTTPException) as error:
        await get_current_user(token)
    assert error.value.status_code == 401


@pytest.mark.asyncio
async def test_suspended_workspace_is_rejected(monkeypatch):
    org_id = uuid.uuid4()
    user = SimpleNamespace(id=uuid.uuid4(), role="admin", is_active=True, organization_id=org_id)
    monkeypatch.setattr(User, "get", AsyncMock(return_value=user))
    monkeypatch.setattr(Organization, "get", AsyncMock(return_value=SimpleNamespace(status="suspended")))

    token = create_access_token(user.id, user.role, org_id)
    with pytest.raises(HTTPException) as error:
        await get_current_user(token)
    assert error.value.status_code == 403


@pytest.mark.asyncio
async def test_resource_from_another_workspace_is_hidden():
    user = SimpleNamespace(organization_id=uuid.uuid4())
    resource = SimpleNamespace(organization_id=uuid.uuid4())
    with pytest.raises(HTTPException) as error:
        await require_same_organization(resource, user)
    assert error.value.status_code == 404


@pytest.mark.asyncio
async def test_tenant_admin_cannot_create_platform_admin():
    request = UserCreate(email="owner@example.com", password="Secret123", role="platform_admin")
    current_user = SimpleNamespace(organization_id=uuid.uuid4())
    with pytest.raises(HTTPException) as error:
        await create_user(request, current_user)
    assert error.value.status_code == 400


class _Query:
    def __init__(self, values):
        self.values = values

    async def to_list(self):
        return self.values


@pytest.mark.asyncio
async def test_overdue_notifications_stay_inside_task_workspace(monkeypatch):
    first_org, second_org = uuid.uuid4(), uuid.uuid4()
    assignee_id = uuid.uuid4()
    task = SimpleNamespace(
        id=uuid.uuid4(),
        title="Annual filing",
        organization_id=first_org,
        assigned_to=assignee_id,
        due_date=date.today() - timedelta(days=1),
        status="upcoming",
        status_manually_set=False,
        save=AsyncMock(),
    )
    admins = [
        SimpleNamespace(organization_id=first_org, email="admin@first.test"),
        SimpleNamespace(organization_id=second_org, email="admin@second.test"),
    ]
    assignee = SimpleNamespace(organization_id=first_org, email="member@first.test", full_name="Member")
    monkeypatch.setattr(Task, "find", lambda *args, **kwargs: _Query([task]))
    monkeypatch.setattr(User, "find", lambda *args, **kwargs: _Query(admins))
    monkeypatch.setattr(User, "get", AsyncMock(return_value=assignee))
    send_email = AsyncMock(return_value=True)
    monkeypatch.setattr(scheduler, "send_overdue_email", send_email)

    await scheduler.run_daily_compliance_check()

    recipients = [call.kwargs["email"] for call in send_email.await_args_list]
    assert "member@first.test" in recipients
    assert "admin@first.test" in recipients
    assert "admin@second.test" not in recipients
