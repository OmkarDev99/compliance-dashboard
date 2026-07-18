import pytest
from pydantic import ValidationError

from app.schemas.task import TaskUpdate


@pytest.mark.parametrize("status", ["upcoming", "due_soon", "overdue", "completed"])
def test_task_update_accepts_supported_statuses(status):
    assert TaskUpdate(status=status).status == status


def test_task_update_rejects_unknown_status():
    with pytest.raises(ValidationError):
        TaskUpdate(status="cancelled")
