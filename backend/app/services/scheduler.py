from datetime import date, timedelta
import pytz
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.core.db import async_session_maker
from app.models.task import Task
from app.models.user import User
from app.services.notifier import send_overdue_email
import logging

logger = logging.getLogger(__name__)

async def run_daily_compliance_check():
    """
    Query all non-completed tasks and update their status.
    If a task changes to 'overdue', trigger notifier.py
    """
    logger.info("Starting daily compliance check job...")
    async with async_session_maker() as db:
        # Fetch all tasks that are not completed
        result = await db.execute(
            select(Task)
            .filter(Task.status != 'completed')
            .options(selectinload(Task.assigned_user))
        )
        tasks = result.scalars().all()
        
        # Fetch all active admins
        admin_result = await db.execute(
            select(User).filter(User.role == 'admin', User.is_active == True)
        )
        admins = admin_result.scalars().all()
        admin_emails = [admin.email for admin in admins if admin.email]
        
        today = date.today()
        seven_days_from_now = today + timedelta(days=7)
        
        updated_count = 0
        overdue_emails_sent = 0
        
        for task in tasks:
            old_status = task.status
            new_status = old_status
            
            if task.due_date < today:
                new_status = 'overdue'
            elif today <= task.due_date <= seven_days_from_now:
                new_status = 'due_soon'
            else:
                new_status = 'upcoming'
                
            if old_status != new_status:
                task.status = new_status
                updated_count += 1
                
                # Check if newly overdue
                if new_status == 'overdue' and old_status != 'overdue':
                    # Send notification to assignee
                    if task.assigned_user and task.assigned_user.email:
                        await send_overdue_email(
                            email=task.assigned_user.email,
                            task_title=task.title,
                            due_date=task.due_date.isoformat()
                        )
                        overdue_emails_sent += 1
                        
                    # Also notify admins
                    assignee_name = task.assigned_user.full_name if task.assigned_user else 'Unassigned'
                    for admin_email in admin_emails:
                        await send_overdue_email(
                            email=admin_email,
                            task_title=f"{task.title} (Admin Notice - Assignee: {assignee_name})",
                            due_date=task.due_date.isoformat()
                        )
                        
        if updated_count > 0:
            await db.commit()
            
        logger.info(f"Daily compliance check completed. Updated {updated_count} tasks. Overdue emails sent: {overdue_emails_sent}.")

scheduler = AsyncIOScheduler()

def start_scheduler():
    # Runs daily at 08:00 IST
    scheduler.add_job(
        run_daily_compliance_check,
        trigger='cron',
        hour=8,
        minute=0,
        timezone=pytz.timezone('Asia/Kolkata'),
        id='daily_compliance_check',
        replace_existing=True
    )
    scheduler.start()
    logger.info("APScheduler started successfully for daily compliance check at 08:00 IST.")

def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("APScheduler shut down successfully.")
