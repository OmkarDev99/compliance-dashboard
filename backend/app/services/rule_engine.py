from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta, date
from typing import Optional
import uuid
import logging
from app.models.company import Company
from app.models.compliance_rule import ComplianceRule
from app.models.task import Task
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)

async def run_rule_engine_for_company(db: AsyncSession, company: Company, user_id: Optional[uuid.UUID] = None) -> int:
    """
    Given a company, find matching active rules, compute due dates,
    bulk create tasks, and write an audit log.
    Returns the count of tasks generated.
    """
    # 1. Query active rules matching the company type
    result = await db.execute(select(ComplianceRule).filter(ComplianceRule.is_active == True))
    rules = result.scalars().all()
    
    tasks_to_create = []
    generated_count = 0
    
    for rule in rules:
        if company.company_type in rule.company_types:
            # Due date computed as: company.financial_year_end + rule.due_days_from_trigger
            due_date = company.financial_year_end + timedelta(days=rule.due_days_from_trigger)
            
            title = f"{rule.name} ({rule.form_number})" if rule.form_number else rule.name
            description = rule.description or f"ROC compliance requirement: {title}"
            
            task = Task(
                company_id=company.id,
                rule_id=rule.id,
                title=title,
                description=description,
                due_date=due_date,
                status="upcoming",
                assigned_to=company.assigned_to
            )
            tasks_to_create.append(task)
            generated_count += 1
            
    if tasks_to_create:
        db.add_all(tasks_to_create)
        await db.flush()  # Flush to generate IDs
        
        # Log to audit logs
        audit_log = AuditLog(
            user_id=user_id,  # Admin/Staff who added the company, or None if system
            action="tasks_generated",
            entity_type="company",
            entity_id=company.id,
            action_metadata={
                "company_name": company.name,
                "tasks_count": generated_count,
                "task_titles": [t.title for t in tasks_to_create]
            }
        )
        db.add(audit_log)
        
    return generated_count
