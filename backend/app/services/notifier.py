import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_overdue_email(email: str, task_title: str, due_date: str) -> bool:
    """
    Sends an email warning about an overdue task.
    """
    subject = f"URGENT: Task Overdue - {task_title}"
    body = f"Hello,\n\nThe compliance task '{task_title}' was due on {due_date} and is now marked as OVERDUE.\n\nPlease login to the CS Compliance Dashboard and resolve it as soon as possible.\n\nBest,\nCS Compliance Dashboard System"
    return await send_email(email, subject, body)

async def send_email(to_email: str, subject: str, body: str) -> bool:
    # If SMTP is not fully configured, log it as warning (mock behavior for dev)
    if not settings.SMTP_USER or "@email.com" in settings.SMTP_USER or not settings.SMTP_PASSWORD or "your-app-password" in settings.SMTP_PASSWORD:
        logger.warning(f"--- [SMTP MOCK EMAIL] ---")
        logger.warning(f"To: {to_email}")
        logger.warning(f"Subject: {subject}")
        logger.warning(f"Body:\n{body}")
        logger.warning(f"-------------------------")
        return True
        
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        # Run blocking SMTP calls
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        server.quit()
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via SMTP: {e}")
        return False
