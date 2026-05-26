"""
Send a one-off test email using configured SMTP settings.

Usage:
    python -m scripts.test_mail --to your@email.com
"""

import argparse
import asyncio
from datetime import datetime, timezone

from app.config import settings
from app.services.email_service import send_email


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Send a test email via configured SMTP")
    parser.add_argument("--to", required=True, help="Recipient email address")
    parser.add_argument(
        "--subject",
        default="Jointlly test email",
        help="Email subject line",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    sent_at = datetime.now(timezone.utc).isoformat()

    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 24px;">
          <h2 style="margin-top: 0; color: #111827;">Jointlly SMTP Test</h2>
          <p style="color: #374151;">This is a test email sent from your Jointlly backend.</p>
          <p style="color: #374151;">
            <strong>Environment:</strong> {settings.environment}<br />
            <strong>SMTP Host:</strong> {settings.smtp_host}<br />
            <strong>Sent At (UTC):</strong> {sent_at}
          </p>
          <p style="color: #6b7280; font-size: 13px;">If you received this, email sending is working.</p>
        </div>
      </body>
    </html>
    """

    await send_email(
        to_email=args.to,
        subject=args.subject,
        html_body=html_body,
    )
    print(f"Email send call completed for: {args.to}")


if __name__ == "__main__":
    asyncio.run(main())
