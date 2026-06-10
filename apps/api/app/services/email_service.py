import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import structlog
from app.core.config import settings

logger = structlog.get_logger()

class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_from = settings.SMTP_FROM
        self.smtp_from_name = settings.SMTP_FROM_NAME

    def send_welcome_email(self, to_email: str, name: str):
        subject = f"Welcome to ImageShare, {name}!"
        
        # Professional, minimalist SaaS HTML template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f8fafc;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 40px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }}
                .logo {{
                    font-size: 24px;
                    font-weight: 700;
                    color: #2563eb;
                    margin-bottom: 24px;
                }}
                .greeting {{
                    font-size: 20px;
                    font-weight: 600;
                    color: #0f172a;
                    margin-bottom: 16px;
                }}
                .body-text {{
                    font-size: 16px;
                    line-height: 1.6;
                    color: #334155;
                    margin-bottom: 24px;
                }}
                .cta-button {{
                    display: inline-block;
                    background-color: #2563eb;
                    color: #ffffff !important;
                    font-weight: 500;
                    text-decoration: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                }}
                .footer {{
                    border-top: 1px solid #e2e8f0;
                    padding-top: 24px;
                    font-size: 14px;
                    color: #64748b;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">ImageShare</div>
                <div class="greeting">Hi {name},</div>
                <div class="body-text">
                    Thank you for signing up for ImageShare! We are thrilled to have you join our platform.
                    Now you can easily upload images, view analytics, and optimize your assets using our side-docked AI Copilot.
                </div>
                <a href="http://localhost:3000" class="cta-button">Go to Dashboard</a>
                <div class="body-text">
                    If you have any questions or feedback, feel free to explore our user dashboard.
                </div>
                <div class="footer">
                    Best regards,<br>
                    <strong>The ImageShare Team</strong><br>
                    <small>Please do not reply directly to this automated email.</small>
                </div>
            </div>
        </body>
        </html>
        """

        # Verify SMTP configurations are set
        if not self.smtp_user or not self.smtp_password:
            logger.info(
                "SMTP credentials not configured. Logging welcome email to console (Development Mode).",
                to=to_email,
                subject=subject
            )
            # Beautiful debug prints in developer logs
            print("\n" + "=" * 60)
            print(f"📧 DEVELOPMENT EMAIL LOG (no-reply)")
            print(f"TO: {to_email}")
            print(f"FROM: {self.smtp_from_name} <{self.smtp_from}>")
            print(f"SUBJECT: {subject}")
            print("-" * 60)
            print(f"Hi {name},\n")
            print("Welcome to ImageShare! You have successfully signed up.")
            print("Dashboard: http://localhost:3000")
            print("=" * 60 + "\n")
            return

        try:
            # Create email message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.smtp_from_name} <{self.smtp_from}>"
            msg["To"] = to_email
            
            # Record the MIME type of text/html
            part = MIMEText(html_content, "html")
            msg.attach(part)

            # Connect and send
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.smtp_from, to_email, msg.as_string())
            
            logger.info("Welcome email sent successfully", to=to_email)
        except Exception as e:
            logger.error("Failed to send welcome email", error=str(e), to=to_email)
