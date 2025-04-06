from flask import current_app
from flask_mail import Message
from app import mail


def send_bug_report_email(data):
    """Send bug report email to administrators"""
    try:
        msg = Message(
            subject="New Bug Report Submitted",
            recipients=[
                current_app.config.get("ADMIN_EMAIL", "your-default-email@example.com")
            ],
            body=f"""
Bug Report Details:
------------------
From: {data['name']} ({data['email']})

Description:
{data['description']}
            """,
        )
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send bug report email: {str(e)}")
        return False
