from datetime import date, timedelta
import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
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
    
    # Fetch all tasks that are not completed
    tasks = await Task.find({"status": {"$ne": "completed"}}).to_list()
    
    # Fetch active admins once, then keep recipients partitioned by tenant.
    admins = await User.find({"role": "admin", "is_active": True}).to_list()
    admin_emails_by_org = {}
    for admin in admins:
        if admin.organization_id and admin.email:
            admin_emails_by_org.setdefault(admin.organization_id, []).append(admin.email)
    
    today = date.today()
    seven_days_from_now = today + timedelta(days=7)
    
    updated_count = 0
    overdue_emails_sent = 0
    
    for task in tasks:
        # Respect a status explicitly chosen by a CS user.
        if getattr(task, "status_manually_set", False):
            continue
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
            await task.save()
            updated_count += 1
            
            # Check if newly overdue
            if new_status == 'overdue' and old_status != 'overdue':
                # Fetch assigned user
                assigned_user = await User.get(task.assigned_to) if task.assigned_to else None
                if assigned_user and assigned_user.organization_id != task.organization_id:
                    logger.warning("Skipped cross-workspace assignee on task %s", task.id)
                    assigned_user = None
                
                # Send notification to assignee
                if assigned_user and assigned_user.email:
                    await send_overdue_email(
                        email=assigned_user.email,
                        task_title=task.title,
                        due_date=task.due_date.isoformat()
                    )
                    overdue_emails_sent += 1
                    
                # Also notify admins
                assignee_name = assigned_user.full_name if assigned_user else 'Unassigned'
                for admin_email in admin_emails_by_org.get(task.organization_id, []):
                    await send_overdue_email(
                        email=admin_email,
                        task_title=f"{task.title} (Admin Notice - Assignee: {assignee_name})",
                        due_date=task.due_date.isoformat()
                    )
                        
    logger.info(f"Daily compliance check completed. Updated {updated_count} tasks. Overdue emails sent: {overdue_emails_sent}.")

scheduler = AsyncIOScheduler()

def start_scheduler():
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
